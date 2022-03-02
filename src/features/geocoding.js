import produce from 'immer';
import * as BikehopperClient from '../lib/BikehopperClient';
import delay from '../lib/delay';

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
export function locationTyped(text, key) {
  return async function locationTypedThunk(dispatch, getState) {
    _LOCATION_TYPED_ACTION_LAST_TEXT_FOR_KEY[key] = text;

    // Debounce
    await delay(700);
    if (_LOCATION_TYPED_ACTION_LAST_TEXT_FOR_KEY[key] !== text) return;

    dispatch({
      type: 'geocode_attempted',
      text,
      time: new Date(),
    });

    let result;
    try {
      result = await BikehopperClient.geocode(text, {});
    } catch (e) {
      dispatch({
        type: 'geocode_failed',
        text,
        failureType: 'network error',
        time: new Date(),
      });
      return;
    }

    if (result.type !== 'FeatureCollection') {
      dispatch({
        type: 'geocode_failed',
        text,
        failureType: 'not a FeatureCollection',
        time: new Date(),
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
        time: new Date(),
      });
      return;
    }

    dispatch({
      type: 'geocode_succeeded',
      text,
      features: resultPoints,
      time: new Date(),
    });
  };
}
