import { IntlShape } from 'react-intl';
import type { Action } from 'redux';
import { ActionAlertMixin, AlertSeverity } from './alerts';
import { BikeHopperThunkAction } from '../store';
import describePlace from '../lib/describePlace';

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

export function shareRoutes(intl: IntlShape): BikeHopperThunkAction {
  return async (dispatch, getState) => {
    let errorFromShare: any;
    // open OS-level share dialog if it exists
    if ('share' in navigator) {
      const { start, end } = getState().routeParams;
      const fromText = start?.point
        ? describePlace(start.point, { fallback: '' })
        : '';
      const toText = end?.point
        ? describePlace(end.point, { fallback: '' })
        : '';
      let shareText;
      if (fromText && toText) {
        shareText = intl.formatMessage(
          {
            defaultMessage: 'Bike routes from {from} to {to}',
            description: 'description of shared link to routing info',
          },
          {
            from: fromText,
            to: toText,
          },
        );
      } else if (toText) {
        shareText = intl.formatMessage(
          {
            defaultMessage: 'Bike routes to {to}',
            description: 'description of shared link to routing info',
          },
          { to: toText },
        );
      } else {
        shareText = intl.formatMessage({
          defaultMessage: 'Bike routes to custom point',
          description:
            'description of shared link to routing info.' +
            ' The routes are to a destination for which no address or name' +
            ' is known.',
        });
      }
      try {
        await navigator.share({
          title: 'BikeHopper',
          text: shareText,
          url: String(document.location),
        });
        return;
      } catch (error) {
        // If the error is because the user aborted the share: stop.
        // Any other error: fall through and try to copy to clipboard.
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
      }
    }

    // OS-level share didn't work, copy to clipboard
    try {
      await navigator.clipboard.writeText(String(document.location));
      dispatch({
        type: 'url_copied',
        alert: {
          message: intl.formatMessage({
            defaultMessage: 'Copied URL to clipboard!',
            description: 'toast displayed when copying a URL to clipboard.',
          }),
          severity: AlertSeverity.SUCCESS,
        },
      });
    } catch (error) {
      dispatch({
        type: 'url_copy_failed',
        alert: {
          message: errorFromShare
            ? errorFromShare.name + ' ' + errorFromShare.message
            : intl.formatMessage({
                defaultMessage: 'Unable to copy URL to clipboard',
                description:
                  'error alert when copying a URL to clipboard fails.',
              }),
          severity: AlertSeverity.ERROR,
        },
      });
    }
  };
}

export type UrlCopyFailedAction = Action<'url_copy_failed'>;
export type UrlCopiedAction = Action<'url_copied'>;

export type MiscAction =
  | MapLoadedAction
  | FitFileGenerationFailedAction
  | UrlCopyFailedAction
  | UrlCopiedAction;
