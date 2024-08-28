import produce from 'immer';
import type { Action } from 'redux';
import { point as turfPoint } from '@turf/helpers';
import describePlace from '../lib/describePlace';
import * as TransitModes from '../lib/TransitModes';
import type { ModeCategory } from '../lib/TransitModes';
import { geocodeTypedLocation } from './geocoding';
import type { PhotonOsmHash } from '../lib/BikeHopperClient';
import { geolocate } from './geolocation';
import { fetchRoute } from './routes';
import type { BikeHopperAction, BikeHopperThunkAction } from '../store';

export enum LocationSourceType {
  Geocoded = 'geocoded',
  SelectedOnMap = 'selected_on_map', // marker drag or long-press/right-click
  UserGeolocation = 'user_geolocation',
  UrlWithString = 'url_with_string',
  UrlWithoutString = 'url_without_string',
}

type Location =
  | {
      source: LocationSourceType.UserGeolocation;
      point: GeoJSON.Feature<GeoJSON.Point> | null;
    }
  | {
      source: LocationSourceType.Geocoded;
      point: PhotonOsmHash;
      fromInputText: string;
    }
  | {
      source: LocationSourceType.UrlWithString;
      point: GeoJSON.Feature<GeoJSON.Point>;
      fromInputText: string;
    }
  | {
      source:
        | LocationSourceType.SelectedOnMap
        | LocationSourceType.UrlWithoutString;
      point: GeoJSON.Feature<GeoJSON.Point>;
    };

type StartOrEnd = 'start' | 'end';

type RouteParamsState = {
  start: Location | null;
  end: Location | null;

  // Transient input state. Which location input ('start', 'end' or null) is
  // currently being edited, and what text is in the box (which may not yet be
  // reflected in the above state)? Note: if a location input is focused, it
  // should be reflected in editingLocation, but editingLocation being set may
  // not necessarily mean a location input is focused.
  editingLocation: StartOrEnd | null;

  startInputText: string;
  endInputText: string;

  arriveBy: boolean;
  // If initialTime == null, this means depart now (should be used with
  // arriveBy === false)
  initialTime: number | null;

  // Transit modes that can be used
  connectingModes: ModeCategory[];

  // Can we default to geolocating for the start location?
  canDefaultStartToGeolocation: boolean;
};

const DEFAULT_STATE: RouteParamsState = {
  start: null,
  end: null,
  editingLocation: null,
  startInputText: '',
  endInputText: '',
  arriveBy: false,
  initialTime: null,
  connectingModes: [
    TransitModes.CATEGORIES.BUSES,
    TransitModes.CATEGORIES.TRAINS,
    TransitModes.CATEGORIES.FERRIES,
  ],
  canDefaultStartToGeolocation: true,
};

