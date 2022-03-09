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
  isEditingLocations: false,
  userPoint: null,
  startPoint: null,
  startSource: LocationSourceType.None,
  endPoint: null,
  endSource: LocationSourceType.None,
};

export function locationsReducer(state = DEFAULT_STATE, action) {
  switch (action.type) {
    case 'locations_set':
      return produce(state, (draft) => {
        draft.startPoint = action.startPoint;
        draft.startSource = action.startSource;
        draft.endPoint = action.endPoint;
        draft.endSource = action.endSource;
        if (action.startPoint && action.endPoint)
          draft.isEditingLocations = false;
      });
    case 'location_input_focused':
      return { ...state, isEditingLocations: true };
    case 'geolocation_set':
      const point = turf.point(action.coords);
      return produce(state, (draft) => {
        draft.startPoint = point;
        draft.startSource = LocationSourceType.UserGeolocation;
        draft.userPoint = point;
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
      startPoint,
      LocationSourceType.Geocoded,
      endPoint,
      LocationSourceType.Geocoded,
    );
  };
}

export function locationDragged(startOrEnd, coords) {
  return async function locationDraggedThunk(dispatch, getState) {
    let { startPoint, endPoint, startSource, endSource } = getState().locations;

    // This might be a sign that the data format should change... turning a raw
    // pair of coords into something that looks as if we got it from Nominatim.
    const pointFromCoords = { geometry: { coordinates: coords } };

    if (startOrEnd === 'start') {
      startPoint = pointFromCoords;
      startSource = LocationSourceType.Marker;
    } else {
      endPoint = pointFromCoords;
      endSource = LocationSourceType.Marker;
    }

    await _setLocationsAndMaybeFetchRoute(
      dispatch,
      getState,
      startPoint,
      startSource,
      endPoint,
      endSource,
    );
  };
}

async function _setLocationsAndMaybeFetchRoute(
  dispatch,
  getState,
  startPoint,
  startSource,
  endPoint,
  endSource,
) {
  dispatch({
    type: 'locations_set',
    startPoint,
    startSource,
    endPoint,
    endSource,
  });

  if (startPoint && endPoint) {
    await fetchRoute(
      startPoint.geometry.coordinates,
      endPoint.geometry.coordinates,
    )(dispatch, getState);
  }
}

export function locationInputFocused() {
  return {
    type: 'location_input_focused',
  };
}

export function userLocationUpdated(evt) {
  return {
    type: 'geolocation_set',
    coords: [evt.coords.longitude, evt.coords.latitude],
  };
}
