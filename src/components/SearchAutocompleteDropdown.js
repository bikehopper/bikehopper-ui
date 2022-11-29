import * as React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import uniqBy from 'lodash/uniqBy';
import {
  LocationSourceType,
  selectCurrentLocation,
  selectGeocodedLocation,
} from '../features/routeParams';
import describePlace from '../lib/describePlace';
import Icon from './Icon';
import SelectionList from './SelectionList';
import SelectionListItem from './SelectionListItem';
import { ReactComponent as CoffeeCup } from 'iconoir/icons/coffee-cup.svg';
import { ReactComponent as Cutlery } from 'iconoir/icons/clutery.svg';
import { ReactComponent as Flower } from 'iconoir/icons/flower.svg';
import { ReactComponent as GlassHalf } from 'iconoir/icons/glass-half.svg';
import { ReactComponent as Golf } from 'iconoir/icons/golf.svg';
import { ReactComponent as Pin } from 'iconoir/icons/pin-alt.svg';
import { ReactComponent as Position } from 'iconoir/icons/position.svg';
import { ReactComponent as PineTree } from 'iconoir/icons/pine-tree.svg';
import { ReactComponent as Sandals } from 'iconoir/icons/sandals.svg';
import { ReactComponent as StarOutline } from 'iconoir/icons/star-outline.svg';
import { ReactComponent as Swimming } from 'iconoir/icons/swimming.svg';
import { ReactComponent as Trekking } from 'iconoir/icons/trekking.svg';

import './SearchAutocompleteDropdown.css';

const LIST_ITEM_CLASSNAME = 'SearchAutocompleteDropdown_place';

export default function SearchAutocompleteDropdown(props) {
  const dispatch = useDispatch();

  const { startOrEnd, inputText, geocodedFeatures, showCurrentLocationOption } =
    useSelector((state) => {
      const startOrEnd = state.routeParams.editingLocation;

      // TODO: Remove this after verifying it doesn't happen
      if (!startOrEnd) throw new Error('expected to be editing start or end');

      let inputText = state.routeParams[startOrEnd + 'InputText'];
      let cache = inputText && state.geocoding.cache['@' + inputText.trim()];
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
          inputText = relevantLocation.fromInputText;
          cache = state.geocoding.cache['@' + inputText.trim()];
          fallbackToGeocodedLocationSourceText = true;
        } else {
          // Still nothing? Try prefixes of the input text. Example: current input text is
          // "123 Main St" which hasn't been looked up yet but we have results for "123 Mai",
          // which came back while you were typing.
          let strippedChars = 0;
          while (
            inputText &&
            (!cache || cache.status !== 'succeeded') &&
            strippedChars++ < 8
          ) {
            inputText = inputText.substr(0, inputText.length - 1);
            cache = state.geocoding.cache['@' + inputText.trim()];
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
          'current location'.indexOf(inputText.toLowerCase()) === 0);

      return {
        startOrEnd,
        inputText,
        geocodedFeatures:
          cache && cache.status === 'succeeded' ? cache.features : [],
        showCurrentLocationOption,
      };
    }, shallowEqual);

  const dedupedFeatures = uniqBy(geocodedFeatures, 'properties.osm_id');

  const handleClick = (index) => {
    dispatch(
      selectGeocodedLocation(startOrEnd, dedupedFeatures[index], inputText),
    );
  };

  const handleCurrentLocationClick = () => {
    dispatch(selectCurrentLocation(startOrEnd));
  };

  return (
    <SelectionList className="SearchAutocompleteDropdown">
      {showCurrentLocationOption && (
        <SelectionListItem
          className={LIST_ITEM_CLASSNAME}
          onClick={handleCurrentLocationClick}
        >
          <Icon className="SearchAutocompleteDropdown_icon">
            <Position />
          </Icon>
          <span className="SearchAutocompleteDropdown_placeDescription">
            Current Location
          </span>
        </SelectionListItem>
      )}
      {dedupedFeatures.map((feature, index) => (
        <SelectionListItem
          className={LIST_ITEM_CLASSNAME}
          key={feature.properties.osm_id + ':' + feature.properties.type}
          onClick={handleClick.bind(null, index)}
        >
          <Icon className="SearchAutocompleteDropdown_icon">
            {_getSvgForFeature(feature)}
          </Icon>
          <span className="SearchAutocompleteDropdown_placeDescription">
            {describePlace(feature)}
          </span>
        </SelectionListItem>
      ))}
    </SelectionList>
  );
}

// Hack for letting search bar see if an autocomplete result was focused
export function isAutocompleteResultElement(domElement) {
  if (!domElement) return false;
  return Array.from(domElement.classList).includes(LIST_ITEM_CLASSNAME);
}

function _getSvgForFeature(feature) {
  const { osm_key: key, osm_value: value } = feature?.properties || {};

  let Klass = Pin;

  if (
    (key === 'boundary' && value === 'national_park') ||
    (key === 'leisure' && value === 'park')
  ) {
    // park
    Klass = PineTree;
  } else if (
    (key === 'natural' && ['beach', 'shingle'].includes(value)) ||
    (key === 'leisure' && value === 'beach_resort')
  ) {
    // beach
    Klass = Sandals;
  } else if (
    key === 'natural' &&
    ['peak', 'hill', 'rock', 'saddle'].includes(value)
  ) {
    // mountain, trail
    Klass = Trekking;
  } else if (key === 'leisure' && value === 'garden') {
    Klass = Flower;
  } else if (key === 'leisure' && value === 'golf_course') {
    Klass = Golf;
  } else if (
    key === 'leisure' &&
    ['swimming_area', 'swimming_pool', 'water_park'].includes(value)
  ) {
    Klass = Swimming;
  } else if (key === 'tourism' && value === 'attraction') {
    Klass = StarOutline;
  } else if (key === 'amenity' && value === 'cafe') {
    Klass = CoffeeCup;
  } else if (
    key === 'amenity' &&
    ['restaurant', 'fast_food', 'food_court'].includes(value)
  ) {
    Klass = Cutlery;
  } else if (
    key === 'amenity' &&
    ['bar', 'biergarten', 'pub'].includes(value)
  ) {
    Klass = GlassHalf;
  }

  return <Klass />;
}
