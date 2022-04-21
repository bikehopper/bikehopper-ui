import produce from 'immer';
import { fetchRoute } from './routes';

const DEFAULT_STATE = {
  arriveBy: false,
  initialTime: null, //new Date().toISOString(),
};

export function timeReducer(state = DEFAULT_STATE, action) {
  switch (action.type) {
    case 'arrive_by_set':
      return produce(state, (draft) => {
        draft.arriveBy = action.arriveBy;
      });
    case 'initial_time_set':
      return produce(state, (draft) => {
        draft.initialTime = action.initialTime;
      });
    default:
      return state;
  }
}

export function arriveBySet(arriveBy) {
  return async function arriveBySetThunk(dispatch, getState) {
    dispatch({
      type: 'arrive_by_set',
      arriveBy,
    });
  };
}

export function initialTimeSet(initialTime) {
  return async function initialTimeSetThunk(dispatch, getState) {
    dispatch({
      type: 'initial_time_set',
      initialTime,
    });

    // If we have a location, fetch a route.
    let { start, end } = getState().locations;
    let { arriveBy } = getState().time;
    if (
      start?.point?.geometry.coordinates &&
      end?.point?.geometry.coordinates
    ) {
      await fetchRoute(
        start.point.geometry.coordinates,
        end.point.geometry.coordinates,
        arriveBy,
        initialTime,
      )(dispatch, getState);
    }
  };
}
