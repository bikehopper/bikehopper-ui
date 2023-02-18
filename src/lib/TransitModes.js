// The meaning of the route "route_type" enum in GTFS.
// See: https://gtfs.org/schedule/reference/#routestxt

const TransitModes = {
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

export default TransitModes;
