import * as React from 'react';
import formatDistance from '../lib/formatDistance';
import { formatDurationBetween } from '../lib/time';
import InstructionSigns from '../lib/InstructionSigns';
import ItineraryBikeStep from './ItineraryBikeStep';
import ItineraryHeader, { ItineraryHeaderIcons } from './ItineraryHeader';
import ItineraryDivider from './ItineraryDivider';

import './ItineraryBikeLeg.css';

export default function ItineraryBikeLeg({ leg, legDestination }) {
  return (
    <>
      <ItineraryHeader icon={ItineraryHeaderIcons.BIKE}>
        <span>Bike to {legDestination}</span>
        <span>
          {formatDistance(leg.distance)} &middot;{' '}
          {formatDurationBetween(leg.departure_time, leg.arrival_time)}
        </span>
      </ItineraryHeader>
      <ItineraryDivider />
      {leg.instructions.map((step, stepIdx) =>
        isArriveStep(step)
          ? null
          : [
              <ItineraryBikeStep
                key={stepIdx}
                step={step}
                isFirstStep={stepIdx === 0}
              />,
              <ItineraryDivider key={stepIdx + 'd'}>
                {step.distance ? formatDistance(step.distance) : null}
              </ItineraryDivider>,
            ],
      )}
    </>
  );
}

// GraphHopper inserts a final step, "Arrive at destination," with zero distance, into each
// bike/walk leg. We display this information in other ways so want to skip this instruction.
function isArriveStep(step) {
  return step.sign === InstructionSigns.FINISH;
}
