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
import { ReactComponent as Pin } from 'iconoir/icons/pin-alt.svg';
import { ReactComponent as Position } from 'iconoir/icons/position.svg';

import './SearchAutocompleteDropdown.css';

export default function SearchAutocompleteDropdown(props) {
  const dispatch = useDispatch();

  const { startOrEnd, inputText, geocodedFeatures, canUseCurrentLocation } =
    useSelector((state) => {
      const startOrEnd = state.routeParams.editingLocation;

      // TODO: Remove this after verifying it doesn't happen
      if (!startOrEnd) throw new Error('expected to be editing start or end');

      let inputText = state.routeParams[startOrEnd + 'InputText'];
      let cache = inputText && state.geocoding.cache['@' + inputText.trim()];
      if (!cache) {
        // If the location we're editing has a geocoded location already selected, display the
        // other options from the input text that was used to pick that.
        const relevantLocation = state.routeParams[startOrEnd];
        if (
          relevantLocation &&
          relevantLocation.source === LocationSourceType.Geocoded &&
          relevantLocation.fromInputText
        ) {
          inputText = relevantLocation.fromInputText;
          cache = state.geocoding.cache['@' + inputText.trim()];
        } else {
          // Still nothing? Try prefixes of the input text. Example: current input text is
          // "123 Main St" which hasn't been looked up yet but we have results for "123 Mai",
          // which came back while you were typing.
          let strippedChars = 0;
          while (inputText && !cache && strippedChars++ < 8) {
            inputText = inputText.substr(0, inputText.length - 1);
            cache = state.geocoding.cache['@' + inputText.trim()];
          }
        }
      }

      const other = startOrEnd === 'start' ? 'end' : 'start';
      const haveCurrentLocation =
        state.geolocation.lat != null && state.geolocation.lng != null;
      const canUseCurrentLocation =
        haveCurrentLocation &&
        (!state.routeParams[other] ||
          state.routeParams[other].source !==
            LocationSourceType.UserGeolocation);

      return {
        startOrEnd,
        inputText,
        geocodedFeatures:
          cache && cache.status === 'succeeded' ? cache.features : [],
        canUseCurrentLocation,
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
      {canUseCurrentLocation && (
        <SelectionListItem
          className="SearchAutocompleteDropdown_place"
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
          className="SearchAutocompleteDropdown_place"
          key={feature.properties.osm_id + ':' + feature.properties.type}
          onClick={handleClick.bind(null, index)}
        >
          <Icon className="SearchAutocompleteDropdown_icon">
            <Pin />
          </Icon>
          <span className="SearchAutocompleteDropdown_placeDescription">
            {describePlace(feature)}
          </span>
        </SelectionListItem>
      ))}
    </SelectionList>
  );
}
