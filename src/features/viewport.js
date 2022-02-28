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

export const DEFAULT_VIEWPORT = {
  // hardcode San Francisco view for now
  latitude: 37.75117670681911,
  longitude: -122.44574920654225,
  zoom: 12,
  bearing: 0,
  pitch: 0,
};

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
