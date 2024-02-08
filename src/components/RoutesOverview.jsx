import * as React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import classnames from 'classnames';
import formatDistance from '../lib/formatDistance';
import { TRANSIT_DATA_ACKNOWLEDGEMENT } from '../lib/region';
import { formatInterval } from '../lib/time';
import Icon from './primitives/Icon';
import RouteLeg from './RouteLeg';
import SelectionList from './SelectionList';
import SelectionListItem from './SelectionListItem';

import { ReactComponent as ArrowDown } from 'iconoir/icons/arrow-down.svg';
import { ReactComponent as ArrowUp } from 'iconoir/icons/arrow-up.svg';
import { ReactComponent as NavArrowRight } from 'iconoir/icons/nav-arrow-right.svg';

import './RoutesOverview.css';

export default function RoutesOverview({
  routes,
  activeRoute,
  outOfAreaStart,
  outOfAreaEnd,
  onRouteClick,
}) {
  const intl = useIntl();
  const SPACE = ' ';

  let containsTransitLeg = false;

  const outOfAreaMsg = _outOfAreaMsg(intl, outOfAreaStart, outOfAreaEnd);

  return (
    <div className="RoutesOverview">
      {outOfAreaMsg && (
        <div className="RoutesOverview_outOfAreaWarning">{outOfAreaMsg}</div>
      )}
      <SelectionList className="RoutesOverview_list">
        {routes.map((route, index) => (
          <SelectionListItem
            active={activeRoute === index}
            onClick={onRouteClick.bind(null, index)}
            key={route.nonce}
            className={classnames({
              RoutesOverview_firstItem: index === 0,
            })}
          >
            <div className="RoutesOverview_row">
              <ul className="RoutesOverview_routeLegs">
                {route.legs.filter(isSignificantLeg).map((leg, index) => (
                  <React.Fragment key={route.nonce + ':' + index}>
                    {index > 0 && (
                      <li className="RoutesOverview_legSeparator">
                        <Icon>
                          <NavArrowRight />
                        </Icon>
                      </li>
                    )}
                    <li className="RoutesOverview_leg">
                      {
                        (leg.type === 'pt' ? (containsTransitLeg = true) : null,
                        null)
                      }
                      <RouteLeg
                        type={leg.type}
                        routeName={leg.route_name || leg.route_id}
                        routeColor={leg.route_color}
                        routeType={leg.route_type}
                        agencyName={leg.agency_name}
                        duration={
                          /* hide duration if route has only one leg */
                          route.legs.length > 1 &&
                          new Date(leg.arrival_time) -
                            new Date(leg.departure_time)
                        }
                        hasAlerts={
                          leg.alerts?.length > 0 ||
                          (leg.type === 'bike2' && leg.has_steps)
                        }
                      />
                    </li>
                  </React.Fragment>
                ))}
              </ul>
              <p className="RoutesOverview_timeEstimate">
                {formatInterval(
                  new Date(route.legs[route.legs.length - 1].arrival_time) -
                    new Date(route.legs[0].departure_time),
                )}
              </p>
            </div>
            <p className="RoutesOverview_departArriveTime">
              <FormattedMessage
                defaultMessage="{depart}–{arrive}"
                description="compact departure and arrival time"
                values={{
                  depart: intl.formatTime(route.legs[0].departure_time, {
                    hour: 'numeric',
                    minute: 'numeric',
                  }),
                  arrive: intl.formatTime(
                    route.legs[route.legs.length - 1].arrival_time,
                    { hour: 'numeric', minute: 'numeric' },
                  ),
                }}
              />
              {route.ascend != null &&
                route.descend != null &&
                Math.min(route.ascend, route.descend) > 10 && (
                  <span className="ml-3">
                    <Icon
                      label={
                        intl.formatMessage({
                          defaultMessage: 'Elevation gain',
                          description:
                            'Accessible alt text for an up-arrow icon that ' +
                            'appears next to a measurement of the elevation gain on a ' +
                            'route, such as (in English) 200 ft or 50 m.',
                        }) + SPACE
                      }
                      className="relative top-0.5"
                    >
                      <ArrowUp
                        width="16"
                        height="16"
                        className="stroke-2 text-gray-600"
                      />
                    </Icon>
                    {formatDistance(route.ascend, intl, { forceFeet: true })}
                    <Icon
                      label={
                        intl.formatMessage({
                          defaultMessage: 'Elevation loss',
                          description:
                            'Accessible alt text for a down-arrow icon that ' +
                            'appears next to a measurement of the elevation loss on a ' +
                            'route, such as (in English) 200 ft or 50 m.',
                        }) + SPACE
                      }
                      className="relative top-0.5 ml-1"
                    >
                      <ArrowDown
                        width="16"
                        height="16"
                        className="stroke-2 text-gray-600"
                      />
                    </Icon>
                    {formatDistance(route.descend, intl, { forceFeet: true })}
                  </span>
                )}
            </p>
          </SelectionListItem>
        ))}
      </SelectionList>
      {containsTransitLeg && TRANSIT_DATA_ACKNOWLEDGEMENT?.text && (
        <p className="RoutesOverview_acknowledgement">
          <a
            target="_blank"
            href={TRANSIT_DATA_ACKNOWLEDGEMENT.url}
            className="RoutesOverview_acknowledgementLink"
          >
            {TRANSIT_DATA_ACKNOWLEDGEMENT.text}
          </a>
        </p>
      )}
    </div>
  );
}

export function isSignificantLeg(leg) {
  // For filtering out short, interpolated legs
  const THRESHOLD_IN_METERS = 120;
  return !(
    leg.type === 'bike2' &&
    leg.interpolated &&
    leg.distance < THRESHOLD_IN_METERS
  );
}

function _outOfAreaMsg(intl, start, end) {
  const which = start ? (end ? 'both' : 'start') : end ? 'end' : 'neither';
  if (which === 'neither') return null;

  return intl.formatMessage(
    {
      defaultMessage:
        'Transit options may be missing. Your {which, select,' +
        '  start {starting point falls}' +
        '  end {destination falls}' +
        '  other {starting point and destination fall}' +
        '} outside the area where BikeHopper has local transit data.',
      description: 'warning shown above routes',
    },
    { which },
  );
}
