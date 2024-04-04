import * as React from 'react';
import { useDispatch } from 'react-redux';
import { FormattedMessage, useIntl } from 'react-intl';
import { formatDurationBetween } from '../lib/time';
import { getAgencyDisplayName } from '../lib/region';
import Icon from './primitives/Icon';
import ItineraryBikeLeg from './ItineraryBikeLeg';
import ItineraryHeader from './ItineraryHeader';
import ItineraryTransitLeg from './ItineraryTransitLeg';
import ItineraryElevationProfile from './ItineraryElevationProfile';
import { isSignificantLeg } from './RoutesOverview';

import { ReactComponent as NavLeftArrow } from 'iconoir/icons/nav-arrow-left.svg';
import { ReactComponent as ArriveIcon } from 'iconoir/icons/triangle-flag.svg';
import './Itinerary.css';

export default function Itinerary({
  route,
  destinationDescription,
  onBackClick,
  onStepClick,
  onIconClick,
  viewingLeg,
  scrollToStep,
}) {
  const dispatch = useDispatch();
  const intl = useIntl();
  const [scrollToLegIdx, scrollToStepIdx] = scrollToStep || [];

  const renderedLegs = route.legs.map((leg, idx, legs) => {
    if (leg.type === 'pt') {
      return (
        <ItineraryTransitLeg
          key={idx}
          leg={leg}
          onStopClick={onStepClick.bind(null, idx)}
          onIconClick={onIconClick.bind(null, idx)}
          expanded={viewingLeg === idx}
          scrollTo={scrollToLegIdx === idx}
        />
      );
    } else if (isSignificantLeg(leg)) {
      const isOnlyLeg = legs.length === 1;
      if (isOnlyLeg) {
        onIconClick(idx);
      }
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
          isOnlyLeg={isOnlyLeg}
          onStepClick={onStepClick.bind(null, idx)}
          onIconClick={onIconClick.bind(null, idx)}
          expanded={viewingLeg === idx}
          scrollToStep={scrollToLegIdx === idx ? scrollToStepIdx : null}
          displayLegElevation={false}
        />
      );
    }
  });

  const startTime = route.legs[0].departure_time;
  const endTime = route.legs[route.legs.length - 1].arrival_time;
  const durationText = formatDurationBetween(startTime, endTime, intl);
  const modeDescriptions = route.legs
    .reduce((modesArray, leg) => {
      let modeForLeg = 'unknown';
      if (leg.type === 'bike2') {
        modeForLeg = intl.formatMessage({
          defaultMessage: 'bike',
          description:
            'Description of bike as a travel mode. Appears in a list of travel modes' +
            ' along with transit agency names, such as "via bike, BART, AC Transit"' +
            ' or just "via bike"',
        });
      } else if (leg.type === 'pt') {
        modeForLeg = getAgencyDisplayName(leg.agency_name);
      }
      if (!modesArray.includes(modeForLeg)) modesArray.push(modeForLeg);
      return modesArray;
    }, [])
    .slice(0, 5);

  const spacer = ' \u00B7 ';

  const backToRoutesText = intl.formatMessage({
    defaultMessage: 'Back to routes',
    description:
      'button to return from a detailed itinerary to routes overview',
  });

  // Clear out icon's SVG width/height attributes so it can be scaled with CSS
  const arriveIcon = <ArriveIcon width={null} height={null} />;

  return (
    <div className="Itinerary">
      <div className="Itinerary_backBtnAndHeadings">
        <button onClick={onBackClick} className="Itinerary_backButton">
          <Icon label={backToRoutesText} className="Itinerary_backIcon">
            <NavLeftArrow />
          </Icon>
        </button>
        <div className="Itinerary_headings">
          <h2 className="Itinerary_overallTimeHeading">
            <FormattedMessage
              defaultMessage="{startTime} to {endTime}"
              description="start and end time for a trip"
              values={{
                startTime: intl.formatTime(startTime, {
                  hour: 'numeric',
                  minute: 'numeric',
                }),
                endTime: intl.formatTime(endTime, {
                  hour: 'numeric',
                  minute: 'numeric',
                }),
              }}
            />
          </h2>
          <h3 className="Itinerary_overallSubheading">
            {durationText}
            {spacer}
            <FormattedMessage
              defaultMessage="via {modes}"
              description={
                'Short summary of the modes used for a trip.' +
                ' Modes is a list which can include bike and/or ' +
                ' transit agency names such as BART and AC Transit.'
              }
              values={{
                modes: intl.formatList(modeDescriptions, { type: 'unit' }),
              }}
            />
          </h3>
        </div>
      </div>
      <div className="Itinerary_elevation">
        <ItineraryElevationProfile route={route} />
      </div>
      <div className="Itinerary_timeline">
        {renderedLegs}
        <ItineraryHeader
          icon={arriveIcon}
          iconColor="#ea526f"
          displayArrow={false}
        >
          <FormattedMessage
            defaultMessage="Arrive at destination"
            description="header text at end of step by step travel instructions"
          />
        </ItineraryHeader>
      </div>
      <div className="Itinerary_bottomBackBtnContainer">
        <button onClick={onBackClick} className="Itinerary_bottomBackBtn">
          <Icon className="Itinerary_backIcon">
            <NavLeftArrow />
          </Icon>
          <span className="Itinerary_bottomBackBtnText">
            {backToRoutesText}
          </span>
        </button>
      </div>
    </div>
  );
}
