import * as React from 'react';
import BorderlessButton from './BorderlessButton';
import InstructionSigns from '../lib/InstructionSigns';
import ItineraryStep from './ItineraryStep';

import { ReactComponent as MapsTurnBack } from 'iconoir/icons/maps-turn-back.svg';
import { ReactComponent as LongArrowUpLeft } from 'iconoir/icons/long-arrow-up-left.svg';
import { ReactComponent as LongArrowUpRight } from 'iconoir/icons/long-arrow-up-right.svg';
import { ReactComponent as ArrowUp } from 'iconoir/icons/arrow-up.svg';
import { ReactComponent as TriangleFlag } from 'iconoir/icons/triangle-flag.svg';
import { ReactComponent as QuestionMarkCircle } from 'iconoir/icons/help-circle.svg';
import { ReactComponent as ArrowTrCircle } from 'iconoir/icons/arrow-tr-circle.svg';

export default function ItineraryBikeStep({
  step,
  isFirstStep,
  onClick,
  rootRef,
}) {
  let IconComponent = QuestionMarkCircle;
  let verb = 'Proceed';
  let preposition = 'on';
  let direction = null;
  let fallbackToGraphHopperInstructionText = false;

  // TODO: Get better icons for u-turn, sharp left/right, slight left/right, etc.
  switch (step.sign) {
    case InstructionSigns.U_TURN_LEFT:
    case InstructionSigns.U_TURN_RIGHT:
    case InstructionSigns.U_TURN_UNKNOWN:
      IconComponent = MapsTurnBack;
      verb = 'Make a';
      direction = 'U-turn';
      break;
    case InstructionSigns.KEEP_LEFT:
      IconComponent = LongArrowUpLeft;
      verb = 'Keep';
      direction = 'left';
      break;
    case InstructionSigns.TURN_SHARP_LEFT:
      IconComponent = LongArrowUpLeft;
      verb = 'Turn';
      direction = 'sharp left';
      preposition = 'onto';
      break;
    case InstructionSigns.TURN_LEFT:
      IconComponent = LongArrowUpLeft;
      verb = 'Turn';
      direction = 'left';
      preposition = 'onto';
      break;
    case InstructionSigns.TURN_SLIGHT_LEFT:
      IconComponent = LongArrowUpLeft;
      verb = 'Turn';
      direction = 'slight left';
      preposition = 'onto';
      break;
    case InstructionSigns.CONTINUE_ON_STREET:
      IconComponent = ArrowUp;
      if (!isFirstStep) {
        verb = 'Continue';
        if (step.heading != null) {
          direction = describeCardinalDirection(step.heading);
        }
      } else if (step.heading != null) {
        verb = 'Head';
        direction = describeCardinalDirection(step.heading);
      }
      break;
    case InstructionSigns.FINISH:
    case InstructionSigns.REACHED_VIA:
      IconComponent = TriangleFlag;
      // Not seeing this one in practice (except for the arrival step we
      // filter) so not sure what to do with it.
      fallbackToGraphHopperInstructionText = true;
      break;
    case InstructionSigns.KEEP_RIGHT:
      IconComponent = LongArrowUpRight;
      verb = 'Keep';
      direction = 'right';
      break;
    case InstructionSigns.TURN_SHARP_RIGHT:
      IconComponent = LongArrowUpRight;
      verb = 'Turn';
      direction = 'sharp right';
      preposition = 'onto';
      break;
    case InstructionSigns.TURN_RIGHT:
      IconComponent = LongArrowUpRight;
      verb = 'Turn';
      direction = 'right';
      preposition = 'onto';
      break;
    case InstructionSigns.TURN_SLIGHT_RIGHT:
      IconComponent = LongArrowUpRight;
      verb = 'Turn';
      direction = 'slight right';
      preposition = 'onto';
      break;
    case InstructionSigns.USE_ROUNDABOUT:
      IconComponent = ArrowTrCircle;
      verb = 'At roundabout, take';
      direction = `exit ${step.exit_number}`;
      preposition = 'onto';
      break;
    default:
      // There are a couple rarely used sign types not covered above. If/when
      // we start seeing them in practice we can improve the display; for now,
      // display plain text out of GraphHopper in those cases.
      fallbackToGraphHopperInstructionText = true;
  }

  // Street name may be null. TODO: Describe (as "path", "service road",
  // "unnamed road") if street name is absent
  const streetName = step.street_name;

  let contents;
  if (fallbackToGraphHopperInstructionText) {
    contents = step.text;
  } else {
    contents = [
      verb,
      direction && [' ', <strong key="direction">{direction}</strong>],
      streetName && [
        ` ${preposition} `,
        <strong key="street">{streetName}</strong>,
      ],
    ].flat();
  }

  return (
    <ItineraryStep IconSVGComponent={IconComponent} rootRef={rootRef}>
      <BorderlessButton onClick={onClick}>{contents}</BorderlessButton>
    </ItineraryStep>
  );
}

// Convert a heading in degrees (0-360) into a description like "northwest"
function describeCardinalDirection(heading) {
  if (heading > 337.5 || heading <= 22.5) return 'north';
  else if (heading <= 67.5) return 'northeast';
  else if (heading <= 112.5) return 'east';
  else if (heading <= 157.5) return 'southeast';
  else if (heading <= 202.5) return 'south';
  else if (heading <= 247.5) return 'southwest';
  else if (heading <= 292.5) return 'west';
  else return 'northwest';
}
