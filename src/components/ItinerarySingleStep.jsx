import * as React from 'react';
import { FormattedMessage } from 'react-intl';

/**
 * When you tap on an instruction (e.g. "Turn left on Valencia
 * Street") in the detailed itinerary, we zoom in on the point that
 * instruction applies to. This is the view that is displayed at the
 * bottom of the screen at that time, showing a single instruction.
 */

export default function ItinerarySingleStep({ leg, stepIdx, onBackClick }) {
  // TODO Make this nice and give the same localized description (with image) as
  // the step in the full itinerary.
  const space = ' ';
  return (
    <p style={{ marginLeft: 32 }}>
      {leg.instructions[stepIdx].text + space}
      <button onClick={onBackClick}>
        <FormattedMessage
          defaultMessage="Go back"
          description="button to return to a previous screen"
        />
      </button>
    </p>
  );
}
