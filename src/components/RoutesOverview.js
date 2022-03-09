import * as React from 'react';
import classnames from 'classnames';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { routeClicked } from '../features/routes';
import { formatInterval } from '../lib/time';
import Icon from './Icon';
import RouteLeg from './RouteLeg';

import { ReactComponent as NavArrowRight } from 'iconoir/icons/nav-arrow-right.svg';

import './RoutesOverview.css';

export default function RoutesOverview(props) {
  const dispatch = useDispatch();
  const { routes, activeRoute } = useSelector(
    (state) => ({
      routes: state.routes.routes,
      activeRoute: state.routes.activeRoute,
    }),
    shallowEqual,
  );

  const handleRouteClick = (index) => {
    dispatch(routeClicked(index));
  };

  return (
    <div className="RoutesOverview">
      <ul className="RoutesOverview_list">
        {routes.map((route, index) => (
          <li
            className={classnames({
              RoutesOverview_route: true,
              RoutesOverview_routeSelected: activeRoute === index,
            })}
            onClick={handleRouteClick.bind(null, index)}
          >
            <ul className="RoutesOverview_routeLegs">
              {route.legs.map((leg, index) => (
                <>
                  {index > 0 && (
                    <li className="RoutesOverview_legSeparator">
                      <Icon>
                        <NavArrowRight />
                      </Icon>
                    </li>
                  )}
                  <li className="RoutesOverview_leg">
                    <RouteLeg
                      type={leg.type}
                      routeName={leg.route_name}
                      routeColor={leg.route_color}
                      agencyName={leg.agency_name}
                      duration={
                        /* hide duration if route has only one leg */
                        route.legs.length > 1 &&
                        new Date(leg.arrival_time) -
                          new Date(leg.departure_time)
                      }
                    />
                  </li>
                </>
              ))}
            </ul>
            <p className="RoutesOverview_timeEstimate">
              {formatInterval(route.time)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
