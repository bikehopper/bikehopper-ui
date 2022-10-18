import * as React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import {
  routeClicked,
  itineraryBackClicked,
  itineraryStepClicked,
  itineraryStepBackClicked,
} from '../features/routes';
import { routeTypeSelected } from '../features/routeParams';
import describePlace from '../lib/describePlace';
import RoutesOverview from './RoutesOverview';
import Itinerary from './Itinerary';
import ItinerarySingleStep from './ItinerarySingleStep';
import ItinerarySingleTransitStop from './ItinerarySingleTransitStop';

export default function Routes(props) {
  const dispatch = useDispatch();
  const {
    routes,
    activeRoute,
    details,
    legIdx,
    stepIdx,
    destinationDescription,
    routeType,
  } = useSelector(({ routes, routeParams }) => {
    let destinationDescription = 'destination';
    if (routeParams.end && routeParams.end.point) {
      destinationDescription = describePlace(routeParams.end.point, {
        short: true,
      });
    } else {
      console.error('rendering routes: expected end location');
    }
    return {
      routes: routes.routes,
      activeRoute: routes.activeRoute,
      details: routes.viewingDetails,
      legIdx: routes.viewingStep && routes.viewingStep[0],
      stepIdx: routes.viewingStep && routes.viewingStep[1],
      destinationDescription,
      routeType: routeParams.routeType,
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

  const handleRouteTypeClick = (routeType) => {
    dispatch(routeTypeSelected(routeType));
  };

  if (!details) {
    return (
      <RoutesOverview
        routes={routes}
        activeRoute={activeRoute}
        onRouteClick={handleRouteClick}
        routeType={routeType}
        onRouteTypeClick={handleRouteTypeClick}
      />
    );
  } else if (stepIdx == null) {
    return (
      <Itinerary
        route={routes[activeRoute]}
        onBackClick={handleBackClick}
        onStepClick={handleStepClick}
        destinationDescription={destinationDescription}
      />
    );
  } else {
    const leg = routes[activeRoute].legs[legIdx];

    if (leg.type !== 'pt') {
      return (
        <ItinerarySingleStep
          leg={leg}
          stepIdx={stepIdx}
          onBackClick={handleStepBackClick}
        />
      );
    } else {
      return (
        <ItinerarySingleTransitStop
          stop={leg.stops[stepIdx]}
          relationship={stepIdx === 0 ? 'board' : 'alight'}
          onBackClick={handleStepBackClick}
        />
      );
    }
  }
}
