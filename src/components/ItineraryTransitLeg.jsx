import * as React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { DEFAULT_PT_COLOR } from '../lib/colors';
import { MODES } from '../lib/TransitModes';
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

import { ReactComponent as Circle } from 'iconoir/icons/circle.svg';

import './ItineraryTransitLeg.css';
import { useState, useCallback } from 'react';

export default function ItineraryTransitLeg({
  leg,
  onStopClick,
  onToggleLegExpand,
  scrollTo,
  expanded,
}) {
  const intl = useIntl();

  const [alertsExpanded, setAlertsExpanded] = useState(false);

  const toggleAlertsExpanded = useCallback(
    () => setAlertsExpanded(!alertsExpanded),
    [alertsExpanded, setAlertsExpanded],
  );

  const { stops } = leg;

  const departure = formatTime(leg.departure_time);
  const arrival = formatTime(leg.arrival_time);

  const stopsTraveled = stops.length - 1;
  const stopsBetweenStartAndEnd = stopsTraveled - 1;

  const spacerWithMiddot = ' \u00B7 ';

  const scrollToRef = useScrollToRef();

  // TODO: Select the alert translation based on locale, instead of always
  // using the first one.
  //
  // Unfortunately, for the Bay Area, no agency seems to actually translate
  // its alerts so it has no impact which is why I've (Scott, April 2023)
  // de-prioritized doing this.
  const alertsForHeader = leg.alerts?.map((rawAlert) => [
    rawAlert.header_text?.translation[0]?.text,
    rawAlert.description_text?.translation[0]?.text,
  ]);

  return (
    <div className="ItineraryTransitLeg" ref={scrollTo ? scrollToRef : null}>
      <ItineraryHeader
        icon={<ModeIcon mode={leg.route_type} />}
        iconColor={leg.route_color || DEFAULT_PT_COLOR}
        expanded={expanded}
        alertsExpanded={alertsExpanded}
        onToggleLegExpand={onToggleLegExpand}
        onAlertClick={toggleAlertsExpanded}
        alerts={alertsForHeader}
        displayArrow={stops.length > 2}
      >
        <span>
          <ItineraryTransitLegHeaderMessage
            mode={leg.route_type}
            agency={getAgencyDisplayName(leg.agency_name)}
            lastStopName={stops[stops.length - 1].stop_name}
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
          defaultMessage="Board at <b>{stop}</b>"
          description="instruction to board (a public transit vehicle) at the named stop"
          values={{
            b: (chunks) => <strong>{chunks}</strong>,
            stop: stops[0].stop_name,
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
                <FormattedMessage
                  defaultMessage="{stop}"
                  description="listing of stops on the selected public transit route"
                  values={{
                    stop: stop.stop_name,
                  }}
                />
              </BorderlessButton>
            </ItineraryStep>
          ))}
        </div>
      ) : stops.length > 2 ? (
        <div onClick={onToggleLegExpand}>
          <ItineraryDivider
            transit={true}
            detail={
              stopsBetweenStartAndEnd > 0
                ? intl.formatMessage(
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
                  )
                : null
            }
          />
        </div>
      ) : null}
      <ItineraryStep
        IconSVGComponent={Circle}
        iconSize="small"
        highMargin={true}
      >
        <FormattedMessage
          defaultMessage="Get off at <b>{stop}</b>"
          description="instruction to exit (a public transit vehicle) at the named stop"
          values={{
            b: (chunks) => <strong>{chunks}</strong>,
            stop: stops[stops.length - 1].stop_name,
          }}
        />
        {spacerWithMiddot}
        {arrival}
      </ItineraryStep>
      <ItinerarySpacer />
    </div>
  );
}

function ItineraryTransitLegHeaderMessage({ mode, agency, lastStopName }) {
  switch (mode) {
    case MODES.TRAM_STREETCAR_LIGHT_RAIL:
      return (
        <FormattedMessage
          defaultMessage="Ride {agency} to {lastStopName}"
          description={
            'instructions header text.' +
            ' Says to ride the named transit line, operated by the named agency.' +
            ' The line is operated by tram, streetcar or light rail.'
          }
          values={{ agency, lastStopName }}
        />
      );
    case MODES.MONORAIL:
      return (
        <FormattedMessage
          defaultMessage="Ride {agency} to {lastStopName}"
          description={
            'instructions header text.' +
            ' Says to ride the named transit line, operated by the named agency.' +
            ' The line is operated by monorail.'
          }
          values={{ agency, lastStopName }}
        />
      );
    case MODES.SUBWAY_METRO:
      return (
        <FormattedMessage
          defaultMessage="Ride {agency} to {lastStopName}"
          description={
            'instructions header text.' +
            ' Says to ride the named transit line, operated by the named agency.' +
            ' The line is operated by a subway or metro train.'
          }
          values={{ agency, lastStopName }}
        />
      );
    case MODES.RAIL_INTERCITY_LONG_DISTANCE:
      return (
        <FormattedMessage
          defaultMessage="Ride {agency} to {lastStopName}"
          description={
            'instructions header text.' +
            ' Says to ride the named transit line, operated by the named agency.' +
            ' The line is an intercity or long-distance rail line.'
          }
          values={{ agency, lastStopName }}
        />
      );
    case MODES.BUS:
    case MODES.TROLLEYBUS:
      return (
        <FormattedMessage
          defaultMessage="Ride {agency} to {lastStopName}"
          description={
            'instructions header text.' +
            ' Says to ride the named transit line, operated by the named agency.' +
            ' The line is operated by a bus.'
          }
          values={{ agency, lastStopName }}
        />
      );
    case MODES.FERRY:
      return (
        <FormattedMessage
          defaultMessage="Ride {agency} to {lastStopName}"
          description={
            'instructions header text.' +
            ' Says to ride the named transit line, operated by the named agency.' +
            ' The line is operated by a ferry.'
          }
          values={{ agency, lastStopName }}
        />
      );
    case MODES.CABLE_TRAM:
    case MODES.AERIAL_TRAM_SUSPENDED_CABLE_CAR:
      return (
        <FormattedMessage
          defaultMessage="Ride {agency} to {lastStopName}"
          description={
            'instructions header text.' +
            ' Says to ride the named transit line, operated by the named agency.' +
            ' The line is operated by a cable tram, cable car, aerial tram' +
            ' or suspended cable car.'
          }
          values={{ agency, lastStopName }}
        />
      );
    case MODES.FUNICULAR:
      return (
        <FormattedMessage
          defaultMessage="Ride {agency} to {lastStopName}"
          description={
            'instructions header text.' +
            ' Says to ride the named transit line, operated by the named agency.' +
            ' The line is operated by a funicular.'
          }
          values={{ agency, lastStopName }}
        />
      );
    default:
      return (
        <FormattedMessage
          defaultMessage="Ride {agency} to {lastStopName}"
          description={
            'instructions header text.' +
            ' Says to ride the named transit line, operated by the named agency.' +
            ' This message is used when we don’t have specific information about' +
            ' what kind of line (bus, train, etc) it is.'
          }
          values={{ agency, lastStopName }}
        />
      );
  }
}
