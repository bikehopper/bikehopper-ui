import * as React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import Icon from './Icon';
import SearchAutocompleteDropdown from './SearchAutocompleteDropdown';
import { changeLocationTextInput } from '../features/locations';
import {
  locationInputFocused,
  locationInputsBlurred,
  locationsSubmitted,
  LocationSourceType,
  selectGeocodedLocation,
} from '../features/locations';
import describePlace from '../lib/describePlace';
import { ReactComponent as Pin } from 'iconoir/icons/pin-alt.svg';

import './SearchBar.css';

export default function SearchBar(props) {
  const dispatch = useDispatch();

  const { startLocation, startText, endLocation, endText, editingLocation } =
    useSelector(
      (state) => ({
        startLocation: state.locations.start,
        endLocation: state.locations.end,
        startText: state.locations.startInputText,
        endText: state.locations.endInputText,
        editingLocation: state.locations.editingLocation,
      }),
      shallowEqual,
    );

  const formRef = React.useRef();
  const startRef = React.useRef();
  const endRef = React.useRef();

  const displayedStart = _getDisplayedText(
    startText,
    startLocation,
    editingLocation === 'start',
  );
  const displayedEnd = _getDisplayedText(
    endText,
    endLocation,
    editingLocation === 'end',
  );

  const handleStartChange = (evt) => {
    dispatch(changeLocationTextInput('start', evt.target.value));
  };

  const handleEndChange = (evt) => {
    dispatch(changeLocationTextInput('end', evt.target.value));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    event.target.blur();

    dispatch(
      locationsSubmitted(
        _selectTextOrLocationToUse(startText, startLocation),
        _selectTextOrLocationToUse(endText, endLocation),
      ),
    );
  };

  const handleFocus = (which, event) => {
    dispatch(locationInputFocused(which));
  };

  const handleBlur = (event) => {
    // If the newly focused element is not part of the search bar (including
    // the autocomplete dropdown), set focused input to null (which hides the
    // autocomplete dropdown).
    // FIXME: But I'm moving the autocomplete dropdown elsewhere so this logic
    // needs to change. Hmm
    if (!formRef.current.contains(event.relatedTarget)) {
      if (editingLocation != null) dispatch(locationInputsBlurred());
    }
  };

  const handleAutocompleteClick = (which, point) => {
    dispatch(selectGeocodedLocation(which, point));

    if (which === 'start' && !endLocation) {
      endRef.current.focus();
    } else if (!startText && !startLocation) {
      startRef.current.focus();
    } else {
      // Make sure we don't think that the ending location input is still focused;
      // that could cause glitches down the road.
      endRef.current.blur();
    }
  };

  const handleKeyPress = (evt) => {
    if (evt.key === 'Enter') handleSubmit(evt);
  };

  return (
    <form className="SearchBar" onSubmit={handleSubmit} ref={formRef}>
      <span className="SearchBar_inputContainer">
        <Icon className="SearchBar_icon">
          <Pin />
        </Icon>
        <input
          aria-label="Starting point"
          className="SearchBar_input"
          type="text"
          placeholder="Starting point"
          value={displayedStart}
          onChange={handleStartChange}
          onFocus={handleFocus.bind(null, 'start')}
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
          ref={startRef}
        />
      </span>
      <span className="SearchBar_divider" />
      <span className="SearchBar_inputContainer">
        <Icon className="SearchBar_icon">
          <Pin />
        </Icon>
        <input
          aria-label="Destination"
          className="SearchBar_input"
          type="text"
          placeholder="Destination"
          value={displayedEnd}
          onChange={handleEndChange}
          onFocus={handleFocus.bind(null, 'end')}
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
          ref={endRef}
          autoFocus={props.initiallyFocusDestination}
        />
      </span>
      {editingLocation && (
        <SearchAutocompleteDropdown
          text={editingLocation === 'start' ? startText : endText}
          onResultClick={handleAutocompleteClick.bind(null, editingLocation)}
        />
      )}
    </form>
  );
}

function _getDisplayedText(text, loc, isFocused) {
  if (!loc) return text;

  switch (loc.source) {
    case LocationSourceType.Geocoded:
      // Initially set to address from geocoder; may have been modified by user.
      return text;
    case LocationSourceType.Marker:
      if (text !== '') return text;
      return isFocused ? '' : 'Custom';
    case LocationSourceType.UserGeolocation:
      if (text !== '') return text;
      return isFocused ? '' : 'Current Location';
    default:
      console.error('unexpected location type', loc.source);
      if (text !== '') return text;
      return isFocused ? '' : 'Point';
  }
}

// Helper to decide whether un-geocoded input text should be used, or the
// previously set location.
// FIXME: This logic should be moved into the action creator and out of this
// component.  Now that the state is in Redux this logic should be too, there's
// no reason for the component to pass global state through.
function _selectTextOrLocationToUse(text, loc) {
  if (!loc) return text;

  // If text WAS an address string from the geocoder, and the user explicitly blanked it
  // out, let them blank it out. But otherwise, empty text means fall back to location.
  if (text === '' && loc.source !== LocationSourceType.Geocoded) return loc;

  // Stick with geocoded location if the text is its exact description
  if (
    loc.source === LocationSourceType.Geocoded &&
    text === describePlace(loc.point)
  ) {
    return loc;
  }

  return text;
}
