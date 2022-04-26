import * as React from 'react';
import classnames from 'classnames';
import Icon from './Icon';
import ItineraryRow from './ItineraryRow';

import './ItineraryStep.css';

export default function ItineraryStep(props) {
  const { IconSVGComponent, smallIcon } = props;
  const iconSize = smallIcon ? 15 : 30;
  return (
    <ItineraryRow>
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
          <IconSVGComponent width={iconSize} height={iconSize} />
        </Icon>
      </span>
      <p className="ItineraryStep_content">{props.children}</p>
    </ItineraryRow>
  );
}
