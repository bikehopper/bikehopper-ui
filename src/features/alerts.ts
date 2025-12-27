import type { Action } from 'redux';
import type { BikeHopperAction } from '../store';

export enum AlertSeverity {
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

export type AlertMessage = {
  code: AlertMessageCode;
  params?: { [key: string]: string };
};

export enum AlertMessageCode {
  CANT_CONNECT_TO_SERVER = 1,
  SERVER_ERROR = 2,

  SEARCH_NO_RESULTS = 10,

  GEOLOCATE_FAIL_NO_PERM = 20,
  GEOLOCATE_FAIL_NO_POS = 21,
  GEOLOCATE_FAIL_TIMEOUT = 22,
  GEOLOCATE_FAIL_UNKNOWN = 23,

  CANT_FIND_ROUTE = 30,

  CANT_GENERATE_FIT_FILE = 40,
  COPIED_URL_TO_CLIPBOARD = 41,
  COPY_URL_FAILED = 42,
}

type Alert = {
  message: AlertMessage;
  severity: AlertSeverity;
  id: number;
};

type AlertParams = {
  message: AlertMessage;
  severity?: AlertSeverity;
};

export type ActionAlertMixin = {
  alert?: AlertParams;
};

type AlertState = {
  alerts: Array<Alert>;
};

const DEFAULT_STATE: AlertState = {
  // Each alert: {
  //   severity: one of AlertSeverity constants,
  //   message: string,
  //   id: a one-time use value unique to this alert over the course of the session,
  // }
  alerts: [],
};

export function alertsReducer(state = DEFAULT_STATE, action: BikeHopperAction) {
  switch (action.type) {
    case 'alert_dismissed':
      return {
        ...state,
        alerts: state.alerts.filter((alert) => alert.id !== action.id),
      };
    default:
      // Sorta unique to the alerts reducer: an action of ANY type can have an
      // alert field and it creates an alert.
      if (action.alert) {
        return _addAlert(state, action.alert.severity, action.alert.message);
      }
      return state;
  }
}

function _addAlert(
  state: AlertState,
  severity = AlertSeverity.ERROR,
  message: AlertMessage,
) {
  return {
    ...state,
    alerts: [_createAlert(severity, message), ...state.alerts],
  };
}

let _alertNonce = 90000; // For assigning a unique ID to each alert in a session

function _createAlert(severity: AlertSeverity, message: AlertMessage) {
  return {
    severity,
    message,
    id: _alertNonce++,
  };
}

// Actions

export type DismissAlertAction = Action<'alert_dismissed'> & { id: number };
export function dismissAlert(id: number): DismissAlertAction {
  return {
    type: 'alert_dismissed',
    id,
  };
}

export type AlertAction = DismissAlertAction;
