import * as React from 'react';
import ItineraryRow from './ItineraryRow';

import './ItineraryBikeDivider.css';

export default function ItineraryBikeDivider(props) {
  return (
    <ItineraryRow>
      <span className="ItineraryDivider_border" />
      <span className="ItineraryBikeDivider_detail">{props.children}</span>
    </ItineraryRow>
  );
}
