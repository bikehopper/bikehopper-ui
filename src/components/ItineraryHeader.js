import * as React from 'react';
import { useIntl } from 'react-intl';
import classnames from 'classnames';
import { getTextColor } from '../lib/colors';
import Icon from './Icon';
import ItineraryRow from './ItineraryRow';
import { ReactComponent as WarningTriangle } from 'iconoir/icons/warning-triangle.svg';

import './ItineraryHeader.css';

export default function ItineraryHeader({ alerts, children, icon, iconColor }) {
  const intl = useIntl();
  const iconIsWhite = getTextColor(iconColor).main === 'white';

  let header, subheading;
  if (Array.isArray(children)) {
    header = children[0];
    subheading = children.slice(1);
  } else header = children;

  return (
    <ItineraryRow>
      <span
        className={classnames({
          ItineraryHeader_iconContainer: true,
          ItineraryHeader_iconContainer__isWhite: iconIsWhite,
        })}
        style={{ backgroundColor: iconColor }}
      >
        <Icon className="ItineraryHeader_icon">{icon}</Icon>
      </span>
      <h3 className="ItineraryHeader_header">{header}</h3>
      {subheading && <p className="ItineraryHeader_subheading">{subheading}</p>}
      {alerts?.length > 0 && (
        <ul className="ItineraryHeader_alerts">
          {alerts.map((alert) => (
            /* TODO: Select the alert translation based on locale, instead of always
             * using the first one.
             *
             * Unfortunately, for the Bay Area, no agency seems to actually translate
             * its alerts so it has no impact which is why I've (Scott, April 2023)
             * de-prioritized doing this.
             */
            <li className="ItineraryHeader_alert">
              <Icon
                className="ItineraryHeader_alertIcon"
                label={intl.formatMessage({
                  defaultMessage: 'Alert',
                  description:
                    'labels a transit trip as having a service alert apply to it.',
                })}
              >
                <WarningTriangle />
              </Icon>
              <span className="ItineraryHeader_alertHeader">
                {alert.header_text?.translation[0]?.text}
              </span>
              <span className="ItineraryHeader_alertBody">
                {alert.description_text?.translation[0]?.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ItineraryRow>
  );
}
