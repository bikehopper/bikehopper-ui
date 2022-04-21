import * as React from 'react';

export default function Itinerary({ route, onBackClick, onStepClick }) {
  return (
    <div className="Itinerary">
      {route.legs.map((leg, idx) => {
        if (leg.type === 'pt') return <h3 key={idx}>Public transit</h3>;
        return <h3 key={idx}>Bike</h3>;
      })}
      <button onClick={onBackClick}>Go back</button>
    </div>
  );
}
