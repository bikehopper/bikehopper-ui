import Bowser from 'bowser';
import * as React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import Icon from './Icon';
import { ReactComponent as ClockOutline } from 'iconoir/icons/clock-outline.svg';
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';
import { initialTimeSet, departureTypeSelected } from '../features/routeParams';

import './TimeBar.css';

export default function TimeBar(props) {
  const { departureType } = useSelector(
    (state) => ({
      departureType: state.routeParams.departureType,
    }),
    shallowEqual,
  );

  const dispatch = useDispatch();

  const lastDispatchedTimeValue = React.useRef(null);

  const handleUpdatedDateTimeValue = (value) => {
    if (value === lastDispatchedTimeValue.current) return;
    lastDispatchedTimeValue.current = value;
    dispatch(initialTimeSet(value));
  };

  const handleTimeBlur = (event) => {
    handleUpdatedDateTimeValue(event.target.value);
  };

  const handleTimeKeyPress = (event) => {
    if (event.key === 'Enter') handleUpdatedDateTimeValue(event.target.value);
  };

  const handleTimeChange = (event) => {
    const ua = Bowser.parse(navigator.userAgent);
    if (!doesBrowserFireDateTimeChangePrematurely(ua))
      handleUpdatedDateTimeValue(event.target.value);
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
