import { DateTime } from 'luxon';
import * as React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Transition } from '@headlessui/react';
import * as Dialog from '@radix-ui/react-dialog';
import * as RadioGroup from '@radix-ui/react-radio-group';
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
  const { globalDepartureType, globalInitialTime } = useSelector(
    ({ routeParams }) => {
      let departureType = 'departAt';
      if (routeParams.arriveBy) departureType = 'arriveBy';
      else if (routeParams.initialTime == null) departureType = 'now';
      return {
        globalDepartureType: departureType,
        globalInitialTime: routeParams.initialTime,
      };
    },
    shallowEqual,
  );

  const dispatch = useDispatch();
  const intl = useIntl();

  // From the time in global state, generate strings for the date & time <input>s
  const datetime = DateTime.fromMillis(globalInitialTime || Date.now());
  const globalTime = datetime.toFormat('HH:mm');
  const globalDate = datetime.toFormat('yyyy-MM-dd');

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  // Local state for the departure type, date and time, as it is being actively edited
  // in the dialog, and has not yet been committed to global state.
  const [pendingDepartureType, setPendingDepartureType] =
    React.useState(globalDepartureType);
  const [pendingDate, setPendingDate] = React.useState(globalDate);
  const [pendingTime, setPendingTime] = React.useState(globalTime);

  const handleUpdateClick = (evt) => {
    if (pendingDepartureType !== globalDepartureType)
      dispatch(departureTypeSelected(pendingDepartureType));
    if (pendingDate !== globalDate || pendingTime !== globalTime) {
      dispatch(
        initialTimeSet(
          DateTime.fromFormat(
            pendingDate + ' ' + pendingTime,
            'yyyy-MM-dd HH:mm',
          ).toMillis(),
        ),
      );
    }
    setIsDialogOpen(false);
    evt.preventDefault();
  };

  const handleDialogOpenChange = (isOpen) => {
    if (isOpen) {
      // Initialize the local (pending) state to match the global state.
      setPendingDepartureType(globalDepartureType);
      setPendingDate(globalDate);
      setPendingTime(globalTime);
    }
    setIsDialogOpen(isOpen);
  };

  const formattedInitialTime = datetime.toLocaleString(DateTime.DATETIME_MED);
  let departureString;
  if (globalDepartureType === 'now') {
    departureString = intl.formatMessage({
      defaultMessage: 'Leaving now',
      description: 'description of departure time for a trip leaving now.',
    });
  } else if (globalDepartureType === 'departAt') {
    departureString = intl.formatMessage(
      {
        defaultMessage: 'Departing {datetime}',
        description:
          'description of trip departing at the given date and time. ' +
          'The datetime is localized but an example for an American English locale ' +
          'would be "May 21, 2023, 2:30PM".',
      },
      { datetime: formattedInitialTime },
    );
  } else if (globalDepartureType === 'arriveBy') {
    departureString = intl.formatMessage(
      {
        defaultMessage: 'Arriving {datetime}',
        description:
          'description of trip arriving by the given date and time. ' +
          'The datetime is localized but an example for an American English locale ' +
          'would be "May 21, 2023, 2:30PM".',
      },
      { datetime: formattedInitialTime },
    );
  }

  return (
    <div className="TimeBar">
      <Dialog.Root open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <Dialog.Trigger asChild>
          <button
            className="outline-none select-none cursor-pointer
              text-[13px] rounded-md p-1.5 pl-[34px]
              border-2 border-solid border-transparent
              focus:outline-none focus:ring-0 focus:ring-offset-0
              bg-[#def0cc] text-[inherit]
              hover:bg-[#d0e1c0]
              focus-visible:border-bikehopperyellow focus-visible:bg-white
              relative"
          >
            <Icon className="absolute left-1 top-0.5">
              <ClockOutline />
            </Icon>
            {departureString}
          </button>
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
                  bg-white dark:bg-gray-800 p-6 rounded-md
                  text-gray-800 dark:text-gray-300"
              >
                <Dialog.Title
                  className="m-0 mb-3 text-lg align-middle
                    flex flex-row justify-start items-center select-none"
                >
                  <Icon className="mr-2 block flex-column justify-center">
                    <ClockOutline width="24" height="24" className="block" />
                  </Icon>
                  <span className="block">
                    <FormattedMessage
                      defaultMessage="Trip time"
                      description={
                        'dialog header. In this dialog you can select whether ' +
                        'to depart now, depart at a future time, or arrive by a ' +
                        'future time.'
                      }
                    />
                  </span>
                </Dialog.Title>
                <form>
                  <RadioGroup.Root
                    value={pendingDepartureType}
                    onValueChange={setPendingDepartureType}
                    className="my-3"
                  >
                    <TimeBarRadioGroupItem value="now" id="rgi_now">
                      <FormattedMessage
                        defaultMessage="Now"
                        description="option in a dropdown list for departure time"
                      />
                    </TimeBarRadioGroupItem>
                    <TimeBarRadioGroupItem value="departAt" id="rgi_departAt">
                      <FormattedMessage
                        defaultMessage="Depart at"
                        description={
                          'option in a dropdown list for departure time.' +
                          ' There is another input next to it to select' +
                          ' the time to depart at.'
                        }
                      />
                    </TimeBarRadioGroupItem>
                    {pendingDepartureType === 'departAt' && (
                      <TimeBarDateTimePicker
                        date={pendingDate}
                        time={pendingTime}
                        onDateChange={setPendingDate}
                        onTimeChange={setPendingTime}
                      />
                    )}
                    <TimeBarRadioGroupItem value="arriveBy" id="rgi_arriveBy">
                      <FormattedMessage
                        defaultMessage="Arrive by"
                        description={
                          'option in a dropdown list for departure time.' +
                          ' There is another input next to it to select' +
                          ' the time to arrive by.'
                        }
                      />
                    </TimeBarRadioGroupItem>
                    {pendingDepartureType === 'arriveBy' && (
                      <TimeBarDateTimePicker
                        date={pendingDate}
                        time={pendingTime}
                        onDateChange={setPendingDate}
                        onTimeChange={setPendingTime}
                      />
                    )}
                  </RadioGroup.Root>
                  <button
                    type="submit"
                    onClick={handleUpdateClick}
                    className="outline-none select-none cursor-pointer
                      text-base rounded-md py-1.5 px-3
                      focus:outline-none focus:ring-0 focus:ring-offset-0
                      focus-visible:ring
                      focus-visible:ring-blue-400 dark:focus-visible:ring-blue-600
                      focus-visible:ring-opacity-75 focus-visible:ring-offset-2
                      bg-blue-500 text-white
                      hover:bg-blue-600 dark:hover:bg-blue-400
                      border border-solid border-gray-300 dark:border-gray-600"
                  >
                    <FormattedMessage
                      defaultMessage="Update"
                      description="button. Saves changes made in a dialog box."
                    />
                  </button>
                </form>
                <Dialog.Close asChild>
                  <button
                    className="absolute top-6 right-3 border-0 bg-transparent
                      cursor-pointer dark:text-gray-400"
                  >
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
}

function TimeBarRadioGroupItem({ value, id, children }) {
  return (
    <div className="flex items-center leading-6">
      <RadioGroup.Item
        value={value}
        id={id}
        className="relative w-4 h-4 rounded-full my-1.5
          border border-solid border-gray-300 dark:border-gray-600
          text-white dark:text-gray-400
          bg-gray-200 dark:bg-gray-700
          aria-checked:bg-blue-500
          cursor-pointer
          focus:outline-none focus:ring-0 focus:ring-offset-0
          focus-visible:ring focus-visible:ring-blue-400
          focus-visible:ring-opacity-75 focus-visible:ring-offset-2 mr-1"
      >
        <RadioGroup.Indicator className="absolute inset-0 flex items-center justify-center leading-0">
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
        </RadioGroup.Indicator>
      </RadioGroup.Item>
      <label
        htmlFor={id}
        className="text-sm lg:text-base grow select-none cursor-pointer"
      >
        {children}
      </label>
    </div>
  );
}

function TimeBarDateTimePicker({ date, time, onDateChange, onTimeChange }) {
  const handleDateChange = React.useCallback(
    (evt) => onDateChange(evt.target.value),
    [onDateChange],
  );
  const handleTimeChange = React.useCallback(
    (evt) => onTimeChange(evt.target.value),
    [onTimeChange],
  );
  return (
    <fieldset className="border-0 m-0 p-1.5 flex flex-wrap flex-row">
      <input
        className="mr-3 font-sans text-sm lg:text-base
          text-gray-800 dark:text-gray-300
          bg-white dark:bg-gray-800
          border border-solid border-gray-300 dark:border-gray-600 rounded-md
          outline-none focus:outline-none focus:ring-0 focus:ring-offset-0
          focus-visible:ring focus-visible:ring-blue-400 dark:focus-visible:ring-blue-600
          dark:focus-visible:ring-offset-gray-800
          focus-visible:ring-opacity-75 focus-visible:ring-offset-2"
        type="date"
        value={date}
        onChange={handleDateChange}
      />
      <input
        className="font-sans text-sm lg:text-base
          text-gray-800 dark:text-gray-300
          bg-white dark:bg-gray-800
          border border-solid border-gray-300 dark:border-gray-600 rounded-md
          outline-none focus:outline-none focus:ring-0 focus:ring-offset-0
          focus-visible:ring focus-visible:ring-blue-400 dark:focus-visible:ring-blue-600
          dark:focus-visible:ring-offset-gray-800
          focus-visible:ring-opacity-75 focus-visible:ring-offset-2"
        type="time"
        value={time}
        onChange={handleTimeChange}
      />
    </fieldset>
  );
}
