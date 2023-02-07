import * as React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  describeRouteType,
  getIconForRouteType,
  ModeIcons,
} from '../lib/modeDescriptions';
import { formatTime, formatDurationBetween } from '../lib/time';
import { getAgencyDisplayName } from '../lib/region';
import useScrollToRef from '../hooks/useScrollToRef';
import BorderlessButton from './BorderlessButton';
import ItineraryHeader from './ItineraryHeader';
import ItineraryDivider from './ItineraryDivider';
import ItinerarySpacer from './ItinerarySpacer';
import ItineraryStep from './ItineraryStep';

import { ReactComponent as Circle } from 'iconoir/icons/circle.svg';

import './ItineraryTransitLeg.css';

export default function ItineraryTransitLeg({ leg, onStopClick, scrollTo }) {
  const intl = useIntl();

  const { stops } = leg;

  const departure = formatTime(leg.departure_time);
  const arrival = formatTime(leg.arrival_time);

  const mode = describeRouteType(leg.route_type);
  const icon = getIconForRouteType(leg.route_type) || ModeIcons.BUS;
  const agency = getAgencyDisplayName(leg.agency_name);

  const stopsTraveled = stops.length - 1;
  const stopsBetweenStartAndEnd = stopsTraveled - 1;

  const scrollToRef = useScrollToRef();
  // TODO localize the rest of this file

  return (
    <div className="ItineraryTransitLeg" ref={scrollTo ? scrollToRef : null}>
      <ItineraryHeader icon={icon} iconColor={leg.route_color}>
        <span>
          Ride the {leg.route_name || leg.route_id} {mode} ({agency})
        </span>
        <span>
          {pluralizedStopCount(stopsTraveled)} &middot;{' '}
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

function pluralizedStopCount(numStops) {
  return `${numStops} stop${numStops > 1 ? 's' : ''}`;
}
