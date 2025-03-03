import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import type { BikeLeg, RouteInstruction } from '../lib/BikeHopperClient';
import { BIKEHOPPER_THEME_COLOR } from '../lib/colors';
import formatDistance from '../lib/formatDistance';
import formatMajorStreets from '../lib/formatMajorStreets';
import { describeBikeInfra } from '../lib/geometry';
import type { StepAnnotation } from '../lib/geometry';
import { formatDurationBetween } from '../lib/time';
import InstructionSigns from '../lib/InstructionSigns';
import useScrollToRef from '../hooks/useScrollToRef';
import ItineraryBikeStep from './ItineraryBikeStep';
import ItineraryHeader from './ItineraryHeader';
import ItinerarySpacer from './ItinerarySpacer';

import BikeIcon from 'iconoir/icons/bicycle.svg?react';

type StepWithInfra = RouteInstruction & {
  bikeInfra: StepAnnotation[];
};

export default function ItineraryBikeLeg({
  leg,
  legDestination,
  expanded,
  onStepClick,
  onToggleLegExpand,
  scrollToStep,
}: {
  leg: BikeLeg;
  legDestination: string;
  expanded: boolean;
  onStepClick: (
    step: number,
    evt: Parameters<React.MouseEventHandler>[0],
  ) => void;
  onToggleLegExpand?: React.MouseEventHandler;
  scrollToStep: number | undefined;
}) {
  const intl = useIntl();
  const instructionsWithBikeInfra: StepWithInfra[] = useMemo(() => {
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
  const majorStreets = useMemo(() => formatMajorStreets(leg), [leg]);

  const scrollToRef = useScrollToRef<HTMLDivElement>();
  const spacer = ' \u00B7 ';

  // Clear out icon's SVG width/height attributes so it can be scaled with CSS
  // @ts-ignore: TS wrongly thinks SVG components' width, height can't be null.
  const bikeIcon = <BikeIcon width={null} height={null} />;

  const alerts: [string, string][] = leg.has_steps
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
        alertsExpanded={true}
        onToggleLegExpand={onToggleLegExpand}
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
          {majorStreets ? (
            <>
              {spacer}
              <FormattedMessage
                defaultMessage="via {streets}"
                description="list of major streets taken on bike leg"
                values={{
                  streets: intl.formatList(majorStreets, { type: 'unit' }),
                }}
              />
            </>
          ) : null}
        </span>
      </ItineraryHeader>

      {expanded ? (
        <>
          <ItinerarySpacer />
          {instructionsWithBikeInfra.map((step, stepIdx) =>
            isArriveStep(step)
              ? null
              : [
                  <ItineraryBikeStep
                    key={stepIdx}
                    step={step}
                    distance={formatDistance(step.distance, intl)}
                    infra={step.bikeInfra}
                    isFirstStep={stepIdx === 0}
                    onClick={onStepClick.bind(null, stepIdx)}
                    rootRef={stepIdx === scrollToStep ? scrollToRef : undefined}
                  />,
                ],
          )}
        </>
      ) : (
        <ItinerarySpacer />
      )}
    </>
  );
}

// GraphHopper inserts a final step, "Arrive at destination," with zero distance, into each
// bike/walk leg. We display this information in other ways so want to skip this instruction.
function isArriveStep(step: StepWithInfra) {
  return step.sign === InstructionSigns.FINISH;
}
