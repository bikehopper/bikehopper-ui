import * as React from 'react';
import formatDuration from '../lib/formatDuration';
import getAgencyNameForDisplay from '../lib/getAgencyNameForDisplay';
import ItineraryHeader, { ItineraryHeaderIcons } from './ItineraryHeader';
import RouteLeg from './RouteLeg';

export default function ItineraryTransitLeg({ leg }) {
  const { stops } = leg;

  const legSummary = (
    <RouteLeg
      type={leg.type}
      routeName={leg.route_name}
      routeColor={leg.route_color}
      agencyName={leg.agency_name}
      duration={null}
    />
  );

  // TODO use the actual transit mode
  const mode = 'bus';
  const icon = ItineraryHeaderIcons.BUS;
  const agency = getAgencyNameForDisplay(leg.agency_name);

  return (
    <>
      <ItineraryHeader icon={icon} iconColor={leg.route_color}>
        <span>
          Ride the {leg.route_name} {mode} ({agency})
        </span>
        <span>
          {stops.length} stop{stops.length > 1 && 's'} &middot;{' '}
          {formatDuration(leg.departure_time, leg.arrival_time)}
        </span>
      </ItineraryHeader>
      <ul className="ItineraryTransitLeg_stopList">
        {stops.map((stop, stopIdx) => (
          <li key={stopIdx}>{stop.stop_name}</li>
        ))}
      </ul>
    </>
  );
}
