import * as React from 'react';
import classnames from 'classnames';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { routeClicked } from '../features/routes';

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
              {route.legs.map((leg) => (
                <li className="RoutesOverview_leg">
                  {leg.type === 'pt' ? leg.route_name : 'Bike'}
                </li>
              ))}
            </ul>
            <p className="RoutesOverview_timeEstimate">
              {Math.round(route.time / 1000 / 60) + ' min'}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
