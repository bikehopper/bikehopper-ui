import * as React from 'react';
import stringReplaceJsx from '../lib/stringReplaceJsx';
import ItineraryHeader from './ItineraryHeader';
import RouteLeg from './RouteLeg';

import './ItineraryBikeLeg.css';

export default function ItineraryBikeLeg({ leg, legDestination }) {
  return (
    <>
      <ItineraryHeader>
        <RouteLeg type="bike2" /> to {legDestination}
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
