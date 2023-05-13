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
          {alerts.map(([alertHeader, alertBody]) => (
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
              {alertHeader && (
                <span className="ItineraryHeader_alertHeader">
                  {alertHeader}
                </span>
              )}
              {alertBody && (
                <span className="ItineraryHeader_alertBody">{alertBody}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </ItineraryRow>
  );
}
