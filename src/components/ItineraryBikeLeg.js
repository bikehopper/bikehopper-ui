import * as React from 'react';
import formatDistance from '../lib/formatDistance';
import formatDuration from '../lib/formatDuration';
import stringReplaceJsx from '../lib/stringReplaceJsx';
import ItineraryHeader, { ItineraryHeaderIcons } from './ItineraryHeader';
import RouteLeg from './RouteLeg';

import './ItineraryBikeLeg.css';

export default function ItineraryBikeLeg({ leg, legDestination }) {
  return (
    <>
      <ItineraryHeader icon={ItineraryHeaderIcons.BIKE}>
        <span>Bike to {legDestination}</span>
        <span>
          {formatDistance(leg.distance)} &middot;{' '}
          {formatDuration(leg.departure_time, leg.arrival_time)}
        </span>
      </ItineraryHeader>
      <ul className="ItineraryBikeLeg_instructions">
        {leg.instructions.map((step, stepIdx) => (
          <li key={stepIdx}>
            {stringReplaceJsx(
              step.text,
              /\b(slight|sharp )?(left|right)\b/,
              (direction) => (
                <span className="ItineraryBikeLeg_direction">{direction}</span>
              ),
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
