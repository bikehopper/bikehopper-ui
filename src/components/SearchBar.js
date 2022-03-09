import * as React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import Icon from './Icon';
import { geocodeTypedLocation } from '../features/geocoding';
import {
  locationInputFocused,
  locationsSubmitted,
  LocationSourceType,
} from '../features/locations';

import { ReactComponent as Pin } from 'iconoir/icons/pin-alt.svg';

import './SearchBar.css';

export default function SearchBar(props) {
  const dispatch = useDispatch();
  const [start, setStart] = React.useState('');
  const [end, setEnd] = React.useState('');

  const { startSource, endSource, userPoint } = useSelector(
    (state) => ({
      startSource: state.locations.startSource,
      endSource: state.locations.endSource,
      userPoint: state.routes.userPoint,
    }),
    shallowEqual,
  );

  const getDisplayText = function (source, curr) {
    switch (source) {
      case LocationSourceType.UserGeolocation:
        return 'Current Location';
      case LocationSourceType.Marker:
        return 'Custom';
      default:
        return curr;
    }
  };

  const displayedStart = getDisplayText(startSource, start);
  const displayedEnd = getDisplayText(endSource, end);

  const handleStartChange = (evt) => {
    const text = evt.target.value;
    setStart(text);
    dispatch(geocodeTypedLocation(text, 'start', { possiblyIncomplete: true }));
  };

  const handleEndChange = (evt) => {
    const text = evt.target.value;
    setEnd(text);
    dispatch(geocodeTypedLocation(text, 'end', { possiblyIncomplete: true }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    event.target.blur();
    dispatch(locationsSubmitted(start, end));
  };

  const handleFocus = (startOrEnd) => {
    return (evt) => {
      dispatch(locationInputFocused(startOrEnd));
    };
  };

  const handleStartKeyPress = (evt) => {
    if (evt.key === 'Enter' && end.length > 0) handleSubmit(evt);
  };

  const handleEndKeyPress = (evt) => {
    if (evt.key === 'Enter' && start.length > 0) handleSubmit(evt);
  };

  return (
    <form className="SearchBar" onSubmit={handleSubmit}>
      <span className="SearchBar_inputContainer">
        <Icon className="SearchBar_icon">
          <Pin />
        </Icon>
        <input
          aria-label="Starting location"
          className="SearchBar_input"
          type="text"
          placeholder="from"
          value={displayedStart}
          onChange={handleStartChange}
          onFocus={handleFocus('start')}
          onKeyPress={handleStartKeyPress}
        />
      </span>
      <span className="SearchBar_inputContainer">
        <Icon className="SearchBar_icon">
          <Pin />
        </Icon>
        <input
          aria-label="Ending location"
          className="SearchBar_input"
          type="text"
          placeholder="to"
          value={displayedEnd}
          onChange={handleEndChange}
          onFocus={handleFocus('end')}
          onKeyPress={handleEndKeyPress}
        />
      </span>
    </form>
  );
}
