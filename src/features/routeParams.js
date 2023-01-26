import produce from 'immer';
import * as turf from '@turf/helpers';
import describePlace from '../lib/describePlace';
import { geocodeTypedLocation } from './geocoding';
import { geolocate } from './geolocation';
import { fetchRoute } from './routes';

export const LocationSourceType = {
  Geocoded: 'geocoded',
  Marker: 'marker_drag',
  UserGeolocation: 'user_geolocation',
  UrlWithString: 'url_with_string',
  UrlWithoutString: 'url_without_string',
};

const DEFAULT_STATE = {
  // When set, start and end have the format: {
  //   point: a geoJSON point (can be null if source === UserGeolocation),
  //   source: a LocationSourceType,
  //   fromInputText: the source input text (if source === Geocoded or UrlWithString),
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
  arriveBy: false,
  // If initialTime == null, this means depart now (should be used with
  // arriveBy === false)
  initialTime: null,
};

export function routeParamsReducer(state = DEFAULT_STATE, action) {
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
    case 'params_hydrated_from_url':
      return produce(state, (draft) => {
        draft.start = {
          point: turf.point(action.startCoords),
          source: action.startText
            ? LocationSourceType.UrlWithString
            : LocationSourceType.UrlWithoutString,
          fromInputText: action.startText || null,
        };
        draft.end = {
          point: turf.point(action.endCoords),
          source: action.endText
            ? LocationSourceType.UrlWithString
            : LocationSourceType.UrlWithoutString,
          fromInputText: action.endText || null,
        };
        draft.startInputText = action.startText || '';
        draft.endInputText = action.endText || '';
        draft.arriveBy = action.arriveBy;
        draft.initialTime = action.initialTime;
      });
    case 'location_input_focused':
      return produce(state, (draft) => {
        draft.editingLocation = action.startOrEnd;
      });
    case 'enter_destination_focused':
      return produce(state, (draft) => {
        draft.editingLocation = 'end';
        // TODO don't default start to current location on desktop
        draft.start = {
          point: null,
          source: LocationSourceType.UserGeolocation,
        };
      });
    case 'route_fetch_attempted':
      return produce(state, (draft) => {
        draft.editingLocation = null;
      });
    case 'search_blurred_with_unchanged_locations':
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
          point: null, // To be hydrated by a later action
          source: LocationSourceType.UserGeolocation,
        };
        draft[action.startOrEnd + 'InputText'] = '';
      });
    case 'geolocate_failed':
      // If we were waiting on geolocation to hydrate a location, clear it
      return produce(state, (draft) => {
        if (
          state.start?.source === LocationSourceType.UserGeolocation &&
          !state.start.point
        ) {
          draft.start = null;
          draft.startInputText = '';
        }
        if (
          state.end?.source === LocationSourceType.UserGeolocation &&
          !state.end.point
        ) {
          draft.end = null;
          draft.endInputText = '';
        }
      });
    case 'location_text_input_changed':
      return produce(state, (draft) => {
        draft[action.startOrEnd + 'InputText'] = action.value;

        // Hack: In order to make it possible to clear out "Current Location,"
        // we must empty out the location value if the corresponding text
        // changes, in this case.
        if (
          state[action.startOrEnd]?.source ===
          LocationSourceType.UserGeolocation
        ) {
          draft[action.startOrEnd] = null;
        }
      });
    case 'route_params_cleared':
      return produce(state, (draft) => {
        draft.start = null;
        draft.end = null;
        draft.editingLocation = null;
        draft.startInputText = '';
        draft.endInputText = '';
        draft.endInputText = '';
        draft.arriveBy = false;
        draft.initialTime = null;
      });
    case 'initial_time_set':
      return produce(state, (draft) => {
        draft.initialTime = action.initialTime;
        if (action.initialTime == null) draft.arriveBy = false;
      });
    case 'departure_type_selected':
      return produce(state, (draft) => {
        draft.arriveBy = action.departureType === 'arriveBy';
        if (action.departureType === 'now') {
          draft.initialTime = null;
        } else if (action.departureType === 'departAt') {
          // Default the departure time to something reasonable
          if (
            draft.initialTime == null ||
            draft.initialTime < action.defaultDepartureTime
          ) {
            draft.initialTime = action.defaultDepartureTime;
          }
        } else if (action.departureType === 'arriveBy') {
          // Default the arrival time to something reasonable
          // (2 hours past current time)
          const reasonableArrivalTime =
            action.defaultDepartureTime + 120 * 60 * 1000;
          if (
            draft.initialTime == null ||
            draft.initialTime < reasonableArrivalTime
          ) {
            draft.initialTime = reasonableArrivalTime;
          }
        }
      });
    default:
      return state;
  }
}

// Actions

