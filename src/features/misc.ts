import type { Action } from 'redux';

export type MapLoadedAction = Action<'map_loaded'>;
export function mapLoaded() {
  return { type: 'map_loaded' };
}

export type MiscAction = MapLoadedAction;
