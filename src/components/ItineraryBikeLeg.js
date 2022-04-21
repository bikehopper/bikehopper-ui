import * as React from 'react';
import ItineraryHeader from './ItineraryHeader';
import RouteLeg from './RouteLeg';

export default function ItineraryBikeLeg({ leg, legDestination }) {
  return (
    <>
      <ItineraryHeader>
        <RouteLeg type="bike2" /> to {legDestination}
      </ItineraryHeader>
      <ul className="ItineraryBikeLeg_instructions">
        {leg.instructions.map((step, stepIdx) => (
          <li key={stepIdx}>{step.text}</li>
        ))}
      </ul>
    </>
  );
}
