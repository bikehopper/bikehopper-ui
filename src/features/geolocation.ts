import produce from 'immer';
import getCurrentPosition from '../lib/getCurrentPosition';
import { AlertSeverity } from './alerts';
import type { AppDispatch, GetAppState } from '../store';
import {
  ActionType,
  type GeolocateAttemptedAction,
  type GeolocateFailedAction,
  type GeolocatedAction,
} from './actions';

type GeolocationState = {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  timestamp: EpochTimeStamp | null;
  /** Are we actively attempting to geolocate? */
  geolocationInProgress: boolean;
};

const DEFAULT_STATE: GeolocationState = {
  lat: null,
  lng: null,
  accuracy: null,
  timestamp: null,
  geolocationInProgress: false,
};

type GeolocationAction =
  | GeolocateAttemptedAction
  | GeolocateFailedAction
  | GeolocatedAction;

export function geolocationReducer(
  state: GeolocationState = DEFAULT_STATE,
  action: GeolocationAction,
): GeolocationState {
  switch (action.type) {
    case ActionType.GEOLOCATE_ATTEMPTED:
      return produce(state, (draft) => {
        draft.geolocationInProgress = true;
      });
    case ActionType.GEOLOCATED:
      return produce(state, (draft) => {
        draft.geolocationInProgress = false;
        draft.lat = action.coords.latitude;
        draft.lng = action.coords.longitude;
        draft.accuracy = action.coords.accuracy;
        draft.timestamp = action.timestamp;
      });
    case ActionType.GEOLOCATE_FAILED:
      return produce(state, (draft) => {
        draft.geolocationInProgress = false;
      });
    default: {
      // enforce exhaustive switch statement
      const unreachable: never = action;
      return state;
    }
  }
}

// Actions

export function geolocated(
  coords: GeolocationCoordinates,
  timestamp: EpochTimeStamp,
): GeolocatedAction {
  return {
    type: ActionType.GEOLOCATED,
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

export function geolocate() {
  return async function geolocateThunk(
    dispatch: AppDispatch,
    getState: GetAppState,
  ) {
    dispatch({ type: 'geolocate_attempted' });

    let pos: GeolocationPosition;
    try {
      pos = await getCurrentPosition({
        maximumAge: MAX_AGE_MS,
        timeout: TIMEOUT_MS,
      });
    } catch (e) {
      const errorCode =
        e instanceof window.GeolocationPositionError ? e.code : null;
      let errorMsg = "Can't find your current location";
      if (errorCode && 'GeolocationPositionError' in window) {
        switch (errorCode) {
          case window.GeolocationPositionError.PERMISSION_DENIED:
            errorMsg =
              "Your browser isn't letting BikeHopper detect your current location." +
              ' Check your browser settings for this website.';
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
