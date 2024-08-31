import { useEffect, useRef } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import pointInPolygon from '@turf/boolean-point-in-polygon';
import usePrevious from '../hooks/usePrevious';
import { BOTTOM_DRAWER_MIN_HEIGHT } from '../lib/layout';
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
    viewingStep,
    viewingLeg,
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
      viewingLeg: routes.viewingLeg,
      viewingStep: routes.viewingStep,
      destinationDescription,
      outOfAreaStart,
      outOfAreaEnd,
    };
  }, shallowEqual);

  const prevViewingStep = usePrevious(viewingStep);

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

  const wasViewingDetails = usePrevious(details);
  const rootRef = useRef();
  const scrollTopBeforeItineraryOpen = useRef();

  useEffect(() => {
    const el = rootRef.current;
    const container = el?.offsetParent;
    if (!el || !container) return;

    // When entering the itinerary view, pop the bottom drawer up a bit
    if (details && !wasViewingDetails) {
      // Show up to 400px of the itinerary, but never take up more than half the
      // vertical height of the map.
      const desiredTop = Math.min(
        400 - BOTTOM_DRAWER_MIN_HEIGHT,
        container.clientHeight / 2 - BOTTOM_DRAWER_MIN_HEIGHT,
      );
      scrollTopBeforeItineraryOpen.current = container.scrollTop;
      if (container.scrollTop < desiredTop)
        container.scrollTo({ top: desiredTop, behavior: 'smooth' });
    } else if (!details && wasViewingDetails) {
      // Undo the popping up
      const desiredTop = scrollTopBeforeItineraryOpen.current;
      if (desiredTop != null && container.scrollTop > desiredTop)
        container.scrollTo({ top: desiredTop, behavior: 'smooth' });
      scrollTopBeforeItineraryOpen.current = null;
    }
  }, [details, wasViewingDetails]);

  let content;

  if (!details) {
    content = (
      <RoutesOverview
        routes={routes}
        activeRoute={activeRoute}
        onRouteClick={handleRouteClick}
        outOfAreaStart={outOfAreaStart}
        outOfAreaEnd={outOfAreaEnd}
      />
    );
  } else if (viewingStep == null) {
    content = (
      <Itinerary
        route={routes[activeRoute]}
        onBackClick={handleBackClick}
        onStepClick={handleStepClick}
        viewingLeg={viewingLeg}
        destinationDescription={destinationDescription}
        scrollToStep={prevViewingStep}
      />
    );
  } else {
    const [legIdx, stepIdx] = viewingStep;
    const leg = routes[activeRoute].legs[legIdx];

    if (leg.type !== 'pt') {
      content = (
        <ItinerarySingleStep
          leg={leg}
          stepIdx={stepIdx}
          onBackClick={handleStepBackClick}
        />
      );
    } else {
      content = (
        <ItinerarySingleTransitStop
          stop={leg.stops[stepIdx]}
          relationship={
            stepIdx === 0
              ? 'board'
              : stepIdx === leg.stops.length - 1
                ? 'alight'
                : 'intermediate'
          }
          onBackClick={handleStepBackClick}
        />
      );
    }
  }

  return <div ref={rootRef}>{content}</div>;
}
