import * as React from 'react';
import classnames from 'classnames';
import { getTextColor } from '../lib/colors';
import Icon from './Icon';
import ItineraryRow from './ItineraryRow';

import './ItineraryHeader.css';

export default function ItineraryHeader({ children, icon, iconColor }) {
  const iconIsWhite = getTextColor(iconColor).main === 'white';

  let header, subheading;
  if (Array.isArray(children)) {
    header = children[0];
    subheading = children.slice(1);
  } else header = children;

  return (
    <ItineraryRow>
      <span
        className={classnames({
          ItineraryHeader_iconContainer: true,
          ItineraryHeader_iconContainer__isWhite: iconIsWhite,
        })}
        style={{ backgroundColor: iconColor }}
      >
        <Icon className="ItineraryHeader_icon">{icon}</Icon>
      </span>
      <h3 className="ItineraryHeader_header">{header}</h3>
      {subheading && <p className="ItineraryHeader_subheading">{subheading}</p>}
    </ItineraryRow>
  );
}
