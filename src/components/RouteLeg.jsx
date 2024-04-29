import * as React from 'react';
import { useIntl } from 'react-intl';
import { DEFAULT_PT_COLOR, getTextColor } from '../lib/colors';
import ModeIcon from './ModeIcon';
import { getModeLabel } from '../lib/TransitModes';
import Icon from './primitives/Icon';
import { ReactComponent as Bicycle } from 'iconoir/icons/bicycle.svg';
import { ReactComponent as WarningTriangle } from 'iconoir/icons/warning-triangle.svg';
import { formatInterval } from '../lib/time';

import './RouteLeg.css';

export default function RouteLeg(props) {
  const intl = useIntl();

  let mode = '?';

  const maybeAlertIcon = props.hasAlerts ? (
    <Icon
      className="RouteLeg_alertIcon"
      label={intl.formatMessage({
        defaultMessage: 'Alert',
        description:
          'labels a transit trip as having a service alert apply to it.',
      })}
    >
      <WarningTriangle />
    </Icon>
  ) : null;

  if (props.type === 'bike2') {
    mode = (
      <div className="RouteLeg_mode">
        {maybeAlertIcon}
        <Icon
          className="RouteLeg_bikeIcon"
          flipHorizontally={true}
          label={intl.formatMessage({
            defaultMessage: 'Bike',
            description:
              'alt text for bicycle icon displayed in a summary of an itinerary',
          })}
        >
          <Bicycle width="32" height="32" />
        </Icon>
      </div>
    );
  } else if (props.type === 'pt') {
    const bgColor = props.routeColor || DEFAULT_PT_COLOR;
    const fgColor = getTextColor(bgColor).main;
    mode = (
      <div className="RouteLeg_mode">
        {maybeAlertIcon}
        <Icon
          className="RouteLeg_transitModeIcon"
          label={getModeLabel(props.routeType, intl)}
        >
          <ModeIcon
            width="20"
            height="20"
            mode={props.routeType}
            fallback={null}
          />
        </Icon>
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
