import * as React from 'react';
import { useIntl } from 'react-intl';
import classnames from 'classnames';
import { getTextColor } from '../lib/colors';
import Icon from './primitives/Icon';
import ItineraryRow from './ItineraryRow';
import WarningTriangle from 'iconoir/icons/warning-triangle.svg?react';
import NavDownArrow from 'iconoir/icons/nav-arrow-down.svg?react';
import NavUpArrow from 'iconoir/icons/nav-arrow-up.svg?react';

import './ItineraryHeader.css';
import BorderlessButton from './BorderlessButton';

const ALERT_SUMMARY_LENGTH = 50;

function alertSummary(alertBody) {
  return alertBody.slice(0, ALERT_SUMMARY_LENGTH) + '...';
}

export default function ItineraryHeader({
  alerts,
  children,
  icon,
  iconColor,
  iconLabel = '',
  expanded,
  onToggleLegExpand,
  alertsExpanded,
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
      <BorderlessButton onClick={onToggleLegExpand}>
        <span
          className={classnames({
            ItineraryHeader_iconContainer: true,
            ItineraryHeader_iconContainer__isWhite: iconIsWhite,
          })}
          style={{ backgroundColor: iconColor }}
        >
          <Icon className="ItineraryHeader_icon" label={iconLabel}>
            {icon}
          </Icon>
        </span>
      </BorderlessButton>
      <span className="ItineraryHeader_headerRow">
        {onToggleLegExpand ? (
          <BorderlessButton onClick={onToggleLegExpand} flex={true}>
            <Icon
              className="ItineraryHeader_arrow"
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
          </BorderlessButton>
        ) : (
          <span className="ItineraryHeader_arrowSpacer" />
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
                <>
                  <span className="ItineraryHeader_alertHeader">
                    {alertHeader}
                  </span>
                  <div />
                </>
              )}
              {alertBody && (
                <span className="ItineraryHeader_alertBody">
                  {alertsExpanded || alertBody.length <= ALERT_SUMMARY_LENGTH
                    ? alertBody
                    : alertSummary(alertBody)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </ItineraryRow>
  );
}
