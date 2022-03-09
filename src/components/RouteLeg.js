import * as React from 'react';
import Color from 'color';
import Icon from './Icon';
import { ReactComponent as Bicycle } from 'iconoir/icons/bicycle.svg';
import { formatInterval } from '../lib/time';

import './RouteLeg.css';

export default function RouteLeg(props) {
  let mode = '?';
  const ICON_SIZE = 32;

  if (props.type === 'bike2') {
    mode = (
      <Icon flipHorizontally={true} label="Bike">
        <Bicycle width={ICON_SIZE} height={ICON_SIZE} />
      </Icon>
    );
  } else if (props.type === 'pt') {
    const bgColor = props.routeColor != null ? '#' + props.routeColor : 'blue';
    const fgColor = Color(bgColor).luminosity() > 0.5 ? 'black' : 'white';
    mode = (
      <span
        className="RouteLeg_transitMode"
        style={{
          backgroundColor: bgColor,
          color: fgColor,
        }}
      >
        {props.routeName}
      </span>
    );
  }

  // only show leg time if duration is supplied, else hide.
  return (
    <div className="RouteLeg">
      {mode}
      {props.duration && (
        <span className="RouteLeg_duration">
          {formatInterval(props.duration)}
        </span>
      )}
    </div>
  );
}
