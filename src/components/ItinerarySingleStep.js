import * as React from 'react';

/**
 * When you tap on an instruction (e.g. "Turn left on Valencia
 * Street") in the detailed itinerary, we zoom in on the point that
 * instruction applies to. This is the view that is displayed at the
 * bottom of the screen at that time, showing a single instruction.
 */

export default function ItinerarySingleStep({ leg, stepIdx, onBackClick }) {
  // TODO Make this nice and give the same description (with image) as
  // the step in the full itinerary.
  return (
    <p style={{ marginLeft: 32 }}>
      {leg.instructions[stepIdx].text + ' '}
      <button onClick={onBackClick}>Go back</button>
    </p>
  );
}
