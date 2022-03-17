import * as React from 'react';
import { useSelector } from 'react-redux';
import uniqBy from 'lodash/uniqBy';
import { describePlace } from '../features/geocoding';
import Icon from './Icon';
import SelectionList from './SelectionList';
import SelectionListItem from './SelectionListItem';
import { ReactComponent as Pin } from 'iconoir/icons/pin-alt.svg';

import './SearchAutocompleteDropdown.css';

export default function SearchAutocompleteDropdown(props) {
  const cacheForText = useSelector(
    (state) => state.geocoding.cache['@' + props.text.trim()],
  );
  if (!cacheForText || cacheForText.status !== 'succeeded') return null;

  const features = uniqBy(cacheForText.features, 'properties.osm_id');

  if (features.length === 0) return null;

  const handleClick = (index) => {
    props.onResultClick(features[index]);
  };

  return (
    <SelectionList className="SearchAutocompleteDropdown">
      {features.map((feature, index) => (
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
