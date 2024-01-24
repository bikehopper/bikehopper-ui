import * as React from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import Icon from './Icon';
import PlaceIcon from './PlaceIcon';
import TimeBar from './TimeBar';
import {
  isAutocompleteResultElement,
  getLastAutocompleteResultMousedownTime,
} from './SearchAutocompleteDropdown';
import {
  blurSearchWithUnchangedLocations,
  changeLocationTextInput,
  clearRouteParams,
  locationInputFocused,
  locationsSubmitted,
  LocationSourceType,
  swapLocations,
} from '../features/routeParams';
import usePrevious from '../hooks/usePrevious';
import { ReactComponent as NavLeftArrow } from 'iconoir/icons/nav-arrow-left.svg';
import { ReactComponent as SwapArrows } from 'iconoir/icons/data-transfer-both.svg';

const CURRENT_LOCATION_STRING = 'Current Location';

export default function SearchBar(props) {
  const dispatch = useDispatch();
  const intl = useIntl();

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

  // Has the text of start/end been modified, since something that aborted or
  // completed the edit?
  const [startTextModified, setStartTextModified] = React.useState(false);
  const [endTextModified, setEndTextModified] = React.useState(false);

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

  const handleBlur = (which, event) => {
    const isOtherSearchInputFocused =
      event.relatedTarget === startRef.current ||
      event.relatedTarget === endRef.current;

    // This is a huge hack. Mobile Safari does not focus a <button> when it's tapped,
    // so we cannot rely on focus alone to see if the blur was the result of tapping
    // an autocomplete result. However, the mousedown on the button does happen before
    // the blur, so that's what we use here.
    const isAutocompleteResultTapped =
      isAutocompleteResultElement(event.relatedTarget) ||
      Date.now() - getLastAutocompleteResultMousedownTime() < 1000;

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
      <button
        onClick={handleSwapClick}
        className="text-bikehopperyellow h-12 w-12 -mr-3 mt-6
          flex items-center justify-center
          bg-transparent border-0"
      >
        <Icon
          label={intl.formatMessage({
            defaultMessage: 'Swap',
            description: 'button to swap start and end point',
          })}
        >
          <SwapArrows className="stroke-[2.5px]" />
        </Icon>
      </button>
    </div>
  );
}

function _getDisplayedText(intl, text, loc, isFocused) {
  if (!loc) return text;

  switch (loc.source) {
    case LocationSourceType.Geocoded:
    case LocationSourceType.UrlWithString:
      // Initially set to address from geocoder/URL; may have been modified by user.
      return text;
    case LocationSourceType.SelectedOnMap:
    case LocationSourceType.UrlWithoutString:
      if (text !== '') return text;
      return isFocused
        ? ''
        : intl.formatMessage({
            defaultMessage: 'Custom',
            description:
              'description of a route start/end point that was selected on the map',
          });
    case LocationSourceType.UserGeolocation:
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
