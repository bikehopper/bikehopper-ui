import * as React from 'react';
import ItineraryRow from './ItineraryRow';

import './ItineraryTransitDivider.css';

export default function ItineraryTransitDivider(props) {
  return (
    <ItineraryRow>
      <span className="ItineraryDivider_border" />
      <span className="ItineraryTransitDivider_detail">{props.children}</span>
    </ItineraryRow>
  );
}
