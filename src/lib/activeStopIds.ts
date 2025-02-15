import { RouteResponsePath } from './BikeHopperClient';

export function activeStopIds(
  paths: RouteResponsePath[],
  activePathIdx: number,
): string[] {
  const stopIds: Set<string> = new Set();

  const activePath = paths[activePathIdx];
  if (activePath != null) {
    for (const leg of activePath.legs) {
      if (leg.type === 'pt') {
        for (const stopId of leg.all_stop_ids) {
          stopIds.add(stopId);
        }
      }
    }
  }

  return Array.from(stopIds.values());
}
