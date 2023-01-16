import * as React from 'react';
import classnames from 'classnames';
import { TRANSIT_DATA_ACKNOWLEDGEMENT } from '../lib/region';
import { formatInterval } from '../lib/time';
import DepartArriveTime from './DepartArriveTime';
import Icon from './Icon';
import RouteLeg from './RouteLeg';
import SelectionList from './SelectionList';
import SelectionListItem from './SelectionListItem';

import { ReactComponent as NavArrowRight } from 'iconoir/icons/nav-arrow-right.svg';

import './RoutesOverview.css';

export default function RoutesOverview(props) {
  const { routes, activeRoute, outOfAreaStart, outOfAreaEnd, onRouteClick } =
    props;

  let outOfArea = [
    outOfAreaStart ? 'start point' : '',
    outOfAreaEnd ? 'end point' : '',
  ]
    .filter((s) => s !== '')
    .join(' and ');

  let containsTransitLeg = false;

  return (
    <div className="RoutesOverview">
      {outOfArea && (
        <div className="RoutesOverview_outOfAreaWarning">
          Transit options may be missing. Your {outOfArea} fall
          {outOfAreaStart && outOfAreaEnd ? '' : 's'} outside the area where
          BikeHopper has local transit data.
        </div>
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
            <DepartArriveTime
              className="RoutesOverview_departArriveTime"
              depart={route.legs[0].departure_time}
              arrive={route.legs[route.legs.length - 1].arrival_time}
            />
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

function isSignificantLeg(leg) {
  // For filtering out short, interpolated legs
  const THRESHOLD_IN_METERS = 120;
  return !(
    leg.type === 'bike2' &&
    leg.interpolated &&
    leg.distance < THRESHOLD_IN_METERS
  );
}
