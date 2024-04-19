// The meaning of the route "route_type" enum in GTFS.
// See: https://gtfs.org/schedule/reference/#routestxt

export const MODES = {
  TRAM_STREETCAR_LIGHT_RAIL: 0,
  SUBWAY_METRO: 1,
  RAIL_INTERCITY_LONG_DISTANCE: 2,
  MONORAIL: 12,

  BUS: 3,
  TROLLEYBUS: 11,

  FERRY: 4,

  CABLE_TRAM: 5,
  AERIAL_TRAM_SUSPENDED_CABLE_CAR: 6,
  FUNICULAR: 7,
};

export const CATEGORIES = {
  TRAINS: 'trains',
  BUSES: 'buses',
  FERRIES: 'ferries',
};

export const CATEGORY_TO_MODES = {
  [CATEGORIES.TRAINS]: [
    MODES.TRAM_STREETCAR_LIGHT_RAIL,
    MODES.SUBWAY_METRO,
    MODES.RAIL_INTERCITY_LONG_DISTANCE,
    MODES.MONORAIL,
    MODES.CABLE_TRAM,
    MODES.AERIAL_TRAM_SUSPENDED_CABLE_CAR,
    MODES.FUNICULAR,
  ],
  [CATEGORIES.BUSES]: [MODES.BUS, MODES.TROLLEYBUS],
  [CATEGORIES.FERRIES]: [MODES.FERRY],
};

export function modeToName(mode) {
  switch (mode) {
    case MODES.TRAM_STREETCAR_LIGHT_RAIL:
      return 'tram/streetcar/light rail';
    case MODES.MONORAIL:
      return 'monorail';
    case MODES.SUBWAY_METRO:
      return 'subway/metro';
    case MODES.RAIL_INTERCITY_LONG_DISTANCE:
      return 'intercity/long-distance rail';
    case MODES.BUS:
    case MODES.TROLLEYBUS:
      return 'bus';
    case MODES.FERRY:
      return 'ferry';
    case MODES.CABLE_TRAM:
    case MODES.AERIAL_TRAM_SUSPENDED_CABLE_CAR:
      return 'cable tram/cable car/aerial tram/suspended cable car';
    case MODES.FUNICULAR:
      return 'funicular';
    default:
      return 'unknown mode';
  }
}
