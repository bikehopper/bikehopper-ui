import * as React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { routeClicked } from '../features/routes';
import { formatInterval } from '../lib/time';
import DepartArriveTime from './DepartArriveTime';
import Icon from './Icon';
import RouteLeg from './RouteLeg';
import SelectionList from './SelectionList';
import SelectionListItem from './SelectionListItem';

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
    <SelectionList>
      {routes.map((route, index) => (
        <SelectionListItem
          className="RoutesOverview_route"
          active={activeRoute === index}
          onClick={handleRouteClick.bind(null, index)}
          key={route.nonce}
        >
          <div className="RoutesOverview_row">
            <ul className="RoutesOverview_routeLegs">
              {route.legs.map((leg, index) => (
                <React.Fragment key={route.nonce + ':' + index}>
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
                </React.Fragment>
              ))}
            </ul>
            <p className="RoutesOverview_timeEstimate">
              {formatInterval(route.time)}
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
  );
}
