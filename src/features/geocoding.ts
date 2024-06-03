import produce from 'immer';
import uniqBy from 'lodash/uniqBy';
import type { Action } from 'redux';
import * as BikehopperClient from '../lib/BikehopperClient';
import delay from '../lib/delay';
import type { BikeHopperAction, BikeHopperThunkAction } from '../store';

const GEOCODE_RESULT_LIMIT = 8;

const RECENTLY_USED_LIMIT = 8;
// expire after just over a week, so if you travel somewhere weekly, you'll retain it
const RECENTLY_USED_MAX_AGE_MS = (7 * 24 + 6) * 60 * 60 * 1000;

// note: all uses of OSM IDs as keys should be prefixed with one character
// representing the type N for node, R for relation, W for way.
// for example osm_id 100 and osm_type N => "N100"
export type OsmId = string;

type OsmCacheItemFetching = {
  status: 'fetching';
  time: number;
  osmIds?: OsmId[];
};
type OsmCacheItemFailed = {
  status: 'failed';
  time: number;
};
type OsmCacheItemSucceeded = {
  status: 'succeeded';
  time: number;
  osmIds: OsmId[];
};
export type OsmCacheItem =
  | OsmCacheItemFetching
  | OsmCacheItemFailed
  | OsmCacheItemSucceeded;

export type GeocodingState = {
  // all location strings are prefixed with '@' to avoid collisions w built-in
  // attributes. If status is 'fetching', osmIds may still be present but
  // stale, from an older fetch.
  typeaheadCache: Record<string, OsmCacheItem>;
  osmCache: Record<OsmId, BikehopperClient.PhotonOsmHash>;
  recentlyUsed: RecentlyUsedItem[];
};

export type RecentlyUsedItem = {
  id: OsmId; // should be in osmCache
  lastUsed: number; // time of last use as returned from Date.now()
};

const DEFAULT_STATE: GeocodingState = {
  typeaheadCache: {},
  osmCache: {},
  recentlyUsed: [],
};

export function geocodingReducer(
  state = DEFAULT_STATE,
  action: BikeHopperAction,
): GeocodingState {
  switch (action.type) {
    case 'hydrate_from_localstorage':
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
    case 'geocode_attempted':
      return produce(state, (draft) => {
        const key = '@' + action.text;
        const newCacheItem: OsmCacheItemFetching = {
          status: 'fetching',
          time: action.time,
        };
        const oldCacheItem = state.typeaheadCache[key];
        if (oldCacheItem?.status === 'succeeded') {
          // keep stale results available while the re-fetch is in progress
          newCacheItem.osmIds = oldCacheItem.osmIds;
        }
        draft.typeaheadCache[key] = newCacheItem;
      });
    case 'geocode_failed':
      return produce(state, (draft) => {
        draft.typeaheadCache['@' + action.text] = {
          status: 'failed',
          time: action.time,
        };
      });
    case 'geocode_succeeded':
      return produce(state, (draft) => {
        const osmIds: OsmId[] = [];
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
    case 'geocoded_location_selected':
      return produce(state, (draft) => {
        draft.recentlyUsed = _updateRecentlyUsed(state.recentlyUsed, [
          action.point.properties.osm_type + action.point.properties.osm_id,
        ]);
      });
    case 'locations_set':
      return produce(state, (draft) => {
        // Update the recently-used list, adding or bumping any geocoded locations used
        // (can be neither, one of the two, or both start and end point)
        draft.recentlyUsed = _updateRecentlyUsed(
          state.recentlyUsed,
          [action.start, action.end]
            .map((loc) => {
              if (loc?.point?.properties?.osm_id != null) {
                return (
                  loc.point.properties.osm_type + loc.point.properties.osm_id
                );
              } else return null;
            })
            .filter((possibleOsmId) => possibleOsmId != null),
        );
      });
    case 'recently_used_location_removed':
      return produce(state, (draft) => {
        const indexToRemove = draft.recentlyUsed.findIndex(
          (r) => r.id === action.id,
        );
        if (indexToRemove !== -1) draft.recentlyUsed.splice(indexToRemove, 1);
      });
    default:
      return state;
  }
}

// Actions

// Only for use in the action creator below, for debouncing.
const _LOCATION_TYPED_ACTION_LAST_TEXT_FOR_KEY: Record<string, string> = {};

type GeocodeAttemptedAction = Action<'geocode_attempted'> & {
  text: string;
  time: number;
};

type GeocodeSucceededAction = Action<'geocode_succeeded'> & {
  text: string;
  time: number;
  features: BikehopperClient.PhotonOsmHash[];
};

type GeocodeFailedAction = Action<'geocode_failed'> & {
  text: string;
  time: number;
  failureType: string;
};

// The user has typed some text representing a location (which may be
// incomplete). That's our cue to try geocoding it. The key is used to
// debounce, e.g. 'start' vs 'end' location.
export function geocodeTypedLocation(
  text: string,
  key: string,
  { fromTextAutocomplete }: { fromTextAutocomplete?: boolean } = {},
): BikeHopperThunkAction {
  return async function geocodeTypedLocationThunk(dispatch, getState) {
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

    dispatch({
      type: 'geocode_attempted',
      text,
      time: Date.now(),
    });

    const { latitude, longitude, zoom } = getState().viewport;

    // Only alert on failure if the location was explicitly submitted. Fail
    // silently in the autocomplete case.
    const alertOnFailure = !fromTextAutocomplete;

    let result;
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
      dispatch({
        type: 'geocode_failed',
        text,
        failureType,
        time: Date.now(),
        alert: alertOnFailure ? { message: alertMsg } : undefined,
      });
      return;
    }

    if (result.type !== 'FeatureCollection') {
      dispatch({
        type: 'geocode_failed',
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
      dispatch({
        type: 'geocode_failed',
        text,
        failureType: 'no points found',
        time: Date.now(),
        alert: alertOnFailure
          ? { message: `Couldn't find ${text}` }
          : undefined,
      });
      return;
    }

    dispatch({
      type: 'geocode_succeeded',
      text,
      features: resultPoints,
      time: Date.now(),
    });
  };
}

type RecentlyUsedLocationRemovedAction =
  Action<'recently_used_location_removed'> & {
    id: OsmId;
  };
export function removeRecentlyUsedLocation(
  id: OsmId,
): RecentlyUsedLocationRemovedAction {
  return {
    type: 'recently_used_location_removed',
    id,
  };
}

// update the recently used list with zero or more (in practice 0-2) just used OSM IDs
function _updateRecentlyUsed(
  recentlyUsed: RecentlyUsedItem[],
  justUsedIds: OsmId[],
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

export type GeocodingAction =
  | GeocodeAttemptedAction
  | GeocodeFailedAction
  | GeocodeSucceededAction
  | RecentlyUsedLocationRemovedAction;
