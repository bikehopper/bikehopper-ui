import * as React from 'react';
import { DEFAULT_PT_COLOR, getTextColor } from '../lib/colors';
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
    const bgColor = props.routeColor || DEFAULT_PT_COLOR;
    const fgColor = getTextColor(bgColor).main;
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
