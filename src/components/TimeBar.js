import Bowser from 'bowser';
import * as React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import Icon from './Icon';
import Dropdown from 'react-dropdown';

import usePrevious from '../hooks/usePrevious';
import { initialTimeSet, departureTypeSelected } from '../features/routeParams';

import { ReactComponent as ClockOutline } from 'iconoir/icons/clock.svg';
import 'react-dropdown/style.css';
import './TimeBar.css';

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
  const prevTimeFromGlobalState = usePrevious(timeFromGlobalState);

  const [timeInputValue, setTimeInputValue] =
    React.useState(timeFromGlobalState);

  // When the time value from the global state changes, use it to override the local
  // component state.
  //
  // Why this is needed: Some browsers fire change events while you are still typing the
  // time: "9:00 AM" => "2:00 AM" => "2:10 AM" => "2:15AM" => "2:15PM".
  // We want to avoid fetching routes four different times in this case -- don't update
  // global state until done editing. Thus, there is a separate global state and local
  // component state for the time input.
  React.useEffect(() => {
    if (timeFromGlobalState !== prevTimeFromGlobalState)
      setTimeInputValue(timeFromGlobalState);
  }, [timeFromGlobalState, prevTimeFromGlobalState]);

  const dispatch = useDispatch();

  const lastDispatchedTimeValue = React.useRef(null);

  const handleUpdatedDateTimeValue = (value) => {
    if (value === lastDispatchedTimeValue.current) return;
    lastDispatchedTimeValue.current = value;
    dispatch(initialTimeSet(value));
  };

  const handleTimeBlur = (event) => {
    handleUpdatedDateTimeValue(timeInputValue);
  };

  const handleTimeKeyPress = (event) => {
    if (event.key === 'Enter') handleUpdatedDateTimeValue(event.target.value);
  };

  const handleTimeChange = (event) => {
    const valueToSet = event.target.value === '' ? null : event.target.value;
    setTimeInputValue(valueToSet);
    const ua = Bowser.parse(navigator.userAgent);
    if (!doesBrowserFireDateTimeChangePrematurely(ua))
      handleUpdatedDateTimeValue(valueToSet);
  };

  const handleSelect = (event) => {
    dispatch(departureTypeSelected(event.value));
  };

  const options = [
    { value: 'now', label: 'Now' },
    { value: 'departAt', label: 'Depart at' },
    { value: 'arriveBy', label: 'Arrive by' },
  ];

  return (
    <form className="TimeBar">
      <Icon className="TimeBar_clockIcon">
        <ClockOutline />
      </Icon>
      <Dropdown
        label="select departure type"
        className="TimeBar_select"
        options={options}
        onChange={handleSelect}
        arrowClassName="TimeBar_select_arrow"
        controlClassName="TimeBar_select_control"
        placeholderClassName="TimeBar_select_placeholder"
        value={options.find((o) => o.value === departureType)}
      />
      <input
        label="select time"
        disabled={!['departAt', 'arriveBy'].includes(departureType)}
        className="TimeBar_datetime"
        onChange={handleTimeChange}
        onBlur={handleTimeBlur}
        onKeyPress={handleTimeKeyPress}
        type="datetime-local"
        name="datetime"
        id="datetime"
        value={timeInputValue || ''}
      />
    </form>
  );
}

// On some platforms the datetime input's change event prematurely fires before
// you are likely to be finished selecting a time, so we have to not commit the
// update until blur.
function doesBrowserFireDateTimeChangePrematurely(ua) {
  return (
    ua.os.name === 'iOS' || // All iOS browsers
    (ua.browser.name === 'Firefox' && ua.platform.type === 'desktop') ||
    (ua.browser.name === 'Chrome' && ua.platform.type === 'desktop')
  );
}
