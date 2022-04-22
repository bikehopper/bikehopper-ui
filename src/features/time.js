import produce from 'immer';
import { fetchRoute } from './routes';

const DEFAULT_STATE = {
  arriveBy: false,
  initialTime: null,
  departureType: 'now',
};

export function timeReducer(state = DEFAULT_STATE, action) {
  switch (action.type) {
    case 'initial_time_set':
      return produce(state, (draft) => {
        draft.initialTime = action.initialTime;
      });
    case 'timebar_dropdown_selected':
      return produce(state, (draft) => {
        draft.departureType = action.departureType;
        draft.arriveBy = action.departureType === 'arriveBy';
        if (action.departureType === 'now') draft.initialTime = null;
      });

    default:
      return state;
  }
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

export function timebarDropdownSelected(departureType) {
  return async function timebarDropdownSelectedThunk(dispatch, getState) {
    dispatch({
      type: 'timebar_dropdown_selected',
      departureType,
    });

    // If we have a location, fetch a route.
    let { start, end } = getState().locations;
    let { arriveBy, initialTime } = getState().time;
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
