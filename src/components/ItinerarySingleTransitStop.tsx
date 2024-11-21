import { FormattedMessage, useIntl } from 'react-intl';
import type { TransitStop } from '../lib/BikeHopperClient';
import { formatTime } from '../lib/time';
import BorderlessButton from './BorderlessButton';
import Icon from './primitives/Icon';
import ItinerarySpacer from './ItinerarySpacer';
import ItineraryStep from './ItineraryStep';

import ArrowLeftCircle from 'iconoir/icons/arrow-left-circle.svg?react';
import ArrowRightCircle from 'iconoir/icons/arrow-right-circle.svg?react';
import Circle from 'iconoir/icons/circle.svg?react';
import NavLeftArrow from 'iconoir/icons/nav-arrow-left.svg?react';

/**
 * When you tap on a transit stop name in the detailed itinerary, we
 * zoom in on that transit stop. This is the view that is displayed at
 * the bottom of the screen at that time.
 */

export default function ItinerarySingleTransitStop({
  stop,
  relationship,
  onBackClick,
  isFirstLeg,
  isLastLeg,
  onPrevStepClick,
  onNextStepClick,
  time,
  headsign,
}: {
  stop: TransitStop;
  relationship: 'board' | 'alight' | 'intermediate';
  onBackClick: React.MouseEventHandler;
  isFirstLeg: boolean;
  isLastLeg: boolean;
  onPrevStepClick: React.MouseEventHandler;
  onNextStepClick: React.MouseEventHandler;
  time: Date | null;
  headsign: string;
}) {
  // TODO add route name, type, agency for board step, and split out stuff from
  // ItineraryTransitLeg to make it reusable so it doesn't all have to be
  // copy-pasted here.
  const space = ' ';
  const stopName = stop.stop_name;
  const canGoToPrev = !(isFirstLeg && relationship === 'board');
  const canGoToNext = !(isLastLeg && relationship === 'alight');
  const spacerWithMiddot = ' \u00B7 ';
  const intl = useIntl();

  return (
    <div className="py-8 px-5">
      <div className="flex flex-row">
        <div className="flex-grow">
          <ItinerarySpacer />
          {relationship === 'board' ? (
            <ItineraryStep IconSVGComponent={Circle} iconSize="small">
              <div className="pt-[5px]">
                <FormattedMessage
                  defaultMessage="Board at {stop}"
                  description="instruction to board (a public transit vehicle) at the named stop"
                  values={{
                    stop: <strong>{stopName}</strong>,
                  }}
                />
                {time && spacerWithMiddot + formatTime(time)}
                {headsign && (
                  <div className="italic text-[#626262]">
                    <FormattedMessage
                      defaultMessage="Towards {headsign}"
                      description={
                        'describes where a transit trip is headed.' +
                        ' Often, the headsign is the name of the final stop.' +
                        ' This appears in an itinerary, along with other details about the' +
                        ' transit vehicle to board.'
                      }
                      values={{
                        headsign: headsign,
                      }}
                    />
                  </div>
                )}
              </div>
            </ItineraryStep>
          ) : relationship === 'alight' ? (
            <ItineraryStep IconSVGComponent={Circle} iconSize="small">
              <div className="pt-[5px]">
                <FormattedMessage
                  defaultMessage="Get off at {stop}"
                  description="instruction to exit (a public transit vehicle) at the named stop"
                  values={{
                    stop: <strong>{stopName}</strong>,
                  }}
                />
                {time && spacerWithMiddot + formatTime(time)}
              </div>
            </ItineraryStep>
          ) : (
            <ItineraryStep IconSVGComponent={Circle} iconSize="tiny">
              <div className="pt-[5px]">{stop.stop_name}</div>
            </ItineraryStep>
          )}
        </div>
        {canGoToNext && (
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
        {canGoToPrev && (
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
