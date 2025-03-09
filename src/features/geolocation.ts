import type { Action } from 'redux';
import type { BikeHopperAction, BikeHopperThunkAction } from '../store';

import produce from 'immer';
import getCurrentPosition from '../lib/getCurrentPosition';
import { AlertMessageCode, AlertSeverity } from './alerts';

type GeolocationState = {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  timestamp: number | null;
  geolocationInProgress: boolean;
};

const DEFAULT_STATE: GeolocationState = {
  lat: null,
  lng: null,
  accuracy: null,
  timestamp: null,

  // are we actively attempting to geolocate?
  geolocationInProgress: false,
};

export function geolocationReducer(
  state = DEFAULT_STATE,
  action: BikeHopperAction,
): GeolocationState {
  switch (action.type) {
    case 'geolocate_attempted':
      return produce(state, (draft) => {
        draft.geolocationInProgress = true;
      });
    case 'geolocated':
      return produce(state, (draft) => {
        draft.geolocationInProgress = false;
        draft.lat = action.coords.latitude;
        draft.lng = action.coords.longitude;
        draft.accuracy = action.coords.accuracy;
        draft.timestamp = action.timestamp;
      });
    case 'geolocate_failed':
      return produce(state, (draft) => {
        draft.geolocationInProgress = false;
      });
    default:
      return state;
  }
}

// Actions

export type GeolocatedAction = Action<'geolocated'> & {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
};
export function geolocated(
  coords: GeolocationCoordinates,
  timestamp: number,
): GeolocatedAction {
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

const MAX_AGE_MS = 30000;
const TIMEOUT_MS = 15000;

export type GeolocateAttemptedAction = Action<'geolocate_attempted'>;
export type GeolocateFailedAction = Action<'geolocate_failed'> & {
  code: number | null;
};

export function geolocate(): BikeHopperThunkAction {
  return async function geolocateThunk(dispatch, getState) {
    dispatch({ type: 'geolocate_attempted' });

    let pos;
    try {
      pos = await getCurrentPosition({
        maximumAge: MAX_AGE_MS,
        timeout: TIMEOUT_MS,
      });
    } catch (e) {
      const errorCode =
        e instanceof window.GeolocationPositionError ? e.code : null;
      let alertMsgCode: AlertMessageCode =
        AlertMessageCode.GEOLOCATE_FAIL_UNKNOWN;
      if (errorCode && 'GeolocationPositionError' in window) {
        switch (errorCode) {
          case window.GeolocationPositionError.PERMISSION_DENIED:
            alertMsgCode = AlertMessageCode.GEOLOCATE_FAIL_NO_PERM;
            break;
          case window.GeolocationPositionError.POSITION_UNAVAILABLE:
            alertMsgCode = AlertMessageCode.GEOLOCATE_FAIL_NO_POS;
            break;
          case window.GeolocationPositionError.TIMEOUT:
            alertMsgCode = AlertMessageCode.GEOLOCATE_FAIL_TIMEOUT;
            break;
        }
      }
      dispatch({
        type: 'geolocate_failed',
        code: errorCode,
        alert: {
          severity: AlertSeverity.WARNING,
          message: { code: alertMsgCode },
        },
      });
      return;
    }

    dispatch(geolocated(pos.coords, pos.timestamp));
  };
}

export type GeolocationAction =
  | GeolocateAttemptedAction
  | GeolocatedAction
  | GeolocateFailedAction;
