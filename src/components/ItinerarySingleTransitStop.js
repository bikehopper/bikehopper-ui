import * as React from 'react';

/**
 * When you tap on a transit stop name in the detailed itinerary, we
 * zoom in on that transit stop. This is the view that is displayed at
 * the bottom of the screen at that time.
 *
 * The relationship prop should be 'board' or 'alight'
 */

export default function ItinerarySingleTransitStop({
  stop,
  relationship,
  onBackClick,
}) {
  // TODO Make this look better -- maybe more information about the
  // transit operator?
  return (
    <p style={{ marginLeft: 32 }}>
      {relationship === 'board' ? 'Board at ' : 'Get off at '}
      {stop.stop_name} <button onClick={onBackClick}>Go back</button>
    </p>
  );
}
