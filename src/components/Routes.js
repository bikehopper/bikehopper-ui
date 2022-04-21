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
        destinationDescription = describePlace(locations.end.point);
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
  } else if (!step) {
    return (
      <Itinerary
        route={routes[activeRoute]}
        onBackClick={handleBackClick}
        onStepClick={handleStepClick}
        destinationDescription={destinationDescription}
      />
    );
  } else {
    return (
      <p>
        Step {step} of leg {leg}. Description TK.{' '}
        <button onClick={handleStepBackClick}>Go back</button>
      </p>
    );
  }
}
