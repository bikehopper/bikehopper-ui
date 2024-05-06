import produce from 'immer';
import * as BikehopperClient from '../lib/BikehopperClient';
import type {
  Coordinates,
  FetchedRoute,
  Route,
  RouteSource,
  EpochTimeStamp,
} from './types';
import { AppDispatch } from '../store';
import { TransitMode } from '../lib/TransitModes';
import { Position } from 'geojson';
import {
  ActionType,
  CurrentLocationSelectedAction,
  GeocodedLocationSelectedAction,
  ItineraryBackClicked,
  ItineraryStepBackClicked,
  ItineraryStepClicked,
  LocationDraggedAction,
  LocationsHydratedFromUrlAction,
  LocationsSetAction,
  RouteClearedAction,
  RouteClickedAction,
  RouteFetchAttemptedAction,
  RouteFetchFailedAction,
  RouteFetchSucceededAction,
  RouteParamsClearedAction,
} from './actions';

type RouteStatus = 'none' | 'fetching' | 'failed' | 'succeeded';

type RoutesState = {
  routes: Route[] | null;
  routeStatus: RouteStatus;
  routeStartCoords: Coordinates | null;
  routeEndCoords: Coordinates | null;
  activeRoute: number | null;
  viewingDetails: boolean;
  viewingStep: [legIndex: number, stepIndex: number] | null;
};

const DEFAULT_STATE: RoutesState = {
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

function _coordsEqual(
  a: Coordinates | Position | null | undefined,
  b: Coordinates | Position | null | undefined,
) {
  if (!a || !b) return a === b; // handle null input
  return a[0] === b[0] && a[1] === b[1];
}

type RoutesAction =
  | RouteClearedAction
  | RouteParamsClearedAction
  | LocationDraggedAction
  | LocationsHydratedFromUrlAction
  | LocationsSetAction
  | CurrentLocationSelectedAction
  | GeocodedLocationSelectedAction
  | RouteFetchAttemptedAction
  | RouteFetchFailedAction
  | RouteFetchSucceededAction
  | RouteClickedAction
  | ItineraryBackClicked
  | ItineraryStepClicked
  | ItineraryStepBackClicked;

export function routesReducer(
  state: RoutesState = DEFAULT_STATE,
  action: RoutesAction,
): RoutesState {
  switch (action.type) {
    case ActionType.ROUTE_CLEARED:
    case ActionType.ROUTE_PARAMS_CLEARED:
    case ActionType.LOCATION_DRAGGED: // assume drag is to new location
    case ActionType.LOCATIONS_HYDRATED_FROM_URL:
      return _clearRoutes(state);
    case ActionType.LOCATIONS_SET:
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
    case ActionType.GEOCODED_LOCATION_SELECTED:
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
    case ActionType.CURRENT_LOCATION_SELECTED:
      return _clearRoutes(state);
    case ActionType.ROUTE_FETCH_ATTEMPTED:
      return produce(state, (draft) => {
        draft.routes = draft.activeRoute = null;
        draft.routeStartCoords = action.startCoords;
        draft.routeEndCoords = action.endCoords;
        draft.routeStatus = 'fetching';
      });
    case ActionType.ROUTE_FETCH_FAILED:
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
    case ActionType.ROUTE_FETCH_SUCCEEDED:
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
    case ActionType.ROUTE_CLICKED:
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
    case ActionType.ITINERARY_BACK_CLICKED:
      return { ...state, viewingDetails: false };
    case ActionType.ITINERARY_STEP_CLICKED:
      return { ...state, viewingStep: [action.leg, action.step] };
    case ActionType.ITINERARY_STEP_BACK_CLICKED:
      return { ...state, viewingStep: null };
    default: {
      // enforce exhaustive switch statement
      const unreachable: never = action;
      return state;
    }
  }
}

function _clearRoutes(state: RoutesState): RoutesState {
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
  startCoords: Coordinates,
  endCoords: Coordinates,
  arriveBy: boolean,
  initialTime: EpochTimeStamp | null,
  blockRouteTypes?: TransitMode[],
) {
  return async function fetchRouteThunk(dispatch: AppDispatch) {
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

    dispatch<RouteFetchAttemptedAction>({
      type: ActionType.ROUTE_FETCH_ATTEMPTED,
      startCoords,
      endCoords,
    });

    let fetchedRoute: FetchedRoute | undefined;
    try {
      fetchedRoute = await BikehopperClient.fetchRoute({
        // Flip the points into LAT-LNG order for GraphHopper (yes it's weird)
        points: [
          [startCoords[1], startCoords[0]],
          [endCoords[1], endCoords[0]],
        ],
        arriveBy,
        earliestDepartureTime: initialTime,
        optimize: true,
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
      dispatch<RouteFetchFailedAction>({
        type: ActionType.ROUTE_FETCH_FAILED,
        startCoords,
        endCoords,
        failureType,
        alert: { message: alertMessage },
      });
      return;
    }

    const paths = fetchedRoute?.paths.length ? fetchedRoute.paths : null;
    if (!paths) {
      dispatch<RouteFetchFailedAction>({
        type: ActionType.ROUTE_FETCH_FAILED,
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

    dispatch<RouteFetchSucceededAction>({
      type: ActionType.ROUTE_FETCH_SUCCEEDED,
      routes: paths,
      startCoords,
      endCoords,
    });
  };
}

export function routeClicked(
  index: number,
  source: RouteSource,
): RouteClickedAction {
  return {
    type: ActionType.ROUTE_CLICKED,
    index,
    source,
  };
}

export function itineraryBackClicked(): ItineraryBackClicked {
  return { type: ActionType.ITINERARY_BACK_CLICKED };
}

export function itineraryStepClicked(
  legIndex: number,
  stepIndex: number,
): ItineraryStepClicked {
  return {
    type: ActionType.ITINERARY_STEP_CLICKED,
    leg: legIndex,
    step: stepIndex,
  };
}

export function itineraryStepBackClicked(): ItineraryStepBackClicked {
  return { type: ActionType.ITINERARY_STEP_BACK_CLICKED };
}
