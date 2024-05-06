import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import Icon from './primitives/Icon';
import PlaceIcon from './PlaceIcon';
import TimeBar from './TimeBar';
import SearchAutocompleteDropdown from './SearchAutocompleteDropdown';
import {
  blurSearchWithUnchangedLocations,
  changeConnectingModes,
  changeLocationTextInput,
  clearRouteParams,
  locationInputFocused,
  locationsSubmitted,
  swapLocations,
} from '../features/routeParams';
import { LocationSourceType } from '../features/types';
import RouteOptionsDialog from './RouteOptionsDialog';
import usePrevious from '../hooks/usePrevious';

import NavLeftArrow from 'iconoir/icons/nav-arrow-left.svg?react';
import SwapArrows from 'iconoir/icons/data-transfer-both.svg?react';
import SettingsIcon from 'iconoir/icons/settings.svg?react';

const CURRENT_LOCATION_STRING = 'Current Location';

export default function SearchBar(props) {
  const dispatch = useDispatch();
  const intl = useIntl();

  const {
    startLocation,
    startText,
    endLocation,
    endText,
    editingLocation,
    connectingModes,
  } = useSelector(
    (state) => ({
      startLocation: state.routeParams.start,
      endLocation: state.routeParams.end,
      startText: state.routeParams.startInputText,
      endText: state.routeParams.endInputText,
      editingLocation: state.routeParams.editingLocation,
      connectingModes: state.routeParams.connectingModes,
    }),
    shallowEqual,
  );

  const startRef = useRef();
  const endRef = useRef();

  // Has the text of start/end been modified, since something that aborted or
  // completed the edit?
  const [startTextModified, setStartTextModified] = useState(false);
  const [endTextModified, setEndTextModified] = useState(false);

  const displayedStart = _getDisplayedText(
    intl,
    startText,
    startLocation,
    editingLocation === 'start',
  );
  const displayedEnd = _getDisplayedText(
    intl,
    endText,
    endLocation,
    editingLocation === 'end',
  );

  const handleStartChange = (evt) => {
    setStartTextModified(true);
    dispatch(changeLocationTextInput('start', evt.target.value));
  };

  const handleEndChange = (evt) => {
    setEndTextModified(true);
    dispatch(changeLocationTextInput('end', evt.target.value));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setStartTextModified(false);
    setEndTextModified(false);
    event.target.blur();

    dispatch(locationsSubmitted());
  };

  const handleBackClick = (event) => {
    setStartTextModified(false);
    setEndTextModified(false);
    dispatch(clearRouteParams());
  };

  const handleSwapClick = (event) => {
    event.preventDefault();
    setStartTextModified(false);
    setEndTextModified(false);

    dispatch(swapLocations());
  };

  const handleFocus = (which, event) => {
    dispatch(locationInputFocused(which));

    const relevantLocation = which === 'start' ? startLocation : endLocation;
    const textModified =
      which === 'start' ? startTextModified : endTextModified;
    // If the input contains the magic string "Current Location", or if it contains
    // unmodified text from the geocoder (often a very long address), select all to
    // make it easier to delete.
    if (
      relevantLocation &&
      (relevantLocation.source === LocationSourceType.UserGeolocation ||
        (relevantLocation.source === LocationSourceType.Geocoded &&
          !textModified))
    ) {
      event.target.select();
    }
  };

  const handleBlur = (which, event) => {
    const isOtherSearchInputFocused =
      event.relatedTarget === startRef.current ||
      event.relatedTarget === endRef.current;

    // This is a huge hack. Mobile Safari does not focus a <button> when it's tapped,
    // so we cannot rely on focus alone to see if the blur was the result of tapping
    // an autocomplete result. However, the mousedown on the button does happen before
    // the blur, so that's what we use here.
    const isAutocompleteResultTapped =
      SearchAutocompleteDropdown.isAutocompleteResultElement(
        event.relatedTarget,
      ) ||
      Date.now() -
        SearchAutocompleteDropdown.getLastAutocompleteResultMousedownTime() <
        1000;

    const haveLocations = !!(startLocation && endLocation);

    // If you focused a search input but then blurred it without editing anything, then
    // we may want to cancel the edit so you can go back to existing routes.
    if (
      !isAutocompleteResultTapped &&
      !isOtherSearchInputFocused &&
      !(startTextModified || endTextModified) &&
      haveLocations
    ) {
      dispatch(blurSearchWithUnchangedLocations());
    }
  };

  const prevStartLocation = usePrevious(startLocation);
  const prevEndLocation = usePrevious(endLocation);

  useEffect(() => {
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
        setStartTextModified(false);
        setEndTextModified(false);
        startRef.current.blur();
      }
    } else if (editingLocation === 'end' && justFilledEnd) {
      if (!startLocation) {
        startRef.current.focus();
      } else {
        setStartTextModified(false);
        setEndTextModified(false);
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

  const [isOptionsDialogOpen, setIsOptionsDialogOpen] = useState(false);
  const handleOptionsDialogTrigger = () => setIsOptionsDialogOpen(true);
  const handleOptionsDialogCancel = () => setIsOptionsDialogOpen(false);
  const handleOptionsDialogApply = (values) => {
    if (!shallowEqual(connectingModes, values.connectingModes)) {
      dispatch(changeConnectingModes(values.connectingModes));
    }
    setIsOptionsDialogOpen(false);
  };

  const startPointMsg = intl.formatMessage({
    defaultMessage: 'Starting point',
    description: 'label for input box for starting point of directions',
  });
  const endPointMsg = intl.formatMessage({
    defaultMessage: 'Destination',
    description: 'label for input box for ending point of directions',
  });

  return (
    <div className="p-0 flex flex-row items-stretch relative">
      <button
        onClick={handleBackClick}
        className="text-bikehopperyellow h-12 w-12 -ml-3 text-center
          flex items-center justify-center
          bg-transparent border-0"
      >
        <Icon
          label={intl.formatMessage({
            defaultMessage: 'Back',
            description: 'button to go back out of entering locations',
          })}
        >
          <NavLeftArrow className="stroke-[3px]" />
        </Icon>
      </button>
      <div className="grow">
        <form onSubmit={handleSubmit}>
          <span className="relative">
            <PlaceIcon
              className="absolute left-2 top-[-1px]"
              place={
                startLocation && !startTextModified ? startLocation.point : null
              }
            />
            <input
              aria-label={startPointMsg}
              className="w-full py-2.5 pr-2.5 pl-8 rounded-xl text-[13px]
                bg-bikehoppergreenlight border-2 border-solid border-transparent
                focus:outline-none focus:bg-white focus:border-bikehopperyellow"
              type="text"
              placeholder={startPointMsg}
              value={displayedStart}
              onChange={handleStartChange}
              onFocus={handleFocus.bind(null, 'start')}
              onBlur={handleBlur.bind(null, 'start')}
              onKeyPress={handleKeyPress}
              ref={startRef}
            />
          </span>
          <span
            className="block h-4
            border-0 border-l-[3px] border-dotted border-white ml-[19px]"
          />
          <span className="relative">
            <PlaceIcon
              className="absolute left-2 top-[-1px]"
              place={endLocation && !endTextModified ? endLocation.point : null}
            />
            <input
              aria-label={endPointMsg}
              className="w-full py-2.5 pr-2.5 pl-8 rounded-xl text-[13px]
                bg-bikehoppergreenlight border-2 border-solid border-transparent
                focus:outline-none focus:bg-white focus:border-bikehopperyellow"
              type="text"
              placeholder={endPointMsg}
              value={displayedEnd}
              onChange={handleEndChange}
              onFocus={handleFocus.bind(null, 'end')}
              onBlur={handleBlur.bind(null, 'end')}
              onKeyPress={handleKeyPress}
              ref={endRef}
              autoFocus={props.initiallyFocusDestination}
            />
          </span>
        </form>
        <span className="block h-4" />
        <TimeBar />
      </div>
      <div className="flex flex-col">
        <RouteOptionsDialog
          isOpen={isOptionsDialogOpen}
          onCancel={handleOptionsDialogCancel}
          onApply={handleOptionsDialogApply}
          globalConnectingModes={connectingModes}
        />
        <button
          onClick={handleOptionsDialogTrigger}
          className="text-bikehopperyellow h-10 w-12 -mr-3
            flex items-center justify-center
            bg-transparent border-0"
        >
          <Icon
            label={intl.formatMessage({
              defaultMessage: 'Options',
              description: 'button to change options related to route query',
            })}
          >
            <SettingsIcon className="stroke-2" />
          </Icon>
        </button>
        <span className="block h-4" />
        <button
          onClick={handleSwapClick}
          className="text-bikehopperyellow h-10 w-12 -mr-3
            flex items-center justify-center
            bg-transparent border-0"
        >
          <Icon
            label={intl.formatMessage({
              defaultMessage: 'Swap',
              description: 'button to swap start and end point',
            })}
          >
            <SwapArrows className="stroke-2" />
          </Icon>
        </button>
      </div>
    </div>
  );
}

function _getDisplayedText(intl, text, loc, isFocused) {
  if (!loc) return text;

  switch (loc.source) {
    case LocationSourceType.GEOCODED:
    case LocationSourceType.URL_WITH_STRING:
      // Initially set to address from geocoder/URL; may have been modified by user.
      return text;
    case LocationSourceType.SELECTED_ON_MAP:
    case LocationSourceType.USER_WITHOUT_STRING:
      if (text !== '') return text;
      return isFocused
        ? ''
        : intl.formatMessage({
            defaultMessage: 'Custom',
            description:
              'description of a route start/end point that was selected on the map',
          });
    case LocationSourceType.USER_GEOLOCATION:
      if (text !== '') return text;
      return CURRENT_LOCATION_STRING;
    default:
      console.error('unexpected location type', loc.source);
      if (text !== '') return text;
      return isFocused
        ? ''
        : intl.formatMessage({
            defaultMessage: 'Point',
            description:
              'generic description of a location we don’t have more info about',
          });
  }
}
