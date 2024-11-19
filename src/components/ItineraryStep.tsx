import classnames from 'classnames';
import Icon from './primitives/Icon';
import ItineraryRow from './ItineraryRow';
import type { ScrollToRef } from '../hooks/useScrollToRef';

import './ItineraryStep.css';

export default function ItineraryStep({
  IconSVGComponent,
  iconSize,
  rootRef,
  children,
}: {
  IconSVGComponent: React.FunctionComponent<
    React.ComponentProps<'svg'> & { title?: string }
  >;
  iconSize?: string | undefined;
  rootRef?: ScrollToRef<HTMLDivElement> | undefined;
  children: React.ReactNode;
}) {
  const iconSizePx = iconSize === 'tiny' ? 12 : iconSize === 'small' ? 15 : 22;
  return (
    <div className="ItineraryStep">
      <ItineraryRow rootRef={rootRef}>
        <span className="ItineraryStep_iconContainer">
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
        <div className="ItineraryStep_content">{children}</div>
      </ItineraryRow>
    </div>
  );
}
