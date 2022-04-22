import * as React from 'react';
import formatDuration from '../lib/formatDuration';
import getAgencyNameForDisplay from '../lib/getAgencyNameForDisplay';
import DepartArriveTime from './DepartArriveTime';
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
      return <ItineraryTransitLeg key={idx} leg={leg} />;
    } else {
      // Where are we biking to? (Either final destination, or name of transit stop to board)
      const legDestination =
        idx === legs.length - 1
          ? destinationDescription
          : legs[idx + 1].stops[0].stop_name;
      return (
        <ItineraryBikeLeg key={idx} leg={leg} legDestination={legDestination} />
      );
    }
  });

  const startTime = route.legs[0].departure_time;
  const endTime = route.legs[route.legs.length - 1].arrival_time;
  const durationText = formatDuration(startTime, endTime);
  const modesText = route.legs
    .reduce((modesArray, leg) => {
      let modeForLeg = 'unknown';
      if (leg.type === 'bike2') modeForLeg = 'bike';
      else if (leg.type === 'pt')
        modeForLeg = getAgencyNameForDisplay(leg.agency_name);
      if (!modesArray.includes(modeForLeg)) modesArray.push(modeForLeg);
      return modesArray;
    }, [])
    .join(', ');

  return (
    <div className="Itinerary">
      <DepartArriveTime
        className="Itinerary_overallTimeHeading"
        depart={startTime}
        arrive={endTime}
      />
      <p className="Itinerary_overallSubheading">
        {durationText} &middot; via {modesText}
      </p>
      {renderedLegs}
      <button onClick={onBackClick}>Return to route results</button>
    </div>
  );
}
