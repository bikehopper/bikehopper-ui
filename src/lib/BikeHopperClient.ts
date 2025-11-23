import { DateTime } from 'luxon';
import delay from './delay';
import {
  getDefaultViewportBounds,
  getTimezone,
  RegionConfig,
  RegionConfigSchema,
} from './region';
import { InstructionSign } from './InstructionSigns';
import { Mode } from './TransitModes';
import { POINT_PRECISION } from './geometry';

export function getApiPath(): string {
  const apiDomain = import.meta.env.VITE_API_DOMAIN;
  // If the env var is not defined, default to making API requests
  // to same domain, which is what we generally want for development
  // (Vite will proxy to staging).
  return apiDomain || window.location.origin;
}

export class BikeHopperClientError extends Error {
  code: number;
  json: any;

  constructor(response: Response) {
    super(response.statusText);
    let json;
    try {
      json = response.json();
    } catch (e) {}
    this.code = response.status;
    this.name = 'BikeHopperClientError';
    this.json = json;
  }
}

export async function fetchRegionConfig(): Promise<RegionConfig> {
  const result = await fetch(`${getApiPath()}/api/v1/config`);
  if (!result.ok) throw new BikeHopperClientError(result);
  return RegionConfigSchema.parse(await result.json());
}

function timeStampToLocalTime(timeStamp: number) {
  const serverTime = DateTime.fromMillis(timeStamp).setZone(getTimezone(), {
    keepLocalTime: true,
  });
  const clientTime = serverTime.toLocal().toMillis();
  return clientTime;
}

type GtfsRouteType = number;

export async function fetchRoute({
  profile = 'pt',
  connectingProfile = 'bike2',
  arriveBy = false,
  earliestDepartureTime,
  optimize = false,
  details,
  points,
  signal,
  blockRouteTypes,
}: {
  profile?: string;
  connectingProfile?: string;
  arriveBy: boolean;
  earliestDepartureTime?: number | null;
  optimize?: boolean;
  details?: string[];
  points: GeoJSON.Position[];
  signal?: AbortSignal;
  blockRouteTypes?: GtfsRouteType[];
}) {
  const isDebugMode = !!(window as any).debug;

  const earliestDepartureLocal = earliestDepartureTime
    ? timeStampToLocalTime(earliestDepartureTime)
    : Date.now();

  const params = new URLSearchParams({
    locale: 'en-US',
    elevation: 'true',
    include_edges: String(isDebugMode), // TODO: pipe debug through the whole app
    useMiles: 'false',
    layer: 'OpenStreetMap',
    profile,
    optimize: String(optimize),
    pointsEncoded: 'false',
    'pt.earliest_departure_time': new Date(
      earliestDepartureLocal,
    ).toISOString(),
    'pt.connecting_profile': connectingProfile,
    'pt.arrive_by': String(arriveBy),
  });

  for (const detail of details || []) params.append('details', detail);
  for (const routeType of blockRouteTypes || [])
    params.append('pt.block_route_types', String(routeType));
  for (const pt of points)
    params.append(
      'point',
      String(pt.map((coord) => coord.toFixed(POINT_PRECISION))),
    );

  let graphHopperPath = getApiPath() + '/api/v1/route';
  if (import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_GRAPHHOPPER)
    graphHopperPath = import.meta.env.VITE_USE_LOCAL_GRAPHHOPPER;

  const url = `${graphHopperPath}/route-pt?${params}`;
  const route = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal,
  });

  if (!route.ok) throw new BikeHopperClientError(route);

  return parse(await route.json());
}

export type RouteInstruction = {
  text: string;
  street_name?: string;
  distance: number;
  time: number;
  interval: number[];
  sign: InstructionSign;
  heading?: number;
  exit_number?: number;
  turn_angle?: number;
};

export type InstructionDetails = Record<string, [number, number, string][]>;

