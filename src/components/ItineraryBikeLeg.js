import * as React from 'react';
import formatDistance from '../lib/formatDistance';
import formatDuration from '../lib/formatDuration';
import stringReplaceJsx from '../lib/stringReplaceJsx';
import InstructionSigns from '../lib/InstructionSigns';
import ItineraryHeader, { ItineraryHeaderIcons } from './ItineraryHeader';
import ItineraryDivider from './ItineraryDivider';
import ItineraryStep from './ItineraryStep';

import { ReactComponent as UTurnIcon } from 'iconoir/icons/maps-turn-back.svg';
import { ReactComponent as LeftTurnIcon } from 'iconoir/icons/long-arrow-up-left.svg';
import { ReactComponent as RightTurnIcon } from 'iconoir/icons/long-arrow-up-right.svg';
import { ReactComponent as ContinueIcon } from 'iconoir/icons/arrow-up.svg';
import { ReactComponent as ArriveIcon } from 'iconoir/icons/triangle-flag.svg';
import { ReactComponent as UnknownIcon } from 'iconoir/icons/question-mark-circle.svg';

import './ItineraryBikeLeg.css';

export default function ItineraryBikeLeg({ leg, legDestination }) {
  return (
    <>
      <ItineraryHeader icon={ItineraryHeaderIcons.BIKE}>
        <span>Bike to {legDestination}</span>
        <span>
          {formatDistance(leg.distance)} &middot;{' '}
          {formatDuration(leg.departure_time, leg.arrival_time)}
        </span>
      </ItineraryHeader>
      <ItineraryDivider />
      {leg.instructions.map((step, stepIdx) =>
        isArriveStep(step)
          ? null
          : [
              <ItineraryStep
                key={stepIdx}
                IconSVGComponent={getSignIcon(step.sign)}
              >
                {stringReplaceJsx(
                  step.text,
                  /\b(slight|sharp )?(left|right)\b/,
                  (direction) => (
                    <span className="ItineraryBikeLeg_direction">
                      {direction}
                    </span>
                  ),
                )}
              </ItineraryStep>,
              <ItineraryDivider key={stepIdx + 'd'}>
                {step.distance ? formatDistance(step.distance) : null}
              </ItineraryDivider>,
            ],
      )}
    </>
  );
}

// TODO: Get better icons for this purpose. We are missing proper icons for u-turn,
// sharp left/right, slight left/right, etc.
function getSignIcon(sign) {
  switch (sign) {
    case InstructionSigns.U_TURN_LEFT:
    case InstructionSigns.U_TURN_RIGHT:
    case InstructionSigns.U_TURN_UNKNOWN:
      return UTurnIcon;
    case InstructionSigns.KEEP_LEFT:
    case InstructionSigns.TURN_SHARP_LEFT:
    case InstructionSigns.TURN_LEFT:
    case InstructionSigns.TURN_SLIGHT_LEFT:
      return LeftTurnIcon;
    case InstructionSigns.CONTINUE_ON_STREET:
      return ContinueIcon;
    case InstructionSigns.FINISH:
    case InstructionSigns.REACHED_VIA:
      return ArriveIcon;
    case InstructionSigns.TURN_SLIGHT_RIGHT:
    case InstructionSigns.TURN_RIGHT:
    case InstructionSigns.TURN_SHARP_RIGHT:
    case InstructionSigns.KEEP_RIGHT:
      return RightTurnIcon;
    default:
      return UnknownIcon;
  }
}

function isArriveStep(step) {
  return step.sign === InstructionSigns.FINISH;
}
