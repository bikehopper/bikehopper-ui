import * as React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import Icon from './Icon';
import {
  changeLocationTextInput,
  clearLocations,
  locationInputFocused,
  locationsSubmitted,
  LocationSourceType,
  swapLocations,
} from '../features/locations';
import usePrevious from '../hooks/usePrevious';
import describePlace from '../lib/describePlace';
import { ReactComponent as Pin } from 'iconoir/icons/pin-alt.svg';
import { ReactComponent as NavLeftArrow } from 'iconoir/icons/nav-arrow-left.svg';
import { ReactComponent as SwapArrows } from 'iconoir/icons/data-transfer-both.svg';

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

  const handleBackClick = (event) => {
    dispatch(clearLocations());
  };

  const handleSwapClick = (event) => {
    dispatch(swapLocations());
  };

  const handleFocus = (which, event) => {
    dispatch(locationInputFocused(which));
  };

  const prevStartLocation = usePrevious(startLocation);
  const prevEndLocation = usePrevious(endLocation);

  React.useEffect(() => {
    const justFilledStart = Boolean(startLocation && !prevStartLocation);
    const justFilledEnd = Boolean(endLocation && !prevEndLocation);

    // If one location was just filled and the other one is blank, focus the blank one.
    // If both locations are filled, make sure the one just filled is blurred.
    if (editingLocation === 'start' && justFilledStart) {
      if (!endLocation) {
        endRef.current.focus();
      } else {
        startRef.current.blur();
      }
    } else if (editingLocation === 'end' && justFilledEnd) {
      if (!startLocation) {
        startRef.current.focus();
      } else {
        endRef.current.blur();
      }
    }
  }, [
    startLocation,
    endLocation,
    prevStartLocation,
    prevEndLocation,
    editingLocation,
  ]);

  const handleKeyPress = (evt) => {
    if (evt.key === 'Enter') handleSubmit(evt);
  };

  return (
    <form className="SearchBar" onSubmit={handleSubmit}>
      <button onClick={handleBackClick} className="SearchBar_backButton">
        <Icon label="back" className="SearchBar_backIcon">
          <NavLeftArrow />
        </Icon>
      </button>
      <div className="SearchBar_inputs">
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
            onKeyPress={handleKeyPress}
            ref={endRef}
            autoFocus={props.initiallyFocusDestination}
          />
        </span>
      </div>
      <button onClick={handleSwapClick} className="SearchBar_swapButton">
        <Icon label="swap" className="SearchBar_swapIcon">
          <SwapArrows />
        </Icon>
      </button>
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
