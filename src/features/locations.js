import produce from 'immer';
import * as turf from '@turf/helpers';
import describePlace from '../lib/describePlace';
import { geocodeTypedLocation } from './geocoding';
import { fetchRoute } from './routes';

export const LocationSourceType = {
  Geocoded: 'geocoded',
  Marker: 'marker_drag',
  UserGeolocation: 'user_geolocation',
};

const DEFAULT_STATE = {
  // When set, start and end have the format: {
  //   point: a geoJSON point,
  //   source: a LocationSourceType,
  //   fromInputText: the source input text (if source === Geocoded),
  // }
  start: null,
  end: null,

  // Transient input state. Which location input ('start', 'end' or null) is
  // currently being edited, and what text is in the box (which may not yet be
  // reflected in the above state)? Note: if a location input is focused, it
  // should be reflected in editingLocation, but editingLocation being set may
  // not necessarily mean a location input is focused.
  editingLocation: null,
  startInputText: '',
  endInputText: '',
};

export function locationsReducer(state = DEFAULT_STATE, action) {
  switch (action.type) {
    case 'locations_set':
      return produce(state, (draft) => {
        draft.start = action.start;
        draft.end = action.end;
        if (action.start && action.end) draft.editingLocation = null;
      });
    case 'location_dragged':
      return produce(state, (draft) => {
        draft[action.startOrEnd] = {
          point: turf.point(action.coords),
          source: LocationSourceType.Marker,
        };
        draft[action.startOrEnd + 'InputText'] = '';
      });
    case 'location_input_focused':
      return produce(state, (draft) => {
        draft.editingLocation = action.startOrEnd;
      });
    case 'route_fetch_attempted':
      return produce(state, (draft) => {
        draft.editingLocation = null;
      });
    case 'geocoded_location_selected':
      return produce(state, (draft) => {
        draft[action.startOrEnd] = {
          point: action.point,
          source: LocationSourceType.Geocoded,
          fromInputText: action.fromInputText,
        };
        draft[action.startOrEnd + 'InputText'] = describePlace(action.point);
        // This probably will result in editingLocation changing but other
        // actions should take care of that
      });
    case 'location_text_input_changed':
      return produce(state, (draft) => {
        draft[action.startOrEnd + 'InputText'] = action.value;
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

    dispatch({
      type: 'locations_set',
      start: resultingStartLocation,
      end: resultingEndLocation,
    });

    if (resultingStartLocation && resultingEndLocation) {
      await fetchRoute(
        resultingStartLocation.point.geometry.coordinates,
        resultingEndLocation.point.geometry.coordinates,
      )(dispatch, getState);
    }
  };
}

export function locationDragged(startOrEnd, coords) {
  return async function locationDraggedThunk(dispatch, getState) {
    dispatch({
      type: 'location_dragged',
      startOrEnd,
      coords,
    });

    // If we have a location for the other point, fetch a route.
    let { start, end } = getState().locations;
    if (startOrEnd === 'start' && end?.point?.geometry.coordinates) {
      await fetchRoute(coords, end.point.geometry.coordinates)(
        dispatch,
        getState,
      );
    } else if (startOrEnd === 'end' && start?.point?.geometry.coordinates) {
      await fetchRoute(start.point.geometry.coordinates, coords)(
        dispatch,
        getState,
      );
    }
  };
}

export function locationInputFocused(startOrEnd) {
  return {
    type: 'location_input_focused',
    startOrEnd,
  };
}

export function changeLocationTextInput(startOrEnd, value) {
  return async function locationTextInputChangedThunk(dispatch, getState) {
    dispatch({
      type: 'location_text_input_changed',
      startOrEnd,
      value,
    });

    dispatch(
      geocodeTypedLocation(value, startOrEnd, { possiblyIncomplete: true }),
    );
  };
}

export function selectGeocodedLocation(startOrEnd, point, fromInputText) {
  return async function selectGeocodedLocationThunk(dispatch, getState) {
    dispatch({
      type: 'geocoded_location_selected',
      startOrEnd,
      point,
      fromInputText,
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
