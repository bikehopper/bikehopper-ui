import * as React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { DEFAULT_PT_COLOR } from '../lib/colors';
import { formatTime, formatDurationBetween } from '../lib/time';
import TransitModes from '../lib/TransitModes';
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

export default function ItineraryTransitLeg({ leg, onStopClick, scrollTo }) {
  const intl = useIntl();

  const { stops } = leg;

  const departure = formatTime(leg.departure_time);
  const arrival = formatTime(leg.arrival_time);

  const stopsTraveled = stops.length - 1;
  const stopsBetweenStartAndEnd = stopsTraveled - 1;

  const spacerWithMiddot = ' \u00B7 ';

  const scrollToRef = useScrollToRef();
  // TODO localize the rest of this file

  return (
    <div className="ItineraryTransitLeg" ref={scrollTo ? scrollToRef : null}>
      <ItineraryHeader
        icon={<ModeIcon mode={leg.route_type} />}
        iconColor={leg.route_color || DEFAULT_PT_COLOR}
      >
        <span>
          <ItineraryTransitLegHeaderMessage
            name={leg.route_name || leg.route_id}
            mode={leg.route_type}
            agency={getAgencyDisplayName(leg.agency_name)}
          />
        </span>
        <span>
          {pluralizedStopCount(stopsTraveled)}
          {spacerWithMiddot}
          {formatDurationBetween(leg.departure_time, leg.arrival_time, intl)}
        </span>
      </ItineraryHeader>
      <ItineraryDivider />
      <ItineraryStep IconSVGComponent={Circle} smallIcon={true}>
        <BorderlessButton onClick={onStopClick.bind(null, 0)}>
          Board at <strong>{stops[0].stop_name}</strong> &middot; {departure}
        </BorderlessButton>
      </ItineraryStep>
      <ItineraryDivider
        transit={true}
        detail={
          stopsBetweenStartAndEnd > 0
            ? pluralizedStopCount(stopsBetweenStartAndEnd) + ' before'
            : null
        }
      >
        Towards {leg.trip_headsign}
      </ItineraryDivider>
      <ItineraryStep IconSVGComponent={Circle} smallIcon={true}>
        <BorderlessButton onClick={onStopClick.bind(null, stops.length - 1)}>
          Get off at <strong>{stops[stops.length - 1].stop_name}</strong>{' '}
          &middot; {arrival}
        </BorderlessButton>
      </ItineraryStep>
      <ItineraryDivider />
      <ItinerarySpacer />
    </div>
  );
}

// Internal-only component that gives localized strings for all possible
// transit modes.
function ItineraryTransitLegHeaderMessage({ name, mode, agency }) {
  switch (mode) {
    case TransitModes.TRAM_STREETCAR_LIGHT_RAIL:
      return (
        <FormattedMessage
          defaultMessage="Ride the {name} train ({agency})"
          description={
            'instructions header text.' +
            ' Says to ride the named transit line, operated by the named agency.' +
            ' The line is operated by tram, streetcar or light rail.'
          }
          values={{ name, agency }}
        />
      );
    case TransitModes.MONORAIL:
      return (
        <FormattedMessage
          defaultMessage="Ride the {name} train ({agency})"
          description={
            'instructions header text.' +
            ' Says to ride the named transit line, operated by the named agency.' +
            ' The line is operated by monorail.'
          }
          values={{ name, agency }}
        />
      );
    case TransitModes.SUBWAY_METRO:
      return (
        <FormattedMessage
          defaultMessage="Ride the {name} train ({agency})"
          description={
            'instructions header text.' +
            ' Says to ride the named transit line, operated by the named agency.' +
            ' The line is operated by a subway or metro train.'
          }
          values={{ name, agency }}
        />
      );
    case TransitModes.RAIL_INTERCITY_LONG_DISTANCE:
      return (
        <FormattedMessage
          defaultMessage="Ride the {name} train ({agency})"
          description={
            'instructions header text.' +
            ' Says to ride the named transit line, operated by the named agency.' +
            ' The line is an intercity or long-distance rail line.'
          }
          values={{ name, agency }}
        />
      );
    case TransitModes.BUS:
    case TransitModes.TROLLEYBUS:
      return (
        <FormattedMessage
          defaultMessage="Ride the {name} bus ({agency})"
          description={
            'instructions header text.' +
            ' Says to ride the named transit line, operated by the named agency.' +
            ' The line is operated by a bus.'
          }
          values={{ name, agency }}
        />
      );
    case TransitModes.FERRY:
      return (
        <FormattedMessage
          defaultMessage="Ride the {name} ferry ({agency})"
          description={
            'instructions header text.' +
            ' Says to ride the named transit line, operated by the named agency.' +
            ' The line is operated by a ferry.'
          }
          values={{ name, agency }}
        />
      );
    case TransitModes.CABLE_TRAM:
    case TransitModes.AERIAL_TRAM_SUSPENDED_CABLE_CAR:
      return (
        <FormattedMessage
          defaultMessage="Ride the {name} cable car ({agency})"
          description={
            'instructions header text.' +
            ' Says to ride the named transit line, operated by the named agency.' +
            ' The line is operated by a cable tram, cable car, aerial tram' +
            ' or suspended cable car.'
          }
          values={{ name, agency }}
        />
      );
    case TransitModes.FUNICULAR:
      return (
        <FormattedMessage
          defaultMessage="Ride the {name} funicular ({agency})"
          description={
            'instructions header text.' +
            ' Says to ride the named transit line, operated by the named agency.' +
            ' The line is operated by a funicular.'
          }
          values={{ name, agency }}
        />
      );
    default:
      return (
        <FormattedMessage
          defaultMessage="Ride the {name} line ({agency})"
          description={
            'instructions header text.' +
            ' Says to ride the named transit line, operated by the named agency.' +
            ' This message is used when we don’t have specific information about' +
            ' what kind of line (bus, train, etc) it is.'
          }
          values={{ name, agency }}
        />
      );
  }
}

function pluralizedStopCount(numStops) {
  // TODO localize this
  return `${numStops} stop${numStops > 1 ? 's' : ''}`;
}
