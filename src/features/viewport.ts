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
//
// This module also tracks the user's saved default view (if any), which the
// map starts at instead of the region default, and whether the user has moved
// the map since it was loaded, saved, or reset.

import type { Action } from 'redux';
import type { ViewState } from 'react-map-gl/maplibre';
import * as geoViewport from '@placemarkio/geo-viewport';
import { z } from 'zod';
import { getDefaultViewportBounds } from '../lib/region';
import { AlertMessageCode, AlertSeverity } from './alerts';
import type { ActionAlertMixin } from './alerts';
import type { BikeHopperAction } from '../store';

const MAPBOX_VT_SIZE = 512;

type ViewportInfo = {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
};

export type SavedViewport = {
  latitude: number;
  longitude: number;
  zoom: number;
};

export type ViewportState = ViewportInfo & {
  customDefault: SavedViewport | null;
  userMovedMap: boolean;
};

export function getRegionDefaultViewport(
  screenDims: [number, number],
): ViewportInfo {
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

// Returns null if the stored value is missing, unparseable, or out of range.
export function parseSavedViewport(raw: string | null): SavedViewport | null {
  if (!raw) return null;
  try {
    const result = _SavedViewportSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch (e) {
    return null;
  }
}

function genDefaultState(): ViewportState {
  return {
    ...getRegionDefaultViewport([window.innerWidth, window.innerHeight]),
    customDefault: null,
    userMovedMap: false,
  };
}

export function viewportReducer(
  state: ViewportState | undefined,
  action: BikeHopperAction,
): ViewportState {
  if (!state) {
    // Must be generated after geoconfig has loaded, so not at import time.
    state = genDefaultState();
  }

  switch (action.type) {
    case 'hydrate_from_localstorage': {
      const saved = action.customDefaultViewport;
      if (!saved) return state;
      return {
        ...state,
        latitude: saved.latitude,
        longitude: saved.longitude,
        zoom: saved.zoom,
        bearing: 0,
        pitch: 0,
        customDefault: saved,
      };
    }
    case 'map_moved':
      return {
        ...state,
        latitude: action.latitude,
        longitude: action.longitude,
        zoom: action.zoom,
        bearing: action.bearing,
        pitch: action.pitch,
        userMovedMap: state.userMovedMap || action.userInitiated,
      };
    case 'default_viewport_saved':
      return {
        ...state,
        customDefault: {
          latitude: state.latitude,
          longitude: state.longitude,
          zoom: state.zoom,
        },
        userMovedMap: false,
      };
    case 'default_viewport_reset':
      return {
        ...state,
        customDefault: null,
        userMovedMap: false,
      };
    default:
      return state;
  }
}

// Actions

export type MapMovedAction = Action<'map_moved'> &
  ViewState & { userInitiated: boolean };
export function mapMoved(
  newViewport: ViewState,
  userInitiated: boolean,
): MapMovedAction {
  return {
    type: 'map_moved',
    ...newViewport,
    userInitiated,
  };
}

export type DefaultViewportSavedAction = Action<'default_viewport_saved'>;
export function defaultViewportSaved(): DefaultViewportSavedAction &
  ActionAlertMixin {
  return {
    type: 'default_viewport_saved',
    alert: {
      severity: AlertSeverity.SUCCESS,
      message: { code: AlertMessageCode.DEFAULT_AREA_SAVED },
    },
  };
}

export type DefaultViewportResetAction = Action<'default_viewport_reset'>;
export function defaultViewportReset(): DefaultViewportResetAction &
  ActionAlertMixin {
  return {
    type: 'default_viewport_reset',
    alert: {
      severity: AlertSeverity.SUCCESS,
      message: { code: AlertMessageCode.DEFAULT_AREA_RESET },
    },
  };
}

export type ViewportAction =
  | MapMovedAction
  | DefaultViewportSavedAction
  | DefaultViewportResetAction;

const _SavedViewportSchema = z.object({
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
  zoom: z.number().gte(0).lte(24),
});
