// Track a copy of the map viewport information.
//
// The map is actually an uncontrolled component, so MapLibre owns this precise
// state, but we need to know the area that was last displayed so that we can
// search in/near that area when geocoding. For this purpose it's ok if this
// viewport information is not always up to date up to the millisecond when the
// map has just been zoomed/panned/etc.
//
// In other words, just to make it super clear: the map itself never moves
// around in (direct) response to the state in this reducer, only vice versa.

import geoViewport from '@mapbox/geo-viewport';

const BAY_AREA_BOUNDS = [-122.597652, 37.330751, -121.669687, 37.858476];

const MAPBOX_VT_SIZE = 512;

function viewportForScreen(screenDims) {
  const viewport = geoViewport.viewport(
    BAY_AREA_BOUNDS,
    screenDims,
    0,
    14,
    MAPBOX_VT_SIZE,
  );
  return {
    latitude: viewport.center[1],
    longitude: viewport.center[0],
    zoom: viewport.zoom,
    bearing: 0,
    pitch: 0,
  };
}

export const DEFAULT_VIEWPORT = viewportForScreen([
  window.innerWidth,
  window.innerHeight,
]);

const DEFAULT_STATE = { ...DEFAULT_VIEWPORT };

export function viewportReducer(state = DEFAULT_STATE, action) {
  switch (action.type) {
    case 'map_moved':
      return {
        ...state,
        latitude: action.latitude,
        longitude: action.longitude,
        zoom: action.zoom,
        bearing: action.bearing,
        pitch: action.pitch,
      };
    default:
      return state;
  }
}

// Actions

export function mapMoved(newViewport) {
  return {
    type: 'map_moved',
    ...newViewport,
  };
}
