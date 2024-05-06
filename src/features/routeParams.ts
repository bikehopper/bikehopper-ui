import produce from 'immer';
import * as turf from '@turf/helpers';
import describePlace from '../lib/describePlace';
import {
  CATEGORY_TO_MODE,
  TransitMode,
  TransitModeCategory,
} from '../lib/TransitModes';
import { geocodeTypedLocation } from './geocoding';
import { geolocate } from './geolocation';
import { fetchRoute } from './routes';
import type { AppDispatch, GetAppState } from '../store';
import {
  StartOrEnd,
  Location,
  LocationSourceType,
  Coordinates,
  Point,
  DepartureType,
} from './types';
import {
  ActionType,
  ConnectingModesChangedAction,
  CurrentLocationSelectedAction,
  DepartureChangedAction,
  EnterDestinationFocusedAction,
  GeocodedLocationSelectedAction,
  GeolocateFailedAction,
  GeolocatedAction,
  LocationDraggedAction,
  LocationInputFocusedAction,
  LocationSelectedOnMapAction,
  LocationTextInputChangedAction,
  LocationsSetAction,
  LocationsSwappedAction,
  ParamsHydratedFromUrlAction,
  RouteFetchAttemptedAction,
  RouteParamsClearedAction,
  SearchBlurredWithUnchangedLocationsAction,
} from './actions';

export type RouteParamsState = {
  end: Location | null;
  start: Location | null;
  /** Transient input state. Which location input ('start', 'end' or null) is
   * currently being edited, and what text is in the box (which may not yet be
   * reflected in the above state)?
   * Note: if a location input is focused, it
   * should be reflected in editingLocation, but editingLocation being set may
   * not necessarily mean a location input is focused.
   */
  editingLocation: StartOrEnd | null;
  startInputText: string;
  endInputText: string;
  arriveBy: boolean;
  /** Time in ms since epoch, or null
   * If initialTime == null, this means depart now
   * (should be used with arriveBy === false)
   */
  initialTime: EpochTimeStamp | null;
  /** Transit modes that can be used */
  connectingModes: TransitModeCategory[];
  /** Can we default to geolocating for the start location? */
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
    TransitModeCategory.BUSES,
    TransitModeCategory.TRAINS,
    TransitModeCategory.FERRIES,
  ],
  canDefaultStartToGeolocation: true,
};

type RouteParamsAction =
  | LocationsSetAction
  | LocationsSwappedAction
  | LocationDraggedAction
  | LocationSelectedOnMapAction
  | ParamsHydratedFromUrlAction
  | LocationInputFocusedAction
  | LocationTextInputChangedAction
  | EnterDestinationFocusedAction
  | RouteFetchAttemptedAction
  | SearchBlurredWithUnchangedLocationsAction
  | GeocodedLocationSelectedAction
  | CurrentLocationSelectedAction
  | GeolocateFailedAction
  | GeolocatedAction
  | RouteParamsClearedAction
  | DepartureChangedAction
  | ConnectingModesChangedAction;

