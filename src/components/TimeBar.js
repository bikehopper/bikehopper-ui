import * as React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import Icon from './Icon';
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

  const datetimeRef = React.useRef();
  const dispatch = useDispatch();

  const handleTimeChange = (event) => {
    dispatch(initialTimeSet(event.target.value));
  };

  const handleSelect = (event) => {
    dispatch(timebarDropdownSelected(event.value));
    switch (event.value) {
      case 'now':
        datetimeRef.current.disabled = true;
        datetimeRef.current.value = null;
        dispatch(arriveBySet(false));
        dispatch(initialTimeSet(null));
        break;
      case 'departAt':
        datetimeRef.current.disabled = false;
        dispatch(arriveBySet(false));
        break;
      case 'arriveBy':
        datetimeRef.current.disabled = false;
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
      <Dropdown
        className="TimeBar_select"
        options={options}
        onChange={handleSelect}
        arrowClassName="TimeBar_select_arrow"
        controlClassName="TimeBar_select_control"
        value={options.find((o) => o.value === timebarDropdownOption)}
      />
      <input
        ref={datetimeRef}
        disabled
        className="TimeBar_datetime"
        onChange={handleTimeChange}
        type="datetime-local"
        name="datetime"
        id="datetime"
      />
    </form>
  );
}
