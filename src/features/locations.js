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
    case 'locations_swapped':
      return produce(state, (draft) => {
        draft.start = state.end;
        draft.end = state.start;
        draft.startInputText = state.endInputText;
        draft.endInputText = state.startInputText;
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
    case 'current_location_selected':
      return produce(state, (draft) => {
        draft[action.startOrEnd] = {
          point: action.point,
          source: LocationSourceType.UserGeolocation,
        };
        draft[action.startOrEnd + 'InputText'] = '';
      });
    case 'geolocated':
      return produce(state, (draft) => {
        const isInNullState =
          !state.start &&
          !state.end &&
          !state.startInputText &&
          !state.endInputText &&
          !state.editingLocation;
        if (isInNullState) {
          // Default to routing from current location now that we have one
          draft.start = {
            point: turf.point([
              action.coords.longitude,
              action.coords.latitude,
            ]),
            source: LocationSourceType.UserGeolocation,
          };
        }
      });
    case 'location_text_input_changed':
      return produce(state, (draft) => {
        draft[action.startOrEnd + 'InputText'] = action.value;
      });
    case 'locations_cleared':
      return produce(state, (draft) => {
        draft.start = null;
        draft.end = null;
        draft.editingLocation = null;
        draft.startInputText = '';
        draft.endInputText = '';
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
    const { start, end } = getState().locations;
    if (
      start?.point?.geometry.coordinates &&
      end?.point?.geometry.coordinates
    ) {
      await fetchRoute(
        start.point.geometry.coordinates,
        end.point.geometry.coordinates,
      )(dispatch, getState);
    }
  };
}

export function selectCurrentLocation(startOrEnd) {
  return async function selectCurrentLocationThunk(dispatch, getState) {
    const { lng, lat } = getState().geolocation;
    if (lng == null || lat == null) {
      // shouldn't happen
      console.error('selected current location but have none');
      return;
    }

    dispatch({
      type: 'current_location_selected',
      startOrEnd,
      point: turf.point([lng, lat]),
    });

    // If this was the start point, and we have an end point -- or vice versa --
    // fetch the route.
    const { start, end } = getState().locations;
    if (
      start?.point?.geometry.coordinates &&
      end?.point?.geometry.coordinates
    ) {
      await fetchRoute(
        start.point.geometry.coordinates,
        end.point.geometry.coordinates,
      )(dispatch, getState);
    }
  };
}

export function clearLocations() {
  return {
    type: 'locations_cleared',
  };
}

export function swapLocations() {
  return {
    type: 'locations_swapped',
  };
}
