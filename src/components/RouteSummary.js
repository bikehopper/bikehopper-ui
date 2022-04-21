import * as React from 'react';
import { formatInterval } from '../lib/time';
import DepartArriveTime from './DepartArriveTime';
import Icon from './Icon';
import RouteLeg from './RouteLeg';

import { ReactComponent as NavArrowRight } from 'iconoir/icons/nav-arrow-right.svg';
import './RouteSummary.css';

export default function RouteSummary({ route }) {
  return (
    <React.Fragment>
      <div className="RouteSummary_topRow">
        <ul className="RouteSummary_legs">
          {route.legs.map((leg, index) => (
            <React.Fragment key={route.nonce + ':' + index}>
              {index > 0 && (
                <li className="RouteSummary_legSeparator">
                  <Icon>
                    <NavArrowRight />
                  </Icon>
                </li>
              )}
              <li className="RouteSummary_leg">
                <RouteLeg
                  type={leg.type}
                  routeName={leg.route_name}
                  routeColor={leg.route_color}
                  agencyName={leg.agency_name}
                  duration={
                    /* hide duration if route has only one leg */
                    route.legs.length > 1 &&
                    new Date(leg.arrival_time) - new Date(leg.departure_time)
                  }
                />
              </li>
            </React.Fragment>
          ))}
        </ul>
        <p className="RouteSummary_timeEstimate">
          {formatInterval(route.time)}
        </p>
      </div>
      <DepartArriveTime
        className="RouteSummary_departArriveTime"
        depart={route.legs[0].departure_time}
        arrive={route.legs[route.legs.length - 1].arrival_time}
      />
    </React.Fragment>
  );
}
