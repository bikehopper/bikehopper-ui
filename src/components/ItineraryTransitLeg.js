import * as React from 'react';
import { formatTime, formatDurationBetween } from '../lib/time';
import getAgencyNameForDisplay from '../lib/getAgencyNameForDisplay';
import ItineraryHeader, { ItineraryHeaderIcons } from './ItineraryHeader';
import ItineraryDivider from './ItineraryDivider';
import ItineraryStep from './ItineraryStep';

import { ReactComponent as Circle } from 'iconoir/icons/circle.svg';

export default function ItineraryTransitLeg({ leg }) {
  const { stops } = leg;

  const departure = formatTime(leg.departure_time);
  const arrival = formatTime(leg.arrival_time);

  // TODO use the actual transit mode
  const mode = 'line';
  const icon = ItineraryHeaderIcons.BUS;
  const agency = getAgencyNameForDisplay(leg.agency_name);

  const stop_detail = `${stops.length} stop${stops.length > 1 && 's'}`;
  return (
    <>
      <ItineraryHeader icon={icon} iconColor={leg.route_color}>
        <span>
          Ride the {leg.route_name} {mode} ({agency})
        </span>
        <span>
          {stops.length} stop{stops.length > 1 && 's'} &middot;{' '}
          {formatDurationBetween(leg.departure_time, leg.arrival_time)}
        </span>
      </ItineraryHeader>
      <ItineraryDivider />
      <ItineraryStep IconSVGComponent={Circle} smallIcon={true}>
        Board at <strong>{stops[0].stop_name}</strong> &middot; {departure}
      </ItineraryStep>
      <ItineraryDivider transit={true} detail={stopDetail}>
        Towards {leg.trip_headsign}
      </ItineraryDivider>
      <ItineraryStep IconSVGComponent={Circle} smallIcon={true}>
        Get off at <strong>{stops[stops.length - 1].stop_name}</strong> &middot;{' '}
        {arrival}
      </ItineraryStep>
      <ItineraryDivider />
    </>
  );
}
