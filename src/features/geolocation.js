import produce from 'immer';
import getCurrentPosition from '../lib/getCurrentPosition';

const DEFAULT_STATE = {
  lat: null,
  lng: null,
  accuracy: null,
  timestamp: null,
};

export function geolocationReducer(state = DEFAULT_STATE, action) {
  switch (action.type) {
    case 'geolocated':
      return produce(state, (draft) => {
        draft.lat = action.coords.latitude;
        draft.lng = action.coords.longitude;
        draft.accuracy = action.coords.accuracy;
        draft.timestamp = action.timestamp;
      });
    default:
      return state;
  }
}

// Actions

export function geolocated(coords, timestamp) {
  return {
    type: 'geolocated',
    // we have to explicitly copy everything out of the GeolocationCoordinates;
    // it's not a plain object
    coords: {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      altitude: coords.altitude,
      altitudeAccuracy: coords.altitudeAccuracy,
      heading: coords.heading,
      speed: coords.speed,
    },
    timestamp,
  };
}

// Not yet used or tested.
// TODO: Call this when "Current Location" is used in a location input and
// enable that option even if the geolocate control has not been touched.
export function geolocate(maxAge, timeout) {
  return async function geolocateThunk(dispatch, getState) {
    dispatch({ type: 'geolocate_attempted' });

    let pos;
    try {
      pos = await getCurrentPosition({
        maximumAge: maxAge,
        timeout,
      });
    } catch (e) {
      dispatch({
        type: 'geolocate_failed',
        code: e instanceof window.GeolocationPositionError ? e.code : null,
      });
      if (!e instanceof window.GeolocationPositionError) {
        // This is unexpected
        console.error(e);
      }
      return;
    }

    dispatch(geolocated(pos.coords, pos.timestamp));
  };
}
