import { RouteResponsePath } from './BikeHopperClient';

export function activeTripIds(
  paths: RouteResponsePath[],
  activePathIdx: number,
): string[] {
  const tripIds: string[] = [];

  const activePath = paths[activePathIdx];
  if (activePath != null) {
    for (const leg of activePath.legs) {
      if (leg.type === 'pt') {
        tripIds.push(leg.trip_id);
      }
    }
  }

  return tripIds;
}

export function activeRouteIds(
  paths: RouteResponsePath[],
  activePathIdx: number,
): string[] {
  const routeIds: string[] = [];

  const activePath = paths[activePathIdx];
  if (activePath != null) {
    for (const leg of activePath.legs) {
      if (leg.type === 'pt') {
        routeIds.push(leg.route_id);
      }
    }
  }

  return routeIds;
}

const ActiveStopTypes = ['entry', 'exit', 'intermediate', 'offRoute'] as const;
export type ActiveStopTypes = (typeof ActiveStopTypes)[number];

export type ActiveStops = {
  [T in ActiveStopTypes]: string[];
};

export const EMPTY_ACTIVE_STOPS = {
  offRoute: [],
  intermediate: [],
  entry: [],
  exit: [],
} satisfies ActiveStops;

export function activeStopIds(
  paths: RouteResponsePath[],
  activePathIdx: number,
): ActiveStops {
  const allStops: Set<string> = new Set();
  const intermediateStops: Set<string> = new Set();
  const entryStops: Set<string> = new Set();
  const exitStops: Set<string> = new Set();

  const activePath = paths[activePathIdx];
  if (activePath != null) {
    for (const leg of activePath.legs) {
      if (leg.type === 'pt' && leg.all_stop_ids) {
        for (const stopId of leg.all_stop_ids) {
          allStops.add(stopId);
        }

        for (const stop of leg.stops.slice(1, -1)) {
          intermediateStops.add(stop.stop_id);
        }
        entryStops.add(leg.stops[0].stop_id);
        exitStops.add(leg.stops[leg.stops.length - 1].stop_id);
      }
    }
  }

  const offRouteStops = allStops
    .difference(intermediateStops)
    .difference(entryStops)
    .difference(exitStops);

  return {
    offRoute: Array.from(offRouteStops.values()),
    intermediate: Array.from(intermediateStops.values()),
    entry: Array.from(entryStops.values()),
    exit: Array.from(exitStops.values()),
  };
}
