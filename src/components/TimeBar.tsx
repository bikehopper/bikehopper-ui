import { DateTime } from 'luxon';
import { useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import ModalDialog from './primitives/ModalDialog';
import DialogSubmitButton from './primitives/DialogSubmitButton';
import Icon from './primitives/Icon';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import type { RootState, Dispatch } from '../store';
import { departureChanged } from '../features/routeParams';
import type { DepartureType } from '../features/routeParams';

import ClockOutline from 'iconoir/icons/clock.svg?react';

// contract:
// receive departureType and initialTime from routeParams store
// modify by firing departureChanged actions

export default function TimeBar(props: {}) {
  const { globalDepartureType, globalInitialTime } = useSelector(
    ({ routeParams }: RootState) => {
      let departureType: DepartureType = 'departAt';
      if (routeParams.arriveBy) departureType = 'arriveBy';
      else if (routeParams.initialTime == null) departureType = 'now';
      return {
        globalDepartureType: departureType,
        globalInitialTime: routeParams.initialTime,
      };
    },
    shallowEqual,
  );

  const dispatch: Dispatch = useDispatch();
  const intl = useIntl();

  // From the time in global state, generate strings for the date & time <input>s
  const globalDateTime = DateTime.fromMillis(globalInitialTime || Date.now());
  const [globalDate, globalTime] = formatForDateAndTimeInputs(globalDateTime);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Local state for the departure type, date and time, as it is being actively edited
  // in the dialog, and has not yet been committed to global state.
  const [pendingDepartureType, setPendingDepartureType] =
    useState<DepartureType>(globalDepartureType);
  const [pendingDate, setPendingDate] = useState(globalDate);
  const [pendingTime, setPendingTime] = useState(globalTime);

  const handleTrigger = () => {
    // Initialize the local (pending) state to match the global state.
    setPendingDepartureType(globalDepartureType);
    setPendingDate(globalDate);
    setPendingTime(globalTime);
    setIsDialogOpen(true);
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
  };

  const handleUpdateClick = useCallback(
    (evt: React.MouseEvent) => {
      // Since this is an explicit "Update" click, always dispatch the action, even if
      // the pending state is the same as the global state. The user might want to refetch
      // routes, which could be different from the cached routes if "Now" is selected.
      dispatch(
        departureChanged(
          pendingDepartureType,
          parseDateAndTimeInputStrings(pendingDate, pendingTime).toMillis(),
        ),
      );
      setIsDialogOpen(false);
      evt.preventDefault();
    },
    [dispatch, pendingDepartureType, pendingDate, pendingTime],
  );

  const formattedInitialTime = globalDateTime.toLocaleString(
    DateTime.DATETIME_MED,
  );
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
    <div>
      <button
        onClick={handleTrigger}
        className="outline-hidden select-none cursor-pointer
          text-[13px] rounded-md p-1.5
          border-2 border-solid border-transparent
          focus:outline-hidden focus:ring-0 focus:ring-offset-0
          bg-bikehoppergreenlight text-inherit
          hover:bg-[#d0e1c0]
          focus-visible:border-bikehopperyellow focus-visible:bg-white"
      >
        {departureString}
      </button>
      <ModalDialog
        isOpen={isDialogOpen}
        onCancel={handleCancel}
        clickOutsideCancels={true}
        title={
          <>
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
          </>
        }
      >
        <form>
          <RadioGroup.Root
            value={pendingDepartureType}
            onValueChange={setPendingDepartureType as (value: string) => void}
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
          <DialogSubmitButton onClick={handleUpdateClick}>
            <FormattedMessage
              defaultMessage="Update"
              description="button. Saves changes made in a dialog box."
            />
          </DialogSubmitButton>
        </form>
      </ModalDialog>
    </div>
  );
}

function TimeBarRadioGroupItem({
  value,
  id,
  children,
}: {
  value: DepartureType;
  id: string;
  children: React.ReactNode;
}) {
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
          focus:outline-hidden focus:ring-0 focus:ring-offset-0
          focus-visible:ring-3 focus-visible:ring-blue-400
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

function TimeBarDateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
}: {
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
}) {
  const handleDateChange = useCallback<
    React.ChangeEventHandler<HTMLInputElement>
  >((evt) => onDateChange(evt.target.value), [onDateChange]);
  const handleTimeChange = useCallback<
    React.ChangeEventHandler<HTMLInputElement>
  >((evt) => onTimeChange(evt.target.value), [onTimeChange]);
  return (
    <fieldset className="border-0 m-0 p-1.5 flex flex-wrap flex-row">
      <input
        className="mr-3 font-sans text-sm lg:text-base
          text-gray-800 dark:text-gray-300
          bg-white dark:bg-gray-800
          border border-solid border-gray-300 dark:border-gray-600 rounded-md
          outline-hidden focus:outline-hidden focus:ring-0 focus:ring-offset-0
          focus-visible:ring-3 focus-visible:ring-blue-400 dark:focus-visible:ring-blue-600
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
          outline-hidden focus:outline-hidden focus:ring-0 focus:ring-offset-0
          focus-visible:ring-3 focus-visible:ring-blue-400 dark:focus-visible:ring-blue-600
          dark:focus-visible:ring-offset-gray-800
          focus-visible:ring-opacity-75 focus-visible:ring-offset-2"
        type="time"
        value={time}
        onChange={handleTimeChange}
      />
    </fieldset>
  );
}

// Helper functions for converting between Luxon DateTime instances and the
// string formats used for HTML input type=date and =time.
function formatForDateAndTimeInputs(dt: DateTime): [string, string] {
  return [dt.toFormat('yyyy-MM-dd'), dt.toFormat('HH:mm')];
}
function parseDateAndTimeInputStrings(
  dateString: string,
  timeString: string,
): DateTime {
  return DateTime.fromFormat(dateString + ' ' + timeString, 'yyyy-MM-dd HH:mm');
}
