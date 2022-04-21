import * as React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import Icon from './Icon';
import { ReactComponent as ClockOutline } from 'iconoir/icons/clock-outline.svg';
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';
import {
  arriveBySet,
  initialTimeSet,
  timebarDropdownSelected,
} from '../features/time';

import './TimeBar.css';

export default function TimeBar(props) {
  const { timebarDropdownOption } = useSelector(
    (state) => ({
      timebarDropdownOption: state.time.timebarDropdownOption,
    }),
    shallowEqual,
  );

  const dispatch = useDispatch();

  const handleTimeChange = (event) => {
    dispatch(initialTimeSet(event.target.value));
  };

  const handleSelect = (event) => {
    dispatch(timebarDropdownSelected(event.value));
    switch (event.value) {
      case 'now':
        dispatch(arriveBySet(false));
        dispatch(initialTimeSet(null));
        break;
      case 'departAt':
        dispatch(arriveBySet(false));
        break;
      case 'arriveBy':
        dispatch(arriveBySet(true));
        break;
      default:
        break;
    }
  };

  const options = [
    { value: 'now', label: 'Now' },
    { value: 'departAt', label: 'Depart at' },
    { value: 'arriveBy', label: 'Arrive by' },
  ];

  return (
    <form className="TimeBar">
      <Icon label="clock" className="TimeBar_clockIcon">
        <ClockOutline />
      </Icon>
      <Dropdown
        className="TimeBar_select"
        options={options}
        onChange={handleSelect}
        arrowClassName="TimeBar_select_arrow"
        controlClassName="TimeBar_select_control"
        placeholderClassName="TimeBar_select_placeholder"
        value={options.find((o) => o.value === timebarDropdownOption)}
      />
      <input
        disabled={!['departAt', 'arriveBy'].includes(timebarDropdownOption)}
        className="TimeBar_datetime"
        onChange={handleTimeChange}
        type="datetime-local"
        name="datetime"
        id="datetime"
      />
    </form>
  );
}
