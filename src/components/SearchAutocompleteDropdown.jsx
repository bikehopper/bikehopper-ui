import { cloneElement, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import classnames from 'classnames';
import MoonLoader from 'react-spinners/MoonLoader';
import { removeRecentlyUsedLocation } from '../features/geocoding';
import {
  LocationSourceType,
  selectCurrentLocation,
  selectGeocodedLocation,
  selectLocationFromTypedCoords,
} from '../features/routeParams';
import describePlace from '../lib/describePlace';
import { parsePossibleCoordsString, stringifyCoords } from '../lib/geometry';
import Icon from './primitives/Icon';
import PlaceIcon from './PlaceIcon';
import SelectionList from './SelectionList';
import SelectionListItem from './SelectionListItem';

import Pin from 'iconoir/icons/map-pin.svg?react';
import Position from 'iconoir/icons/position.svg?react';

const LIST_ITEM_CLASSNAME = 'SearchAutocompleteDropdown_place';

let _resultMousedownTime = 0;

export default function SearchAutocompleteDropdown(props) {
  const dispatch = useDispatch();
  const intl = useIntl();

  const currentLocationString = intl.formatMessage({
    defaultMessage: 'Current Location',
    description:
      'option that can be selected (or typed in) to get directions from or ' +
      'to the current location of the user, as determined by GPS',
  });
  const strong = useCallback((txt) => <strong>{txt}</strong>, []);

  const {
    startOrEnd,
    inputText,
    autocompletedText,
    features,
    showCurrentLocationOption,
    loading,
    noResults, // we explicitly searched and found no results
    parsedCoords,
  } = useSelector((state) => {
    const startOrEnd = state.routeParams.editingLocation;
    const inputText = state.routeParams[startOrEnd + 'InputText'].trim();

    const parsedCoords = parsePossibleCoordsString(inputText);

    let autocompletedText = inputText; // May get changed below
    let cache = inputText && state.geocoding.typeaheadCache['@' + inputText];
    let fallbackToGeocodedLocationSourceText = false;
    let loading = false;
    let noResults = false;
    if (!parsedCoords && (!cache || cache.status !== 'succeeded')) {
      if (inputText !== '' && (!cache || cache?.status === 'fetching')) {
        loading = true;
      }
      // TODO: should we distinguish b/t server error & no match?
      if (cache?.status === 'failed') noResults = true;

      // If the location we're editing has a geocoded location already selected, display the
      // other options from the input text that was used to pick that.
      const relevantLocation = state.routeParams[startOrEnd];
      if (
        relevantLocation &&
        relevantLocation.source === LocationSourceType.Geocoded &&
        relevantLocation.fromInputText &&
        (inputText === '' ||
          inputText === describePlace(relevantLocation.point))
      ) {
        autocompletedText = relevantLocation.fromInputText;
        cache = state.geocoding.typeaheadCache['@' + autocompletedText.trim()];
        fallbackToGeocodedLocationSourceText = true;
        loading = false;
      } else if (
        relevantLocation?.source === LocationSourceType.UrlWithString &&
        inputText === relevantLocation.fromInputText
      ) {
        // in this case we don't fetch autocompletes
        loading = false;
      } else if (loading && !cache?.osmIds) {
        // Still nothing? Try prefixes of the input text. Example: current input text is
        // "123 Main St" which hasn't been looked up yet but we have results for "123 Mai",
        // which came back while you were typing.
        let strippedChars = 0;
        while (
          autocompletedText &&
          (!cache || cache.status !== 'succeeded') &&
          strippedChars++ < 8
        ) {
          autocompletedText = autocompletedText.substr(
            0,
            autocompletedText.length - 1,
          );
          cache =
            state.geocoding.typeaheadCache['@' + autocompletedText.trim()];
        }
      }
    }

    const other = startOrEnd === 'start' ? 'end' : 'start';
    const canUseCurrentLocation =
      'geolocation' in navigator &&
      (!state.routeParams[other] ||
        state.routeParams[other].source !== LocationSourceType.UserGeolocation);

    // Only show the current location option if typed text is 1) blank, or 2)
    // a prefix of "Current Location", case-insensitive
    const showCurrentLocationOption =
      canUseCurrentLocation &&
      (fallbackToGeocodedLocationSourceText ||
        currentLocationString
          .toLocaleLowerCase(intl.locale)
          .startsWith(inputText.toLocaleLowerCase(intl.locale)));

    let recentlyUsedFeatureIds = [];
    let autocompleteFeatureIds = [];

    if (inputText === '') {
      // Suggest recently used locations
      // NOTE: This is currently only done if input text is empty, but we
      // could switch to always showing recently used locations that match
      // the text typed, alongside Photon results.
      recentlyUsedFeatureIds = state.geocoding.recentlyUsed.map((r) => r.id);
    } else if (cache?.osmIds?.length > 0) {
      autocompleteFeatureIds = cache.osmIds;
    }

    // Limit result size, don't show the location already selected as start
    // point as a candidate for end point (or vice versa), and hydrate.
    const otherId =
      state.routeParams[other]?.point?.properties?.osm_id &&
      state.routeParams[other].point.properties.osm_type +
        state.routeParams[other].point.properties.osm_id;
    const shownFeatures = [
      ...autocompleteFeatureIds.map((id) => state.geocoding.osmCache[id]),
      ...recentlyUsedFeatureIds.map((id) => ({
        ...state.geocoding.osmCache[id],
        fromRecentlyUsed: true,
      })),
    ]
      .filter(
        (feat) =>
          feat?.properties?.osm_type &&
          feat.properties.osm_type + feat.properties.osm_id !== otherId,
      )
      .slice(0, 8);

    return {
      startOrEnd,
      inputText,
      autocompletedText,
      features: shownFeatures,
      showCurrentLocationOption,
      loading,
      noResults,
      parsedCoords,
    };
  }, shallowEqual);

  const handleClick = (index) => {
    dispatch(
      selectGeocodedLocation(startOrEnd, features[index], autocompletedText),
    );
  };

  const handleRemoveClick = (index) => {
    dispatch(
      removeRecentlyUsedLocation(
        features[index].properties.osm_type + features[index].properties.osm_id,
      ),
    );
  };

  const handleCoordsClick = () => {
    dispatch(selectLocationFromTypedCoords(startOrEnd, parsedCoords));
  };

  const handleCurrentLocationClick = () => {
    dispatch(selectCurrentLocation(startOrEnd));
  };

  const handleResultMousedown = () => {
    _resultMousedownTime = Date.now();
  };

  let tabIndex = 4;

  return (
    <div className="flex flex-col m-0">
      <SelectionList
        className="flex-grow pointer-events-auto"
        id="SearchAutocompleteDropdown"
      >
        {parsedCoords && (
          <AutocompleteItem
            onClick={handleCoordsClick}
            onMouseDown={handleResultMousedown}
            icon={
              <Icon>
                <Pin />
              </Icon>
            }
            text={stringifyCoords(parsedCoords)}
            tabIndex={tabIndex++}
          />
        )}
        {showCurrentLocationOption && (
          <AutocompleteItem
            onClick={handleCurrentLocationClick}
            onMouseDown={handleResultMousedown}
            icon={
              <Icon>
                <Position />
              </Icon>
            }
            text={currentLocationString}
            tabIndex={tabIndex++}
          />
        )}
        {features.map((feature, index) => (
          <AutocompleteItem
            key={feature.properties.osm_id + ':' + feature.properties.type}
            onClick={handleClick.bind(null, index)}
            onMouseDown={handleResultMousedown}
            onRemoveClick={
              feature.fromRecentlyUsed
                ? handleRemoveClick.bind(null, index)
                : null
            }
            icon={<PlaceIcon place={feature} />}
            text={describePlace(feature)}
            tabIndex={tabIndex++}
          />
        ))}
      </SelectionList>
      {(loading || noResults) && (
        <div className="relative inset-x-0 pt-4 pl-12 pointer-events-none">
          <MoonLoader size={30} loading={loading} />
          {noResults && !parsedCoords && (
            <span className="text-sm">
              <FormattedMessage
                defaultMessage="Nothing found for ''{inputText}''"
                description="Message when no search results are found"
                values={{ inputText, strong }}
              />
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Hack for letting search bar see if an autocomplete result was focused
SearchAutocompleteDropdown.isAutocompleteResultElement = (domElement) => {
  if (!domElement) return false;
  return Array.from(domElement.classList).includes(LIST_ITEM_CLASSNAME);
};

// Hack for letting search bar see if an autocomplete result was just tapped on
// but the browser in question does not focus it
SearchAutocompleteDropdown.getLastAutocompleteResultMousedownTime = () => {
  return _resultMousedownTime;
};

function AutocompleteItem({
  onClick,
  onMouseDown,
  onRemoveClick,
  icon,
  tabIndex,
  text,
}) {
  return (
    <SelectionListItem
      buttonClassName={classnames(
        LIST_ITEM_CLASSNAME,
        'flex flex-row items-center text-[13px]',
      )}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onRemoveClick={onRemoveClick}
      tabIndex={tabIndex != null ? tabIndex : undefined}
    >
      {cloneElement(icon, {
        className: 'relative top-0.5 my-0 -ml-2 md:ml-6 mr-2',
      })}
      <span className="align-middle">{text}</span>
    </SelectionListItem>
  );
}
