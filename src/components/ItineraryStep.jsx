import * as React from 'react';
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
        <p
          className={classnames({
            ItineraryStep_content: true,
            ItineraryStep_contentLowMargin: !highMargin,
            ItineraryStep_contentHighMargin: highMargin,
          })}
        >
          {children}
        </p>
      </ItineraryRow>
    </div>
  );
}
