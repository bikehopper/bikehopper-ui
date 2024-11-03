import { z } from 'zod';
import { GeoJSONPointSchema, GeoJSONPolygonSchema } from 'zod-geojson';

export function getAgencyDisplayName(gtfsAgencyName: string): string {
  const { agencyNames } = _getConfig();
  return (agencyNames && agencyNames[gtfsAgencyName]) || gtfsAgencyName;
}

export function getSupportedRegionText(): string | undefined {
  return _getConfig().supportedRegion;
}

export function getDefaultViewportBounds(): [number, number, number, number] {
  const config = _getConfig();
  let defaultViewport, hull;
  if ((defaultViewport = config.geoConfig['default-viewport'])) {
    return defaultViewport;
  } else if (config.supportedRegion === 'San Francisco Bay Area') {
    // TODO: Remove this hardcoding once the above default viewport is instead
    // configured on our server.
    return [-122.597652, 37.330751, -121.669687, 37.85847];
  } else if ((hull = config.geoConfig['buffered-hull'])) {
    // generate bounding box for hull
    let bbox: [number, number, number, number] = [180, 90, -180, -90];
    for (const coord of hull.geometry.coordinates[0]) {
      bbox[0] = Math.min(bbox[0], coord[0]);
      bbox[1] = Math.min(bbox[1], coord[1]);
      bbox[2] = Math.max(bbox[2], coord[0]);
      bbox[3] = Math.max(bbox[3], coord[1]);
    }
    return bbox;
  } else {
    return config.geoConfig['bounding-box'];
  }
}

export function getTransitServiceArea():
  | GeoJSON.Feature<GeoJSON.Polygon>
  | undefined {
  return _getConfig().geoConfig['buffered-hull'];
}

export function getTransitDataAcknowledgement():
  | {
      text: string;
      url: string;
    }
  | undefined {
  const acks = _getConfig().dataAcknowledgements;
  if (acks && acks.items && acks.items.length >= 1) return acks.items[0];
  return undefined;
}

const Latitude = z.number().lte(90).gte(-90);
const Longitude = z.number().lte(180).gte(-180);

const FeatureOfSchema = <GeomType>(geometryType: z.ZodSchema<GeomType>) =>
  z.object({
    properties: z.record(z.string(), z.any()),
    type: z.literal('Feature'),
    geometry: geometryType,
  });

export const RegionConfigSchema = z.object({
  agencyNames: z.record(z.string(), z.string()).optional(),
  dataAcknowledgements: z
    .object({
      items: z.array(
        z.object({
          // TODO: remove this unnecessary layer of nesting
          text: z.string(),
          url: z.string(),
        }),
      ),
    })
    .optional(),
  geoConfig: z.object({
    'bounding-box': z.tuple([Longitude, Latitude, Longitude, Latitude]),
    'buffered-hull': FeatureOfSchema(GeoJSONPolygonSchema).optional(),
    'center-area': FeatureOfSchema(GeoJSONPointSchema).optional(),
    // TODO: implement as configurable on server
    'default-viewport': z
      .tuple([Longitude, Latitude, Longitude, Latitude])
      .optional(),
  }),
  supportedRegion: z.string().optional(),
});
export type RegionConfig = z.infer<typeof RegionConfigSchema>;

let _regionConfig: RegionConfig | null = null;

function _getConfig(): RegionConfig {
  if (!_regionConfig) throw new Error('region config not initialized');
  return _regionConfig;
}

export function init(config: RegionConfig) {
  if (_regionConfig) {
    throw new Error('region config already initialized');
  }
  _regionConfig = config;
}