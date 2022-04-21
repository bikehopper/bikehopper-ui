import * as React from 'react';
import ItineraryHeader from './ItineraryHeader';

export default function ItineraryBikeLeg({ leg, legDestination }) {
  return (
    <>
      <ItineraryHeader>Bike to {legDestination}</ItineraryHeader>
      <ul className="ItineraryBikeLeg_instructions">
        {leg.instructions.map((step, stepIdx) => (
          <li key={stepIdx}>{step.text}</li>
        ))}
      </ul>
    </>
  );
}
