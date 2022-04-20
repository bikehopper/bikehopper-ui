import * as turf from '@turf/helpers';
import transformRotate from '@turf/transform-rotate';
import bezierSpline from '@turf/bezier-spline';
import distance from '@turf/distance';
import lineSliceAlong from '@turf/line-slice-along';
import { darkenLegColor } from './colors.js';

export const EMPTY_GEOJSON = {
  type: 'FeatureCollection',
  features: [],
};

export const BIKEABLE_HIGHWAYS = ['cycleway', 'footway', 'pedestrian', 'path'];

export function routesToGeoJSON(paths) {
  const features = [];

  // For-each path
  for (let pathIdx = 0; pathIdx < paths.length; pathIdx++) {
    const path = paths[pathIdx];

    // For-each leg in the path
    for (let legIdx = 0; legIdx < path.legs.length; legIdx++) {
      const leg = path.legs[legIdx];

      // Add a LineString feature for the leg
      const legFeature = turf.lineString(leg.geometry.coordinates, {
        route_color: darkenLegColor(leg.route_color),
        route_name: leg.route_name,
        label: leg.route_name,
        type: leg.type,
        path_index: pathIdx,
      });
      features.push(legFeature);

      // Add transition for every leg except the last one
      if (legIdx !== path.legs.length - 1) {
        const nextLeg = path.legs[legIdx + 1];
        const start =
          leg.geometry.coordinates[leg.geometry.coordinates.length - 1];
        const end = nextLeg.geometry.coordinates[0];
        const transitionFeature = curveBetween(start, end, {
          properties: {
            path_index: pathIdx,
            type: leg.type,
          },
          resolution: 1000,
        });
        if (transitionFeature) features.push(transitionFeature);
      }

      // Add detail features for cycleway quality
      if (leg.details?.cycleway) {
        const cyclewayFeatures = [];
        for (const segment of leg.details?.cycleway) {
          const [start, end, type] = segment;
          if (type === 'other') continue;

          const line = leg.geometry.coordinates?.slice(start, end + 1);

          if (line?.length < 2) continue;

          cyclewayFeatures.push(
            turf.lineString(line, {
              label: type.replace('_', ' '),
              path_index: pathIdx,
              cycleway: type,
              type: leg.type,
            }),
          );
        }
        features.push(...cyclewayFeatures);
      }
      if (leg.details?.road_class) {
        const roadClassSegments = leg.details?.road_class.filter(
          ([, , value]) => BIKEABLE_HIGHWAYS.includes(value),
        );
        const roadClassFeatures = [];
        for (const [start, end, value] of roadClassSegments) {
          const line = leg.geometry.coordinates?.slice(start, end + 1);

          if (line?.length < 2) continue;

          roadClassFeatures.push(
            turf.lineString(line, {
              label: value,
              path_index: pathIdx,
              cycleway: value,
              type: leg.type,
            }),
          );
        }

        features.push(...roadClassFeatures);
      }
    }
  }

  return turf.featureCollection(features);
}

/**
 * Generates a curve feature between `start` and `end`., with a specified launch angle `angle`.
 * @param {*} start
 * @param {*} end
 * @param {*} options
 * @param {*} angle  In degrees, defaults to 30
 */
export function curveBetween(start, end, options, angle = 30) {
  const D = distance(start, end) / 2;
  if (D < 1e-10) return null;

  const R = D / Math.cos((angle * Math.PI) / 180);
  const rotated = transformRotate(turf.lineString([start, end]), angle, {
    pivot: start,
  });
  const sliced = lineSliceAlong(rotated, 0, R);

  return bezierSpline(
    turf.lineString([
      sliced.geometry.coordinates[0],
      sliced.geometry.coordinates[1],
      end,
    ]),
    options,
  );
}
