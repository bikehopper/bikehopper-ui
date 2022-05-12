import * as React from 'react';
import classnames from 'classnames';
import ItineraryRow from './ItineraryRow';

import './ItineraryDivider.css';

export default function ItineraryDivider(props) {
  const { transit, detail } = props;

  return (
    <ItineraryRow>
      <span className="ItineraryDivider_border" />
      <span
        className={classnames({
          ItineraryDivider_subheading: true,
          ItineraryDivider_subheadingBike: !transit,
          ItineraryDivider_subheadingTransit: transit,
        })}
      >
        {props.children}
      </span>
      <span className={'ItineraryDivider_detail'}>{detail}</span>
    </ItineraryRow>
  );
}
