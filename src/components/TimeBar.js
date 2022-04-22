import * as React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import Icon from './Icon';
import { ReactComponent as ClockOutline } from 'iconoir/icons/clock-outline.svg';
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';
import {
  initialTimeSet,
  timebarDropdownSelected,
} from '../features/routeParams';

import './TimeBar.css';

export default function TimeBar(props) {
  const { departureType } = useSelector(
    (state) => ({
      departureType: state.routeParams.departureType,
    }),
    shallowEqual,
  );

  const dispatch = useDispatch();

  const handleTimeChange = (event) => {
    dispatch(initialTimeSet(event.target.value));
  };

  const handleSelect = (event) => {
    dispatch(timebarDropdownSelected(event.value));
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
        type="datetime-local"
        name="datetime"
        id="datetime"
      />
    </form>
  );
}
