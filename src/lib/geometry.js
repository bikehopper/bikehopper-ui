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
 * @param {object} details
 */
function detailsToLines(details, coordinates, type, pathIdx) {
  if (!details || !Object.keys(details).length) return;
  const lines = [];
  const indexes = Array(coordinates.length);

  for (const [key, segments] of Object.entries(details)) {
    for (const [start, end, value] of segments) {
      for (let i = start; i < end + 1; i++) {
        if (!indexes[i]) indexes[i] = {};
        indexes[i][key] = value;
      }
    }
  }

  let currentStart;
  let currentProps;
  for (let i = 0; i < indexes.length; i++) {
    const props = indexes[i];
    // Skip until properties are found
    if (!props || !Object.entries(props).length) continue;

    // The first line is started
    if (!currentProps) {
      currentStart = i;
      currentProps = props;
      continue;
    }

    // Skip until the end of the line
    if (JSON.stringify(currentProps) === JSON.stringify(props)) continue;

    // The line finished, add it to the list
    const line = coordinates?.slice(currentStart, i + 1);
    if (line?.length < 2) continue;

    lines.push(
      turf.lineString(line, {
        path_index: pathIdx,
        type,
        ...currentProps,
      }),
    );

    // Start a new line
    currentStart = i;
    currentProps = props;
  }
  // Finish the last line
  if (currentProps && Object.entries(currentProps).length) {
    const line = coordinates?.slice(currentStart, indexes.length);
    if (line.length > 1)
      lines.push(
        turf.lineString(line, {
          path_index: pathIdx,
          type,
          ...currentProps,
        }),
      );
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
