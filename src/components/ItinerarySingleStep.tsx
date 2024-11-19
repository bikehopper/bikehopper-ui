import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import type { BikeLeg } from '../lib/BikeHopperClient';
import BorderlessButton from './BorderlessButton';
import Icon from './primitives/Icon';
import ItineraryBikeStep from './ItineraryBikeStep';
import ItinerarySpacer from './ItinerarySpacer';
import formatDistance from '../lib/formatDistance';
import { describeBikeInfra } from '../lib/geometry';

import NavLeftArrow from 'iconoir/icons/nav-arrow-left.svg?react';
import ArrowLeftCircle from 'iconoir/icons/arrow-left-circle.svg?react';
import ArrowRightCircle from 'iconoir/icons/arrow-right-circle.svg?react';

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
  isFirstStep,
  isLastStep,
  onPrevStepClick,
  onNextStepClick,
}: {
  leg: BikeLeg;
  stepIdx: number;
  onBackClick: React.MouseEventHandler;
  isFirstStep: boolean;
  isLastStep: boolean;
  onPrevStepClick: React.MouseEventHandler;
  onNextStepClick: React.MouseEventHandler;
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
    <div className="py-8 px-5">
      <div className="flex flex-row">
        <div className="flex-grow">
          <ItinerarySpacer />
          <ItineraryBikeStep
            key={stepIdx}
            step={step}
            distance={formatDistance(step.distance, intl)}
            infra={stepBikeInfra}
            isFirstStep={stepIdx === 0}
            onClick={doNothing}
          />
        </div>
        {!isFirstStep && (
          <BorderlessButton onClick={onPrevStepClick} className="ml-2">
            <Icon
              label={intl.formatMessage({
                defaultMessage: 'Previous step',
                description:
                  'button. Goes to previous step in a list of directions.',
              })}
            >
              <ArrowLeftCircle />
            </Icon>
          </BorderlessButton>
        )}
        {!isLastStep && (
          <BorderlessButton onClick={onNextStepClick} className="ml-2">
            <Icon
              label={intl.formatMessage({
                defaultMessage: 'Next step',
                description:
                  'button. Goes to next step in a list of directions.',
              })}
            >
              <ArrowRightCircle />
            </Icon>
          </BorderlessButton>
        )}
      </div>
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
    </div>
  );
}
