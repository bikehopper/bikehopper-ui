import type { Action } from 'redux';
import type {
  StartOrEnd,
  Coordinates,
  Point,
  DepartureType,
  Location,
  Route,
  RouteSource,
  Alert,
  OSMId,
  RecentlyUsedItem,
  EpochTimeStamp,
} from './types';
import { TransitModeCategory } from '../lib/TransitModes';

export enum ActionType {
  LOCATIONS_SET = 'locations_set',
  LOCATIONS_SWAPPED = 'locations_swapped',
  LOCATION_DRAGGED = 'location_dragged',
  LOCATION_SELECTED_ON_MAP = 'location_selected_on_map',
  LOCATIONS_HYDRATED_FROM_URL = 'locations_hydrated_from_url',
  LOCATION_INPUT_FOCUSED = 'location_input_focused',
  LOCATION_TEXT_INPUT_CHANGED = 'location_text_input_changed',

  PARAMS_HYDRATED_FROM_URL = 'params_hydrated_from_url',
  HYDRATE_FROM_LOCALSTORAGE = 'hydrate_from_localstorage',

  ENTER_DESTINATION_FOCUSED = 'enter_destination_focused',
  SEARCH_BLURRED_WITH_UNCHANGED_LOCATIONS = 'search_blurred_with_unchanged_locations',

  ROUTE_CLEARED = 'route_cleared',
  ROUTE_FETCH_ATTEMPTED = 'route_fetch_attempted',
  ROUTE_FETCH_FAILED = 'route_fetch_failed',
  ROUTE_FETCH_SUCCEEDED = 'route_fetch_succeeded',

  ROUTE_CLICKED = 'route_clicked',

  ITINERARY_BACK_CLICKED = 'itinerary_back_clicked',
  ITINERARY_STEP_CLICKED = 'itinerary_step_clicked',
  ITINERARY_STEP_BACK_CLICKED = 'itinerary_step_back_clicked',

  GEOCODED_LOCATION_SELECTED = 'geocoded_location_selected',
  CURRENT_LOCATION_SELECTED = 'current_location_selected',

  ROUTE_PARAMS_CLEARED = 'route_params_cleared',
  DEPARTURE_CHANGED = 'departure_changed',
  CONNECTING_MODES_CHANGED = 'connecting_modes_changed',

  GEOLOCATE_ATTEMPTED = 'geolocate_attempted',
  GEOLOCATE_FAILED = 'geolocate_failed',
  GEOLOCATED = 'geolocated',

  GEOCODE_ATTEMPTED = 'geocode_attempted',
  GEOCODE_FAILED = 'geocode_failed',
  GEOCODE_SUCCEEDED = 'geocode_succeeded',
  RECENTLY_USED_LOCATION_REMOVED = 'recently_used_location_removed',
}

type AlertingAction = {
  failureType: string;
  alert?: Alert;
};

// STORAGE

export type HydrateFromLocalStorageAction =
  Action<ActionType.HYDRATE_FROM_LOCALSTORAGE> & {
    geocodingOsmCache: Record<OSMId, Point>;
    geocodingRecentlyUsed: RecentlyUsedItem[];
  };

// LOCATIONS

export type LocationsSetAction = Action<ActionType.LOCATIONS_SET> & {
  start: Location | null;
  end: Location | null;
};
export type LocationsSwappedAction = Action<ActionType.LOCATIONS_SWAPPED>;
export type LocationDraggedAction = Action<ActionType.LOCATION_DRAGGED> & {
  startOrEnd: StartOrEnd;
  coords: Coordinates;
};
export type LocationSelectedOnMapAction =
  Action<ActionType.LOCATION_SELECTED_ON_MAP> & {
    startOrEnd: StartOrEnd;
    coords: Coordinates;
  };
export type LocationsHydratedFromUrlAction =
  Action<ActionType.LOCATIONS_HYDRATED_FROM_URL>;

export type LocationInputFocusedAction =
  Action<ActionType.LOCATION_INPUT_FOCUSED> & {
    startOrEnd: StartOrEnd;
  };
