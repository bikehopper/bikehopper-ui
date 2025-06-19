import Bowser from 'bowser';
import { Fragment, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import type { IntlShape } from 'react-intl';
import { useDispatch } from 'react-redux';
import classnames from 'classnames';
import { shareRoutes } from '../features/misc';
import type {
  BikeLeg,
  RouteResponsePath,
  TransitLeg,
} from '../lib/BikeHopperClient';
import formatDistance from '../lib/formatDistance';
import { getTransitDataAcknowledgement } from '../lib/region';
import { formatInterval } from '../lib/time';
import BorderlessButton from './BorderlessButton';
import Icon from './primitives/Icon';
import RouteLeg from './RouteLeg';
import SelectionList from './SelectionList';
import SelectionListItem from './SelectionListItem';
import type { Dispatch } from '../store';

import ArrowDown from 'iconoir/icons/arrow-down.svg?react';
import ArrowUp from 'iconoir/icons/arrow-up.svg?react';
import NavArrowRight from 'iconoir/icons/nav-arrow-right.svg?react';
import ListIcon from 'iconoir/icons/list.svg?react';
import ShareAndroidIcon from 'iconoir/icons/share-android.svg?react';
import ShareIosIcon from 'iconoir/icons/share-ios.svg?react';

export default function RoutesOverview({
  routes,
  activeRoute,
  outOfAreaStart,
  outOfAreaEnd,
  onRouteClick,
}: {
  routes: RouteResponsePath[];
  activeRoute: number;
  outOfAreaStart: boolean;
  outOfAreaEnd: boolean;
  onRouteClick: (routeIndex: number, evt: React.MouseEvent) => void;
}) {
  const intl = useIntl();
  const dispatch: Dispatch = useDispatch();
  const SPACE = ' ';
  const os = useMemo(() => Bowser.parse(navigator.userAgent).os.name, []);

  const shareText = intl.formatMessage({
    defaultMessage: 'Share',
    description:
      'Button. When clicked, lets you share a set of directions, ' +
      'such as by copying a URL to the clipboard.',
  });

  let containsTransitLeg = false;

  const outOfAreaMsg = _outOfAreaMsg(intl, outOfAreaStart, outOfAreaEnd);
  const transitDataAck = getTransitDataAcknowledgement();

  const handleShareClick = (evt: React.MouseEvent) => {
    dispatch(shareRoutes(intl));
  };

  return (
    <div className="flex flex-col">
      {outOfAreaMsg && <div className="border-gray-300">{outOfAreaMsg}</div>}
      <SelectionList className="rounded-t-large">
        {routes.map((route, index) => (
          <SelectionListItem
            active={activeRoute === index}
            onClick={onRouteClick.bind(null, index)}
            key={route.nonce}
            className={classnames({
              'rounded-t-large': index === 0,
            })}
          >
            <div className="flex flex-row justify-between">
              <ul className="pl-0 flex flex-row flex-wrap">
                {route.legs.filter(_isSignificantLeg).map((leg, index) => (
                  <Fragment key={route.nonce + ':' + index}>
                    {index > 0 && (
                      <li className="inline-block mr-1 mb-3 self-center">
                        <Icon>
                          <NavArrowRight />
                        </Icon>
                      </li>
                    )}
                    <li className="inline-block mr-1">
                      {
                        (leg.type === 'pt' ? (containsTransitLeg = true) : null,
                        null)
                      }
                      {leg.type === 'pt' ? (
                        <RouteLeg
                          type={leg.type}
                          routeName={leg.route_name || leg.route_id}
                          routeColor={leg.route_color}
                          routeType={leg.route_type}
                          duration={
                            leg.arrival_time.getTime() -
                            leg.departure_time.getTime()
                          }
                          hasAlerts={Boolean(
                            leg.alerts && leg.alerts.length > 0,
                          )}
                        />
                      ) : (
                        <RouteLeg
                          type={leg.type}
                          duration={
                            /* hide duration if route has only one leg */
                            route.legs.length > 1
                              ? leg.arrival_time.getTime() -
                                leg.departure_time.getTime()
                              : null
                          }
                          hasAlerts={leg.type === 'bike2' && leg.has_steps}
                        />
                      )}
                    </li>
                  </Fragment>
                ))}
              </ul>
              <p className="m-0 content-center text-nowrap text-base">
                {formatInterval(
                  route.legs[route.legs.length - 1].arrival_time.getTime() -
                    route.legs[0].departure_time.getTime(),
                )}
              </p>
            </div>
            <p
              className={classnames({
                'mt-2 flex flex-row text-sm': true,
              })}
            >
              {activeRoute === index && (
                <Icon className="relative top-0.5 pr-0.5">
                  <ListIcon height="16" width="16" />
                </Icon>
              )}
              <FormattedMessage
                defaultMessage="{depart}–{arrive}"
                description="compact departure and arrival time"
                values={{
                  depart: intl.formatTime(route.legs[0].departure_time, {
                    timeZone: 'America/Los_Angeles',
                    hour: 'numeric',
                    minute: 'numeric',
                  }),
                  arrive: intl.formatTime(
                    route.legs[route.legs.length - 1].arrival_time,
                    {
                      timeZone: 'America/Los_Angeles',
                      hour: 'numeric',
                      minute: 'numeric',
                    },
                  ),
                }}
              />
              {route.ascend != null &&
                route.descend != null &&
                Math.min(route.ascend, route.descend) > 10 && (
                  <span className="ml-3 flex flex-row">
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
      <footer className="text-sm mx-6 my-4 flex flex-row">
        <BorderlessButton
          title={shareText}
          className="mr-3"
          onClick={handleShareClick}
        >
          <Icon label={shareText}>
            {os === 'iOS' ? <ShareIosIcon /> : <ShareAndroidIcon />}
          </Icon>
        </BorderlessButton>
        {containsTransitLeg && transitDataAck?.text && (
          <a
            target="_blank"
            href={transitDataAck.url}
            className="underline ml-auto text-sky-700 active:text-sky-600"
          >
            {transitDataAck.text}
          </a>
        )}
      </footer>
    </div>
  );
}

function _outOfAreaMsg(intl: IntlShape, start: boolean, end: boolean) {
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

function _isSignificantLeg(leg: BikeLeg | TransitLeg): boolean {
  // For filtering out short, interpolated legs
  const THRESHOLD_IN_METERS = 120;
  return !(
    leg.type === 'bike2' &&
    leg.interpolated &&
    leg.distance < THRESHOLD_IN_METERS
  );
}
