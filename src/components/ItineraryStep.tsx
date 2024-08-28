import classnames from 'classnames';
import Icon from './primitives/Icon';
import ItineraryRow from './ItineraryRow';

import './ItineraryStep.css';

export default function ItineraryStep({
  IconSVGComponent,
  iconSize,
  highMargin = false,
  rootRef,
  children,
}: {
  IconSVGComponent: React.FunctionComponent<
    React.ComponentProps<'svg'> & { title?: string }
  >;
  iconSize?: string | undefined;
  highMargin?: boolean | undefined;
  rootRef: React.Ref<HTMLElement> | undefined;
  children: React.ReactNode;
}) {
  const iconSizePx = iconSize === 'tiny' ? 12 : iconSize === 'small' ? 15 : 22;
  return (
    <div
      className={classnames({
        ItineraryStep: true,
      })}
    >
      <ItineraryRow rootRef={rootRef}>
        <span
          className={classnames({
            ItineraryStep_iconContainer: true,
          })}
        >
          <Icon
            className={classnames({
              ItineraryStep_icon: true,
              ItineraryStep_iconLarge: !iconSize || iconSize === 'large',
              ItineraryStep_iconSmall: iconSize === 'small',
              ItineraryStep_iconTiny: iconSize === 'tiny',
            })}
          >
            <IconSVGComponent
              className="ItineraryStep_iconSvg"
              width={iconSizePx}
              height={iconSizePx}
            />
          </Icon>
        </span>
        <div
          className={classnames({
            ItineraryStep_content: true,
            ItineraryStep_contentLowMargin: !highMargin,
            ItineraryStep_contentHighMargin: highMargin,
          })}
        >
          {children}
        </div>
      </ItineraryRow>
    </div>
  );
}
