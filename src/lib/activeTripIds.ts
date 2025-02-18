import { RouteResponsePath } from './BikeHopperClient';

export function activeTripIds(
  paths: RouteResponsePath[],
  activePathIdx: number,
): string[] {
  const routeIds: string[] = [];

  const activePath = paths[activePathIdx];
  if (activePath != null) {
    for (const leg of activePath.legs) {
      if (leg.type === 'pt') {
        routeIds.push(leg.trip_id);
      }
    }
  }

  return routeIds;
}
