import { useState, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { selectAlertsToDisplay } from '../lib/alerts';
import type { TransitLeg } from '../lib/BikeHopperClient';
import { DEFAULT_PT_COLOR } from '../lib/colors';
import { stationElevators } from '../lib/elevators';
import { getModeLabel } from '../lib/TransitModes';
import { formatTime, formatDurationBetween } from '../lib/time';
import { getAgencyDisplayName } from '../lib/region';
import useScrollToRef from '../hooks/useScrollToRef';
import BorderlessButton from './BorderlessButton';
import Icon from './primitives/Icon';
import ItineraryHeader from './ItineraryHeader';
import ItineraryDivider from './ItineraryDivider';
import ItinerarySpacer from './ItinerarySpacer';
import ItineraryStep from './ItineraryStep';
import ModeIcon from './ModeIcon';

import Circle from 'iconoir/icons/circle.svg?react';
import ElevatorIcon from 'iconoir/icons/elevator.svg?react';

import './ItineraryTransitLeg.css';

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
  scrollTo: boolean;
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

  const alertsForHeader = selectAlertsToDisplay(leg);

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
      <ItineraryStep IconSVGComponent={Circle} iconSize="small">
        <BorderlessButton
          className="pt-[5px]"
          onClick={onStopClick.bind(null, 0)}
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
          <div className="ItineraryTransitLeg_headsign">
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
          {describeElevators(stops[0].stop_id)}
        </BorderlessButton>
      </ItineraryStep>

      {expanded ? (
        <div onClick={onToggleLegExpand}>
          {stops.slice(1, -1).map((stop, stopIdx) => (
            <ItineraryStep
              IconSVGComponent={Circle}
              iconSize="tiny"
              key={stopIdx}
            >
              <BorderlessButton
                className="pt-[5px]"
                onClick={onStopClick.bind(null, stopIdx + 1)}
              >
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
      <ItineraryStep IconSVGComponent={Circle} iconSize="small">
        <BorderlessButton
          onClick={onStopClick.bind(null, stops.length - 1)}
          className="pt-[5px]"
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
          {describeElevators(stops[stops.length - 1].stop_id)}
        </BorderlessButton>
      </ItineraryStep>
      <ItinerarySpacer />
    </div>
  );
}

function describeElevators(stopId: string) {
  const elevatorInfos = stationElevators.get(stopId);
  console.log('elevators for', stopId, elevatorInfos);
  if (!elevatorInfos || elevatorInfos.length === 0) return null;
  const diagonals = elevatorInfos.map((elev) => elev.diagonal);
  const minDiag = Math.min.apply(Math, diagonals);
  const maxDiag = Math.max.apply(Math, diagonals);

  return (
    <div className="ItineraryTransitLeg_elevators">
      <Icon>
        <ElevatorIcon />
      </Icon>
      <FormattedMessage
        defaultMessage={'Elevator diagonals: {min}"-{max}"'}
        description={
          'describes the minimum and maximum diagonal width of an elevator.' +
          ' The widths are given in inches, as indicated in the English-language' +
          ' string by a " symbol.'
        }
        values={{
          min: minDiag,
          max: maxDiag,
        }}
      />
    </div>
  );
}
