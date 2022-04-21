import * as React from 'react';

export default function ItineraryTransitLeg({ leg }) {
  const { stops } = leg;
  return (
    <>
      Ride from {stops[0].stop_name}
      <br />
      to {stops[stops.length - 1].stop_name}
    </>
  );
}