// This can be triggered either directly by pressing Enter in the location
// input form (or the mobile equivalent: submitting the form), or indirectly
// from other actions that call it as a helper function.
//
// If we have start and end location info, hydrate the locations if possible
// and then fetch routes. Hydrating can mean geocoding input text or finding
// the current geolocation if a location has source type UserGeolocation.
export function locationsSubmitted() {
  return async function locationsSubmittedThunk(dispatch, getState) {
    const { start, startInputText, end, endInputText, initialTime, arriveBy } =
      getState().routeParams;

    const hydrate = async function hydrate(text, location, startOrEnd) {
      // Decide whether to use the text or location:
      let useLocation = false;

      // If text WAS an address string from the geocoder (or hydrated from URL), and the
      // user explicitly blanked it out, let them blank it out. But otherwise, empty text
      // means fall back to location.
      if (
        text === '' &&
        location &&
        location.source !== LocationSourceType.Geocoded
      ) {
        useLocation = true;
      } else if (
        location &&
        location.source === LocationSourceType.Geocoded &&
        text === describePlace(location.point)
      ) {
        // Stick with geocoded location if the text is its exact description
        useLocation = true;
      } else if (
        location &&
        location.source === LocationSourceType.UrlWithString &&
        text === location.fromInputText
      ) {
        useLocation = true;
      }

      if (!useLocation) {
        text = text.trim();

        let geocodingState = getState().geocoding;
        let cacheEntry = geocodingState.typeaheadCache['@' + text];
        if (cacheEntry && cacheEntry.status === 'succeeded') {
          return {
            point: geocodingState.osmCache[cacheEntry.osmIds[0]],
            source: LocationSourceType.Geocoded,
          };
        }

        await geocodeTypedLocation(text, startOrEnd, {
          fromTextAutocomplete: false,
        })(dispatch, getState);

        // check again if geocoding succeeded (there's no direct return value)
        geocodingState = getState().geocoding;
        cacheEntry = geocodingState.typeaheadCache['@' + text];
        if (cacheEntry && cacheEntry.status === 'succeeded') {
          return {
            point: geocodingState.osmCache[cacheEntry.osmIds[0]],
            source: LocationSourceType.Geocoded,
          };
        }

        return null;
      } else if (location.source === LocationSourceType.UserGeolocation) {
        // Always geolocate anew; never use the stored point. Geolocation does its own
        // short-term caching.
        await dispatch(geolocate());

        const { lng, lat } = getState().geolocation;
        if (lng == null || lat == null) return null;
        return {
          point: turf.point([lng, lat]),
          source: LocationSourceType.UserGeolocation,
        };
      } else if (location.point) {
        // If we already have a point, not from geolocation, pass through
        return location;
      } else {
        console.error('expected location.point');
        return null;
      }
    };

    const [resultingStartLocation, resultingEndLocation] = (
      await Promise.allSettled([
        hydrate(startInputText, start, 'start'),
        hydrate(endInputText, end, 'end'),
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
        arriveBy,
        initialTime,
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
    let { start, end, arriveBy, initialTime } = getState().routeParams;
    if (startOrEnd === 'start' && end?.point?.geometry.coordinates) {
      await fetchRoute(
        coords,
        end.point.geometry.coordinates,
        arriveBy,
        initialTime,
      )(dispatch, getState);
    } else if (startOrEnd === 'end' && start?.point?.geometry.coordinates) {
      await fetchRoute(
        start.point.geometry.coordinates,
        coords,
        arriveBy,
        initialTime,
      )(dispatch, getState);
    }
  };
}

export function hydrateParamsFromUrl(
  startCoords,
  endCoords,
  startText = '',
  endText = '',
  arriveBy,
  initialTime,
) {
  return async function hydrateParamsFromUrlThunk(dispatch, getState) {
    dispatch({
      type: 'params_hydrated_from_url',
      startCoords,
      endCoords,
      startText,
      endText,
      arriveBy,
      initialTime,
    });
    await fetchRoute(
      startCoords,
      endCoords,
      arriveBy,
      initialTime,
    )(dispatch, getState);
  };
}

export function locationInputFocused(startOrEnd) {
  return {
    type: 'location_input_focused',
    startOrEnd,
  };
}

export function enterDestinationFocused() {
  return {
    type: 'enter_destination_focused',
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
      geocodeTypedLocation(value, startOrEnd, { fromTextAutocomplete: true }),
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

    dispatch(locationsSubmitted());
  };
}

export function selectCurrentLocation(startOrEnd) {
  return async function selectCurrentLocationThunk(dispatch, getState) {
    dispatch({
      type: 'current_location_selected',
      startOrEnd,
    });

    dispatch(locationsSubmitted());
  };
}

export function clearRouteParams() {
  return {
    type: 'route_params_cleared',
  };
}

export function blurSearchWithUnchangedLocations() {
  // When you focus the start or end input but then blur it without changing existing
  // (geocoded, geolocated, marker dragged, etc.) locations.
  return {
    type: 'search_blurred_with_unchanged_locations',
  };
}

export function swapLocations() {
  return async function swapLocationsThunk(dispatch, getState) {
    dispatch({
      type: 'locations_swapped',
    });

    dispatch(locationsSubmitted());
  };
}

export function initialTimeSet(initialTime) {
  return async function initialTimeSetThunk(dispatch, getState) {
    dispatch({
      type: 'initial_time_set',
      initialTime,
    });

    // If we have a location, fetch a route.
    dispatch(locationsSubmitted());
  };
}

export function departureTypeSelected(departureType) {
  // departureType should be 'departAt', 'arriveBy', or 'now'
  return async function departureTypeSelectedThunk(dispatch, getState) {
    dispatch({
      type: 'departure_type_selected',
      departureType,
      // This default departure time is used if you switch from 'Now' to
      // 'Depart At' or 'Arrive By'. Why fetch the current datetime here in the
      // action creator? So the reducer can stay purely functional.
      defaultDepartureTime: Date.now(),
    });

    // If we have a location, fetch a route.
    dispatch(locationsSubmitted());
  };
}
