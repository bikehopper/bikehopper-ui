import classnames from 'classnames';
import { cloneElement, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import type { IntlShape } from 'react-intl';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import MoonLoader from 'react-spinners/MoonLoader';
import { createSelector } from 'reselect';
import type { PhotonOsmHash } from '../lib/BikeHopperClient';
import { removeRecentlyUsedLocation } from '../features/geocoding';
import type {
  OsmCacheItem,
  OsmId,
  RecentlyUsedItem,
} from '../features/geocoding';
import {
  LocationSourceType,
  selectCurrentLocation,
  selectGeocodedLocation,
  selectLocationFromTypedCoords,
} from '../features/routeParams';
import type { Location } from '../features/routeParams';
import describePlace from '../lib/describePlace';
import { parsePossibleCoordsString, stringifyCoords } from '../lib/geometry';
import Icon from './primitives/Icon';
import PlaceIcon from './PlaceIcon';
import SelectionList from './SelectionList';
import SelectionListItem from './SelectionListItem';
import type { Dispatch, RootState } from '../store';

import Pin from 'iconoir/icons/map-pin.svg?react';
import Position from 'iconoir/icons/position.svg?react';

const LIST_ITEM_CLASSNAME = 'SearchDropdown_place';

let _resultMousedownTime = 0;

export default function SearchDropdown({
  startOrEnd,
}: {
  startOrEnd: 'start' | 'end';
}) {
  const dispatch: Dispatch = useDispatch();
  const intl = useIntl();

  const currentLocationString = intl.formatMessage({
    defaultMessage: 'Current Location',
    description:
      'option that can be selected (or typed in) to get directions from or ' +
      'to the current location of the user, as determined by GPS',
  });
  const strong = useCallback(
    (txt: React.ReactNode) => <strong>{txt}</strong>,
    [],
  );

  const {
    inputText,
    autocompletedText,
    features,
    showCurrentLocationOption,
    loading,
    noResults, // we explicitly searched and found no results
    parsedCoords,
  } = useSelector(
    (state) =>
      _searchDropdownSelector(state, startOrEnd, intl, currentLocationString),
    shallowEqual,
  );

  const handleClick = (index: number) => {
    dispatch(
      selectGeocodedLocation(startOrEnd, features[index], autocompletedText),
    );
  };

  const handleRemoveClick = (index: number) => {
    dispatch(
      removeRecentlyUsedLocation(
        features[index].properties.osm_type + features[index].properties.osm_id,
      ),
    );
  };

  const handleCoordsClick = () => {
    if (parsedCoords)
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
        id="SearchDropdown"
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
                : undefined
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

const _searchDropdownSelector = createSelector(
  [
    // pass-thru: is there a better way to do this??
    function selectIntl(_state, _startOrEnd, intl): IntlShape {
      return intl;
    },
    // pass-thru
    function selectCurrentLocationString(
      _state,
      _startOrEnd,
      _intl,
      currentLocationString: string,
    ) {
      return currentLocationString;
    },
    function selectThisLocation(state: RootState, startOrEnd: 'start' | 'end') {
      return state.routeParams[startOrEnd];
    },
    function selectThisLocationText(
      state: RootState,
      startOrEnd: 'start' | 'end',
    ) {
      return state.routeParams[
        startOrEnd === 'start' ? 'startInputText' : 'endInputText'
      ];
    },
    function selectOtherLocation(
      state: RootState,
      startOrEnd: 'start' | 'end',
    ) {
      const other = startOrEnd === 'start' ? 'end' : 'start';
      return state.routeParams[other];
    },
    function selectTypeaheadCache(state: RootState) {
      return state.geocoding.typeaheadCache;
    },
    function selectOsmCache(state: RootState) {
      return state.geocoding.osmCache;
    },
    function selectRecentlyUsed(state: RootState) {
      return state.geocoding.recentlyUsed;
    },
  ],
  (
    intl: IntlShape,
    currentLocationString: string,
    thisLocation: Location | null,
    thisLocationText: string,
    otherLocation: Location | null,
    typeaheadCache: Record<string, OsmCacheItem>,
    osmCache: Record<OsmId, PhotonOsmHash>,
    recentlyUsed: RecentlyUsedItem[],
  ) => {
    const inputText = thisLocationText.trim();

    const parsedCoords = parsePossibleCoordsString(inputText);

    let autocompletedText = inputText; // May get changed below
    let cache = inputText && typeaheadCache['@' + inputText];
    let fallbackToGeocodedLocationSourceText = false;
    let loading = false;
    let noResults = false;
    if (!parsedCoords && (!cache || cache.status !== 'succeeded')) {
      if (inputText !== '' && (!cache || cache?.status === 'fetching')) {
        loading = true;
      }
      // TODO: should we distinguish b/t server error & no match?
      if (cache && cache.status === 'failed') noResults = true;

      // If the location we're editing has a geocoded location already selected, display the
      // other options from the input text that was used to pick that.
      if (
        thisLocation &&
        thisLocation.source === LocationSourceType.Geocoded &&
        thisLocation.fromInputText &&
        (inputText === '' || inputText === describePlace(thisLocation.point))
      ) {
        autocompletedText = thisLocation.fromInputText;
        cache = typeaheadCache['@' + autocompletedText.trim()];
        fallbackToGeocodedLocationSourceText = true;
        loading = false;
      } else if (
        thisLocation?.source === LocationSourceType.UrlWithString &&
        inputText === thisLocation.fromInputText
      ) {
        // in this case we don't fetch autocompletes
        loading = false;
      } else if (
        loading &&
        (!cache || cache.status === 'failed' || !cache.osmIds)
      ) {
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
          cache = typeaheadCache['@' + autocompletedText.trim()];
        }
      }
    }

    const canUseCurrentLocation =
      'geolocation' in navigator &&
      (!otherLocation ||
        otherLocation.source !== LocationSourceType.UserGeolocation);

    // XXX This is meant to catch a location selected from the recently-used
    // list. It would be cleaner to just have a diff source type for that.
    const unmodifiedSelectionFromRecentlyUsed =
      thisLocation &&
      thisLocation.source === LocationSourceType.Geocoded &&
      thisLocation.fromInputText === '' &&
      inputText === describePlace(thisLocation.point);

    // Only show the current location option if typed text is 1. blank, or 2.
    // a prefix of "Current Location", case-insensitive, or 3. matches a
    // location selected from the recently-used list
    const showCurrentLocationOption =
      canUseCurrentLocation &&
      (fallbackToGeocodedLocationSourceText ||
        currentLocationString
          .toLocaleLowerCase(intl.locale)
          .startsWith(inputText.toLocaleLowerCase(intl.locale)) ||
        unmodifiedSelectionFromRecentlyUsed);

    let recentlyUsedFeatureIds: string[] = [];
    let autocompleteFeatureIds: string[] = [];

    if (inputText === '' || unmodifiedSelectionFromRecentlyUsed) {
      // Suggest recently used locations
      // NOTE: This is currently only done if input text is empty, but we
      // could switch to always showing recently used locations that match
      // the text typed, alongside Photon results.
      recentlyUsedFeatureIds = recentlyUsed.map((r: RecentlyUsedItem) => r.id);
      loading = false;
    } else if (
      cache &&
      cache.status !== 'failed' &&
      cache.osmIds &&
      cache.osmIds.length > 0
    ) {
      autocompleteFeatureIds = cache.osmIds;
    }

    // Limit result size, don't show a location already selected (for either
    // point) as a candidate, and hydrate.
    const otherId =
      otherLocation?.point?.properties?.osm_id &&
      otherLocation.point.properties.osm_type +
        otherLocation.point.properties.osm_id;
    const thisId =
      thisLocation?.point?.properties?.osm_id &&
      thisLocation.point.properties.osm_type +
        thisLocation.point.properties.osm_id;
    const shownFeatures: (PhotonOsmHash & { fromRecentlyUsed?: boolean })[] = [
      ...autocompleteFeatureIds.map((id: string) => osmCache[id]),
      ...recentlyUsedFeatureIds.map((id: string) => ({
        ...osmCache[id],
        fromRecentlyUsed: true,
      })),
    ]
      .filter(
        (feat) =>
          feat?.properties?.osm_type &&
          feat.properties.osm_type + feat.properties.osm_id !== otherId &&
          feat.properties.osm_type + feat.properties.osm_id !== thisId,
      )
      .slice(0, 8);

    return {
      inputText,
      autocompletedText,
      features: shownFeatures,
      showCurrentLocationOption,
      loading,
      noResults,
      parsedCoords,
    };
  },
);

// Hack for letting search bar see if an autocomplete result was focused
SearchDropdown.isAutocompleteResultElement = (domElement: Element | null) => {
  if (!domElement) return false;
  return Array.from(domElement.classList).includes(LIST_ITEM_CLASSNAME);
};

// Hack for letting search bar see if an autocomplete result was just tapped on
// but the browser in question does not focus it
SearchDropdown.getLastAutocompleteResultMousedownTime = () => {
  return _resultMousedownTime;
};

function AutocompleteItem({
  onClick,
  onMouseDown,
  onRemoveClick,
  icon,
  tabIndex,
  text,
}: {
  onClick: React.MouseEventHandler;
  onMouseDown: React.MouseEventHandler;
  onRemoveClick?: React.MouseEventHandler;
  icon: React.ReactElement;
  tabIndex: number | null;
  text: React.ReactNode;
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
