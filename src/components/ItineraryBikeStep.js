import * as React from 'react';
import InstructionSigns from '../lib/InstructionSigns';
import stringReplaceJsx from '../lib/stringReplaceJsx';
import ItineraryStep from './ItineraryStep';

import { ReactComponent as MapsTurnBack } from 'iconoir/icons/maps-turn-back.svg';
import { ReactComponent as LongArrowUpLeft } from 'iconoir/icons/long-arrow-up-left.svg';
import { ReactComponent as LongArrowUpRight } from 'iconoir/icons/long-arrow-up-right.svg';
import { ReactComponent as ArrowUp } from 'iconoir/icons/arrow-up.svg';
import { ReactComponent as TriangleFlag } from 'iconoir/icons/triangle-flag.svg';
import { ReactComponent as QuestionMarkCircle } from 'iconoir/icons/question-mark-circle.svg';

export default function ItineraryBikeStep({ step }) {
  return (
    <ItineraryStep IconSVGComponent={getSignIcon(step.sign)}>
      {stringReplaceJsx(
        step.text,
        /\b(slight|sharp )?(left|right)\b/,
        (direction) => (
          <strong>{direction}</strong>
        ),
      )}
    </ItineraryStep>
  );
}

// TODO: Get better icons for this purpose. We are missing proper icons for u-turn,
// sharp left/right, slight left/right, etc.
function getSignIcon(sign) {
  switch (sign) {
    case InstructionSigns.U_TURN_LEFT:
    case InstructionSigns.U_TURN_RIGHT:
    case InstructionSigns.U_TURN_UNKNOWN:
      return MapsTurnBack;
    case InstructionSigns.KEEP_LEFT:
    case InstructionSigns.TURN_SHARP_LEFT:
    case InstructionSigns.TURN_LEFT:
    case InstructionSigns.TURN_SLIGHT_LEFT:
      return LongArrowUpLeft;
    case InstructionSigns.CONTINUE_ON_STREET:
      return ArrowUp;
    case InstructionSigns.FINISH:
    case InstructionSigns.REACHED_VIA:
      return TriangleFlag;
    case InstructionSigns.TURN_SLIGHT_RIGHT:
    case InstructionSigns.TURN_RIGHT:
    case InstructionSigns.TURN_SHARP_RIGHT:
    case InstructionSigns.KEEP_RIGHT:
      return LongArrowUpRight;
    default:
      return QuestionMarkCircle;
  }
}