type BikeLegBase = {
  type: 'bike2';
  departure_location: string;
  geometry: GeoJSON.LineString;
  distance: number;
  weight: number;
  interpolated: boolean;
  instructions: RouteInstruction[];
  details: InstructionDetails;
  ascend: number;
  descend: number;
};
type BikeLegRaw = BikeLegBase & {
  departure_time: string; // ISO-8601
  arrival_time: string; // ISO-8601
};
export type BikeLeg = BikeLegBase & {
  departure_time: Date;
  arrival_time: Date;
  has_steps: boolean;
};
type TransitLegBase = {
  type: 'pt';
  departure_location: string;
  geometry: GeoJSON.LineString;
  distance: number;
  weight: number;
  interpolated: boolean;
  feed_id: string;
  agency_id: string;
  agency_name: string;
  is_in_same_vehicle_as_previous: boolean;
  trip_headsign: string;
  route_color?: string;
  route_name?: string;
  route_type: Mode;
  bikes_allowed: number;
  travel_time: number;
  stops: TransitStop[];
  trip_id: string;
  route_id: string;
  all_stop_ids?: string[];
  alerts?: TransitAlert[];
};
type TransitLegRaw = TransitLegBase & {
  departure_time: string; // ISO-8601
  arrival_time: string; // ISO-8601
};
export type TransitLeg = TransitLegBase & {
  departure_time: Date;
  arrival_time: Date;
};
type LegRaw = TransitLegRaw | BikeLegRaw;
type Leg = TransitLeg | BikeLeg;
export type TransitStop = {
  stop_id: string;
  stop_name: string;
  geometry: GeoJSON.Point;
  arrival_cancelled: boolean;
  departure_time: string; // ISO-8601
  planned_departure_time: string; // ISO-8601
  departure_cancelled: boolean;
  elevators?: ElevatorInfo[];
};
type ElevatorInfo = {
  agency: string;
  station: string;
  elevator_stops: string;
  door: string;
  width: string;
  length: string;
  diagonal: string;
};
type TransitAlert = {
  entities: {
    stop_id: string | null;
    trip_id: string | null;
    route_type: number | null;
    route_id: string | null;
    agency_id: string | null;
  }[];
  time_ranges: {
    start: number; // epoch timestamp
    end: number; // epoch timestamp
  }[];
  header_text: TransitAlertTextField;
  description_text: TransitAlertTextField;
  cause: number;
  effect: number;
  severity_level: number;
};
type TransitAlertTextField = {
  translation: {
    language: string;
    text: string;
  }[];
};
type RouteResponsePathBase = {
  distance: number;
  time: number;
  ascend: number;
  descend: number;
  // We always send points_encoded=false, so this is a line string:
  points: GeoJSON.LineString;
  snapped_waypoints: GeoJSON.LineString;
  points_encoded: boolean;
  bbox: [number, number, number, number];
  instructions: RouteInstruction[];
  weight: number;
  transfers: number;
  details: InstructionDetails;
};
type RouteResponsePathRaw = RouteResponsePathBase & {
  legs: LegRaw[];
};
export type RouteResponsePath = RouteResponsePathBase & {
  legs: Leg[];
  nonce: number;
};

// For assigning a unique ID to each route fetched in a session
let _routeNonce = 10000000;

function parse(route: { paths: RouteResponsePathRaw[] }): {
  paths: RouteResponsePath[];
} {
  return {
    ...route,
    paths: route.paths.map((path) => {
      return {
        ...path,
        nonce: ++_routeNonce,
        legs: path.legs.map((leg) => {
          return {
            ...leg,
            route_color:
              leg.type === 'pt' && leg.route_color
                ? '#' + leg.route_color
                : undefined,
            departure_time: DateTime.fromISO(leg.departure_time).toJSDate(),
            arrival_time: DateTime.fromISO(leg.arrival_time).toJSDate(),
            // mark bike legs that have steps
            has_steps:
              leg.type === 'bike2'
                ? leg.details?.road_class?.some(
                    ([_start, _end, roadClass]) => roadClass === 'steps',
                  ) || false
                : false,
          };
        }),
      };
    }),
  };
}

let _lastNominatimReqTime = 0;
// All BikeHopper users together are supposed to not hit the public Nominatim more than
// 1x/sec. This should only be used for demo purposes and never for a public site. We'll
// rate limit to every 3 sec per user:
const NOMINATIM_RATE_LIMIT = 3000;

type PhotonProperties = {
  name: string;
  street?: string;
  housenumber?: string;
  postcode?: string;
  city?: string;
  state?: string;
  country?: string;
  countrycode?: string;
  osm_key: string;
  osm_value: string;
  osm_type: string;
  osm_id: number;
  type?: string /** can be street or house, etc */;
};

export type PhotonOsmHash = GeoJSON.Feature<GeoJSON.Point, PhotonProperties>;
type PhotonCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  PhotonProperties
>;

export async function geocode(
  placeString: string,
  {
    limit = 1,
    latitude,
    longitude,
    zoom = 12,
    lang = 'en',
    locationBias = 0.1,
    signal,
  }: {
    limit?: number;
    latitude: number;
    longitude: number;
    zoom?: number;
    lang?: string;
    locationBias?: number;
    signal?: AbortSignal;
  },
): Promise<PhotonCollection> {
  let url;
  if (import.meta.env.VITE_USE_PUBLIC_NOMINATIM) {
    // Note: This flag is for demo/dev purposes only and will not produce as high quality
    // results as the default of hitting (our own instance of) Photon.
    const dontHitBefore = _lastNominatimReqTime + NOMINATIM_RATE_LIMIT;
    const now = Date.now();
    if (now < dontHitBefore) await delay(dontHitBefore - now);
    url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      placeString,
    )}&limit=1&viewbox=${getDefaultViewportBounds().join(',')}&format=geojson`;
    // TODO figure out why bounded=1 messes up results
    // Things come up without it but disappear with it...?
    _lastNominatimReqTime = Date.now();
    // "Lincoln Park Zoo, Chicago" to "Warwick Allerton, Chicago" works....
    //
    // but leave off ", Chicago" and all bets are off
  } else {
    url = `${getApiPath()}/api/v1/geocode/geocode?q=${encodeURIComponent(
      placeString,
    )}&lang=${lang}&limit=${limit}`;

    if (latitude != null && longitude != null) {
      zoom = Math.round(zoom); // Photon doesn't accept float zoom values
      url += `&lat=${latitude.toFixed(POINT_PRECISION)}&lon=${longitude.toFixed(
        POINT_PRECISION,
      )}&zoom=${zoom}&location_bias_scale=${locationBias}`;
    }
  }

  const geocoding = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal,
  });

  if (!geocoding.ok) throw new BikeHopperClientError(geocoding);

  return geocoding.json();
}
