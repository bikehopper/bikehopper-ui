import * as React from 'react';
import ItineraryRow from './ItineraryRow';

import './ItinerarySpacer.css';

export default function ItinerarySpacer(props) {
  return (
    <ItineraryRow>
      {'' /* no content for timeline side of row */}
      <span className="ItinerarySpacer" />
    </ItineraryRow>
  );
}