export function routeParamsReducer(
  state = DEFAULT_STATE,
  action: BikeHopperAction,
): RouteParamsState {
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
    case 'location_selected_on_map':
      return produce(state, (draft) => {
        draft[action.startOrEnd] = {
          point: turfPoint(action.coords),
          source: LocationSourceType.SelectedOnMap,
        };
        draft[startOrEndInputText(action.startOrEnd)] = '';
        if (
          action.startOrEnd === 'end' &&
          state.start == null &&
          state.canDefaultStartToGeolocation
        ) {
          // if no start point, and "directions to" was selected,
          // route from current location.
          draft.start = {
            point: null,
            source: LocationSourceType.UserGeolocation,
          };
        }
      });
    case 'params_hydrated_from_url':
      return produce(state, (draft) => {
        if (action.startText) {
          draft.start = {
            point: turfPoint(action.startCoords),
            source: LocationSourceType.UrlWithString,
            fromInputText: action.startText,
          };
        } else {
          draft.start = {
            point: turfPoint(action.startCoords),
            source: LocationSourceType.UrlWithoutString,
          };
        }

        if (action.endText) {
          draft.end = {
            point: turfPoint(action.endCoords),
            source: LocationSourceType.UrlWithString,
            fromInputText: action.endText,
          };
        } else {
          draft.end = {
            point: turfPoint(action.endCoords),
            source: LocationSourceType.UrlWithoutString,
          };
        }
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
        if (state.canDefaultStartToGeolocation) {
          draft.start = {
            point: null,
            source: LocationSourceType.UserGeolocation,
          };
        }
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
        draft[startOrEndInputText(action.startOrEnd)] = describePlace(
          action.point,
        );
        // This probably will result in editingLocation changing but other
        // actions should take care of that
      });
    case 'current_location_selected':
      return produce(state, (draft) => {
        draft[action.startOrEnd] = {
          point: null, // To be hydrated by a later action
          source: LocationSourceType.UserGeolocation,
        };
        draft[startOrEndInputText(action.startOrEnd)] = '';
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

        // If we were denied permission, don't try to default to geolocation
        // next time.
        if (action.code === window.GeolocationPositionError.PERMISSION_DENIED) {
          draft.canDefaultStartToGeolocation = false;
        }
      });
    case 'geolocated':
      return produce(state, (draft) => {
        // Since geolocation has worked, we can default to it again (if we
        // stopped trying).
        draft.canDefaultStartToGeolocation = true;
      });
    case 'location_text_input_changed':
      return produce(state, (draft) => {
        draft[startOrEndInputText(action.startOrEnd)] = action.value;

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
    case 'departure_changed':
      return produce(state, (draft) => {
        draft.arriveBy =
          action.departureType === 'arriveBy' && action.initialTime != null;
        draft.initialTime =
          action.departureType === 'now' ? null : action.initialTime;
      });
    case 'connecting_modes_changed':
      return produce(state, (draft) => {
        draft.connectingModes = [...action.connectingModes];
      });
    default:
      return state;
  }
}

// Utility to help dynamic property accesses typecheck
function startOrEndInputText(startOrEnd: StartOrEnd) {
  return startOrEnd === 'start' ? 'startInputText' : 'endInputText';
}

// Actions

type LocationsSetAction = Action<'locations_set'> & {
  start: Location | null;
  end: Location | null;
};

// This can be triggered either directly by pressing Enter in the location
// input form (or the mobile equivalent: submitting the form), or indirectly
// from other actions that call it as a helper function.
//
// If we have start and end location info, hydrate the locations if possible
// and then fetch routes. Hydrating can mean geocoding input text or finding
// the current geolocation if a location has source type UserGeolocation.
export function locationsSubmitted(): BikeHopperThunkAction {
  return async function locationsSubmittedThunk(dispatch, getState) {
    const {
      start,
      startInputText,
      end,
      endInputText,
      initialTime,
      arriveBy,
      connectingModes,
    } = getState().routeParams;

    const hydrate = async function hydrate(
      text: string,
      location: Location | null,
      startOrEnd: StartOrEnd,
    ): Promise<Location | null> {
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
            fromInputText: text,
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
            fromInputText: text,
          };
        }

        return null;
      } else if (location?.source === LocationSourceType.UserGeolocation) {
        // Always geolocate anew; never use the stored point. Geolocation does its own
        // short-term caching.
        await dispatch(geolocate());

        const { lng, lat } = getState().geolocation;
        if (lng == null || lat == null) return null;
        return {
          point: turfPoint([lng, lat]),
          source: LocationSourceType.UserGeolocation,
        };
      } else if (location?.point) {
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

    // If locations have since been changed, do nothing.
    // (This can happen if a geocode/geolocate took a long time and in the
    // meantime the user changed the location to a different one.)
    const routeParamsAfterHydration = getState().routeParams;
    if (
      routeParamsAfterHydration.start !== start ||
      routeParamsAfterHydration.startInputText !== startInputText ||
      routeParamsAfterHydration.end !== end ||
      routeParamsAfterHydration.endInputText !== endInputText
    ) {
      return;
    }

    dispatch({
      type: 'locations_set',
      start: resultingStartLocation,
      end: resultingEndLocation,
    });

    if (resultingStartLocation?.point && resultingEndLocation?.point) {
      await fetchRoute(
        resultingStartLocation.point.geometry.coordinates,
        resultingEndLocation.point.geometry.coordinates,
        arriveBy,
        initialTime,
        _computeBlockRouteTypes(connectingModes),
      )(dispatch, getState);
    }
  };
}

type LocationDraggedAction = Action<'location_dragged'> & {
  startOrEnd: StartOrEnd;
  coords: [number, number];
};

