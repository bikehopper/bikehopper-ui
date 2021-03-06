import produce from 'immer';
import * as BikehopperClient from '../lib/BikehopperClient';
import delay from '../lib/delay';

const GEOCODE_RESULT_LIMIT = 5;

const DEFAULT_STATE = {
  // maps location strings to geocoded results.
  // all location strings are prefixed with '@' to avoid collisions w built-in attributes.
  cache: {},
};

export function geocodingReducer(state = DEFAULT_STATE, action) {
  switch (action.type) {
    case 'geocode_attempted':
      return produce(state, (draft) => {
        draft.cache['@' + action.text] = {
          status: 'fetching',
          time: action.time,
        };
      });
    case 'geocode_failed':
      return produce(state, (draft) => {
        draft.cache['@' + action.text] = {
          status: 'failed',
          time: action.time,
        };
      });
    case 'geocode_succeeded':
      return produce(state, (draft) => {
        draft.cache['@' + action.text] = {
          status: 'succeeded',
          time: action.time,
          features: action.features,
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
      dispatch({
        type: 'geocode_failed',
        text,
        failureType: 'network error',
        time: Date.now(),
        alert: alertOnFailure && { message: "Can't connect to server" },
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
