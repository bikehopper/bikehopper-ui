import * as React from 'react';
import classnames from 'classnames';
import ItineraryRow from './ItineraryRow';

import './ItineraryDivider.css';

export default function ItineraryDivider(props) {
  const { transit, detail, children: subheading } = props;

  return (
    <ItineraryRow>
      {'' /* no content for timeline side of row */}
      {subheading && (
        <span
          className={classnames({
            ItineraryDivider_subheading: true,
            ItineraryDivider_subheadingBike: !transit,
            ItineraryDivider_subheadingTransit: transit,
          })}
        >
          {subheading}
        </span>
      )}
      <span className="ItineraryDivider_horizontalRule">
        {detail && <span className="ItineraryDivider_detail">{detail}</span>}
      </span>
    </ItineraryRow>
  );
}
