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
};

function _coordsEqual(a, b) {
  if (!a || !b) return a === b; // handle null input
  return a[0] === b[0] && a[1] === b[1];
}

export function routesReducer(state = DEFAULT_STATE, action) {
  switch (action.type) {
    case 'route_cleared':
      return produce(state, (draft) => {
        draft.routes =
          draft.routeStartCoords =
          draft.routeEndCoords =
          draft.activeRoute =
            null;
        draft.routeStatus = 'none';
      });
    case 'locations_set':
      // clear routes if new start and/or end point differ from the routes we have
      if (
        state.routes &&
        !(
          _coordsEqual(
            state.routeStartCoords,
            action.startPoint?.geometry?.coordinates,
          ) &&
          _coordsEqual(
            state.routeEndCoords,
            action.endPoint?.geometry?.coordinates,
          )
        )
      ) {
        return produce(state, (draft) => {
          draft.routes = draft.activeRoute = null;
          draft.routeStatus = 'none';
        });
      } else {
        return state;
      }
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
      return { ...state, activeRoute: action.index };
    default:
      return state;
  }
}

// Actions

export function fetchRoute(startCoords, endCoords) {
  return async function fetchRouteThunk(dispatch, getState) {
    if (!startCoords || !endCoords) {
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
        optimize: true,
        pointsEncoded: false,
      });
    } catch (e) {
      console.error('route fetch failed:', e);
      dispatch({
        type: 'route_fetch_failed',
        startCoords,
        endCoords,
        failureType: 'network error',
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
      });
      return;
    }

    dispatch({
      type: 'route_fetch_succeeded',
      routes: paths,
      startCoords,
      endCoords,
    });
  };
}

export function routeClicked(index) {
  return {
    type: 'route_clicked',
    index,
  };
}
