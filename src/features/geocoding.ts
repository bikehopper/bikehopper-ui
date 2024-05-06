import produce from 'immer';
import uniqBy from 'lodash/uniqBy';
import * as BikehopperClient from '../lib/BikehopperClient';
import delay from '../lib/delay';
import {
  Location,
  LocationWithPoint,
  OSMCacheItem,
  OSMId,
  Point,
  Points,
  RecentlyUsedItem,
} from './types';
import {
  ActionType,
  GeocodeAttemptedAction,
  GeocodeFailedAction,
  GeocodeSucceededAction,
  GeocodedLocationSelectedAction,
  HydrateFromLocalStorageAction,
  LocationsSetAction,
  RecentlyUsedLocationRemovedAction,
} from './actions';
import { AppDispatch, GetAppState } from '../store';
import type { FeatureCollection } from 'geojson';

const GEOCODE_RESULT_LIMIT = 8;

const RECENTLY_USED_LIMIT = 8;
// expire after just over a week, so if you travel somewhere weekly, you'll retain it
const RECENTLY_USED_MAX_AGE_MS = (7 * 24 + 6) * 60 * 60 * 1000;

type GeocodingState = {
  /** All location strings are prefixed with '@' to avoid collisions w built-in attributes.
   * If status is 'fetching', osmIds may still be present but stale, from an older fetch.
   */
  typeaheadCache: Record<string, OSMCacheItem>;
  /** Maps OSM types + IDs (stringified) to Photon GeoJSON points */
  osmCache: Record<OSMId, Point>;
  /** Recently used locations */
  recentlyUsed: RecentlyUsedItem[];
};

const DEFAULT_STATE: GeocodingState = {
  typeaheadCache: {},
  osmCache: {},
  recentlyUsed: [],
};

type GeocodingAction =
  | HydrateFromLocalStorageAction
  | GeocodeAttemptedAction
  | GeocodeFailedAction
  | GeocodeSucceededAction
  | GeocodedLocationSelectedAction
  | LocationsSetAction
  | RecentlyUsedLocationRemovedAction;

export function geocodingReducer(
  state: GeocodingState = DEFAULT_STATE,
  action: GeocodingAction,
): GeocodingState {
  switch (action.type) {
    case ActionType.HYDRATE_FROM_LOCALSTORAGE:
      return produce(state, (draft) => {
        // This happens at app start, so it should be safe to replace rather than
        // expand the cache.
        draft.osmCache = action.geocodingOsmCache;
        // Call the update function to purge any that are too old
        draft.recentlyUsed = _updateRecentlyUsed(
          action.geocodingRecentlyUsed,
          [],
        );
      });
    case ActionType.GEOCODE_ATTEMPTED:
      return produce(state, (draft) => {
        const key = '@' + action.text;
        const newCacheItem: OSMCacheItem = {
          status: 'fetching',
          time: action.time,
        };
        const currentCachedValue = state.typeaheadCache[key];
        if (currentCachedValue?.status === 'succeeded') {
          // keep stale results available while the re-fetch is in progress
          newCacheItem.osmIds = currentCachedValue.osmIds;
        }
        draft.typeaheadCache[key] = newCacheItem;
      });
    case ActionType.GEOCODE_FAILED:
      return produce(state, (draft) => {
        draft.typeaheadCache['@' + action.text] = {
          status: 'failed',
          time: action.time,
        };
      });
    case ActionType.GEOCODE_SUCCEEDED:
      return produce(state, (draft) => {
        const osmIds: OSMId[] = [];
        // TODO: Denormalize and somehow save both osm_key/osm_value pairs when we get dupes
        const dedupedFeatures = uniqBy(action.features, 'properties.osm_id');

        for (const feat of dedupedFeatures) {
          const idWithType = feat.properties.osm_type + feat.properties.osm_id;
          if (idWithType !== osmIds[osmIds.length - 1]) {
            osmIds.push(idWithType);
            draft.osmCache[idWithType] = feat;
          }
        }
        draft.typeaheadCache['@' + action.text] = {
          status: 'succeeded',
          time: action.time,
          osmIds,
        };
      });
    case ActionType.GEOCODED_LOCATION_SELECTED:
      return produce(state, (draft) => {
        draft.recentlyUsed = _updateRecentlyUsed(state.recentlyUsed, [
          action.point.properties.osm_type + action.point.properties.osm_id,
        ]);
      });
    case ActionType.LOCATIONS_SET:
      return produce(state, (draft) => {
        // Update the recently-used list, adding or bumping any geocoded locations used
        // (can be neither, one of the two, or both start and end point)
        draft.recentlyUsed = _updateRecentlyUsed(
          state.recentlyUsed,
          [action.start, action.end]
            .filter(locationFilter)
            .map(
              (loc) =>
                loc.point.properties.osm_type + loc.point.properties.osm_id,
            ),
        );
      });
    case ActionType.RECENTLY_USED_LOCATION_REMOVED:
      return produce(state, (draft) => {
        const indexToRemove = draft.recentlyUsed.findIndex(
          (r) => r.id === action.id,
        );
        if (indexToRemove !== -1) draft.recentlyUsed.splice(indexToRemove, 1);
      });
    default: {
      // enforce exhaustive switch statement
      const unreachable: never = action;
      return state;
    }
  }
}

