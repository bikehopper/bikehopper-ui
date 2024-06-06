import type { Action } from 'redux';
import { ActionAlertMixin, AlertSeverity } from './alerts';

export type MapLoadedAction = Action<'map_loaded'>;
export function mapLoaded() {
  return { type: 'map_loaded' };
}

export type FitFileGenerationFailedAction =
  Action<'fit_file_generation_failed'>;
/** This just exists to generate an alert, for now. */
export function fitFileGenerationFailed(
  message: string,
): FitFileGenerationFailedAction & ActionAlertMixin {
  return {
    type: 'fit_file_generation_failed',
    alert: {
      message,
      severity: AlertSeverity.ERROR,
    },
  };
}

export type MiscAction = MapLoadedAction | FitFileGenerationFailedAction;
