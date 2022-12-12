import * as React from 'react';
import { formatTime, formatDurationBetween } from '../lib/time';
import { getAgencyDisplayName } from '../lib/region';
import Icon from './Icon';
import ItineraryBikeLeg from './ItineraryBikeLeg';
import ItineraryHeader, { ItineraryHeaderIcons } from './ItineraryHeader';
import ItineraryTransitLeg from './ItineraryTransitLeg';

import { ReactComponent as NavLeftArrow } from 'iconoir/icons/nav-arrow-left.svg';
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
        <ItineraryTransitLeg
          key={idx}
          leg={leg}
          onStopClick={onStepClick.bind(null, idx)}
        />
      );
    } else {
      // Where are we biking to? (Either final destination, or name of transit stop to board)
      const legDestination =
        idx === legs.length - 1
          ? destinationDescription
          : legs[idx + 1].stops[0].stop_name;
      return (
        <ItineraryBikeLeg
          key={idx}
          leg={leg}
          legDestination={legDestination}
          onStepClick={onStepClick.bind(null, idx)}
        />
      );
    }
  });

  const startTime = route.legs[0].departure_time;
  const endTime = route.legs[route.legs.length - 1].arrival_time;
  const durationText = formatDurationBetween(startTime, endTime);
  const modesText = route.legs
    .reduce((modesArray, leg) => {
      let modeForLeg = 'unknown';
      if (leg.type === 'bike2') modeForLeg = 'bike';
      else if (leg.type === 'pt')
        modeForLeg = getAgencyDisplayName(leg.agency_name);
      if (!modesArray.includes(modeForLeg)) modesArray.push(modeForLeg);
      return modesArray;
    }, [])
    .join(', ');

  return (
    <div className="Itinerary">
      <div className="Itinerary_backBtnAndHeadings">
        <button onClick={onBackClick} className="Itinerary_backButton">
          <Icon label="Back to routes overview" className="Itinerary_backIcon">
            <NavLeftArrow />
          </Icon>
        </button>
        <div className="Itinerary_headings">
          <h2 className="Itinerary_overallTimeHeading">
            {formatTime(startTime)} to {formatTime(endTime)}
          </h2>
          <h3 className="Itinerary_overallSubheading">
            {durationText} &middot; via {modesText}
          </h3>
        </div>
      </div>
      <div className="Itinerary_timeline">
        {renderedLegs}
        <ItineraryHeader icon={ItineraryHeaderIcons.ARRIVE} iconColor="#ea526f">
          Arrive at destination
        </ItineraryHeader>
      </div>
      <div className="Itinerary_bottomBackBtnContainer">
        <button onClick={onBackClick} className="Itinerary_bottomBackBtn">
          <Icon className="Itinerary_backIcon">
            <NavLeftArrow />
          </Icon>
          <span className="Itinerary_bottomBackBtnText">Back to routes</span>
        </button>
      </div>
    </div>
  );
}
