import * as React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import Icon from './Icon';
import SearchAutocompleteDropdown from './SearchAutocompleteDropdown';
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
  const [startText, setStartText] = React.useState('');
  const [endText, setEndText] = React.useState('');
  const [focusedInput, setFocusedInput] = React.useState(null); // can be 'start' or 'end'

  const { startLocation, endLocation } = useSelector(
    (state) => ({
      startLocation: state.locations.start,
      endLocation: state.locations.end,
    }),
    shallowEqual,
  );

  const getDisplayText = function (state, isFocused, curr) {
    if (!state) return curr;

    switch (state.source) {
      case LocationSourceType.UserGeolocation:
        return 'Current Location';
      case LocationSourceType.Marker:
        return 'Custom';
      default:
        return curr;
    }
  };

  const displayedStart = getDisplayText(
    startLocation,
    focusedInput === 'start',
    startText,
  );
  const displayedEnd = getDisplayText(
    endLocation,
    focusedInput === 'end',
    endText,
  );

  const handleStartChange = (evt) => {
    const text = evt.target.value;
    setStartText(text);
    dispatch(geocodeTypedLocation(text, 'start', { possiblyIncomplete: true }));
  };

  const handleEndChange = (evt) => {
    const text = evt.target.value;
    setEndText(text);
    dispatch(geocodeTypedLocation(text, 'end', { possiblyIncomplete: true }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    event.target.blur();
    dispatch(locationsSubmitted(startText, endText)); // FIXME
  };

  const handleFocus = (which, event) => {
    // clear start and end
    const state = which === 'start' ? startLocation : endLocation;
    const setter = which === 'start' ? setStartText : setEndText;
    if (
      state.source === LocationSourceType.Marker ||
      state.source === LocationSourceType.UserGeolocation
    ) {
      setter('');
    }
    setFocusedInput(which);
    dispatch(locationInputFocused(which));
  };

  const handleBlur = (which, event) => {
    setFocusedInput(null);
  };

  const handleStartKeyPress = (evt) => {
    if (evt.key === 'Enter') handleSubmit(evt);
  };

  const handleEndKeyPress = (evt) => {
    if (evt.key === 'Enter') handleSubmit(evt);
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
          onFocus={handleFocus.bind(null, 'start')}
          onBlur={handleBlur.bind(null, 'start')}
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
          onFocus={handleFocus.bind(null, 'end')}
          onBlur={handleBlur.bind(null, 'end')}
          onKeyPress={handleEndKeyPress}
        />
      </span>
      {focusedInput && (
        <SearchAutocompleteDropdown
          text={focusedInput === 'start' ? startText : endText}
        />
      )}
    </form>
  );
}