function locationFilter(loc: Location | null): loc is LocationWithPoint {
  return Boolean(loc?.point?.properties?.osm_id);
}

// Actions

// Only for use in the action creator below, for debouncing.
const _LOCATION_TYPED_ACTION_LAST_TEXT_FOR_KEY: Record<string, string> = {};

// The user has typed some text representing a location (which may be
// incomplete). That's our cue to try geocoding it. The key is used to
// debounce, e.g. 'start' vs 'end' location.
export function geocodeTypedLocation(
  text: string,
  key: string,
  { fromTextAutocomplete }: { fromTextAutocomplete?: boolean } = {},
) {
  return async function geocodeTypedLocationThunk(
    dispatch: AppDispatch,
    getState: GetAppState,
  ) {
    text = text.trim();
    if (text === '') return;

    _LOCATION_TYPED_ACTION_LAST_TEXT_FOR_KEY[key] = text;

    if (fromTextAutocomplete) {
      if (import.meta.env.VITE_USE_PUBLIC_NOMINATIM) {
        // Public Nominatim is for development / demo only, and to comply with
        // the API guidelines, we must limit requests to 1/sec and not use it
        // for an autocomplete.
        return;
      }

      // This is functioning as an autocomplete: we don't know for sure if the
      // user is done typing. Therefore, debounce.
      await delay(700);
      if (_LOCATION_TYPED_ACTION_LAST_TEXT_FOR_KEY[key] !== text) return;
    }

    dispatch<GeocodeAttemptedAction>({
      type: ActionType.GEOCODE_ATTEMPTED,
      text,
      time: Date.now(),
    });

    const { latitude, longitude, zoom } = getState().viewport;

    // Only alert on failure if the location was explicitly submitted. Fail
    // silently in the autocomplete case.
    const alertOnFailure = !fromTextAutocomplete;

    let result: Points | undefined;
    try {
      result = await BikehopperClient.geocode(text, {
        latitude,
        longitude,
        zoom,
        limit: GEOCODE_RESULT_LIMIT,
      });
    } catch (e) {
      let failureType, alertMsg;
      if (e instanceof BikehopperClient.BikehopperClientError) {
        failureType = 'server error';
        alertMsg = 'Server error';
      } else {
        failureType = 'network error';
        alertMsg = "Can't connect to server";
      }
      dispatch<GeocodeFailedAction>({
        type: ActionType.GEOCODE_FAILED,
        text,
        failureType,
        time: Date.now(),
        alert: alertOnFailure ? { message: alertMsg } : undefined,
      });
      return;
    }

    if (result?.type !== 'FeatureCollection') {
      dispatch<GeocodeFailedAction>({
        type: ActionType.GEOCODE_FAILED,
        text,
        failureType: 'not a FeatureCollection',
        time: Date.now(),
        alert: alertOnFailure
          ? { message: `Couldn't find ${text}` }
          : undefined,
      });
      return;
    }

    const resultPoints = result.features.filter(
      (feat) => feat.geometry.type === 'Point',
    );

    if (resultPoints.length === 0) {
      dispatch<GeocodeFailedAction>({
        type: ActionType.GEOCODE_FAILED,
        text,
        failureType: 'no points found',
        time: Date.now(),
        alert: alertOnFailure
          ? { message: `Couldn't find ${text}` }
          : undefined,
      });
      return;
    }

    dispatch<GeocodeSucceededAction>({
      type: ActionType.GEOCODE_SUCCEEDED,
      text,
      features: resultPoints,
      time: Date.now(),
    });
  };
}

export function removeRecentlyUsedLocation(
  id: string,
): RecentlyUsedLocationRemovedAction {
  return {
    type: ActionType.RECENTLY_USED_LOCATION_REMOVED,
    id,
  };
}

// update the recently used list with zero or more (in practice 0-2) just used OSM IDs
function _updateRecentlyUsed(
  recentlyUsed: RecentlyUsedItem[],
  justUsedIds: OSMId[],
): RecentlyUsedItem[] {
  const now = Date.now();
  return [
    ...justUsedIds.map((id) => ({
      id,
      lastUsed: now,
    })),
    ...recentlyUsed.filter(
      (record) =>
        !justUsedIds.includes(record.id) &&
        now < record.lastUsed + RECENTLY_USED_MAX_AGE_MS,
    ),
  ].slice(0, RECENTLY_USED_LIMIT);
}
