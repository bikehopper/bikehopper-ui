import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import type { BikeLeg } from '../lib/BikeHopperClient';
import BorderlessButton from './BorderlessButton';
import Icon from './primitives/Icon';
import ItineraryBase from './ItineraryBase';
import ItineraryBikeStep from './ItineraryBikeStep';
import ItinerarySpacer from './ItinerarySpacer';
import ItineraryTimeline from './ItineraryTimeline';
import formatDistance from '../lib/formatDistance';
import { describeBikeInfra } from '../lib/geometry';

import NavLeftArrow from 'iconoir/icons/nav-arrow-left.svg?react';

/**
 * When you tap on an instruction (e.g. "Turn left on Valencia
 * Street") in the detailed itinerary, we zoom in on the point that
 * instruction applies to. This is the view that is displayed at the
 * bottom of the screen at that time, showing a single instruction.
 */

export default function ItinerarySingleStep({
  leg,
  stepIdx,
  onBackClick,
}: {
  leg: BikeLeg;
  stepIdx: number;
  onBackClick: React.MouseEventHandler;
}) {
  const intl = useIntl();

  const step = leg.instructions[stepIdx];
  const stepBikeInfra = describeBikeInfra(
    leg.geometry,
    leg.details.cycleway,
    leg.details.road_class,
    step.interval[0],
    step.interval[1],
  );

  const doNothing = useCallback(() => {}, []);

  return (
    <ItineraryBase>
      <ItineraryTimeline>
        <ItinerarySpacer />
        <ItineraryBikeStep
          key={stepIdx}
          step={step}
          distance={formatDistance(step.distance, intl)}
          infra={stepBikeInfra}
          isFirstStep={stepIdx === 0}
          onClick={doNothing}
        />
      </ItineraryTimeline>
      <div className="flex flex-row items-center">
        <BorderlessButton onClick={onBackClick} className="h-12 -ml-3 block">
          <Icon className="align-middle relative top-1">
            <NavLeftArrow />
          </Icon>
          <span className="text-base ml-2">
            <FormattedMessage
              defaultMessage="Go back"
              description="button to return to a previous screen"
            />
          </span>
        </BorderlessButton>
      </div>
    </ItineraryBase>
  );
}
