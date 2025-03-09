import * as ToastPrimitive from '@radix-ui/react-toast';
import { Fragment, useCallback, useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import type { IntlShape } from 'react-intl';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import classnames from 'classnames';
import { Transition } from '@headlessui/react';

import {
  AlertMessageCode,
  AlertSeverity,
  dismissAlert,
} from '../features/alerts';
import type { AlertMessage } from '../features/alerts';
import type { RootState } from '../store';
import BorderlessButton from './BorderlessButton';
import Icon from './primitives/Icon';

import CancelIcon from 'iconoir/icons/xmark.svg?react';
import CheckCircle from 'iconoir/icons/check-circle.svg?react';
import WarningCircle from 'iconoir/icons/warning-circle.svg?react';
import WarningTriangle from 'iconoir/icons/warning-triangle.svg?react';

const DISMISS_TIME = 4000;

export default function Toasts() {
  const alerts = useSelector(
    (state: RootState) => state.alerts.alerts,
    shallowEqual,
  );

  const dispatch = useDispatch();
  const intl = useIntl();

  const handleOpenChange = useCallback(
    (id: number, open: boolean) => {
      if (!open) dispatch(dismissAlert(id));
    },
    [dispatch],
  );

  // for some reason, radix's toast isn't automatically dismissing after the
  // passed duration like it should. so do it ourselves:
  const dismissTimersRef = useRef<Map<number, number>>(new Map());
  useEffect(() => {
    const dismissTimers = dismissTimersRef.current;
    const alertIdsDisplayed = new Set();
    for (const alert of alerts) {
      alertIdsDisplayed.add(alert.id);
      if (!dismissTimers.has(alert.id)) {
        dismissTimers.set(
          alert.id,
          setTimeout(() => dispatch(dismissAlert(alert.id)), DISMISS_TIME),
        );
      }
    }
    // Clear timers for already-dismissed alerts
    for (const [alertId, timer] of dismissTimers) {
      if (!alertIdsDisplayed.has(alertId)) {
        clearTimeout(timer);
        dismissTimers.delete(alertId);
      }
    }
  }, [dispatch, alerts]);

  // The default hotkey. Explicitly defining so we can use it as a parameter
  // for internationalization.
  const hotkeyProp = ['F8'];
  const hotkeyDisplay = 'F8';

  return (
    <>
      <ToastPrimitive.Viewport
        className="bg-transparent pointer-events-none z-30
          list-none px-0 pt-0 pb-8 flex flex-col
          fixed bottom-0 inset-x-0 box-content content-end items-center"
        hotkey={hotkeyProp}
        label={intl.formatMessage(
          {
            defaultMessage: 'Notifications ({hotkey})',
            description:
              'label for notifications area. The hotkey is a key such as ' +
              'F8 that can be pressed on a keyboard to jump to this area.',
          },
          {
            hotkey: hotkeyDisplay,
          },
        )}
      />
      {alerts.map(({ severity, message, id }) => (
        <Transition
          as={Fragment}
          enter="transition-opacity ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          key={id}
          show={true}
          appear={true}
        >
          <ToastPrimitive.Root
            className={classnames({
              'pointer-events-auto p-2 mx-2 sm:mx-4 lg:mx-12 rounded-lg shadow-md': true,
              'border border-slate-300 border-solid': true,
              'flex flex-row justify-between': true,
              'items-center text-sm md:text-base mt-2': true,
              'bg-red-200': severity === AlertSeverity.ERROR,
              'bg-yellow-200': severity === AlertSeverity.WARNING,
              'bg-white': severity === AlertSeverity.SUCCESS,
            })}
            key={id}
            onOpenChange={handleOpenChange.bind(null, id)}
            duration={DISMISS_TIME}
          >
            <div>
              <Icon className="">
                {severity === AlertSeverity.ERROR ? (
                  <WarningCircle width="16" height="16" />
                ) : severity === AlertSeverity.WARNING ? (
                  <WarningTriangle width="16" height="16" />
                ) : (
                  <CheckCircle width="16" height="16" />
                )}
              </Icon>
            </div>
            <ToastPrimitive.Description className="mx-2">
              {describeMessage(message, intl)}
            </ToastPrimitive.Description>
            <ToastPrimitive.Close asChild>
              <BorderlessButton
                aria-label={intl.formatMessage({
                  defaultMessage: 'Dismiss',
                  description: 'button to dismiss alert',
                })}
              >
                <Icon>
                  <CancelIcon width="16" height="16" />
                </Icon>
              </BorderlessButton>
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        </Transition>
      ))}
    </>
  );
}

function describeMessage(
  message: string | AlertMessage,
  intl: IntlShape,
): string {
  if (typeof message === 'string') return message;
  switch (message.code) {
    case AlertMessageCode.CANT_CONNECT_TO_SERVER:
      return intl.formatMessage({
        defaultMessage: "Can't connect to server",
        description: 'error message',
      });
    case AlertMessageCode.SERVER_ERROR:
      return intl.formatMessage({
        defaultMessage: 'Server error',
        description:
          'error message when something unexpectedly went wrong' +
          ' on the server',
      });
    case AlertMessageCode.SEARCH_NO_RESULTS: {
      let text = message.params?.text;
      if (text == null) {
        console.warn('missing text parameter for SEARCH_NO_RESULTS');
        text = '---';
      }
      return intl.formatMessage(
        {
          defaultMessage: "Couldn't find {text}",
          description:
            'Error message. There was no result for ' +
            'the text you searched for',
        },
        { text: message.params?.text || '---' },
      );
    }
    case AlertMessageCode.GEOLOCATE_FAIL_NO_PERM:
      return intl.formatMessage({
        defaultMessage:
          "Your browser isn't letting BikeHopper detect" +
          ' your current location.' +
          ' Check your browser settings for this website.',
        description:
          'Error message. Detecting location fails due to lack' +
          ' of user permission',
      });
    case AlertMessageCode.GEOLOCATE_FAIL_NO_POS:
      return intl.formatMessage({
        defaultMessage:
          "Can't find your current location: position unavailable",
        description: 'Error message when detecting user location',
      });
    case AlertMessageCode.GEOLOCATE_FAIL_TIMEOUT:
      return intl.formatMessage({
        defaultMessage: "Can't find your current location: timed out",
        description: 'Error message when detecting user location',
      });
    case AlertMessageCode.GEOLOCATE_FAIL_UNKNOWN:
      return intl.formatMessage({
        defaultMessage: "Can't find your current location: unknown error",
        description: 'Error message when detecting user location',
      });
    case AlertMessageCode.CANT_GENERATE_FIT_FILE:
      return intl.formatMessage({
        defaultMessage: 'Unable to generate FIT file',
        description:
          "error when we can't generate a FIT file " +
          '(a file format used in a cycling computer).',
      });
    case AlertMessageCode.COPIED_URL_TO_CLIPBOARD:
      return intl.formatMessage({
        defaultMessage: 'Copied URL to clipboard!',
        description: 'toast displayed when copying a URL to clipboard.',
      });
    case AlertMessageCode.COPY_URL_FAILED:
      return intl.formatMessage({
        defaultMessage: 'Unable to copy URL to clipboard',
        description: 'error alert when copying a URL to clipboard fails.',
      });
  }
  console.warn('unhandled message type', message);
  return `#${message}`;
}
