import * as React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import Icon from './Icon';
import TimeBar from './TimeBar';
import {
  changeLocationTextInput,
  clearRouteParams,
  locationInputFocused,
  locationsSubmitted,
  LocationSourceType,
  swapLocations,
} from '../features/routeParams';
import usePrevious from '../hooks/usePrevious';
import { ReactComponent as Pin } from 'iconoir/icons/pin-alt.svg';
import { ReactComponent as NavLeftArrow } from 'iconoir/icons/nav-arrow-left.svg';
import { ReactComponent as SwapArrows } from 'iconoir/icons/data-transfer-both.svg';

import './SearchBar.css';

const CURRENT_LOCATION_STRING = 'Current Location';

export default function SearchBar(props) {
  const dispatch = useDispatch();

  const { startLocation, startText, endLocation, endText, editingLocation } =
    useSelector(
      (state) => ({
        startLocation: state.routeParams.start,
        endLocation: state.routeParams.end,
        startText: state.routeParams.startInputText,
        endText: state.routeParams.endInputText,
        editingLocation: state.routeParams.editingLocation,
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

    dispatch(locationsSubmitted());
  };

  const handleBackClick = (event) => {
    dispatch(clearRouteParams());
  };

  const handleSwapClick = (event) => {
    event.preventDefault();

    dispatch(swapLocations());
  };

  const handleFocus = (which, event) => {
    dispatch(locationInputFocused(which));
    if (
      (which === 'start' &&
        startLocation?.source === LocationSourceType.UserGeolocation) ||
      (which === 'end' &&
        endLocation?.source === LocationSourceType.UserGeolocation)
    ) {
      // Select the "Current Location" text so that any key input will replace it in its
      // entirety, since it doesn't make sense to edit this magic string otherwise.
      event.target.select();
    }
  };

  const prevStartLocation = usePrevious(startLocation);
  const prevEndLocation = usePrevious(endLocation);

  React.useEffect(() => {
    const justFilledStart = Boolean(
      startLocation && startLocation !== prevStartLocation,
    );
    const justFilledEnd = Boolean(
      endLocation && endLocation !== prevEndLocation,
    );

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
    <div className="SearchBar">
      <button onClick={handleBackClick} className="SearchBar_backButton">
        <Icon label="back" className="SearchBar_backIcon">
          <NavLeftArrow />
        </Icon>
      </button>
      <div className="SearchBar_inputs">
        <form onSubmit={handleSubmit}>
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
          <span className="SearchBar_divider_dotted" />
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
        </form>
        <span className="SearchBar_divider" />
        <TimeBar />
      </div>
      <button onClick={handleSwapClick} className="SearchBar_swapButton">
        <Icon label="swap" className="SearchBar_swapIcon">
          <SwapArrows />
        </Icon>
      </button>
    </div>
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
      return CURRENT_LOCATION_STRING;
    default:
      console.error('unexpected location type', loc.source);
      if (text !== '') return text;
      return isFocused ? '' : 'Point';
  }
}
