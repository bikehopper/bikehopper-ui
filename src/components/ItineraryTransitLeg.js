import * as React from 'react';
import { formatTime, formatDurationBetween } from '../lib/time';
import { getAgencyDisplayName } from '../lib/region';
import BorderlessButton from './BorderlessButton';
import ItineraryHeader, { ItineraryHeaderIcons } from './ItineraryHeader';
import ItineraryDivider from './ItineraryDivider';
import ItinerarySpacer from './ItinerarySpacer';
import ItineraryStep from './ItineraryStep';

import { ReactComponent as Circle } from 'iconoir/icons/circle.svg';

export default function ItineraryTransitLeg({ leg, onStopClick }) {
  const { stops } = leg;

  const departure = formatTime(leg.departure_time);
  const arrival = formatTime(leg.arrival_time);

  let mode, icon;
  switch (leg.route_type) {
    case 0: // tram, streetcar, light rail
    case 12: // monorail
      mode = 'train'; // The more specific word 'tram' might confuse in a US context
      icon = ItineraryHeaderIcons.TRAM;
      break;
    case 1: // subway, metro
      mode = 'train';
      icon = ItineraryHeaderIcons.METRO;
      break;
    case 2: // rail (intercity, long distance)
      mode = 'train';
      icon = ItineraryHeaderIcons.TRAIN;
      break;
    case 3: // bus
    case 11: // trolleybus
      mode = 'bus';
      icon = ItineraryHeaderIcons.BUS;
      break;
    case 4: // ferry
      mode = 'ferry';
      icon = ItineraryHeaderIcons.FERRY;
      break;
    case 5: // cable tram
    case 6: // aerial lift, suspended cable car
      mode = 'cable car';
      icon = ItineraryHeaderIcons.TRAM;
      break;
    case 7: // funicular
      mode = 'funicular';
      icon = ItineraryHeaderIcons.TRAM;
      break;
    default:
      mode = 'line';
      icon = ItineraryHeaderIcons.BUS;
  }

  const agency = getAgencyDisplayName(leg.agency_name);

  const stopsTraveled = stops.length - 1;
  const stopsBetweenStartAndEnd = stopsTraveled - 1;
  return (
    <>
      <ItineraryHeader icon={icon} iconColor={leg.route_color}>
        <span>
          Ride the {leg.route_name || leg.route_id} {mode} ({agency})
        </span>
        <span>
          {pluralizedStopCount(stopsTraveled)} &middot;{' '}
          {formatDurationBetween(leg.departure_time, leg.arrival_time)}
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
    </>
  );
}

function pluralizedStopCount(numStops) {
  return `${numStops} stop${numStops > 1 ? 's' : ''}`;
}
