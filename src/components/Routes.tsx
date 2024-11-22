import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import pointInPolygon from '@turf/boolean-point-in-polygon';
import usePrevious from '../hooks/usePrevious';
import { BOTTOM_DRAWER_MIN_HEIGHT } from '../lib/layout';
import { getTransitServiceArea } from '../lib/region';
import {
  routeClicked,
  itineraryBackClicked,
  itineraryStepClicked,
  itineraryStepBackClicked,
  itineraryPrevStepClicked,
  itineraryNextStepClicked,
} from '../features/routes';
import describePlace from '../lib/describePlace';
import InstructionSigns from '../lib/InstructionSigns';
import Itinerary from './Itinerary';
import ItinerarySingleStep from './ItinerarySingleStep';
import ItinerarySingleTransitStop from './ItinerarySingleTransitStop';
import RoutesOverview from './RoutesOverview';
import type { Dispatch, RootState } from '../store';

export default function Routes(props: {}) {
  const dispatch: Dispatch = useDispatch();
  const {
    routes,
    activeRoute,
    details,
    viewingStep,
    destinationDescription,
    outOfAreaStart,
    outOfAreaEnd,
  } = useSelector(({ routes, routeParams }: RootState) => {
    let destinationDescription = 'destination';
    if (routeParams.end && routeParams.end.point) {
      destinationDescription = describePlace(routeParams.end.point, {
        short: true,
      });
    } else {
      console.error('rendering routes: expected end location');
    }

    const transitServiceArea = getTransitServiceArea();

    const outOfAreaStart =
      transitServiceArea && routeParams?.start?.point
        ? !pointInPolygon(routeParams.start.point, transitServiceArea)
        : false;

    const outOfAreaEnd =
      transitServiceArea && routeParams?.end?.point
        ? !pointInPolygon(routeParams.end.point, transitServiceArea)
        : false;

    return {
      routes: routes.routes,
      activeRoute: routes.activeRoute,
      details: routes.viewingDetails,
      viewingStep: routes.viewingStep,
      destinationDescription,
      outOfAreaStart,
      outOfAreaEnd,
    };
  }, shallowEqual);

  const prevViewingStep = usePrevious(viewingStep);

  const handleRouteClick = useCallback(
    (index: number) => {
      dispatch(routeClicked(index, 'list'));
    },
    [dispatch],
  );

  const handleStepClick = useCallback(
    (legClicked: number, stepClicked: number) => {
      dispatch(itineraryStepClicked(legClicked, stepClicked));
    },
    [dispatch],
  );

  const handleBackClick = useCallback<React.MouseEventHandler>(() => {
    dispatch(itineraryBackClicked());
  }, [dispatch]);

  const handleStepBackClick = useCallback<React.MouseEventHandler>(() => {
    dispatch(itineraryStepBackClicked());
  }, [dispatch]);

  const handlePrevStepClick = useCallback<React.MouseEventHandler>(() => {
    dispatch(itineraryPrevStepClicked());
  }, [dispatch]);

  const handleNextStepClick = useCallback<React.MouseEventHandler>(() => {
    dispatch(itineraryNextStepClicked());
  }, [dispatch]);

  const wasViewingDetails = usePrevious(details);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollTopBeforeItineraryOpen = useRef<number | null>(null);

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

  if (!routes) {
    // This component normally shouldn't render at all when we have no routes,
    // but it can momentarily happen when app state is in the process of
    // updating.
    content = null;
  } else if (!details) {
    content = (
      <RoutesOverview
        routes={routes}
        activeRoute={activeRoute as number}
        onRouteClick={handleRouteClick}
        outOfAreaStart={outOfAreaStart}
        outOfAreaEnd={outOfAreaEnd}
      />
    );
  } else if (viewingStep == null) {
    content = (
      <Itinerary
        route={routes[activeRoute as number]}
        onBackClick={handleBackClick}
        onStepClick={handleStepClick}
        destinationDescription={destinationDescription}
        scrollToStep={prevViewingStep || null}
      />
    );
  } else {
    const [legIdx, stepIdx] = viewingStep;
    const routeIdx: number = activeRoute as number;
    const leg = routes[routeIdx].legs[legIdx];

    if (leg.type !== 'pt') {
      content = (
        <ItinerarySingleStep
          leg={leg}
          stepIdx={stepIdx}
          onBackClick={handleStepBackClick}
          isFirstStep={stepIdx === 0 && legIdx === 0}
          isLastStep={
            (stepIdx + 1 === leg.instructions.length ||
              leg.instructions[stepIdx + 1].sign === InstructionSigns.FINISH) &&
            legIdx + 1 === routes[routeIdx].legs.length
          }
          onPrevStepClick={handlePrevStepClick}
          onNextStepClick={handleNextStepClick}
        />
      );
    } else {
      content = (
        <ItinerarySingleTransitStop
          leg={leg}
          stopIdx={stepIdx}
          onBackClick={handleStepBackClick}
          isFirstLeg={legIdx === 0}
          isLastLeg={legIdx + 1 === routes[routeIdx].legs.length}
          onPrevStepClick={handlePrevStepClick}
          onNextStepClick={handleNextStepClick}
        />
      );
    }
  }

  return <div ref={rootRef}>{content}</div>;
}
