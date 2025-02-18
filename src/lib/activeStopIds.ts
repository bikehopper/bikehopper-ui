import { RouteResponsePath } from './BikeHopperClient';

export function activeStopIds(
  paths: RouteResponsePath[],
  activePathIdx: number,
): { allActiveStops: string[]; activeStopsOnRoute: string[] } {
  const allStops: Set<string> = new Set();
  const stopsOnRoute: Set<string> = new Set();

  const activePath = paths[activePathIdx];
  if (activePath != null) {
    for (const leg of activePath.legs) {
      if (leg.type === 'pt') {
        for (const stopId of leg.all_stop_ids) {
          allStops.add(stopId);
        }

        for (const stop of leg.stops) {
          stopsOnRoute.add(stop.stop_id);
        }
      }
    }
  }

  return {
    allActiveStops: Array.from(allStops.values()),
    activeStopsOnRoute: Array.from(stopsOnRoute.values()),
  };
}
