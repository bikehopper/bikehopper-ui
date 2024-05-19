import produce from 'immer';
import * as BikehopperClient from '../lib/BikehopperClient';

const DEFAULT_STATE = {
  routes: null,
  routeStatus: 'none', // one of none/fetching/failed/succeeded
  // If we have routes, then the start and end coords they're for, as [lng, lat]:
  routeStartCoords: null,
  routeEndCoords: null,
  // Index of the selected route. This should always be null if routes is null,
  // and otherwise, 0 <= activeRoute < routes.length
  activeRoute: null,

  // State specific to an active route.
  viewingDetails: false, // True if viewing detailed itinerary for the active route
  viewingStep: null, // Array [leg, step] if viewing a particular step of active route.
};

function _coordsEqual(a, b) {
  if (!a || !b) return a === b; // handle null input
  return a[0] === b[0] && a[1] === b[1];
}

export function routesReducer(state = DEFAULT_STATE, action) {
  switch (action.type) {
    case 'route_cleared':
    case 'route_params_cleared':
    case 'location_dragged': // assume drag is to new location
    case 'locations_hydrated_from_url':
      return _clearRoutes(state);
    case 'locations_set':
      // clear routes if new start and/or end point differ from the routes we have
      if (
        state.routes &&
        !(
          _coordsEqual(
            state.routeStartCoords,
            action.start?.point?.geometry?.coordinates,
          ) &&
          _coordsEqual(
            state.routeEndCoords,
            action.end?.point?.geometry?.coordinates,
          )
        )
      ) {
        return _clearRoutes(state);
      } else {
        return state;
      }
    case 'geocoded_location_selected':
      // As above, clear route if need be
      if (
        state.routes &&
        !_coordsEqual(
          action.startOrEnd === 'start'
            ? state.routeStartCoords
            : state.routeEndCoords,
          action.point.geometry.coordinates,
        )
      ) {
        return _clearRoutes(state);
      } else {
        return state;
      }
    case 'current_location_selected':
      return _clearRoutes(state);
    case 'route_fetch_attempted':
      return produce(state, (draft) => {
        draft.routes = draft.activeRoute = null;
        draft.routeStartCoords = action.startCoords;
        draft.routeEndCoords = action.endCoords;
        draft.routeStatus = 'fetching';
      });
    case 'route_fetch_failed':
      if (
        !_coordsEqual(state.routeStartCoords, action.startCoords) ||
        !_coordsEqual(state.routeEndCoords, action.endCoords)
      ) {
        // Ignore stale result
        return state;
      }
      return produce(state, (draft) => {
        draft.routes = draft.activeRoute = null;
        draft.routeStatus = 'failed';
      });
    case 'route_fetch_succeeded':
      if (
        !_coordsEqual(state.routeStartCoords, action.startCoords) ||
        !_coordsEqual(state.routeEndCoords, action.endCoords) ||
        state.routeStatus === 'succeeded'
      ) {
        // Ignore stale result
        return state;
      }
      return produce(state, (draft) => {
        draft.routes = action.routes;
        draft.routeStatus = 'succeeded';
        draft.activeRoute = 0;
        draft.viewingDetails = false;
        draft.viewingStep = null;
      });
    case 'route_clicked':
      if (
        !state.routes ||
        isNaN(action.index) ||
        action.index < 0 ||
        action.index >= state.routes.length
      ) {
        console.error('invalid route click', action.index);
        return state;
      }
      return produce(state, (draft) => {
        draft.activeRoute = action.index;

        if (action.source === 'list') {
          // If the route clicked was already active, toggle viewing details.
          // Otherwise, always view the details.
          draft.viewingDetails =
            state.activeRoute !== action.index || !state.viewingDetails;
        } else if (action.source === 'map') {
          draft.viewingDetails = false;
          draft.viewingStep = null;
        }
      });
    case 'itinerary_back_clicked':
      return { ...state, viewingDetails: false };
    case 'itinerary_step_clicked':
      return { ...state, viewingStep: [action.leg, action.step] };
    case 'itinerary_step_back_clicked':
      return { ...state, viewingStep: null };
    default:
      return state;
  }
}

function _clearRoutes(state) {
  return produce(state, (draft) => {
    draft.routes =
      draft.routeStartCoords =
      draft.routeEndCoords =
      draft.activeRoute =
        null;
    draft.routeStatus = 'none';
  });
}

// Actions

let _routeNonce = 10000000; // For assigning a unique ID to each route fetched in a session

const COORD_EPSILON = 1e-5;

export function fetchRoute(
  startCoords,
  endCoords,
  arriveBy,
  initialTime,
  blockRouteTypes,
) {
  return async function fetchRouteThunk(dispatch, getState) {
    if (!startCoords || !endCoords) {
      dispatch({ type: 'route_cleared' });
      return;
    }

    if (
      Math.abs(startCoords[0] - endCoords[0]) < COORD_EPSILON &&
      Math.abs(startCoords[1] - endCoords[1]) < COORD_EPSILON
    ) {
      // Refuse to route from a place to itself.
      dispatch({ type: 'route_cleared' });
      return;
    }

    dispatch({
      type: 'route_fetch_attempted',
      startCoords,
      endCoords,
    });

    let fetchedRoute;
    try {
      fetchedRoute = await BikehopperClient.fetchRoute({
        // Flip the points into LAT-LNG order for GraphHopper (yes it's weird)
        points: [
          [startCoords[1], startCoords[0]],
          [endCoords[1], endCoords[0]],
        ],
        arriveBy,
        earliestDepartureTime: initialTime,
        pointsEncoded: false,
        details: ['cycleway', 'road_class', 'street_name'],
        blockRouteTypes,
      });
    } catch (e) {
      console.error('route fetch failed:', e);
      let alertMessage = "Can't connect to server";
      let failureType = 'network error';
      if (e instanceof BikehopperClient.BikehopperClientError) {
        // GraphHopper sometimes 400s if it doesn't like the coordinates
        if (e.message === 'Bad Request') {
          alertMessage = "Can't find a route";
          failureType = 'no route found';
        } else {
          alertMessage = 'Server error';
          failureType = 'server error';
        }
      }
      dispatch({
        type: 'route_fetch_failed',
        startCoords,
        endCoords,
        failureType,
        alert: { message: alertMessage },
      });
      return;
    }

    const paths = fetchedRoute?.paths.length ? fetchedRoute.paths : null;
    if (!paths) {
      dispatch({
        type: 'route_fetch_failed',
        startCoords,
        endCoords,
        failureType: 'no route found',
        alert: { message: "Can't find a route" },
      });
      return;
    }

    for (const path of paths) {
      path.nonce = ++_routeNonce;
    }

    dispatch({
      type: 'route_fetch_succeeded',
      routes: paths,
      startCoords,
      endCoords,
    });
  };
}

export function routeClicked(index, source) {
  return {
    type: 'route_clicked',
    index,
    source, // where was it clicked? should be 'map' or 'list'
  };
}

export function itineraryBackClicked() {
  return { type: 'itinerary_back_clicked' };
}

export function itineraryStepClicked(legIndex, stepIndex) {
  return {
    type: 'itinerary_step_clicked',
    leg: legIndex,
    step: stepIndex,
  };
}

export function itineraryStepBackClicked() {
  return { type: 'itinerary_step_back_clicked' };
}
