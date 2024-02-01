import * as React from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import classnames from 'classnames';
import { removeRecentlyUsedLocation } from '../features/geocoding';
import {
  LocationSourceType,
  selectCurrentLocation,
  selectGeocodedLocation,
} from '../features/routeParams';
import describePlace from '../lib/describePlace';
import Icon from './Icon';
import PlaceIcon from './PlaceIcon';
import SelectionList from './SelectionList';
import SelectionListItem from './SelectionListItem';

import { ReactComponent as Position } from 'iconoir/icons/position.svg';

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

  const { startOrEnd, autocompletedText, features, showCurrentLocationOption } =
    useSelector((state) => {
      const startOrEnd = state.routeParams.editingLocation;

      // TODO: Remove this after verifying it doesn't happen
      if (!startOrEnd) throw new Error('expected to be editing start or end');

      const inputText = state.routeParams[startOrEnd + 'InputText'];
      let autocompletedText = inputText; // MAy get changed below
      let cache =
        inputText && state.geocoding.typeaheadCache['@' + inputText.trim()];
      let fallbackToGeocodedLocationSourceText = false;
      if (!cache || cache.status !== 'succeeded') {
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
          cache =
            state.geocoding.typeaheadCache['@' + autocompletedText.trim()];
          fallbackToGeocodedLocationSourceText = true;
        } else {
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
          state.routeParams[other].source !==
            LocationSourceType.UserGeolocation);

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
      } else if (cache && cache.status === 'succeeded') {
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
        autocompletedText,
        features: shownFeatures,
        showCurrentLocationOption,
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

  const handleCurrentLocationClick = () => {
    dispatch(selectCurrentLocation(startOrEnd));
  };

  const handleResultMousedown = () => {
    _resultMousedownTime = Date.now();
  };

  return (
    <div className="flex flex-col m-0">
      <SelectionList className="flex-grow pointer-events-auto">
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
          />
        ))}
      </SelectionList>
    </div>
  );
}

// Hack for letting search bar see if an autocomplete result was focused
export function isAutocompleteResultElement(domElement) {
  if (!domElement) return false;
  return Array.from(domElement.classList).includes(LIST_ITEM_CLASSNAME);
}

// Hack for letting search bar see if an autocomplete result was just tapped on
// but the browser in question does not focus it
export function getLastAutocompleteResultMousedownTime() {
  return _resultMousedownTime;
}

function AutocompleteItem({ onClick, onMouseDown, onRemoveClick, icon, text }) {
  return (
    <SelectionListItem
      buttonClassName={classnames(
        LIST_ITEM_CLASSNAME,
        'flex flex-row items-center text-[13px]',
      )}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onRemoveClick={onRemoveClick}
    >
      {React.cloneElement(icon, {
        className: 'relative top-0.5 my-0 -ml-2 md:ml-6 mr-2',
      })}
      <span className="align-middle">{text}</span>
    </SelectionListItem>
  );
}
