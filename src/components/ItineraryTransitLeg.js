import * as React from 'react';
import ItineraryHeader from './ItineraryHeader';
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

  return (
    <>
      <ItineraryHeader>
        {legSummary} to {stops[stops.length - 1].stop_name}
      </ItineraryHeader>
      <ul className="ItineraryTransitLeg_stopList">
        {stops.map((stop, stopIdx) => (
          <li key={stopIdx}>{stop.stop_name}</li>
        ))}
      </ul>
    </>
  );
}
