import produce from 'immer';
import uniqBy from 'lodash/uniqBy';
import * as BikehopperClient from '../lib/BikehopperClient';
import delay from '../lib/delay';

const GEOCODE_RESULT_LIMIT = 8;

const RECENTLY_USED_LIMIT = 8;
const RECENTLY_USED_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const DEFAULT_STATE = {
  // maps location strings to {
  //    status: 'fetching' | 'failed' | 'succeeded',
  //    time: /* time as returned from Date.now() */,
  //    osmIds: OSM ID strings,
  // }
  // all location strings are prefixed with '@' to avoid collisions w built-in attributes.
  typeaheadCache: {},

  // maps OSM IDs (stringified) to Photon GeoJSON hashes
  osmCache: {},

  // recently used locations
  // each record contains {
  //    feature: /* Photon GeoJSON feature */,
  //    lastUsed: /* time of last use as returned from Date.now() */
  // }
  recentlyUsed: [],
};

export function geocodingReducer(state = DEFAULT_STATE, action) {
  switch (action.type) {
    case 'geocode_attempted':
      return produce(state, (draft) => {
        draft.typeaheadCache['@' + action.text] = {
          status: 'fetching',
          time: action.time,
        };
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
        const osmIds = [];
        // TODO: Denormalize and somehow save both osm_key/osm_value pairs when we get dupes
        const dedupedFeatures = uniqBy(action.features, 'properties.osm_id');

        for (const feat of dedupedFeatures) {
          const id = feat.properties.osm_id;
          if (id !== osmIds[osmIds.length - 1]) {
            osmIds.push(id);
            draft.osmCache[id] = feat;
          }
        }
        draft.typeaheadCache['@' + action.text] = {
          status: 'succeeded',
          time: action.time,
          osmIds,
        };
      });
    default:
      return state;
  }
}

// Actions

// Only for use in the action creator below, for debouncing.
const _LOCATION_TYPED_ACTION_LAST_TEXT_FOR_KEY = {};

// The user has typed some text representing a location (which may be
// incomplete). That's our cue to try geocoding it. The key is used to
// debounce, e.g. 'start' vs 'end' location.
export function geocodeTypedLocation(text, key, { fromTextAutocomplete } = {}) {
  return async function geocodeTypedLocationThunk(dispatch, getState) {
    text = text.trim();
    if (text === '') return;

    _LOCATION_TYPED_ACTION_LAST_TEXT_FOR_KEY[key] = text;

    if (fromTextAutocomplete) {
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
        alert: alertOnFailure && { message: alertMsg },
      });
      return;
    }

    if (result.type !== 'FeatureCollection') {
      dispatch({
        type: 'geocode_failed',
        text,
        failureType: 'not a FeatureCollection',
        time: Date.now(),
        alert: alertOnFailure && { message: `Couldn't find ${text}` },
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
        alert: alertOnFailure && { message: `Couldn't find ${text}` },
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