export type LocationTextInputChangedAction =
  Action<ActionType.LOCATION_TEXT_INPUT_CHANGED> & {
    startOrEnd: StartOrEnd;
    value: string;
  };

// ITINERARY
export type ItineraryBackClicked = Action<ActionType.ITINERARY_BACK_CLICKED>;
export type ItineraryStepClicked = Action<ActionType.ITINERARY_STEP_CLICKED> & {
  leg: number;
  step: number;
};
export type ItineraryStepBackClicked =
  Action<ActionType.ITINERARY_STEP_BACK_CLICKED>;

// ROUTE PARAMS

export type ParamsHydratedFromUrlAction =
  Action<ActionType.PARAMS_HYDRATED_FROM_URL> & {
    startCoords: Coordinates;
    startText: string | null;
    endCoords: Coordinates;
    endText: string | null;
    arriveBy: boolean;
    initialTime: EpochTimeStamp | null;
  };

export type EnterDestinationFocusedAction =
  Action<ActionType.ENTER_DESTINATION_FOCUSED>;

export type SearchBlurredWithUnchangedLocationsAction =
  Action<ActionType.SEARCH_BLURRED_WITH_UNCHANGED_LOCATIONS>;

export type GeocodedLocationSelectedAction =
  Action<ActionType.GEOCODED_LOCATION_SELECTED> & {
    startOrEnd: StartOrEnd;
    point: Point;
    fromInputText: string | null;
  };

export type CurrentLocationSelectedAction =
  Action<ActionType.CURRENT_LOCATION_SELECTED> & {
    startOrEnd: StartOrEnd;
  };

// ROUTES

export type RouteClearedAction = Action<ActionType.ROUTE_CLEARED>;
export type RouteParamsClearedAction = Action<ActionType.ROUTE_PARAMS_CLEARED>;

type RouteFetchParams = {
  startCoords: Coordinates;
  endCoords: Coordinates;
};

export type RouteFetchAttemptedAction =
  Action<ActionType.ROUTE_FETCH_ATTEMPTED> & RouteFetchParams;
export type RouteFetchFailedAction = Action<ActionType.ROUTE_FETCH_FAILED> &
  RouteFetchParams &
  AlertingAction;
export type RouteFetchSucceededAction =
  Action<ActionType.ROUTE_FETCH_SUCCEEDED> &
    RouteFetchParams & {
      routes: Route[];
    };

export type RouteClickedAction = Action<ActionType.ROUTE_CLICKED> & {
  index: number;
  /** Where was it clicked? should be 'map' or 'list' */
  source: RouteSource;
};

export type DepartureChangedAction = Action<ActionType.DEPARTURE_CHANGED> & {
  departureType: DepartureType;
  initialTime: EpochTimeStamp | null;
};

export type ConnectingModesChangedAction =
  Action<ActionType.CONNECTING_MODES_CHANGED> & {
    connectingModes: TransitModeCategory[];
  };

// GEOLOCATION

export type GeolocateAttemptedAction = Action<ActionType.GEOLOCATE_ATTEMPTED>;
export type GeolocateFailedAction = Action<ActionType.GEOLOCATE_FAILED> & {
  code: GeolocationPositionError['code']
};

export type GeolocatedAction = Action<ActionType.GEOLOCATED> & {
  coords: GeolocationCoordinates;
  timestamp: EpochTimeStamp;
};

// GEOCODING
export type GeocodeAttemptedAction = Action<ActionType.GEOCODE_ATTEMPTED> & {
  time: EpochTimeStamp;
  text: string;
};
export type GeocodeFailedAction = Action<ActionType.GEOCODE_FAILED> &
  AlertingAction & {
    time: EpochTimeStamp;
    text: string;
  };
export type GeocodeSucceededAction = Action<ActionType.GEOCODE_SUCCEEDED> & {
  features: Point[];
  text: string;
  time: EpochTimeStamp;
};
export type RecentlyUsedLocationRemovedAction =
  Action<ActionType.RECENTLY_USED_LOCATION_REMOVED> & {
    id: OSMId;
  };
