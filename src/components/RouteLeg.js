import * as React from 'react';
import { useIntl } from 'react-intl';
import { DEFAULT_PT_COLOR, getTextColor } from '../lib/colors';
import ModeIcon from './ModeIcon';
import TransitModes from '../lib/TransitModes';
import Icon from './Icon';
import { ReactComponent as Bicycle } from 'iconoir/icons/bicycle.svg';
import { ReactComponent as WarningTriangle } from 'iconoir/icons/warning-triangle.svg';
import { formatInterval } from '../lib/time';

import './RouteLeg.css';

export default function RouteLeg(props) {
  const intl = useIntl();

  let mode = '?';

  if (props.type === 'bike2') {
    mode = (
      <Icon
        flipHorizontally={true}
        label={intl.formatMessage({
          defaultMessage: 'Bike',
          description:
            'alt text for bicycle icon displayed in a summary of an itinerary',
        })}
      >
        <Bicycle width="32" height="32" />
      </Icon>
    );
  } else if (props.type === 'pt') {
    const bgColor = props.routeColor || DEFAULT_PT_COLOR;
    const fgColor = getTextColor(bgColor).main;
    mode = (
      <div className="RouteLeg_transitMode">
        {props.hasAlerts && (
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
        )}
        <Icon
          className="RouteLeg_transitModeIcon"
          label={_getModeLabel(props.routeType, intl)}
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

function _getModeLabel(mode, intl) {
  switch (mode) {
    case TransitModes.TRAM_STREETCAR_LIGHT_RAIL:
      return intl.formatMessage({
        defaultMessage: 'Train',
        description:
          'labels a transit line as being operated by a tram, streetcar or light rail.' +
          ' Appears next to the name or number of the line.' +
          ' For American English, we match common usage by saying "train",' +
          ' but "tram" might be appropriate for other dialects of English.',
      });
    case TransitModes.MONORAIL:
      return intl.formatMessage({
        defaultMessage: 'Monorail',
        description:
          'labels a transit line as being operated by a tram, streetcar or light rail.' +
          ' Appears next to the name or number of the line.',
      });
    case TransitModes.SUBWAY_METRO:
      return intl.formatMessage({
        defaultMessage: 'Train',
        description:
          'labels a transit line as being operated by a train;' +
          ' specifically a subway or metro train but the label need not be that specific.' +
          ' Appears next to the name or number of the line.',
      });
    case TransitModes.RAIL_INTERCITY_LONG_DISTANCE:
      return intl.formatMessage({
        defaultMessage: 'Train',
        description:
          'labels a transit line as being operated by a train;' +
          ' specifically intercity or long-distance rail,' +
          ' but the label need not be that specific.' +
          ' Appears next to the name or number of the line.',
      });
    case TransitModes.BUS:
      return intl.formatMessage({
        defaultMessage: 'Bus',
        description:
          'labels a transit line as being operated by a bus.' +
          ' Appears next to the name or number of the bus line.',
      });
    case TransitModes.TROLLEYBUS:
      return intl.formatMessage({
        defaultMessage: 'Bus',
        description:
          'labels a transit line as being operated by a bus.' +
          ' Specifically a trolleybus but the label need not be that specific.' +
          ' Appears next to the name or number of the bus line.',
      });
    case TransitModes.FERRY:
      return intl.formatMessage({
        defaultMessage: 'Ferry',
        description:
          'labels a transit line as being operated by a ferry.' +
          ' Appears next to the name or number of the line.',
      });
    case TransitModes.CABLE_TRAM:
      return intl.formatMessage({
        defaultMessage: 'Cable car',
        description:
          'labels a transit line as being operated by a cable tram/cable car.' +
          ' Appears next to the name or number of the line.',
      });
    case TransitModes.AERIAL_TRAM_SUSPENDED_CABLE_CAR:
      return intl.formatMessage({
        defaultMessage: 'Cable car',
        description:
          'labels a transit line as being operated by an aerial tram or' +
          ' suspended cable car.' +
          ' Appears next to the name or number of the line.',
      });
    case TransitModes.FUNICULAR:
      return intl.formatMessage({
        defaultMessage: 'Funicular',
        description:
          'labels a transit line as being operated by a funicular.' +
          ' Appears next to the name or number of the bus line.',
      });
    default:
      return intl.formatMessage({
        defaultMessage: 'Transit line',
        description:
          'label for transit line when the mode (bus, train, etc) is unknown.' +
          ' Appears next to the name or number of the line.',
      });
  }
}
