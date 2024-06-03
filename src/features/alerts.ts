import type { Action } from 'redux';
import type { BikeHopperAction } from '../store';

export enum AlertSeverity {
  WARNING = 'warning',
  ERROR = 'error',
}

type Alert = {
  message: string;
  severity: AlertSeverity;
  id: number;
};

type AlertParams = {
  message: string;
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
  message: string,
) {
  return {
    ...state,
    alerts: [_createAlert(severity, message), ...state.alerts],
  };
}

let _alertNonce = 90000; // For assigning a unique ID to each alert in a session

function _createAlert(severity: AlertSeverity, message: string) {
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
