import * as React from 'react';
import ItineraryRow from './ItineraryRow';

import './ItineraryDivider.css';

export default function ItineraryDivider(props) {
  return (
    <ItineraryRow>
      <span className="ItineraryDivider_border" />
      <span className="ItineraryDivider_content">{props.children}</span>
    </ItineraryRow>
  );
}
