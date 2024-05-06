import type {
  Feature,
  FeatureCollection,
  Point as GeoJsonPoint,
} from 'geojson';

// TODO: remove when lint is fixed
export type EpochTimeStamp = number;

export type Alert = {
  message: string;
};

export enum LocationSourceType {
  GEOCODED = 'geocoded',
  SELECTED_ON_MAP = 'selected_on_map', // marker drag or long-press/right-click
  USER_GEOLOCATION = 'user_geolocation',
  URL_WITH_STRING = 'url_with_string',
  USER_WITHOUT_STRING = 'url_without_string',
}

export type Route = {
  nonce: number;
};

export type FetchedRoute = {
  paths: Route[];
};

export type LocationWithPoint = {
  source: LocationSourceType;
  /** A geoJSON point (can be null if source === UserGeolocation) */
  point: Point;
  /** The source input text (if source === Geocoded or UrlWithString) */
  fromInputText?: string | null;
};

export type Location = {
  source: LocationSourceType;
  /** A geoJSON point (can be null if source === UserGeolocation) */
  point: Point | null;
  /** The source input text (if source === Geocoded or UrlWithString) */
  fromInputText?: string | null;
};

type PointProperties = {
  osm_type: string;
  osm_id: string;
};
export type Point = Feature<GeoJsonPoint, PointProperties>;
export type Points = FeatureCollection<GeoJsonPoint, PointProperties>;

export type Coordinates = [lng: number, lat: number];

export type DepartureType = 'now' | 'departAt' | 'arriveBy';

export type StartOrEnd = 'start' | 'end';

export type RouteSource = 'list' | 'map';

/**
 * note: all uses of OSM IDs as keys should be prefixed with one character
 * representing the type N for node, R for relation, W for way.
 * for example osm_id 100 and osm_type N => "N100"
 */
export type OSMId = string;

type OSMCacheItemSucceeded = {
  status: 'succeeded';
  /** time as returned from Date.now() */
  time: EpochTimeStamp;
  /** OSM type + ID strings */
  osmIds: OSMId[];
};

type OSMCacheItemFetching = {
  status: 'fetching';
  /** time as returned from Date.now() */
  time: EpochTimeStamp;
  /** OSM type + ID strings */
  osmIds?: OSMId[];
};

type OSMCacheItemFailed = {
  status: 'failed';
  /** time as returned from Date.now() */
  time: EpochTimeStamp;
};

export type OSMCacheItem =
  | OSMCacheItemSucceeded
  | OSMCacheItemFetching
  | OSMCacheItemFailed;

export type RecentlyUsedItem = {
  /** OSM type + ID, should be in osmCache */
  id: OSMId;
  /** Time of last use as returned from Date.now() */
  lastUsed: EpochTimeStamp;
};
