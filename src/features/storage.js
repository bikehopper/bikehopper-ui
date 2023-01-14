/*
 * Middleware for syncing stuff to LocalStorage to persist across sessions, and
 * an initialization routine to load the stuff.
 */

let _warned = false;

export function storageMiddleware(store) {
  return (next) => (action) => {
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
        if (process.env.NODE_ENV !== 'production' && !_warned) {
          console.warn("Can't save recently used:", e);
          _warned = true;
        }
      }
    }
  };
}

// This returns an action, which should be dispatched.
export function initFromStorage() {
  let recentlyUsedRaw = [];
  try {
    const json = localStorage.getItem('ru');
    if (json) recentlyUsedRaw = JSON.parse(json);
  } catch (e) {
    if (process.env.NODE_ENV !== 'production')
      console.warn("Can't load from localstorage:", e);
  }

  const osmCache = {};
  const recentlyUsedCooked = [];

  for (const entry of recentlyUsedRaw) {
    // Do some basic validation before using them
    if (
      typeof entry === 'object' &&
      typeof entry.ts === 'number' &&
      typeof entry.obj === 'object' &&
      typeof entry.obj.properties === 'object' &&
      typeof entry.obj.properties.osm_id === 'number'
    ) {
      osmCache[entry.obj.properties.osm_id] = entry.obj;
      recentlyUsedCooked.push({
        lastUsed: entry.ts,
        id: entry.obj.properties.osm_id,
      });
    } else if (process.env.NODE_ENV !== 'production') {
      console.warn('Ignoring invalid recently used entry:', entry);
    }
  }

  return {
    type: 'hydrate_from_localstorage',
    geocodingOsmCache: osmCache,
    geocodingRecentlyUsed: recentlyUsedCooked,
  };
}
