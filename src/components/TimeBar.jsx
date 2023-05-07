import Bowser from 'bowser';
import { DateTime } from 'luxon';
import * as React from 'react';
import { useIntl } from 'react-intl';
import { Transition } from '@headlessui/react';
import * as Dialog from '@radix-ui/react-dialog';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import Icon from './Icon';

import { initialTimeSet, departureTypeSelected } from '../features/routeParams';

import { ReactComponent as CancelIcon } from 'iconoir/icons/cancel.svg';
import { ReactComponent as ClockOutline } from 'iconoir/icons/clock.svg';
import './TimeBar.css';

// contract:
// receive departureType and initialTime from routeParams store
// modify by firing departureTypeSelected and initialTimeSet actions

export default function TimeBar(props) {
  const { departureType, timeFromGlobalState } = useSelector(
    ({ routeParams }) => {
      let departureType = 'departAt';
      if (routeParams.arriveBy) departureType = 'arriveBy';
      else if (routeParams.initialTime == null) departureType = 'now';
      return {
        departureType,
        timeFromGlobalState: routeParams.initialTime,
      };
    },
    shallowEqual,
  );

  const dispatch = useDispatch();
  const intl = useIntl();

  // From the time in global state, generate strings for the date & time <input>s
  const datetime = DateTime.fromMillis(timeFromGlobalState || Date.now());
  const timeForTimeInput = datetime.toFormat('HH:mm');
  const dateForDateInput = datetime.toFormat('yyyy-MM-dd');

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleUpdateClick = React.useCallback((evt) => {
    console.log('update clicked');
    setIsDialogOpen(false);
  }, []);

  return (
    <div className="TimeBar">
      <span>{departureType + ' '}</span>
      {departureType !== 'now' && (
        <span>{dateForDateInput + ' ' + timeForTimeInput}</span>
      )}
      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Trigger asChild>
          <button>Change</button>
        </Dialog.Trigger>
        <Dialog.Portal forceMount>
          <Transition show={isDialogOpen}>
            <Transition.Child
              as={React.Fragment}
              enter="transition-opacity ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay
                className="fixed inset-0 bg-slate-900/50 z-10 transition-colors"
                forceMount
              />
            </Transition.Child>
            <Transition.Child
              as={React.Fragment}
              enter="transition-opacity ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Content
                forceMount
                aria-describedby={undefined}
                className="fixed z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                  w-[90vw] md:w-[95vw] max-w-md
                  bg-white p-6 rounded-md"
              >
                <Dialog.Title className="m-0">Change trip time</Dialog.Title>
                <p>controls to come here</p>
                <button onClick={handleUpdateClick} className="">
                  Update
                </button>
                <Dialog.Close asChild>
                  <button className="absolute top-6 right-3 border-0 bg-transparent">
                    <Icon
                      label={intl.formatMessage({
                        defaultMessage: 'Cancel',
                        description:
                          'button to cancel making changes in a dialog',
                      })}
                    >
                      <CancelIcon width="20" height="20" />
                    </Icon>
                  </button>
                </Dialog.Close>
              </Dialog.Content>
            </Transition.Child>
          </Transition>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );

  const options = [
    {
      value: 'now',
      label: intl.formatMessage({
        defaultMessage: 'Now',
        description: 'option in a dropdown list for departure time',
      }),
    },
    {
      value: 'departAt',
      label: intl.formatMessage({
        defaultMessage: 'Depart at',
        description:
          'option in a dropdown list for departure time.' +
          ' There is another input next to it to select the time to depart at.',
      }),
    },
    {
      value: 'arriveBy',
      label: intl.formatMessage({
        defaultMessage: 'Arrive by',
        description:
          'option in a dropdown list for departure time.' +
          ' There is another input next to it to select the time to arrive by.',
      }),
    },
  ];
}
