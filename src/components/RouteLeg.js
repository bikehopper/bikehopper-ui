import * as React from 'react';
import Color from 'color';
import Icon from './Icon';
import { ReactComponent as Bicycle } from 'iconoir/icons/bicycle.svg';

import './RouteLeg.css';

export default function RouteLeg(props) {
  let mode = '?';
  const ICON_SIZE = 32;

  if (props.type === 'bike2') {
    mode = (
      <Icon>
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

  // Compute number of minutes on this leg, but only if duration is supplied, else hide.
  const minutes = props.duration && Math.round(props.duration / 1000 / 60);

  return (
    <div className="RouteLeg">
      {mode}
      {minutes && <span className="RouteLeg_duration">{minutes} min</span>}
    </div>
  );
}
