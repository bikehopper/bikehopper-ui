import { useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import type { TransitLeg } from '../lib/BikeHopperClient';
import { DEFAULT_PT_COLOR } from '../lib/colors';
import { getAgencyDisplayName } from '../lib/region';
import { formatDurationBetween, formatTime } from '../lib/time';
import { getModeLabel } from '../lib/TransitModes';
import BorderlessButton from './BorderlessButton';
import ModeIcon from './ModeIcon';
import Icon from './primitives/Icon';
import ItineraryHeader from './ItineraryHeader';
import ItineraryStep from './ItineraryStep';

import ArrowLeftCircle from 'iconoir/icons/arrow-left-circle.svg?react';
import ArrowRightCircle from 'iconoir/icons/arrow-right-circle.svg?react';
import Circle from 'iconoir/icons/circle.svg?react';
import NavLeftArrow from 'iconoir/icons/nav-arrow-left.svg?react';
import { selectAlertsToDisplay } from '../lib/alerts';
import usePrevious from '../hooks/usePrevious';

/**
 * When you tap on a transit stop name in the detailed itinerary, we
 * zoom in on that transit stop. This is the view that is displayed at
 * the bottom of the screen at that time.
 */

export default function ItinerarySingleTransitStop({
  leg,
  stopIdx,
  onBackClick,
  isFirstLeg,
  isLastLeg,
  onPrevStepClick,
  onNextStepClick,
}: {
  leg: TransitLeg;
  stopIdx: number;
  onBackClick: React.MouseEventHandler;
  isFirstLeg: boolean;
  isLastLeg: boolean;
  onPrevStepClick: React.MouseEventHandler;
  onNextStepClick: React.MouseEventHandler;
}) {
  const stopName = leg.stops[stopIdx].stop_name;
  const isBoardingStop = stopIdx === 0;
  const isAlightingStop = stopIdx === leg.stops.length - 1;
  const canGoToPrev = !(isFirstLeg && isBoardingStop);
  const canGoToNext = !(isLastLeg && isAlightingStop);
  const spacerWithMiddot = ' \u00B7 ';
  const intl = useIntl();
  const [alertsExpanded, setAlertsExpanded] = useState(false);

  const prevLeg = usePrevious(leg);
  useEffect(() => {
    if (leg !== prevLeg) {
      setAlertsExpanded(false);
    }
  }, [leg, prevLeg]);

  const toggleAlertsExpanded = useCallback(() => {
    setAlertsExpanded(!alertsExpanded);
  }, [alertsExpanded]);

  const alertsForHeader = selectAlertsToDisplay(leg);
  const stopsTraveled = leg.stops.length - 1;

  return (
    <div className="py-8 px-5">
      <div className="flex flex-row items-start">
        <div className="flex-grow">
          {isBoardingStop && (
            <ItineraryHeader
              icon={<ModeIcon mode={leg.route_type} />}
              iconColor={leg.route_color || DEFAULT_PT_COLOR}
              iconLabel={getModeLabel(leg.route_type, intl)}
              alertsExpanded={alertsExpanded}
              onAlertClick={toggleAlertsExpanded}
              alerts={alertsForHeader}
            >
              <span>
                <FormattedMessage
                  defaultMessage="Ride {agency} {routeName} to {lastStopName}"
                  description={
                    'instructions header text.' +
                    ' Says to ride the named transit line to the named stop, operated by the named agency.'
                  }
                  values={{
                    agency: getAgencyDisplayName(leg.agency_name),
                    routeName: leg.route_name || leg.route_id,
                    lastStopName: leg.stops[leg.stops.length - 1].stop_name,
                  }}
                />
              </span>
              <span>
                <FormattedMessage
                  defaultMessage={
                    '{numStops} {numStops, plural,' +
                    ' one {stop}' +
                    ' other {stops}' +
                    '}'
                  }
                  description="the number of stops for which you should stay on a transit vehicle"
                  values={{
                    numStops: stopsTraveled,
                  }}
                />
                {spacerWithMiddot}
                {formatDurationBetween(
                  leg.departure_time,
                  leg.arrival_time,
                  intl,
                )}
              </span>
            </ItineraryHeader>
          )}
          {isBoardingStop ? (
            <ItineraryStep IconSVGComponent={Circle} iconSize="small">
              <div className="pt-[5px]">
                <FormattedMessage
                  defaultMessage="Board at {stop}"
                  description="instruction to board (a public transit vehicle) at the named stop"
                  values={{
                    stop: <strong>{stopName}</strong>,
                  }}
                />
                {spacerWithMiddot}
                {formatTime(leg.departure_time)}
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
                      headsign: leg.trip_headsign,
                    }}
                  />
                </div>
              </div>
            </ItineraryStep>
          ) : isAlightingStop ? (
            <ItineraryStep
              IconSVGComponent={Circle}
              iconSize="small"
              hideLine={true}
            >
              <div className="pt-[5px]">
                <FormattedMessage
                  defaultMessage="Get off at {stop}"
                  description="instruction to exit (a public transit vehicle) at the named stop"
                  values={{
                    stop: <strong>{stopName}</strong>,
                  }}
                />
                {spacerWithMiddot}
                {formatTime(leg.arrival_time)}
              </div>
            </ItineraryStep>
          ) : (
            <ItineraryStep
              IconSVGComponent={Circle}
              iconSize="tiny"
              hideLine={true}
            >
              <div className="pt-[5px]">{stopName}</div>
            </ItineraryStep>
          )}
        </div>
        {canGoToNext && (
          <BorderlessButton onClick={onPrevStepClick} className="ml-2 mt-3.5">
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
          <BorderlessButton onClick={onNextStepClick} className="ml-2 mt-3.5">
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
