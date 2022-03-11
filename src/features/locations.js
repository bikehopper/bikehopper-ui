import produce from 'immer';
import { geocodeTypedLocation } from './geocoding';
import { fetchRoute } from './routes';
import * as turf from '@turf/helpers';

export const LocationSourceType = {
  None: 'none',
  Geocoded: 'geocoded',
  Marker: 'marker_drag',
  UserGeolocation: 'user_geolocation',
};

const DEFAULT_STATE = {
  start: { point: null, source: LocationSourceType.None, editing: false },
  end: { point: null, source: LocationSourceType.None, editing: false },
};

export function locationsReducer(state = DEFAULT_STATE, action) {
  switch (action.type) {
    case 'locations_set':
      return produce(state, (draft) => {
        if (action.start) {
          draft.start = {
            point: action.start.point,
            source: action.start.source,
            editing: false,
          };
        }
        if (action.end) {
          draft.end = {
            point: action.end.point,
            source: action.end.source,
            editing: false,
          };
        }
      });
    case 'location_input_focused':
      return produce(state, (draft) => {
        draft[action.startOrEnd].editing = true;
      });
    default:
      return state;
  }
}

// Actions

export function locationsSubmitted(startText, endText) {
  // Note: may want to modify this later to accept start and/or end already
  // being resolved to a confirmed location, possibly the current location, and
  // so not just text.
  return async function locationsSubmittedThunk(dispatch, getState) {
    const geocodeOrUseCached = async function geocodeOrUseCached(
      text,
      startOrEnd,
    ) {
      let cacheEntry = getState().geocoding.cache['@' + text];
      if (cacheEntry && cacheEntry.status === 'succeeded')
        return cacheEntry.features[0];

      await geocodeTypedLocation(text, startOrEnd, {
        possiblyIncomplete: false,
      })(dispatch, getState);

      // check again if geocoding succeeded (there's no direct return value)
      cacheEntry = getState().geocoding.cache['@' + text];
      if (cacheEntry && cacheEntry.status === 'succeeded')
        return cacheEntry.features[0];

      return null;
    };

    startText = startText.trim();
    endText = endText.trim();

    const [startPoint, endPoint] = (
      await Promise.allSettled([
        geocodeOrUseCached(startText, 'start'),
        geocodeOrUseCached(endText, 'end'),
      ])
    ).map((promiseResult) =>
      promiseResult.status === 'fulfilled' ? promiseResult.value : null,
    );

    await _setLocationsAndMaybeFetchRoute(
      dispatch,
      getState,
      startPoint
        ? { point: startPoint, source: LocationSourceType.Geocoded }
        : null,
      endPoint
        ? { point: endPoint, source: LocationSourceType.Geocoded }
        : null,
    );
  };
}

export function locationDragged(startOrEnd, coords) {
  return async function locationDraggedThunk(dispatch, getState) {
    let { start, end } = getState().locations;
    const pointFromCoords = turf.point(coords);

    if (startOrEnd === 'start') {
      start = {
        point: pointFromCoords,
        source: LocationSourceType.Marker,
      };
    } else {
      end = {
        point: pointFromCoords,
        source: LocationSourceType.Marker,
      };
    }

    await _setLocationsAndMaybeFetchRoute(dispatch, getState, start, end);
  };
}

async function _setLocationsAndMaybeFetchRoute(dispatch, getState, start, end) {
  dispatch({
    type: 'locations_set',
    start,
    end,
  });

  await fetchRoute()(dispatch, getState);
}

export function locationInputFocused(startOrEnd) {
  return {
    type: 'location_input_focused',
    startOrEnd,
  };
}
