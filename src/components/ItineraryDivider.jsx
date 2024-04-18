import * as React from 'react';
import classnames from 'classnames';
import ItineraryRow from './ItineraryRow';

import './ItineraryDivider.css';

export default function ItineraryDivider(props) {
  const { transit, detail, children: subheading } = props;

  return (
    <ItineraryRow>
      {'' /* no content for timeline side of row */}
      <span className="ItineraryDivider_horizontalRule">
        {detail && <span className="ItineraryDivider_detail">{detail}</span>}
      </span>
    </ItineraryRow>
  );
}
