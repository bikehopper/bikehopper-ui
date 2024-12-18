import InstructionSigns, { InstructionSign } from '../lib/InstructionSigns';

import MapsTurnBack from 'iconoir/icons/maps-turn-back.svg?react';
import LongArrowUpLeft from 'iconoir/icons/long-arrow-up-left.svg?react';
import LongArrowUpRight from 'iconoir/icons/long-arrow-up-right.svg?react';
import ArrowUp from 'iconoir/icons/arrow-up.svg?react';
import TriangleFlag from 'iconoir/icons/triangle-flag.svg?react';
import QuestionMarkCircle from 'iconoir/icons/help-circle.svg?react';
import ArrowTrCircle from 'iconoir/icons/arrow-up-right-circle.svg?react';

/*
 * An icon to represent an instruction, such as "turn left."
 * Returns a rendered SVG component which should be wrapped by <Icon>.
 *
 * NOTE: That's different from PlaceIcon, which does render the wrapping
 * <Icon> for you.
 *
 * TODO: Find or design more specific icons for "slight" and "sharp" turns.
 */

export default function InstructionIcon({
  sign,
  width,
  height,
  fallback = QuestionMarkCircle,
  className,
}: {
  sign: InstructionSign;
  width?: string | number | undefined;
  height?: string | number | undefined;
  fallback?: React.FunctionComponent | null;
  className?: string;
}) {
  let IconSvg;

  switch (sign) {
    case InstructionSigns.U_TURN_LEFT:
    case InstructionSigns.U_TURN_RIGHT:
    case InstructionSigns.U_TURN_UNKNOWN:
      IconSvg = MapsTurnBack;
      break;
    case InstructionSigns.KEEP_LEFT:
    case InstructionSigns.TURN_LEFT:
    case InstructionSigns.TURN_SHARP_LEFT:
    case InstructionSigns.TURN_SLIGHT_LEFT:
      IconSvg = LongArrowUpLeft;
      break;
    case InstructionSigns.KEEP_RIGHT:
    case InstructionSigns.TURN_RIGHT:
    case InstructionSigns.TURN_SHARP_RIGHT:
    case InstructionSigns.TURN_SLIGHT_RIGHT:
      IconSvg = LongArrowUpRight;
      break;
    case InstructionSigns.CONTINUE_ON_STREET:
      IconSvg = ArrowUp;
      break;
    case InstructionSigns.FINISH:
    case InstructionSigns.REACHED_VIA:
      IconSvg = TriangleFlag;
      break;
    case InstructionSigns.USE_ROUNDABOUT:
      IconSvg = ArrowTrCircle;
      break;
    default:
      if (!fallback) return null;
      IconSvg = fallback;
  }

  return <IconSvg className={className} width={width} height={height} />;
}
