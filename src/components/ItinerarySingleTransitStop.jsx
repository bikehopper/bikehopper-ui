import * as React from 'react';
import { FormattedMessage } from 'react-intl';

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

  const space = ' ';
  const stopName = stop.stop_name;

  return (
    <p style={{ marginLeft: 32 }}>
      {relationship === 'board' ? (
        <FormattedMessage
          defaultMessage="Board at {stop}"
          description="instruction to board a transit vehicle at the named stop"
          values={{ stop: stopName }}
        />
      ) : (
        <FormattedMessage
          defaultMessage="Get off at {stop}"
          description="instruction to exit a transit vehicle at the named stop"
          values={{ stop: stopName }}
        />
      )}
      {space}
      <button onClick={onBackClick}>
        <FormattedMessage
          defaultMessage="Go back"
          description="button to return to a previous screen"
        />
      </button>
    </p>
  );
}
