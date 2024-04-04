import * as React from 'react';
import classnames from 'classnames';
import Icon from './primitives/Icon';
import ItineraryRow from './ItineraryRow';

import './ItineraryStep.css';

export default function ItineraryStep({
  IconSVGComponent,
  smallIcon,
  rootRef,
  children,
}) {
  const iconSize = smallIcon ? 15 : 22;
  return (
    <ItineraryRow rootRef={rootRef}>
      <span
        className={classnames({
          ItineraryStep_iconContainer: true,
        })}
      >
        <Icon
          className={classnames({
            ItineraryStep_icon: true,
            ItineraryStep_iconLarge: !smallIcon,
            ItineraryStep_iconSmall: smallIcon,
          })}
        >
          <IconSVGComponent
            className="ItineraryStep_iconSvg"
            width={iconSize}
            height={iconSize}
          />
        </Icon>
      </span>
      <p className="ItineraryStep_content">{children}</p>
    </ItineraryRow>
  );
}