export function routeParamsReducer(
  state: RouteParamsState = DEFAULT_STATE,
  action: RouteParamsAction,
): RouteParamsState {
  switch (action.type) {
    case ActionType.LOCATIONS_SET:
      return produce(state, (draft) => {
        draft.start = action.start;
        draft.end = action.end;
        if (action.start && action.end) draft.editingLocation = null;
      });
    case ActionType.LOCATIONS_SWAPPED:
      return produce(state, (draft) => {
        draft.start = state.end;
        draft.end = state.start;
        draft.startInputText = state.endInputText;
        draft.endInputText = state.startInputText;
      });
    case ActionType.LOCATION_DRAGGED:
    case ActionType.LOCATION_SELECTED_ON_MAP:
      return produce(state, (draft) => {
        draft[action.startOrEnd] = {
          point: turf.point(action.coords),
          source: LocationSourceType.SELECTED_ON_MAP,
        };
        draft[startOrEndInputText(action.startOrEnd)] = '';
        if (
          action.startOrEnd === 'end'
          && state.start == null 
          && state.canDefaultStartToGeolocation
        ) {
          // if no start point, and "directions to" was selected,
          // route from current location.
          draft.start = {
            point: null,
            source: LocationSourceType.USER_GEOLOCATION,
          };
        }
      });
    case ActionType.PARAMS_HYDRATED_FROM_URL:
      return produce(state, (draft) => {
        draft.start = {
          point: turf.point(action.startCoords),
          source: action.startText
            ? LocationSourceType.URL_WITH_STRING
            : LocationSourceType.USER_WITHOUT_STRING,
          fromInputText: action.startText || null,
        };
        draft.end = {
          point: turf.point(action.endCoords),
          source: action.endText
            ? LocationSourceType.URL_WITH_STRING
            : LocationSourceType.USER_WITHOUT_STRING,
          fromInputText: action.endText || null,
        };
        draft.startInputText = action.startText || '';
        draft.endInputText = action.endText || '';
        draft.arriveBy = action.arriveBy;
        draft.initialTime = action.initialTime;
      });
    case ActionType.LOCATION_INPUT_FOCUSED:
      return produce(state, (draft) => {
        draft.editingLocation = action.startOrEnd;
      });
    case ActionType.ENTER_DESTINATION_FOCUSED:
      return produce(state, (draft) => {
        draft.editingLocation = 'end';
        // TODO don't default start to current location on desktop
        if (state.canDefaultStartToGeolocation) {
          draft.start = {
            point: null,
            source: LocationSourceType.USER_GEOLOCATION,
          };
        }
      });
    case ActionType.ROUTE_FETCH_ATTEMPTED:
      return produce(state, (draft) => {
        draft.editingLocation = null;
      });
    case ActionType.SEARCH_BLURRED_WITH_UNCHANGED_LOCATIONS:
      return produce(state, (draft) => {
        draft.editingLocation = null;
      });
    case ActionType.GEOCODED_LOCATION_SELECTED:
      return produce(state, (draft) => {
        draft[action.startOrEnd] = {
          point: action.point,
          source: LocationSourceType.GEOCODED,
          fromInputText: action.fromInputText,
        };
        draft[startOrEndInputText(action.startOrEnd)] = describePlace(
          action.point,
        );
        // This probably will result in editingLocation changing but other
        // actions should take care of that
      });
    case ActionType.CURRENT_LOCATION_SELECTED:
      return produce(state, (draft) => {
        draft[action.startOrEnd] = {
          point: null, // To be hydrated by a later action
          source: LocationSourceType.USER_GEOLOCATION,
        };
        draft[startOrEndInputText(action.startOrEnd)] = '';
      });
    case ActionType.GEOLOCATE_FAILED:
      // If we were waiting on geolocation to hydrate a location, clear it
      return produce(state, (draft) => {
        if (
          state.start?.source === LocationSourceType.USER_GEOLOCATION &&
          !state.start.point
        ) {
          draft.start = null;
          draft.startInputText = '';
        }
        if (
          state.end?.source === LocationSourceType.USER_GEOLOCATION &&
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
    case ActionType.GEOLOCATED:
      return produce(state, (draft) => {
        // Since geolocation has worked, we can default to it again (if we
        // stopped trying).
        draft.canDefaultStartToGeolocation = true;
      });
    case ActionType.LOCATION_TEXT_INPUT_CHANGED:
      return produce(state, (draft) => {
        draft[startOrEndInputText(action.startOrEnd)] = action.value;

        // Hack: In order to make it possible to clear out "Current Location,"
        // we must empty out the location value if the corresponding text
        // changes, in this case.
        if (
          state[action.startOrEnd]?.source ===
          LocationSourceType.USER_GEOLOCATION
        ) {
          draft[action.startOrEnd] = null;
        }
      });
    case ActionType.ROUTE_PARAMS_CLEARED:
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
    case ActionType.DEPARTURE_CHANGED:
      return produce(state, (draft) => {
        draft.arriveBy =
          action.departureType === 'arriveBy' && action.initialTime != null;
        draft.initialTime =
          action.departureType === 'now' ? null : action.initialTime;
      });
    case ActionType.CONNECTING_MODES_CHANGED:
      return produce(state, (draft) => {
        draft.connectingModes = [...action.connectingModes];
      });
    default: {
      // enforce exhaustive switch statement
      const unreachable: never = action;
      return state;
    }
  }
}

// Utility to help dynamic property accesses typecheck
const startOrEndInputText = (startOrEnd: StartOrEnd) =>
  startOrEnd === 'start' ? 'startInputText' : 'endInputText';

// Actions

// This can be triggered either directly by pressing Enter in the location
// input form (or the mobile equivalent: submitting the form), or indirectly
// from other actions that call it as a helper function.
//
// If we have start and end location info, hydrate the locations if possible
// and then fetch routes. Hydrating can mean geocoding input text or finding
// the current geolocation if a location has source type UserGeolocation.
export function locationsSubmitted() {
  return async function locationsSubmittedThunk(
    dispatch: AppDispatch,
    getState: GetAppState,
  ) {
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
      if (text === '' && location?.source !== LocationSourceType.GEOCODED) {
        useLocation = true;
      } else if (
        location?.source === LocationSourceType.GEOCODED &&
        text === describePlace(location.point)
      ) {
        // Stick with geocoded location if the text is its exact description
        useLocation = true;
      } else if (
        location?.source === LocationSourceType.URL_WITH_STRING &&
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
            source: LocationSourceType.GEOCODED,
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
            source: LocationSourceType.GEOCODED,
          };
        }

        return null;
      } else if (location?.source === LocationSourceType.USER_GEOLOCATION) {
        // Always geolocate anew; never use the stored point. Geolocation does its own
        // short-term caching.
        await dispatch(geolocate());

        const { lng, lat } = getState().geolocation;
        if (lng == null || lat == null) return null;
        return {
          point: turf.point([lng, lat]),
          source: LocationSourceType.USER_GEOLOCATION,
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

    dispatch<LocationsSetAction>({
      type: ActionType.LOCATIONS_SET,
      start: resultingStartLocation,
      end: resultingEndLocation,
    });

    if (resultingStartLocation?.point && resultingEndLocation?.point) {
      await fetchRoute(
        resultingStartLocation.point.geometry.coordinates as Coordinates,
        resultingEndLocation.point.geometry.coordinates as Coordinates,
        arriveBy,
        initialTime,
        _computeBlockRouteTypes(connectingModes),
      )(dispatch);
    }
  };
}

export function locationDragged(startOrEnd: StartOrEnd, coords: Coordinates) {
  return async function locationDraggedThunk(
    dispatch: AppDispatch,
    getState: GetAppState,
  ) {
    dispatch<LocationDraggedAction>({
      type: ActionType.LOCATION_DRAGGED,
      startOrEnd,
      coords,
    });

    // If we have a location for the other point, fetch a route.
    let { start, end, arriveBy, initialTime, connectingModes } =
      getState().routeParams;
    if (startOrEnd === 'start' && end?.point?.geometry.coordinates) {
      await fetchRoute(
        coords,
        end.point.geometry.coordinates as Coordinates,
        arriveBy,
        initialTime,
        _computeBlockRouteTypes(connectingModes),
      )(dispatch);
    } else if (startOrEnd === 'end' && start?.point?.geometry.coordinates) {
      await fetchRoute(
        start.point.geometry.coordinates as Coordinates,
        coords,
        arriveBy,
        initialTime,
        _computeBlockRouteTypes(connectingModes),
      )(dispatch);
    }
  };
}

// Location selected on map via context menu (long press or right-click).
// Similar to a drag, except might be starting from no location selected.
export function locationSelectedOnMap(
  startOrEnd: StartOrEnd,
  coords: Coordinates,
) {
  return async function locationSelectedOnMapThunk(
    dispatch: AppDispatch,
    getState: GetAppState,
  ) {
    dispatch<LocationSelectedOnMapAction>({
      type: ActionType.LOCATION_SELECTED_ON_MAP,
      startOrEnd,
      coords,
    });

    // If we have a location for the other point, fetch a route.
    let { start, end, arriveBy, initialTime, connectingModes } =
      getState().routeParams;
    if (startOrEnd === 'start' && end?.point?.geometry.coordinates) {
      await fetchRoute(
        coords,
        end.point.geometry.coordinates as Coordinates,
        arriveBy,
        initialTime,
        _computeBlockRouteTypes(connectingModes),
      )(dispatch);
    } else if (startOrEnd === 'end' && start != null) {
      // Potentially geolocate user for start point
      if (start?.source === LocationSourceType.USER_GEOLOCATION) {
        await dispatch(geolocate());
        const { lng, lat } = getState().geolocation;
        if (lng == null || lat == null) return;

        start = {
          point: turf.point([lng, lat]),
          source: LocationSourceType.USER_GEOLOCATION,
        };

        await dispatch({
          type: 'locations_set',
          start,
          end,
        });
      }

      if (start?.point?.geometry.coordinates) {
        await fetchRoute(
          start.point.geometry.coordinates as Coordinates,
          coords,
          arriveBy,
          initialTime,
          _computeBlockRouteTypes(connectingModes),
        )(dispatch);
      }
    }
  };
}

export function hydrateParamsFromUrl(
  startCoords: Coordinates,
  endCoords: Coordinates,
  startText: string = '',
  endText: string = '',
  arriveBy: boolean,
  initialTime: EpochTimeStamp | null,
) {
  return async function hydrateParamsFromUrlThunk(
    dispatch: AppDispatch,
    getState: GetAppState,
  ) {
    dispatch<ParamsHydratedFromUrlAction>({
      type: ActionType.PARAMS_HYDRATED_FROM_URL,
      startCoords,
      endCoords,
      startText,
      endText,
      arriveBy,
      initialTime,
    });
    await fetchRoute(startCoords, endCoords, arriveBy, initialTime)(dispatch);
  };
}

export function locationInputFocused(
  startOrEnd: StartOrEnd,
): LocationInputFocusedAction {
  return {
    type: ActionType.LOCATION_INPUT_FOCUSED,
    startOrEnd,
  };
}

export function enterDestinationFocused(): EnterDestinationFocusedAction {
  return {
    type: ActionType.ENTER_DESTINATION_FOCUSED,
  };
}

export function changeLocationTextInput(startOrEnd: StartOrEnd, value: string) {
  return async function locationTextInputChangedThunk(dispatch: AppDispatch) {
    dispatch<LocationTextInputChangedAction>({
      type: ActionType.LOCATION_TEXT_INPUT_CHANGED,
      startOrEnd,
      value,
    });

    dispatch(
      geocodeTypedLocation(value, startOrEnd, { fromTextAutocomplete: true }),
    );
  };
}

export function selectGeocodedLocation(
  startOrEnd: StartOrEnd,
  point: Point,
  fromInputText: string,
) {
  return async function selectGeocodedLocationThunk(dispatch: AppDispatch) {
    dispatch<GeocodedLocationSelectedAction>({
      type: ActionType.GEOCODED_LOCATION_SELECTED,
      startOrEnd,
      point,
      fromInputText,
    });

    dispatch(locationsSubmitted());
  };
}

export function selectCurrentLocation(startOrEnd: StartOrEnd) {
  return async function selectCurrentLocationThunk(dispatch: AppDispatch) {
    dispatch<CurrentLocationSelectedAction>({
      type: ActionType.CURRENT_LOCATION_SELECTED,
      startOrEnd,
    });

    dispatch(locationsSubmitted());
  };
}

export function clearRouteParams(): RouteParamsClearedAction {
  return {
    type: ActionType.ROUTE_PARAMS_CLEARED,
  };
}

export function blurSearchWithUnchangedLocations(): SearchBlurredWithUnchangedLocationsAction {
  // When you focus the start or end input but then blur it without changing existing
  // (geocoded, geolocated, marker dragged, etc.) locations.
  return {
    type: ActionType.SEARCH_BLURRED_WITH_UNCHANGED_LOCATIONS,
  };
}

export function swapLocations() {
  return async function swapLocationsThunk(dispatch: AppDispatch) {
    dispatch<LocationsSwappedAction>({
      type: ActionType.LOCATIONS_SWAPPED,
    });

    dispatch(locationsSubmitted());
  };
}

export function departureChanged(
  departureType: DepartureType,
  initialTime: EpochTimeStamp | null,
) {
  return async function departureChangedThunk(dispatch: AppDispatch) {
    dispatch({
      type: 'departure_changed',
      initialTime,
      departureType,
    });

    // If we have a location, fetch a route.
    dispatch(locationsSubmitted());
  };
}

export function changeConnectingModes(
  newConnectingModes: TransitModeCategory[],
) {
  return async function changeConnectingModesThunk(dispatch: AppDispatch) {
    dispatch({
      type: 'connecting_modes_changed',
      connectingModes: newConnectingModes,
    });

    // If we have a location, fetch a route.
    dispatch(locationsSubmitted());
  };
}

function _computeBlockRouteTypes(
  connectingModes: TransitModeCategory[],
): TransitMode[] {
  const blockRouteTypes = [];
  for (const modeCategory of Object.values(TransitModeCategory)) {
    if (!connectingModes.includes(modeCategory)) {
      for (const modeInCategory of CATEGORY_TO_MODE[modeCategory]) {
        blockRouteTypes.push(modeInCategory);
      }
    }
  }
  return blockRouteTypes;
}
