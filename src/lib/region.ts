import { z } from 'zod';
import {
  GeoJSONFeatureSchema,
  GeoJSONPointSchema,
  GeoJSONPolygonSchema,
} from 'zod-geojson';

export function getAgencyDisplayName(gtfsAgencyName: string): string {
  const { agencyNames } = _getConfig();
  return (agencyNames && agencyNames[gtfsAgencyName]) || gtfsAgencyName;
}

export function getSupportedRegionText(): string | undefined {
  return _getConfig().supportedRegion;
}

// TODO: Manual override as this starts BikeHopper too zoomed out.
export function getDefaultViewportBounds(): [number, number, number, number] {
  const config = _getConfig();
  const hull = config.geoConfig['buffered-hull'];
  if (hull) {
    // generate bounding box for hull
    let bbox: [number, number, number, number] = [180, 90, -180, -90];
    for (const coord of hull.geometry.coordinates[0]) {
      bbox[0] = Math.min(bbox[0], coord[0]);
      bbox[1] = Math.min(bbox[1], coord[1]);
      bbox[2] = Math.max(bbox[2], coord[0]);
      bbox[3] = Math.max(bbox[3], coord[1]);
    }
    return bbox;
  }
  return config.geoConfig['bounding-box'];
}

export function getTransitServiceArea():
  | GeoJSON.Feature<GeoJSON.Polygon>
  | undefined {
  const hull = _getConfig().geoConfig['buffered-hull'];
  // work around https://github.com/reilem/zod-geojson/issues/4
  return hull as GeoJSON.Feature<GeoJSON.Polygon> | undefined;
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
