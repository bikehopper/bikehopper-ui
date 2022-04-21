import * as React from 'react';
import RouteSummary from './RouteSummary';
import SelectionList from './SelectionList';
import SelectionListItem from './SelectionListItem';
import ItineraryBikeLeg from './ItineraryBikeLeg';
import ItineraryTransitLeg from './ItineraryTransitLeg';

import './Itinerary.css';

export default function Itinerary({
  route,
  destinationDescription,
  onBackClick,
  onStepClick,
}) {
  const renderedLegs = route.legs.map((leg, idx, legs) => {
    if (leg.type === 'pt') {
      return (
        <SelectionListItem key={idx}>
          <ItineraryTransitLeg leg={leg} />
        </SelectionListItem>
      );
    } else {
      // Where are we biking to? (Either final destination, or name of transit stop to board)
      const legDestination =
        idx === legs.length - 1
          ? destinationDescription
          : legs[idx + 1].stops[0].stop_name;
      return (
        <SelectionListItem key={idx}>
          <ItineraryBikeLeg leg={leg} legDestination={legDestination} />
        </SelectionListItem>
      );
    }
  });

  return (
    <SelectionList className="Itinerary">
      <SelectionListItem>
        <RouteSummary route={route} />
      </SelectionListItem>
      {renderedLegs}
      <SelectionListItem onClick={onBackClick}>Go back</SelectionListItem>
    </SelectionList>
  );
}
