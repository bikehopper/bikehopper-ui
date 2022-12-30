import * as React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import pointInPolygon from '@turf/boolean-point-in-polygon';
import { TRANSIT_SERVICE_AREA } from '../lib/region';
import {
  routeClicked,
  itineraryBackClicked,
  itineraryStepClicked,
  itineraryStepBackClicked,
} from '../features/routes';
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
    outOfAreaStart,
    outOfAreaEnd,
  } = useSelector(({ routes, routeParams }) => {
    let destinationDescription = 'destination';
    if (routeParams.end && routeParams.end.point) {
      destinationDescription = describePlace(routeParams.end.point, {
        short: true,
      });
    } else {
      console.error('rendering routes: expected end location');
    }

    const outOfAreaStart =
      TRANSIT_SERVICE_AREA &&
      routeParams?.start?.point &&
      !pointInPolygon(routeParams.start.point, TRANSIT_SERVICE_AREA);

    const outOfAreaEnd =
      TRANSIT_SERVICE_AREA &&
      routeParams?.end?.point &&
      !pointInPolygon(routeParams.end.point, TRANSIT_SERVICE_AREA);

    return {
      routes: routes.routes,
      activeRoute: routes.activeRoute,
      details: routes.viewingDetails,
      legIdx: routes.viewingStep && routes.viewingStep[0],
      stepIdx: routes.viewingStep && routes.viewingStep[1],
      destinationDescription,
      outOfAreaStart,
      outOfAreaEnd,
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
        outOfAreaStart={outOfAreaStart}
        outOfAreaEnd={outOfAreaEnd}
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
