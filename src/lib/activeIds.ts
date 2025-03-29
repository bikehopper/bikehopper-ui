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

export type ActiveStops = {
  all: string[];
  onRoute: string[];
  entry: string[];
  exit: string[];
};

export const EMPTY_ACTIVE_STOPS: ActiveStops = {
  all: [],
  onRoute: [],
  entry: [],
  exit: [],
};

export enum ActiveStopTypes {
  all = 'all',
  onRoute = 'onRoute',
  entry = 'entry',
  exit = 'exit',
}

export function activeStopIds(
  paths: RouteResponsePath[],
  activePathIdx: number,
): ActiveStops {
  const allStops: Set<string> = new Set();
  const stopsOnRoute: Set<string> = new Set();
  const entryStops: Set<string> = new Set();
  const exitStops: Set<string> = new Set();

  const activePath = paths[activePathIdx];
  if (activePath != null) {
    for (const leg of activePath.legs) {
      if (leg.type === 'pt' && leg.all_stop_ids) {
        for (const stopId of leg.all_stop_ids) {
          allStops.add(stopId);
        }

        for (const stop of leg.stops) {
          stopsOnRoute.add(stop.stop_id);
        }
        entryStops.add(leg.stops[0].stop_id);
        exitStops.add(leg.stops[leg.stops.length - 1].stop_id);
      }
    }
  }

  return {
    all: Array.from(allStops.values()),
    onRoute: Array.from(stopsOnRoute.values()),
    entry: Array.from(entryStops.values()),
    exit: Array.from(exitStops.values()),
  };
}
