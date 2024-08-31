import { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { formatDurationBetween } from '../lib/time';
import { getAgencyDisplayName } from '../lib/region';
import Icon from './primitives/Icon';
import ItineraryBikeLeg from './ItineraryBikeLeg';
import ItineraryHeader from './ItineraryHeader';
import ItineraryTransitLeg from './ItineraryTransitLeg';
import ItineraryElevationProfile from './ItineraryElevationProfile';
import ShareFit from './ShareFit';

import NavLeftArrow from 'iconoir/icons/nav-arrow-left.svg?react';
import ArriveIcon from 'iconoir/icons/triangle-flag.svg?react';
import './Itinerary.css';
import type { RouteResponsePath } from '../lib/BikeHopperClient';

export default function Itinerary({
  route,
  destinationDescription,
  onBackClick,
  onStepClick,
  scrollToStep,
}: {
  route: RouteResponsePath;
  destinationDescription: string;
  onBackClick: React.MouseEventHandler;
  onStepClick: (
    leg: number,
    step: number,
    evt: Parameters<React.MouseEventHandler>[0],
  ) => void;
  scrollToStep: [number, number] | null;
}) {
  const intl = useIntl();
  const [scrollToLegIdx, scrollToStepIdx] = scrollToStep || [];

  // array of booleans: whether the leg at that index is expanded.
  const [expandedLegs, setExpandedLegs] = useState<boolean[]>([]);

  useEffect(() => {
    if (route.legs.length === 1) {
      setExpandedLegs([true]);
    } else {
      setExpandedLegs(Array(route.legs.length).fill(false));
    }
  }, [route]);

  const toggleExpandedLeg = (idx: number) => {
    const newValue = [...expandedLegs];
    newValue[idx] = !newValue[idx];
    setExpandedLegs(newValue);
  };

  const renderedLegs = route.legs.map((leg, idx, legs) => {
    if (leg.type === 'pt') {
      return (
        <ItineraryTransitLeg
          key={idx}
          leg={leg}
          onStopClick={onStepClick.bind(null, idx)}
          onToggleLegExpand={toggleExpandedLeg.bind(null, idx)}
          expanded={expandedLegs[idx]}
          scrollTo={scrollToLegIdx === idx}
        />
      );
    } else {
      // Where are we biking to? (Either name of transit stop to board for next
      // leg, or final destination)
      const nextLeg = legs[idx + 1];
      const legDestination =
        nextLeg?.type === 'pt'
          ? nextLeg.stops[0].stop_name
          : destinationDescription;
      const expandable = legs.length > 1;
      return (
        <ItineraryBikeLeg
          key={idx}
          leg={leg}
          legDestination={legDestination}
          onStepClick={onStepClick.bind(null, idx)}
          onToggleLegExpand={
            expandable ? toggleExpandedLeg.bind(null, idx) : undefined
          }
          expanded={expandedLegs[idx]}
          scrollToStep={scrollToLegIdx === idx ? scrollToStepIdx : undefined}
        />
      );
    }
  });

  const startTime = route.legs[0].departure_time;
  const endTime = route.legs[route.legs.length - 1].arrival_time;
  const durationText = formatDurationBetween(startTime, endTime, intl);
  const modeDescriptions = route.legs
    .reduce((modesArray: string[], leg) => {
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
  // (TS thinks width and height can't be set to null. It is wrong.)
  const ArriveIconShutUpTypeScript: any = ArriveIcon;
  const arriveIcon = <ArriveIconShutUpTypeScript width={null} height={null} />;

  const soleBikeLeg =
    route.legs.length === 1 && route.legs[0].type === 'bike2'
      ? route.legs[0]
      : null;

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
        {soleBikeLeg && <ShareFit leg={soleBikeLeg} />}
      </div>
      <div className="Itinerary_elevation">
        <ItineraryElevationProfile route={route} />
      </div>
      <div className="Itinerary_timeline">
        {renderedLegs}
        <ItineraryHeader icon={arriveIcon} iconColor="#ea526f">
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