export function locationDragged(
  startOrEnd: StartOrEnd,
  coords: [number, number],
): BikeHopperThunkAction {
  return async function locationDraggedThunk(dispatch, getState) {
    dispatch({
      type: 'location_dragged',
      startOrEnd,
      coords,
    });

    // If we have a location for the other point, fetch a route.
    let { start, end, arriveBy, initialTime, connectingModes } =
      getState().routeParams;
    if (startOrEnd === 'start' && end?.point?.geometry.coordinates) {
      await fetchRoute(
        coords,
        end.point.geometry.coordinates,
        arriveBy,
        initialTime,
        _computeBlockRouteTypes(connectingModes),
      )(dispatch, getState);
    } else if (startOrEnd === 'end' && start?.point?.geometry.coordinates) {
      await fetchRoute(
        start.point.geometry.coordinates,
        coords,
        arriveBy,
        initialTime,
        _computeBlockRouteTypes(connectingModes),
      )(dispatch, getState);
    }
  };
}

type LocationSelectedOnMapAction = Action<'location_selected_on_map'> & {
  startOrEnd: StartOrEnd;
  coords: [number, number];
};
// Location selected on map via context menu (long press or right-click).
// Similar to a drag, except might be starting from no location selected.
export function locationSelectedOnMap(
  startOrEnd: StartOrEnd,
  coords: [number, number],
): BikeHopperThunkAction {
  return async function locationSelectedOnMapThunk(dispatch, getState) {
    dispatch({
      type: 'location_selected_on_map',
      startOrEnd,
      coords,
    });

    // If we have a location for the other point, fetch a route.
    let { start, end, arriveBy, initialTime, connectingModes } =
      getState().routeParams;
    if (startOrEnd === 'start' && end?.point?.geometry.coordinates) {
      await fetchRoute(
        coords,
        end.point.geometry.coordinates,
        arriveBy,
        initialTime,
        _computeBlockRouteTypes(connectingModes),
      )(dispatch, getState);
    } else if (startOrEnd === 'end' && start != null) {
      // Potentially geolocate user for start point
      if (start?.source === LocationSourceType.UserGeolocation) {
        await dispatch(geolocate());

        const stateAfterGeolocate = getState();
        if (
          !stateAfterGeolocate.routeParams.start ||
          stateAfterGeolocate.routeParams.start.source !==
            LocationSourceType.UserGeolocation
        ) {
          // While geolocating, a different start point was selected.
          return;
        }
        const { lng, lat } = stateAfterGeolocate.geolocation;
        if (lng == null || lat == null) return;

        start = {
          point: turfPoint([lng, lat]),
          source: LocationSourceType.UserGeolocation,
        };

        await dispatch({
          type: 'locations_set',
          start,
          end,
        });
      }

      if (start?.point?.geometry.coordinates) {
        await fetchRoute(
          start.point.geometry.coordinates,
          coords,
          arriveBy,
          initialTime,
          _computeBlockRouteTypes(connectingModes),
        )(dispatch, getState);
      }
    }
  };
}

type ParamsHydratedFromUrlAction = Action<'params_hydrated_from_url'> & {
  startCoords: [number, number];
  endCoords: [number, number];
  startText: string;
  endText: string;
  arriveBy: boolean;
  initialTime: number | null;
};

export function hydrateParamsFromUrl(
  startCoords: [number, number],
  endCoords: [number, number],
  startText = '',
  endText = '',
  arriveBy: boolean,
  initialTime: number | null,
): BikeHopperThunkAction {
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
      [],
    )(dispatch, getState);
  };
}

type LocationInputFocusedAction = Action<'location_input_focused'> & {
  startOrEnd: StartOrEnd;
};
export function locationInputFocused(
  startOrEnd: StartOrEnd,
): LocationInputFocusedAction {
  return {
    type: 'location_input_focused',
    startOrEnd,
  };
}

type EnterDestinationFocusedAction = Action<'enter_destination_focused'>;
export function enterDestinationFocused(): EnterDestinationFocusedAction {
  return {
    type: 'enter_destination_focused',
  };
}

type LocationTextInputChangedAction = Action<'location_text_input_changed'> & {
  startOrEnd: StartOrEnd;
  value: string;
};
export function changeLocationTextInput(
  startOrEnd: StartOrEnd,
  value: string,
): BikeHopperThunkAction {
  return async function locationTextInputChangedThunk(dispatch, getState) {
    dispatch({
      type: 'location_text_input_changed',
      startOrEnd,
      value,
    });

    await dispatch(
      geocodeTypedLocation(value, startOrEnd, { fromTextAutocomplete: true }),
    );
  };
}

