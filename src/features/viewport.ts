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

import type { Action } from 'redux';
import type { ViewState } from 'react-map-gl/maplibre';
import * as geoViewport from '@placemarkio/geo-viewport';
import { getDefaultViewportBounds } from '../lib/region';
import type { BikeHopperAction } from '../store';

const MAPBOX_VT_SIZE = 512;

type ViewportInfo = {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
};

function viewportForScreen(screenDims: [number, number]): ViewportInfo {
  const viewport = geoViewport.viewport(
    getDefaultViewportBounds(),
    screenDims,
    {
      minzoom: 0,
      maxzoom: 14,
      tileSize: MAPBOX_VT_SIZE,
    },
  );
  return {
    latitude: viewport.center[1],
    longitude: viewport.center[0],
    zoom: viewport.zoom,
    bearing: 0,
    pitch: 0,
  };
}

function genDefaultState(): ViewportInfo {
  return viewportForScreen([window.innerWidth, window.innerHeight]);
}

export function viewportReducer(
  state: ViewportInfo | undefined,
  action: BikeHopperAction,
): ViewportInfo {
  if (!state) {
    // Must be generated after geoconfig has loaded, so not at import time.
    state = genDefaultState();
  }

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

export type MapMovedAction = Action<'map_moved'> & ViewState;
export function mapMoved(newViewport: ViewState): MapMovedAction {
  return {
    type: 'map_moved',
    ...newViewport,
  };
}

export type ViewportAction = MapMovedAction;
