import * as React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
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

let _warnedOfFallback = false;

export default function ItineraryBikeStep({
  step,
  isFirstStep,
  onClick,
  rootRef,
}) {
  const intl = useIntl();

  let IconComponent = QuestionMarkCircle;
  let msg;
  let fallbackToGraphHopperInstructionText = false;

  const street = step.street_name;
  const haveStreet = street ? 'name' : 'none';
  const strong = React.useCallback((txt) => <strong>{txt}</strong>, []);

  // TODO: Get better icons for u-turn, sharp left/right, slight left/right, etc.
  switch (step.sign) {
    case InstructionSigns.U_TURN_LEFT:
    case InstructionSigns.U_TURN_RIGHT:
    case InstructionSigns.U_TURN_UNKNOWN:
      IconComponent = MapsTurnBack;
      msg = (
        <FormattedMessage
          defaultMessage={
            'Make a <dir>U-turn</dir>' +
            '{haveStreet, select,' +
            '  name { on <name>{street}</name>}' +
            '  other {}' +
            '}'
          }
          description="instruction"
          values={{
            street,
            haveStreet,
            dir: strong,
            name: strong,
          }}
        />
      );
      break;
    case InstructionSigns.KEEP_LEFT:
      IconComponent = LongArrowUpLeft;
      msg = (
        <FormattedMessage
          defaultMessage={
            'Keep <dir>left</dir>' +
            '{haveStreet, select,' +
            '  name { on <name>{street}</name>}' +
            '  other {}' +
            '}'
          }
          description="instruction"
          values={{
            street,
            haveStreet,
            dir: strong,
            name: strong,
          }}
        />
      );
      break;
    case InstructionSigns.TURN_SHARP_LEFT:
      IconComponent = LongArrowUpLeft;
      msg = (
        <FormattedMessage
          defaultMessage={
            'Turn <dir>sharp left</dir>' +
            '{haveStreet, select,' +
            '  name { onto <name>{street}</name>}' +
            '  other {}' +
            '}'
          }
          description="instruction"
          values={{
            street,
            haveStreet,
            dir: strong,
            name: strong,
          }}
        />
      );
      break;
    case InstructionSigns.TURN_LEFT:
      IconComponent = LongArrowUpLeft;
      msg = (
        <FormattedMessage
          defaultMessage={
            'Turn <dir>left</dir>' +
            '{haveStreet, select,' +
            '  name { onto <name>{street}</name>}' +
            '  other {}' +
            '}'
          }
          description="instruction"
          values={{
            street,
            haveStreet,
            dir: strong,
            name: strong,
          }}
        />
      );
      break;
    case InstructionSigns.TURN_SLIGHT_LEFT:
      IconComponent = LongArrowUpLeft;
      msg = (
        <FormattedMessage
          defaultMessage={
            'Turn <dir>slight left</dir>' +
            '{haveStreet, select,' +
            '  name { onto <name>{street}</name>}' +
            '  other {}' +
            '}'
          }
          description="instruction"
          values={{
            street,
            haveStreet,
            dir: strong,
            name: strong,
          }}
        />
      );
      break;
    case InstructionSigns.CONTINUE_ON_STREET:
      IconComponent = ArrowUp;
      if (!isFirstStep || step.heading == null) {
        msg = (
          <FormattedMessage
            defaultMessage={
              'Continue' +
              '{haveStreet, select,' +
              '  name { on <name>{street}</name>}' +
              '  other {}' +
              '}'
            }
            description="instruction"
            values={{
              street,
              haveStreet,
              name: strong,
            }}
          />
        );
      } else {
        const direction = _describeCardinalDirection(step.heading, intl);
        msg = (
          <FormattedMessage
            defaultMessage={
              'Head <dir>{direction}</dir>' +
              '{haveStreet, select,' +
              '  name { on <name>{street}</name>}' +
              '  other {}' +
              '}'
            }
            description="instruction. direction is a cardinal direction like north"
            values={{
              direction,
              street,
              haveStreet,
              name: strong,
              dir: strong,
            }}
          />
        );
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
      msg = (
        <FormattedMessage
          defaultMessage={
            'Keep <dir>right</dir>' +
            '{haveStreet, select,' +
            '  name { on <name>{street}</name>}' +
            '  other {}' +
            '}'
          }
          description="instruction"
          values={{
            street,
            haveStreet,
            dir: strong,
            name: strong,
          }}
        />
      );
      break;
    case InstructionSigns.TURN_SHARP_RIGHT:
      IconComponent = LongArrowUpRight;
      msg = (
        <FormattedMessage
          defaultMessage={
            'Turn <dir>sharp right</dir>' +
            '{haveStreet, select,' +
            '  name { onto <name>{street}</name>}' +
            '  other {}' +
            '}'
          }
          description="instruction"
          values={{
            street,
            haveStreet,
            dir: strong,
            name: strong,
          }}
        />
      );
      break;
    case InstructionSigns.TURN_RIGHT:
      IconComponent = LongArrowUpRight;
      msg = (
        <FormattedMessage
          defaultMessage={
            'Turn <dir>right</dir>' +
            '{haveStreet, select,' +
            '  name { onto <name>{street}</name>}' +
            '  other {}' +
            '}'
          }
          description="instruction"
          values={{
            street,
            haveStreet,
            dir: strong,
            name: strong,
          }}
        />
      );
      break;
    case InstructionSigns.TURN_SLIGHT_RIGHT:
      IconComponent = LongArrowUpRight;
      msg = (
        <FormattedMessage
          defaultMessage={
            'Turn <dir>slight right</dir>' +
            '{haveStreet, select,' +
            '  name { onto <name>{street}</name>}' +
            '  other {}' +
            '}'
          }
          description="instruction"
          values={{
            street,
            haveStreet,
            dir: strong,
            name: strong,
          }}
        />
      );
      break;
    case InstructionSigns.USE_ROUNDABOUT:
      IconComponent = ArrowTrCircle;
      msg = (
        <FormattedMessage
          defaultMessage={
            'At roundabout, take exit {num}' +
            '{haveStreet, select,' +
            '  name { onto <name>{street}</name>}' +
            '  other {}' +
            '}'
          }
          description="instruction"
          values={{
            street,
            haveStreet,
            num: strong(step.exit_number),
            name: strong,
          }}
        />
      );
      break;
    default:
      // There are a couple rarely used sign types not covered above. If/when
      // we start seeing them in practice we can improve the display; for now,
      // display plain text out of GraphHopper in those cases.
      fallbackToGraphHopperInstructionText = true;
  }

  if (fallbackToGraphHopperInstructionText) {
    msg = step.text;
    if (process.env.NODE_ENV !== 'production' && !_warnedOfFallback) {
      console.error(
        `Falling back to GraphHopper instruction text. This will not be translated: ${step.text}`,
      );
      _warnedOfFallback = true;
    }
  }

  return (
    <ItineraryStep IconSVGComponent={IconComponent} rootRef={rootRef}>
      <BorderlessButton onClick={onClick}>{msg}</BorderlessButton>
    </ItineraryStep>
  );
}

function _describeCardinalDirection(heading, intl) {
  switch (_describeCardinalDirectionUntranslated(heading)) {
    case 'north':
      return intl.formatMessage({
        defaultMessage: 'north',
        description: 'cardinal direction, used in a sentence like "Head north"',
      });
    case 'northeast':
      return intl.formatMessage({
        defaultMessage: 'northeast',
        description:
          'cardinal direction, used in a sentence like "Head northeast"',
      });
    case 'east':
      return intl.formatMessage({
        defaultMessage: 'east',
        description: 'cardinal direction, used in a sentence like "Head east"',
      });
    case 'southeast':
      return intl.formatMessage({
        defaultMessage: 'southeast',
        description:
          'cardinal direction, used in a sentence like "Head southeast"',
      });
    case 'south':
      return intl.formatMessage({
        defaultMessage: 'south',
        description: 'cardinal direction, used in a sentence like "Head south"',
      });
    case 'southwest':
      return intl.formatMessage({
        defaultMessage: 'southwest',
        description:
          'cardinal direction, used in a sentence like "Head southwest"',
      });
    case 'west':
      return intl.formatMessage({
        defaultMessage: 'west',
        description: 'cardinal direction, used in a sentence like "Head west"',
      });
    default:
      return intl.formatMessage({
        defaultMessage: 'northwest',
        description:
          'cardinal direction, used in a sentence like "Head northwest"',
      });
  }
}

// Convert a heading in degrees (0-360) into a description like "northwest"
function _describeCardinalDirectionUntranslated(heading) {
  if (heading > 337.5 || heading <= 22.5) return 'north';
  else if (heading <= 67.5) return 'northeast';
  else if (heading <= 112.5) return 'east';
  else if (heading <= 157.5) return 'southeast';
  else if (heading <= 202.5) return 'south';
  else if (heading <= 247.5) return 'southwest';
  else if (heading <= 292.5) return 'west';
  else return 'northwest';
}
