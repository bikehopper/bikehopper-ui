export const AlertSeverity = {
  WARNING: 'warning',
  ERROR: 'error',
};

const DEFAULT_STATE = {
  // Each alert: {
  //   severity: one of AlertSeverity constants,
  //   message: string,
  //   id: a one-time use value unique to this alert over the course of the session,
  // }
  alerts: [],
};

export function alertsReducer(state = DEFAULT_STATE, action) {
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

function _addAlert(state, severity = AlertSeverity.ERROR, message) {
  return {
    ...state,
    alerts: [_createAlert(severity, message), ...state.alerts],
  };
}

let _alertNonce = 90000; // For assigning a unique ID to each alert in a session

function _createAlert(severity, message) {
  return {
    severity,
    message,
    id: _alertNonce++,
  };
}

// Actions

export function dismissAlert(id) {
  return {
    type: 'alert_dismissed',
    id,
  };
}
