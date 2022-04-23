import * as React from 'react';

import './ItineraryRow.css';

export default function ItineraryRow(props) {
  return (
    <div className="ItineraryRow">
      <div className="ItineraryRow_timeline">{props.children[0]}</div>
      <div className="ItineraryRow_content">{props.children.slice(1)}</div>
    </div>
  );
}
