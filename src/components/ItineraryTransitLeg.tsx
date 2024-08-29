import { FormattedMessage, useIntl } from 'react-intl';
import type { TransitLeg } from '../lib/BikeHopperClient';
import { DEFAULT_PT_COLOR } from '../lib/colors';
import { getModeLabel } from '../lib/TransitModes';
import { formatTime, formatDurationBetween } from '../lib/time';
import classnames from 'classnames';
import { getAgencyDisplayName } from '../lib/region';
import useScrollToRef from '../hooks/useScrollToRef';
import BorderlessButton from './BorderlessButton';
import ItineraryHeader from './ItineraryHeader';
import ItineraryDivider from './ItineraryDivider';
import ItinerarySpacer from './ItinerarySpacer';
import ItineraryStep from './ItineraryStep';
import ModeIcon from './ModeIcon';

import Circle from 'iconoir/icons/circle.svg?react';

import './ItineraryTransitLeg.css';
import { useState, useCallback } from 'react';

export default function ItineraryTransitLeg({
  leg,
  onStopClick,
  onToggleLegExpand,
  scrollTo,
  expanded,
}: {
  leg: TransitLeg;
  expanded: boolean;
  onStopClick: (
    stop: number,
    evt: Parameters<React.MouseEventHandler>[0],
  ) => void;
  onToggleLegExpand?: React.MouseEventHandler;
  scrollTo: number | undefined;
}) {
  const intl = useIntl();

  const [alertsExpanded, setAlertsExpanded] = useState(false);

  const toggleAlertsExpanded = useCallback(
    () => setAlertsExpanded(!alertsExpanded),
    [alertsExpanded],
  );

  const { stops } = leg;

  const departure = formatTime(leg.departure_time);
  const arrival = formatTime(leg.arrival_time);

  const stopsTraveled = stops.length - 1;
  const stopsBetweenStartAndEnd = stopsTraveled - 1;
  const expandable = stopsBetweenStartAndEnd > 0;

  const spacerWithMiddot = ' \u00B7 ';

  const scrollToRef = useScrollToRef<HTMLDivElement>();

  // TODO: Select the alert translation based on locale, instead of always
  // using the first one.
  //
  // Unfortunately, for the Bay Area, no agency seems to actually translate
  // its alerts so it has no impact which is why I've (Scott, April 2023)
  // de-prioritized doing this.
  const alertsForHeader: [string, string][] | undefined = leg.alerts?.map(
    (rawAlert) => [
      rawAlert.header_text?.translation[0]?.text,
      rawAlert.description_text?.translation[0]?.text,
    ],
  );

  return (
    <div className="ItineraryTransitLeg" ref={scrollTo ? scrollToRef : null}>
      <ItineraryHeader
        icon={<ModeIcon mode={leg.route_type} />}
        iconColor={leg.route_color || DEFAULT_PT_COLOR}
        iconLabel={getModeLabel(leg.route_type, intl)}
        expanded={expanded}
        alertsExpanded={alertsExpanded}
        onToggleLegExpand={expandable ? onToggleLegExpand : undefined}
        onAlertClick={toggleAlertsExpanded}
        alerts={alertsForHeader}
      >
        <span>
          <FormattedMessage
            defaultMessage="Ride {agency} {routeName} to {lastStopName}"
            description={
              'instructions header text.' +
              ' Says to ride the named transit line to the named stop, operated by the named agency.'
            }
            values={{
              agency: getAgencyDisplayName(leg.agency_name),
              routeName: leg.route_name || leg.route_id,
              lastStopName: stops[stops.length - 1].stop_name,
            }}
          />
        </span>
        <span>
          <FormattedMessage
            defaultMessage={
              '{numStops} {numStops, plural,' +
              ' one {stop}' +
              ' other {stops}' +
              '}'
            }
            description="the number of stops for which you should stay on a transit vehicle"
            values={{
              numStops: stopsTraveled,
            }}
          />
          {spacerWithMiddot}
          {formatDurationBetween(leg.departure_time, leg.arrival_time, intl)}
        </span>
      </ItineraryHeader>
      <ItineraryStep
        IconSVGComponent={Circle}
        iconSize="small"
        highMargin={true}
      >
        <FormattedMessage
          defaultMessage="Board at {stop}"
          description="instruction to board (a public transit vehicle) at the named stop"
          values={{
            stop: <strong>{stops[0].stop_name}</strong>,
          }}
        />
        {spacerWithMiddot}
        {departure}
        <div
          className={classnames({
            ItineraryDivider_headsign: true,
          })}
        >
          <FormattedMessage
            defaultMessage="Towards {headsign}"
            description={
              'describes where a transit trip is headed.' +
              ' Often, the headsign is the name of the final stop.' +
              ' This appears in an itinerary, along with other details about the' +
              ' transit vehicle to board.'
            }
            values={{
              headsign: leg.trip_headsign,
            }}
          />
        </div>
      </ItineraryStep>

      {expanded ? (
        <div onClick={onToggleLegExpand}>
          {stops.slice(1, -1).map((stop, stopIdx) => (
            <ItineraryStep
              IconSVGComponent={Circle}
              iconSize="tiny"
              highMargin={true}
              key={stopIdx}
            >
              <BorderlessButton onClick={onStopClick.bind(null, stopIdx + 1)}>
                {stop.stop_name}
              </BorderlessButton>
            </ItineraryStep>
          ))}
        </div>
      ) : expandable ? (
        <div onClick={onToggleLegExpand}>
          <ItineraryDivider
            detail={intl.formatMessage(
              {
                defaultMessage:
                  '{numStops} {numStops, plural,' +
                  ' one {stop}' +
                  ' other {stops}' +
                  '} before',
                description:
                  'the number of stops between two listed transit stops',
              },
              { numStops: stopsBetweenStartAndEnd },
            )}
          />
        </div>
      ) : null}
      <ItineraryStep
        IconSVGComponent={Circle}
        iconSize="small"
        highMargin={true}
      >
        <FormattedMessage
          defaultMessage="Get off at {stop}"
          description="instruction to exit (a public transit vehicle) at the named stop"
          values={{
            stop: <strong>{stops[stops.length - 1].stop_name}</strong>,
          }}
        />
        {spacerWithMiddot}
        {arrival}
      </ItineraryStep>
      <ItinerarySpacer />
    </div>
  );
}
