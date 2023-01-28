import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import formatDistance from '../lib/formatDistance';
import { describeBikeInfra } from '../lib/geometry';
import { ModeIcons } from '../lib/modeDescriptions';
import { formatDurationBetween } from '../lib/time';
import InstructionSigns from '../lib/InstructionSigns';
import useScrollToRef from '../hooks/useScrollToRef';
import ItineraryBikeStep from './ItineraryBikeStep';
import ItineraryHeader from './ItineraryHeader';
import ItineraryDivider from './ItineraryDivider';
import ItinerarySpacer from './ItinerarySpacer';

export default function ItineraryBikeLeg({
  leg,
  legDestination,
  onStepClick,
  scrollToStep,
}) {
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

  return (
    <>
      <ItineraryHeader icon={ModeIcons.BIKE}>
        <span>
          <FormattedMessage
            defaultMessage="Bike to {place}"
            description="header for step by step bike directions"
            values={{ place: legDestination }}
          />
        </span>
        <span>
          {/* TODO: localize this */ formatDistance(leg.distance)} &middot;{' '}
          {
            /* TODO: localize this */ formatDurationBetween(
              leg.departure_time,
              leg.arrival_time,
            )
          }
        </span>
      </ItineraryHeader>
      <ItineraryDivider />
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
                  step.distance ? formatDistance(step.distance) : null
                }`}
              >
                {step.bikeInfra}
              </ItineraryDivider>,
            ],
      )}
      <ItinerarySpacer />
    </>
  );
}

// GraphHopper inserts a final step, "Arrive at destination," with zero distance, into each
// bike/walk leg. We display this information in other ways so want to skip this instruction.
function isArriveStep(step) {
  return step.sign === InstructionSigns.FINISH;
}
