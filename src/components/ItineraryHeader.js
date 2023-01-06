import * as React from 'react';
import classnames from 'classnames';
import {
  BIKEHOPPER_THEME_COLOR,
  DEFAULT_PT_COLOR,
  getTextColor,
} from '../lib/colors';
import { ModeIcons, getSvgComponentForIcon } from '../lib/modeDescriptions';
import Icon from './Icon';
import ItineraryRow from './ItineraryRow';

import './ItineraryHeader.css';

export default function ItineraryHeader(props) {
  let iconColor = props.iconColor; // Actually the icon background color
  if (!iconColor) {
    if (props.icon === ModeIcons.BIKE) {
      iconColor = BIKEHOPPER_THEME_COLOR;
    } else {
      iconColor = DEFAULT_PT_COLOR;
    }
  }
  const iconIsWhite = getTextColor(iconColor).main === 'white';
  const IconSVGComponent =
    getSvgComponentForIcon(props.icon) || (() => <span />);

  let header, subheading;
  if (Array.isArray(props.children)) {
    header = props.children[0];
    subheading = props.children.slice(1);
  } else header = props.children;

  return (
    <ItineraryRow>
      <span
        className={classnames({
          ItineraryHeader_iconContainer: true,
          ItineraryHeader_iconContainer__isWhite: iconIsWhite,
        })}
        style={{ backgroundColor: iconColor }}
      >
        <Icon className="ItineraryHeader_icon">
          <IconSVGComponent width="32" height="32" />
        </Icon>
      </span>
      <h3 className="ItineraryHeader_header">{header}</h3>
      {subheading && <p className="ItineraryHeader_subheading">{subheading}</p>}
    </ItineraryRow>
  );
}
