import * as React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { BIKEHOPPER_THEME_COLOR } from '../lib/colors';
import formatDistance from '../lib/formatDistance';
import formatMajorStreets from '../lib/formatMajorStreets';
import { describeBikeInfra } from '../lib/geometry';
import { formatDurationBetween } from '../lib/time';
import InstructionSigns from '../lib/InstructionSigns';
import useScrollToRef from '../hooks/useScrollToRef';
import ItineraryBikeStep from './ItineraryBikeStep';
import ItineraryHeader from './ItineraryHeader';
import ItineraryDivider from './ItineraryDivider';
import ItinerarySpacer from './ItinerarySpacer';

import { ReactComponent as BikeIcon } from 'iconoir/icons/bicycle.svg';
import ItineraryElevationProfile from './ItineraryElevationProfile';

export default function ItineraryBikeLeg({
  leg,
  legDestination,
  isOnlyLeg,
  expanded,
  onStepClick,
  onIconClick,
  scrollToStep,
  displayLegElevation,
}) {
  const intl = useIntl();
  const instructionsWithBikeInfra = React.useMemo(() => {
    return leg.instructions.map((step) => {
      return {
        ...step,
        bikeInfra: describeBikeInfra(
          leg.geometry,
          leg.details.cycleway,
          leg.details.road_class,
          step.interval[0],
          step.interval[1],
        ),
      };
    });
  }, [leg]);

  const scrollToRef = useScrollToRef();
  const spacer = ' \u00B7 ';

  // Clear out icon's SVG width/height attributes so it can be scaled with CSS
  const bikeIcon = <BikeIcon width={null} height={null} />;

  const alerts = leg.has_steps
    ? [
        [
          '', // no header
          intl.formatMessage({
            defaultMessage:
              'This route may require carrying your bike up or down steps.',
            description:
              'warning displayed in trip itinerary. ' +
              'Warns you that you may have to lift your bicycle up steps, such as an ' +
              'outdoor staircase, to complete the trip.',
          }),
        ],
      ]
    : [];

  return (
    <>
      <ItineraryHeader
        icon={bikeIcon}
        iconColor={BIKEHOPPER_THEME_COLOR}
        alerts={alerts}
        expanded={expanded}
        displayArrow={true}
        alertsExpanded={true}
        onIconClick={onIconClick}
      >
        <span>
          <FormattedMessage
            defaultMessage="Bike to {place}"
            description="header for step by step bike directions"
            values={{ place: legDestination }}
          />
        </span>
        <span>
          {formatDistance(leg.distance, intl)}
          {spacer}
          {formatDurationBetween(leg.departure_time, leg.arrival_time, intl)}
          {spacer}
          {formatMajorStreets(leg)}
        </span>
      </ItineraryHeader>

      {expanded ? (
        <>
          {isOnlyLeg || !displayLegElevation ? null : (
            <ItineraryElevationProfile route={{ legs: [leg] }} />
          )}

          {instructionsWithBikeInfra.map((step, stepIdx) =>
            isArriveStep(step)
              ? null
              : [
                  <ItineraryBikeStep
                    key={stepIdx}
                    step={step}
                    isFirstStep={stepIdx === 0}
                    onClick={onStepClick.bind(null, stepIdx)}
                    rootRef={stepIdx === scrollToStep ? scrollToRef : null}
                  />,
                  <ItineraryDivider
                    key={stepIdx + 'd'}
                    transit={false}
                    detail={`${
                      step.distance ? formatDistance(step.distance, intl) : null
                    }`}
                  >
                    {step.bikeInfra}
                  </ItineraryDivider>,
                ],
          )}
          <ItinerarySpacer />
        </>
      ) : (
        <ItinerarySpacer />
      )}
    </>
  );
}

// GraphHopper inserts a final step, "Arrive at destination," with zero distance, into each
// bike/walk leg. We display this information in other ways so want to skip this instruction.
function isArriveStep(step) {
  return step.sign === InstructionSigns.FINISH;
}
