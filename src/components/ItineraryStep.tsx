import classnames from 'classnames';
import Icon from './primitives/Icon';
import ItineraryRow from './ItineraryRow';
import type { ScrollToRef } from '../hooks/useScrollToRef';

import './ItineraryStep.css';

export default function ItineraryStep({
  hideLine,
  IconSVGComponent,
  iconSize,
  rootRef,
  children,
}: {
  hideLine?: boolean;
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
      <ItineraryRow rootRef={rootRef} hideLine={hideLine}>
        <span className="justify-center flex w-full">
          <Icon
            className={classnames({
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
