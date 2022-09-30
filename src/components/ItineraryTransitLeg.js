import * as React from 'react';
import { formatTime, formatDurationBetween } from '../lib/time';
import getAgencyNameForDisplay from '../lib/getAgencyNameForDisplay';
import ItineraryHeader, { ItineraryHeaderIcons } from './ItineraryHeader';
import ItineraryDivider from './ItineraryDivider';
import ItinerarySpacer from './ItinerarySpacer';
import ItineraryStep from './ItineraryStep';

import { ReactComponent as Circle } from 'iconoir/icons/circle.svg';

import './ItineraryTransitLeg.css';

export default function ItineraryTransitLeg({ leg, onStopClick }) {
  const { stops } = leg;

  const departure = formatTime(leg.departure_time);
  const arrival = formatTime(leg.arrival_time);

  // TODO use the actual transit mode
  const mode = 'line';
  const icon = ItineraryHeaderIcons.BUS;
  const agency = getAgencyNameForDisplay(leg.agency_name);

  const stopsTraveled = stops.length - 1;
  const stopsBetweenStartAndEnd = stopsTraveled - 1;
  return (
    <>
      <ItineraryHeader icon={icon} iconColor={leg.route_color}>
        <span>
          Ride the {leg.route_name} {mode} ({agency})
        </span>
        <span>
          {pluralizedStopCount(stopsTraveled)} &middot;{' '}
          {formatDurationBetween(leg.departure_time, leg.arrival_time)}
        </span>
      </ItineraryHeader>
      <ItineraryDivider />
      <ItineraryStep IconSVGComponent={Circle} smallIcon={true}>
        <button
          className="ItineraryTransitLeg_btn"
          onClick={onStopClick.bind(null, 0)}
        >
          Board at <strong>{stops[0].stop_name}</strong> &middot; {departure}
        </button>
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
        <button
          className="ItineraryTransitLeg_btn"
          onClick={onStopClick.bind(null, stops.length - 1)}
        >
          Get off at <strong>{stops[stops.length - 1].stop_name}</strong>{' '}
          &middot; {arrival}
        </button>
      </ItineraryStep>
      <ItineraryDivider />
      <ItinerarySpacer />
    </>
  );
}

function pluralizedStopCount(numStops) {
  return `${numStops} stop${numStops > 1 ? 's' : ''}`;
}
