import * as React from 'react';
import { useIntl } from 'react-intl';
import classnames from 'classnames';
import { getTextColor } from '../lib/colors';
import Icon from './primitives/Icon';
import ItineraryRow from './ItineraryRow';
import WarningTriangle from 'iconoir/icons/warning-triangle.svg?react';
import NavDownArrow from 'iconoir/icons/nav-arrow-down.svg?react';
import NavUpArrow from 'iconoir/icons/nav-arrow-up.svg?react';
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
  displayArrow = true,
  expanded,
  alertsExpanded,
  onToggleLegExpand,
  onAlertClick,
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
        onClick={onToggleLegExpand}
      >
        <Icon className="ItineraryHeader_icon">{icon}</Icon>
      </span>
      <span className="ItineraryHeader_headerRow">
        {displayArrow && (
          <div onClick={onToggleLegExpand}>
            <Icon
              label={intl.formatMessage({
                defaultMessage: 'Toggle expanded',
                description: 'button to toggle if the leg steps are expanded',
              })}
            >
              {expanded ? (
                <NavUpArrow className="stroke-[3px]" />
              ) : (
                <NavDownArrow className="stroke-[3px]" />
              )}
            </Icon>
          </div>
        )}
        <div>
          <h3 className="ItineraryHeader_header">{header}</h3>
          {subheading && (
            <p className="ItineraryHeader_subheading">{subheading}</p>
          )}
        </div>
      </span>
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
