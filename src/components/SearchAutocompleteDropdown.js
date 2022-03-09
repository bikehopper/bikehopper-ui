import * as React from 'react';
import { useSelector } from 'react-redux';
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

  const { features } = cacheForText;

  if (features.length === 0) return null;

  return (
    <SelectionList className="SearchAutocompleteDropdown">
      {features.map((feature) => (
        <SelectionListItem className="SearchAutocompleteDropdown_place">
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
