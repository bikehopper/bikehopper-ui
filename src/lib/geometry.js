import * as turf from '@turf/helpers';
import transformRotate from '@turf/transform-rotate';
import bezierSpline from '@turf/bezier-spline';
import distance from '@turf/distance';
import lineSliceAlong from '@turf/line-slice-along';
import {
  darkenLegColor,
  DEFAULT_PT_COLOR,
  TRANSITION_COLOR,
  getTextColor,
} from './colors.js';

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
      if (leg.type === 'pt') {
        let routeColor = leg.route_color;
        if (!routeColor) routeColor = DEFAULT_PT_COLOR;
        const legColor = darkenLegColor(routeColor);
        const textColor = getTextColor(legColor);
        const legFeature = turf.lineString(leg.geometry.coordinates, {
          route_color: legColor,
          text_color: textColor.main,
          text_halo_color: textColor.halo,
          route_name: leg.route_name,
          type: leg.type,
          path_index: pathIdx,
        });
        features.push(legFeature);
      }

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
            route_color: TRANSITION_COLOR,
          },
          resolution: 1000,
        });
        if (transitionFeature) features.push(transitionFeature);
      }

      // Add detail features
      const detailFeatures = detailsToLines(
        leg.details,
        leg.geometry.coordinates,
        leg.type,
        pathIdx,
      );
      if (detailFeatures) features.push(...detailFeatures);
    }
  }

  return turf.featureCollection(features);
}

/**
 * From a details object, generates a coherent set of lines such that no lines overlap.
 *
 * @param {object} details
 */
function detailsToLines(details, coordinates, type, pathIdx) {
  if (!details || !Object.keys(details).length) return;
  const lines = [];
  let currentStart = 0;
  const keys = Object.keys(details);
  let indexes = {};
  keys.forEach((k) => {
    indexes[k] = 0;
  });

  while (currentStart < coordinates.length - 1) {
    let ends = {};
    keys.forEach((k) => {
      ends[k] = details[k][indexes[k]][1];
    });
    const currentEnd = Math.min(...Object.values(ends));

    let lineDetails = {};
    keys.forEach(
      (k) => (lineDetails[k] = details[k][indexes[k]][2].replace('_', ' ')),
    );

    const line = coordinates?.slice(currentStart, currentEnd + 1);
    if (line.length > 1)
      lines.push(
        turf.lineString(line, {
          path_index: pathIdx,
          type,
          ...lineDetails,
        }),
      );

    currentStart = currentEnd;
    for (const k of keys) {
      if (currentStart >= ends[k]) indexes[k]++;
    }
  }
  return lines;
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