type GeocodedLocationSelectedAction = Action<'geocoded_location_selected'> & {
  startOrEnd: StartOrEnd;
  point: PhotonOsmHash;
  fromInputText: string;
};
export function selectGeocodedLocation(
  startOrEnd: StartOrEnd,
  point: PhotonOsmHash,
  fromInputText: string,
): BikeHopperThunkAction {
  return async function selectGeocodedLocationThunk(dispatch, getState) {
    dispatch({
      type: 'geocoded_location_selected',
      startOrEnd,
      point,
      fromInputText,
    });

    await dispatch(locationsSubmitted());
  };
}

export type CurrentLocationSelectedAction =
  Action<'current_location_selected'> & {
    startOrEnd: StartOrEnd;
  };
export function selectCurrentLocation(
  startOrEnd: StartOrEnd,
): BikeHopperThunkAction {
  return async function selectCurrentLocationThunk(dispatch, getState) {
    dispatch({
      type: 'current_location_selected',
      startOrEnd,
    });

    await dispatch(locationsSubmitted());
  };
}

type RouteParamsClearedAction = Action<'route_params_cleared'>;
export function clearRouteParams() {
  return {
    type: 'route_params_cleared',
  };
}

type SearchBlurredAction = Action<'search_blurred_with_unchanged_locations'>;
export function blurSearchWithUnchangedLocations() {
  // When you focus the start or end input but then blur it without changing existing
  // (geocoded, geolocated, marker dragged, etc.) locations.
  return {
    type: 'search_blurred_with_unchanged_locations',
  };
}

type LocationsSwappedAction = Action<'locations_swapped'>;
export function swapLocations(): BikeHopperThunkAction {
  return async function swapLocationsThunk(dispatch, getState) {
    dispatch({
      type: 'locations_swapped',
    });

    await dispatch(locationsSubmitted());
  };
}

export type DepartureType = 'now' | 'departAt' | 'arriveBy';
type DepartureChangedAction = Action<'departure_changed'> & {
  departureType: DepartureType;
  initialTime: number | null;
};
// departureType: 'now', 'departAt', 'arriveBy'
// initialTime: if not 'now', the time to depart at or arrive by, millis since epoch
export function departureChanged(
  departureType: DepartureType,
  initialTime: number | null,
): BikeHopperThunkAction {
  return async function departureChangedThunk(dispatch, getState) {
    dispatch({
      type: 'departure_changed',
      initialTime,
      departureType,
    });

    // If we have a location, fetch a route.
    await dispatch(locationsSubmitted());
  };
}

type ConnectingModesChangedAction = Action<'connecting_modes_changed'> & {
  connectingModes: ModeCategory[];
};
export function changeConnectingModes(
  newConnectingModes: ModeCategory[],
): BikeHopperThunkAction {
  return async function changeConnectingModesThunk(dispatch, getState) {
    dispatch({
      type: 'connecting_modes_changed',
      connectingModes: newConnectingModes,
    });

    // If we have a location, fetch a route.
    await dispatch(locationsSubmitted());
  };
}

function _computeBlockRouteTypes(connectingModes: ModeCategory[]) {
  const blockRouteTypes = [];
  for (const modeCategory of Object.values(TransitModes.CATEGORIES)) {
    if (!connectingModes.includes(modeCategory)) {
      for (const modeInCategory of TransitModes.CATEGORY_TO_MODES[
        modeCategory
      ]) {
        blockRouteTypes.push(modeInCategory);
      }
    }
  }
  return blockRouteTypes;
}

export type RouteParamsAction =
  | ConnectingModesChangedAction
  | CurrentLocationSelectedAction
  | DepartureChangedAction
  | EnterDestinationFocusedAction
  | GeocodedLocationSelectedAction
  | LocationDraggedAction
  | LocationInputFocusedAction
  | LocationSelectedOnMapAction
  | LocationTextInputChangedAction
  | LocationsSetAction
  | LocationsSwappedAction
  | ParamsHydratedFromUrlAction
  | RouteParamsClearedAction
  | SearchBlurredAction;
