import type { Action, Middleware } from 'redux';

import type { RootState } from '../store';
import type { OsmId, RecentlyUsedItem } from './geocoding';
import type { PhotonOsmHash } from '../lib/BikeHopperClient';
import { parseSavedViewport } from './viewport';
import type { SavedViewport } from './viewport';

/*
 * Middleware for syncing stuff to LocalStorage to persist across sessions, and
 * an initialization routine to load the stuff.
 */

let _warned = false;

const _DEFAULT_VIEW_KEY = 'defaultView';

export const storageMiddleware: Middleware<{}, RootState> =
  (store) => (next) => (action) => {
    const before = store.getState();
    next(action);
    const after = store.getState();

    if (after.geocoding.recentlyUsed !== before.geocoding.recentlyUsed) {
      // Save not just the OSM IDs, but the full hashes of the recently used
      const recentlyUsedFeatures = after.geocoding.recentlyUsed.map((r) => ({
        ts: r.lastUsed,
        obj: after.geocoding.osmCache[r.id],
      }));
      const json = JSON.stringify(recentlyUsedFeatures);
      try {
        localStorage.setItem('ru', json);
      } catch (e) {
        if (import.meta.env.DEV && !_warned) {
          console.warn("Can't save recently used:", e);
          _warned = true;
        }
      }
    }

    if (after.viewport.customDefault !== before.viewport.customDefault) {
      const saved = after.viewport.customDefault;
      try {
        if (saved) {
          localStorage.setItem(_DEFAULT_VIEW_KEY, JSON.stringify(saved));
        } else {
          localStorage.removeItem(_DEFAULT_VIEW_KEY);
        }
      } catch (e) {
        if (import.meta.env.DEV) console.warn("Can't save default view:", e);
      }
    }
  };

type HydrateFromLocalStorageAction = Action<'hydrate_from_localstorage'> & {
  geocodingOsmCache: Record<OsmId, PhotonOsmHash>;
  geocodingRecentlyUsed: RecentlyUsedItem[];
  customDefaultViewport: SavedViewport | null;
};
export type StorageAction = HydrateFromLocalStorageAction;

// This returns an action, which should be dispatched.
export function initFromStorage(): HydrateFromLocalStorageAction {
  let recentlyUsedRaw = [];
  try {
    const json = localStorage.getItem('ru');
    if (json) recentlyUsedRaw = JSON.parse(json);
  } catch (e) {
    if (import.meta.env.DEV) console.warn("Can't load from localstorage:", e);
  }

  // Read separately so a problem with one stored item doesn't lose the other.
  let customDefaultViewport: SavedViewport | null = null;
  try {
    customDefaultViewport = parseSavedViewport(
      localStorage.getItem(_DEFAULT_VIEW_KEY),
    );
  } catch (e) {
    if (import.meta.env.DEV) console.warn("Can't load default view:", e);
  }

  const osmCache: Record<OsmId, PhotonOsmHash> = {};
  const recentlyUsedCooked: RecentlyUsedItem[] = [];

  for (const entry of recentlyUsedRaw) {
    // Do some basic validation before using them
    if (
      typeof entry === 'object' &&
      typeof entry.ts === 'number' &&
      typeof entry.obj === 'object' &&
      typeof entry.obj.properties === 'object' &&
      typeof entry.obj.properties.osm_id === 'number' &&
      ['N', 'R', 'W'].includes(entry.obj.properties.osm_type)
    ) {
      const idWithType =
        entry.obj.properties.osm_type + entry.obj.properties.osm_id;
      osmCache[idWithType] = entry.obj;
      recentlyUsedCooked.push({
        lastUsed: entry.ts,
        id: idWithType,
      });
    } else if (import.meta.env.DEV) {
      console.warn('Ignoring invalid recently used entry:', entry);
    }
  }

  return {
    type: 'hydrate_from_localstorage',
    geocodingOsmCache: osmCache,
    geocodingRecentlyUsed: recentlyUsedCooked,
    customDefaultViewport,
  };
}
