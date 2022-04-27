import produce from 'immer';
import getCurrentPosition from '../lib/getCurrentPosition';
import { AlertSeverity } from './alerts';

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
      const errorCode =
        e instanceof window.GeolocationPositionError ? e.code : null;
      let errorMsg = "Can't geolocate";
      if (errorCode && 'GeolocationPositionError' in window) {
        switch (errorCode) {
          case window.GeolocationPositionError.PERMISSION_DENIED:
            errorMsg += ': permission denied';
            break;
          case window.GeolocationPositionError.POSITION_UNAVAILABLE:
            errorMsg += ': position unavailable';
            break;
          case window.GeolocationPositionError.TIMEOUT:
            errorMsg += ': timed out';
            break;
          default:
            errorMsg += ': unknown error';
            break;
        }
      }
      dispatch({
        type: 'geolocate_failed',
        code: errorCode,
        alert: {
          severity: AlertSeverity.WARNING,
          message: errorMsg,
        },
      });
      return;
    }

    dispatch(geolocated(pos.coords, pos.timestamp));
  };
}
