import * as React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
// import Icon from './Icon';
// import { ReactComponent as ClockOutline } from 'iconoir/icons/clock-outline.svg';
import { arriveBySet, initialTimeSet } from '../features/time';

import './TimeBar.css';

export default function TimeBar(props) {
  const dispatch = useDispatch();
  const { initialTime } = useSelector(
    (state) => ({ initialTime: state.time.initialTime }),
    shallowEqual,
  );

  const handleTimeChange = (event) => {
    const iso = new Date(event.target.value).toISOString();
    const short = iso.substring(0, ((iso.indexOf('T') | 0) + 6) | 0);
    dispatch(initialTimeSet(short));
  };

  const handleTabSelect = (index) => {
    switch (index) {
      case 0:
        dispatch(arriveBySet(false));
        break;
      case 1:
        dispatch(arriveBySet(true));
        break;
      default:
        break;
    }
  };

  return (
    <form className="TimeBar">
      <Tabs onSelect={handleTabSelect}>
        <TabList>
          <Tab>Depart at</Tab>
          <Tab>Arrive by</Tab>
          <input
            className="TimeBar_datetime"
            onChange={handleTimeChange}
            type="datetime-local"
            name="datetime"
            id="datetime"
            defaultValue={initialTime}
          />
        </TabList>

        <TabPanel></TabPanel>
        <TabPanel></TabPanel>
      </Tabs>
    </form>
  );
}
