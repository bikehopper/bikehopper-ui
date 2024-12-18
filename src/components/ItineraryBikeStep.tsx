import { useCallback } from 'react';
import type { ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import type { IntlShape } from 'react-intl';
import classnames from 'classnames';

import BorderlessButton from './BorderlessButton';
import { STEP_ANNOTATIONS, describeStepAnnotation } from '../lib/geometry';
import type { StepAnnotation } from '../lib/geometry';
import InstructionIcon from './InstructionIcon';
import InstructionSigns from '../lib/InstructionSigns';
import ItineraryStep from './ItineraryStep';
import type { RouteInstruction } from '../lib/BikeHopperClient';
import type { ScrollToRef } from '../hooks/useScrollToRef';

import './ItineraryBikeStep.css';

let _warnedOfFallback = false;
const spacerWithMiddot = ' \u00B7 ';

export default function ItineraryBikeStep({
  step,
  distance,
  hideLine,
  infra,
  isFirstStep,
  onClick,
  rootRef,
}: {
  step: RouteInstruction;
  distance: string;
  hideLine?: boolean;
  infra: StepAnnotation[];
  isFirstStep: boolean;
  onClick: React.MouseEventHandler;
  rootRef?: ScrollToRef<HTMLDivElement> | undefined;
}) {
  const intl = useIntl();

  let msg;
  let fallbackToGraphHopperInstructionText = false;

  const street = step.street_name;
  const haveStreet = street ? 'name' : 'none';
  const strong = useCallback((txt: ReactNode) => <strong>{txt}</strong>, []);

  // TODO: Get better icons for u-turn, sharp left/right, slight left/right, etc.
  switch (step.sign) {
    case InstructionSigns.U_TURN_LEFT:
    case InstructionSigns.U_TURN_RIGHT:
    case InstructionSigns.U_TURN_UNKNOWN:
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
      // Not seeing this one in practice (except for the arrival step we
      // filter) so not sure what to do with it.
      fallbackToGraphHopperInstructionText = true;
      break;
    case InstructionSigns.KEEP_RIGHT:
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
    if (import.meta.env.DEV && !_warnedOfFallback) {
      console.error(
        `Falling back to GraphHopper instruction text. This will not be translated: ${step.text}`,
      );
      _warnedOfFallback = true;
    }
  }

  // Hack: ItineraryStep expects icon to be a component, not a component
  // instance, so we have to make a component that will have the instruction
  // sign built in.
  const IconComponent = (
    props: Omit<Parameters<typeof InstructionIcon>[0], 'sign'>,
  ) => <InstructionIcon sign={step.sign} {...props} />;

  return (
    <ItineraryStep
      IconSVGComponent={IconComponent}
      rootRef={rootRef}
      hideLine={hideLine}
    >
      <div
        className={classnames({
          ItineraryBikeStep_content: true,
        })}
      >
        <BorderlessButton onClick={onClick}>
          {msg}
          {spacerWithMiddot}
          {distance}
          <div
            className={classnames({
              ItineraryBikeStep_infra: true,
            })}
          >
            {infra.map((anno, idx) => (
              <span
                key={idx}
                className={classnames({
                  'mt-1 mr-1 rounded-md px-1 py-0.5 inline-block': true,
                  'font-medium text-white text-xs': true,
                  'bg-red-700': anno === STEP_ANNOTATIONS.mainRoad,
                  'bg-gray-500':
                    anno === STEP_ANNOTATIONS.steepHill ||
                    anno === STEP_ANNOTATIONS.verySteepHill,
                  'bg-bikeinfragreen': !(
                    anno === STEP_ANNOTATIONS.mainRoad ||
                    anno === STEP_ANNOTATIONS.steepHill ||
                    anno === STEP_ANNOTATIONS.verySteepHill
                  ),
                })}
              >
                {describeStepAnnotation(anno, intl)}
              </span>
            ))}
          </div>
        </BorderlessButton>
      </div>
    </ItineraryStep>
  );
}

function _describeCardinalDirection(heading: number, intl: IntlShape) {
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
function _describeCardinalDirectionUntranslated(heading: number) {
  if (heading > 337.5 || heading <= 22.5) return 'north';
  else if (heading <= 67.5) return 'northeast';
  else if (heading <= 112.5) return 'east';
  else if (heading <= 157.5) return 'southeast';
  else if (heading <= 202.5) return 'south';
  else if (heading <= 247.5) return 'southwest';
  else if (heading <= 292.5) return 'west';
  else return 'northwest';
}
