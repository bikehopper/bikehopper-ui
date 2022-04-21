import * as React from 'react';
import ItineraryHeader from './ItineraryHeader';

export default function ItineraryTransitLeg({ leg }) {
  const { stops } = leg;
  return (
    <>
      <ItineraryHeader>
        Ride to {stops[stops.length - 1].stop_name}
      </ItineraryHeader>
      <ul className="ItineraryTransitLeg_stopList">
        {stops.map((stop, stopIdx) => (
          <li key={stopIdx}>{stop.stop_name}</li>
        ))}
      </ul>
    </>
  );
}
