import produce from 'immer';
import { geocodeTypedLocation } from './geocoding';
import { fetchRoute } from './routes';
import * as turf from '@turf/helpers';

export const LocationSourceType = {
  Geocoded: 'geocoded',
  Marker: 'marker_drag',
  UserGeolocation: 'user_geolocation',
};

const DEFAULT_STATE = {
  // When set, start and end have the format: {
  //   point: a geoJSON point,
  //   source: a LocationSourceType,
  // }
  start: null,
  end: null,
  isEditingLocations: false,
};

export function locationsReducer(state = DEFAULT_STATE, action) {
  switch (action.type) {
    case 'locations_set':
      return produce(state, (draft) => {
        draft.start = action.start;
        draft.end = action.end;
        if (action.start && action.end) draft.isEditingLocations = false;
      });
    case 'location_input_focused':
      return produce(state, (draft) => {
        draft.isEditingLocations = true;
      });
    case 'geocoded_location_selected':
      return produce(state, (draft) => {
        draft[action.startOrEnd] = {
          point: action.point,
          source: LocationSourceType.Geocoded,
        };
      });
    default:
      return state;
  }
}

// Actions

export function locationsSubmitted(startTextOrLocation, endTextOrLocation) {
  return async function locationsSubmittedThunk(dispatch, getState) {
    const geocodeOrUseCached = async function geocodeOrUseCached(
      textOrLocation,
      startOrEnd,
    ) {
      // If it's already a point (not text), pass through
      if (typeof textOrLocation !== 'string') return textOrLocation;

      const text = textOrLocation.trim();

      let cacheEntry = getState().geocoding.cache['@' + text];
      if (cacheEntry && cacheEntry.status === 'succeeded') {
        return {
          point: cacheEntry.features[0],
          source: LocationSourceType.Geocoded,
        };
      }

      await geocodeTypedLocation(text, startOrEnd, {
        possiblyIncomplete: false,
      })(dispatch, getState);

      // check again if geocoding succeeded (there's no direct return value)
      cacheEntry = getState().geocoding.cache['@' + text];
      if (cacheEntry && cacheEntry.status === 'succeeded') {
        return {
          point: cacheEntry.features[0],
          source: LocationSourceType.Geocoded,
        };
      }

      return null;
    };

    const [resultingStartLocation, resultingEndLocation] = (
      await Promise.allSettled([
        geocodeOrUseCached(startTextOrLocation, 'start'),
        geocodeOrUseCached(endTextOrLocation, 'end'),
      ])
    ).map((promiseResult) =>
      promiseResult.status === 'fulfilled' ? promiseResult.value : null,
    );

    await _setLocationsAndMaybeFetchRoute(
      dispatch,
      getState,
      resultingStartLocation,
      resultingEndLocation,
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

  if (start && end) {
    await fetchRoute(
      start.point.geometry.coordinates,
      end.point.geometry.coordinates,
    )(dispatch, getState);
  }
}

export function locationInputFocused() {
  return {
    type: 'location_input_focused',
  };
}

export function selectGeocodedLocation(startOrEnd, point) {
  return async function selectGeocodedLocationThunk(dispatch, getState) {
    dispatch({
      type: 'geocoded_location_selected',
      startOrEnd,
      point,
    });

    // If this was the end point, and we have a start point -- or vice versa --
    // fetch the route.

    const { locations } = getState();
    if (startOrEnd === 'end' && locations.start) {
      await fetchRoute(
        locations.start.point.geometry.coordinates,
        point.geometry.coordinates,
      )(dispatch, getState);
    } else if (startOrEnd === 'start' && locations.end) {
      await fetchRoute(
        point.geometry.coordinates,
        locations.end.point.geometry.coordinates,
      )(dispatch, getState);
    }
  };
}
