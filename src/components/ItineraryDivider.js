import * as React from 'react';
import ItineraryRow from './ItineraryRow';

import './ItineraryDivider.css';

export default function ItineraryDivider(props) {
  const { transit, detail } = props;
  const dividerType = transit ? 'transit' : 'bike';
  return (
    <ItineraryRow>
      <span className="ItineraryDivider_border" />
      <span className={'ItineraryDivider_content_' + dividerType}>
        {props.children}
      </span>
      <span className={'ItineraryDivider_detail_' + dividerType}>{detail}</span>
    </ItineraryRow>
  );
}
