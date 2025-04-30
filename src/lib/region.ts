import { z } from 'zod';
import { GeoJSONPolygonSchema } from 'zod-geojson';

export function getAgencyDisplayName(gtfsAgencyName: string): string {
  const { agencyAliases } = _getConfig();
  return (agencyAliases && agencyAliases[gtfsAgencyName]) || gtfsAgencyName;
}

export function getSupportedRegionText(): string | undefined {
  return _getConfig().supportedRegionDescription;
}

export function getDefaultViewportBounds(): [number, number, number, number] {
  const { defaultViewport, transitServiceArea } = _getConfig();
  if (defaultViewport) {
    return defaultViewport;
  } else if (transitServiceArea) {
    // generate bounding box
    let bbox: [number, number, number, number] = [180, 90, -180, -90];
    for (const coord of transitServiceArea.geometry.coordinates[0]) {
      bbox[0] = Math.min(bbox[0], coord[0]);
      bbox[1] = Math.min(bbox[1], coord[1]);
      bbox[2] = Math.max(bbox[2], coord[0]);
      bbox[3] = Math.max(bbox[3], coord[1]);
    }
    return bbox;
  } else {
    throw new Error(
      'one of default viewport or transit service area must be defined',
    );
  }
}

export function getTransitServiceArea():
  | GeoJSON.Feature<GeoJSON.Polygon>
  | undefined {
  return _getConfig().transitServiceArea;
}

export function getTransitDataAcknowledgement():
  | {
      text: string;
      url: string;
    }
  | undefined {
  return _getConfig().transitDataAcknowledgement;
}

export function getMapboxStyleParams(): {
  mapboxAccessToken: string;
  mapboxStyleUrl: string;
} {
  let { mapboxAccessToken, mapboxStyleUrl } = _getConfig();
  if (import.meta.env.VITE_MAPBOX_STYLE_URL) {
    mapboxStyleUrl = import.meta.env.VITE_MAPBOX_STYLE_URL;
  }

  if (import.meta.env.VITE_MAPBOX_TOKEN) {
    mapboxAccessToken = import.meta.env.VITE_MAPBOX_TOKEN;
  }

  return { mapboxAccessToken, mapboxStyleUrl };
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
  agencyAliases: z.record(z.string(), z.string()).optional(),
  transitDataAcknowledgement: z
    .object({
      text: z.string(),
      url: z.string(),
    })
    .optional(),
  transitServiceArea: FeatureOfSchema(GeoJSONPolygonSchema).optional(),
  defaultViewport: z
    .tuple([Longitude, Latitude, Longitude, Latitude])
    .optional(),
  supportedRegionDescription: z.string().optional(),
  mapboxAccessToken: z.string(),
  mapboxStyleUrl: z.string(),
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
