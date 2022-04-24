import * as React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import {
  routeClicked,
  itineraryBackClicked,
  itineraryStepClicked,
  itineraryStepBackClicked,
} from '../features/routes';
import describePlace from '../lib/describePlace';
import RoutesOverview from './RoutesOverview';
import Itinerary from './Itinerary';

export default function Routes(props) {
  const dispatch = useDispatch();
  const { routes, activeRoute, details, leg, step, destinationDescription } =
    useSelector(({ routes, locations }) => {
      let destinationDescription = 'destination';
      if (locations.end && locations.end.point) {
        destinationDescription = describePlace(locations.end.point, {
          short: true,
        });
      } else {
        console.error('rendering routes: expected end location');
      }
      return {
        routes: routes.routes,
        activeRoute: routes.activeRoute,
        details: routes.viewingDetails,
        leg: routes.viewingStep && routes.viewingStep[0],
        step: routes.viewingStep && routes.viewingStep[1],
        destinationDescription,
      };
    }, shallowEqual);

  const handleRouteClick = (index) => {
    dispatch(routeClicked(index, 'list'));
  };

  const handleStepClick = (legClicked, stepClicked) => {
    dispatch(itineraryStepClicked(legClicked, stepClicked));
  };

  const handleBackClick = () => {
    dispatch(itineraryBackClicked());
  };

  const handleStepBackClick = () => {
    dispatch(itineraryStepBackClicked());
  };

  if (!details) {
    return (
      <RoutesOverview
        routes={routes}
        activeRoute={activeRoute}
        onRouteClick={handleRouteClick}
      />
    );
  } else if (step == null) {
    return (
      <Itinerary
        route={routes[activeRoute]}
        onBackClick={handleBackClick}
        onStepClick={handleStepClick}
        destinationDescription={destinationDescription}
      />
    );
  } else {
    // TODO Make a nice single-step display that gives the same description as
    // the step in the full itinerary.
    return (
      <p style={{ marginLeft: 32 }}>
        {routes[activeRoute].legs[leg].instructions[step].text + ' '}
        <button onClick={handleStepBackClick}>Go back</button>
      </p>
    );
  }
}
