import * as ToastPrimitive from '@radix-ui/react-toast';
import { Fragment, useCallback, useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import classnames from 'classnames';
import { Transition } from '@headlessui/react';

import { AlertSeverity, dismissAlert } from '../features/alerts';
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

  return (
    <>
      <ToastPrimitive.Viewport
        className="bg-transparent pointer-events-none z-30
          list-none px-0 pt-0 pb-8 flex flex-col
          fixed bottom-0 inset-x-0 box-content content-end items-center"
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
              'pointer-events-auto p-2 mx-2 sm:mx-4 lg:mx-12 rounded-lg shadow-md':
                true,
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
            <div className="relative top-0.5">
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
              {message}
            </ToastPrimitive.Description>
            <ToastPrimitive.Close asChild>
              <BorderlessButton
                aria-label={intl.formatMessage({
                  defaultMessage: 'Dismiss',
                  description: 'button to dismiss alert',
                })}
                className="relative top-0.5"
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
