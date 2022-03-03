import * as React from 'react';
import { useDispatch } from 'react-redux';
import Icon from './Icon';
import { geocodeTypedLocation } from '../features/geocoding';
import {
  locationInputFocused,
  locationsSubmitted,
} from '../features/locations';

import { ReactComponent as Pin } from 'iconoir/icons/pin-alt.svg';

import './SearchBar.css';

export default function SearchBar(props) {
  const dispatch = useDispatch();
  const [start, setStart] = React.useState('');
  const [end, setEnd] = React.useState('');

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

  const handleFocus = (event) => {
    dispatch(locationInputFocused());
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
          onChange={handleStartChange}
          onFocus={handleFocus}
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
          onChange={handleEndChange}
          onFocus={handleFocus}
          onKeyPress={handleEndKeyPress}
        />
      </span>
    </form>
  );
}
