import * as React from 'react';
import classnames from 'classnames';
import Icon from './Icon';
import { getTextColor } from '../lib/colors';

import { ReactComponent as BikeIcon } from 'iconoir/icons/bicycle.svg';
import { ReactComponent as BusIcon } from 'iconoir/icons/bus-outline.svg';
import { ReactComponent as TrainIcon } from 'iconoir/icons/train-outline.svg';
import { ReactComponent as TramIcon } from 'iconoir/icons/tram.svg';
import { ReactComponent as MetroIcon } from 'iconoir/icons/metro.svg';
import { ReactComponent as UnknownIcon } from 'iconoir/icons/question-mark-circle.svg';
import './ItineraryHeader.css';

export const ItineraryHeaderIcons = {
  BIKE: 'bike',
  BUS: 'bus',
  TRAM: 'tram',
  TRAIN: 'train',
  METRO: 'metro',
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
    default:
      return UnknownIcon;
  }
}

export default function ItineraryHeader(props) {
  let iconColor = props.iconColor; // Actually the icon background color
  if (!iconColor) {
    if (props.icon === ItineraryHeaderIcons.BIKE) {
      iconColor = '5aaa0a';
    } else {
      iconColor = '00f'; // TODO: Better default transit color
    }
  }
  const iconIsWhite = getTextColor(iconColor).main === 'white';
  const IconSVGComponent = getIconSVGComponent(props.icon);

  return (
    <div className="ItineraryHeader">
      <Icon
        className={classnames({
          ItineraryHeader_icon: true,
          ItineraryHeader_icon__isWhite: iconIsWhite,
        })}
      >
        <IconSVGComponent />
      </Icon>
      {props.children}
    </div>
  );
}
