import * as React from 'react';
import classnames from 'classnames';
import {
  BIKEHOPPER_THEME_COLOR,
  DEFAULT_PT_COLOR,
  getTextColor,
} from '../lib/colors';
import Icon from './Icon';
import ItineraryRow from './ItineraryRow';

import { ReactComponent as BikeIcon } from 'iconoir/icons/bicycle.svg';
import { ReactComponent as BusIcon } from 'iconoir/icons/bus-outline.svg';
import { ReactComponent as TrainIcon } from 'iconoir/icons/train-outline.svg';
import { ReactComponent as TramIcon } from 'iconoir/icons/tram.svg';
import { ReactComponent as MetroIcon } from 'iconoir/icons/metro.svg';
// There's no ferry icon in iconoir! Sea waves is the best I can do.
import { ReactComponent as FerryIcon } from 'iconoir/icons/sea-waves.svg';
import { ReactComponent as ArriveIcon } from 'iconoir/icons/triangle-flag.svg';
import { ReactComponent as UnknownIcon } from 'iconoir/icons/question-mark-circle.svg';
import './ItineraryHeader.css';

export const ItineraryHeaderIcons = {
  BIKE: 'bike',
  BUS: 'bus',
  TRAM: 'tram',
  TRAIN: 'train',
  METRO: 'metro',
  FERRY: 'ferry',
  ARRIVE: 'arrive',
  UNKNOWN: 'unknown',
};

function getIconSVGComponent(iconType) {
  switch (iconType) {
    case ItineraryHeaderIcons.BIKE:
      return BikeIcon;
    case ItineraryHeaderIcons.BUS:
      return BusIcon;
    case ItineraryHeaderIcons.TRAM:
      return TramIcon;
    case ItineraryHeaderIcons.TRAIN:
      return TrainIcon;
    case ItineraryHeaderIcons.METRO:
      return MetroIcon;
    case ItineraryHeaderIcons.FERRY:
      return FerryIcon;
    case ItineraryHeaderIcons.ARRIVE:
      return ArriveIcon;
    default:
      return UnknownIcon;
  }
}

export default function ItineraryHeader(props) {
  let iconColor = props.iconColor; // Actually the icon background color
  if (!iconColor) {
    if (props.icon === ItineraryHeaderIcons.BIKE) {
      iconColor = BIKEHOPPER_THEME_COLOR;
    } else {
      iconColor = DEFAULT_PT_COLOR;
    }
  }
  const iconIsWhite = getTextColor(iconColor).main === 'white';
  const IconSVGComponent = getIconSVGComponent(props.icon);

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
