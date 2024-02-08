import * as React from 'react';
import { useIntl } from 'react-intl';
import classnames from 'classnames';
import { getTextColor } from '../lib/colors';
import Icon from './primitives/Icon';
import ItineraryRow from './ItineraryRow';
import { ReactComponent as WarningTriangle } from 'iconoir/icons/warning-triangle.svg';
import ArrowChevron from '../lib/icons/icon-chevron.svg';

import './ItineraryHeader.css';

function alertSummary(alertBody) {
  return alertBody.slice(0, 40) + '...';
}

export default function ItineraryHeader({
  alerts,
  children,
  icon,
  iconColor,
  alertsExpanded,
  onIconClick,
  onAlertClick,
  expanded,
  displayArrow,
}) {
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
        <Icon className="ItineraryHeader_icon" onClick={onIconClick}>
          {icon}
        </Icon>
        {displayArrow && (
          <img
            src={ArrowChevron}
            className={
              expanded ? 'ItineraryHeader_arrow_90' : 'ItineraryHeader_arrow'
            }
          />
        )}
      </span>
      <h3 className="ItineraryHeader_header">{header}</h3>
      {subheading && <p className="ItineraryHeader_subheading">{subheading}</p>}
      {alerts?.length > 0 && (
        <ul className="ItineraryHeader_alerts" onClick={onAlertClick}>
          {alerts.map(([alertHeader, alertBody], idx) => (
            <li className="ItineraryHeader_alert" key={idx}>
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
                <span className="ItineraryHeader_alertBody">
                  {alertsExpanded ? alertBody : alertSummary(alertBody)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </ItineraryRow>
  );
}
