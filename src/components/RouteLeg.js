import * as React from 'react';
import { DEFAULT_PT_COLOR, getTextColor } from '../lib/colors';
import {
  describeRouteType,
  getIconForRouteType,
  getSvgComponentForIcon,
} from '../lib/modeDescriptions';
import Icon from './Icon';
import { ReactComponent as Bicycle } from 'iconoir/icons/bicycle.svg';
import { formatInterval } from '../lib/time';

import './RouteLeg.css';

export default function RouteLeg(props) {
  let mode = '?';

  if (props.type === 'bike2') {
    mode = (
      <Icon flipHorizontally={true} label="Bike">
        <Bicycle width="32" height="32" />
      </Icon>
    );
  } else if (props.type === 'pt') {
    const bgColor = props.routeColor || DEFAULT_PT_COLOR;
    const fgColor = getTextColor(bgColor).main;
    const TransitIcon = getSvgComponentForIcon(
      getIconForRouteType(props.routeType),
    );
    mode = (
      <div className="RouteLeg_transitMode">
        {TransitIcon && (
          <Icon
            className="RouteLeg_transitModeIcon"
            label={describeRouteType(props.routeType)}
          >
            <TransitIcon width="20" height="20" />
          </Icon>
        )}
        <span
          className="RouteLeg_transitModeName"
          style={{
            backgroundColor: bgColor,
            color: fgColor,
          }}
        >
          {props.routeName}
        </span>
      </div>
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
