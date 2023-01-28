import * as turf from '@turf/helpers';
import { segmentEach } from '@turf/meta';
import transformRotate from '@turf/transform-rotate';
import bezierSpline from '@turf/bezier-spline';
import distance from '@turf/distance';
import turfLength from '@turf/length';
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
export const MAIN_ROADS = [
  'primary',
  'primary_link',
  'secondary',
  'secondary_link',
  'motorway',
  'motorway_link',
  'trunk',
  'trunk_link',
];

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
  for (const k of keys) indexes[k] = 0;

  while (currentStart < coordinates.length - 1) {
    let ends = {};
    for (const k of keys) ends[k] = details[k][indexes[k]][1];
    const currentEnd = Math.min(...Object.values(ends));

    let lineDetails = {};
    for (const k of keys)
      lineDetails[k] = details[k][indexes[k]][2].replace('_', ' ');

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
      if (currentStart === ends[k]) indexes[k]++;
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

function _describeBikeInfraFromCyclewayAndRoadClass(cycleway, roadClass) {
  if (roadClass === 'path') return 'path';
  if (roadClass === 'cycleway') return 'bike path';
  if (roadClass === 'footway') return 'foot path';
  if (roadClass === 'pedestrian') return 'promenade';
  if (roadClass === 'steps') return 'steps';
  if (cycleway === 'track') return 'protected bike lane';
  if (cycleway === 'lane') return 'bike lane';
  if (cycleway === 'shared_lane') return 'shared road';
  if (cycleway === 'sidepath') return 'sidepath';
  if (cycleway === 'shoulder') return 'shoulder';
  if (MAIN_ROADS.includes(roadClass)) return 'main road';
  return null;
}

// Describe the bike infra encountered at a particular step of the instructions which
// spans points 'start' to 'end' in 'lineString'.
//
// 'cyclewayValues' and 'roadClasses' are each arrays of triples [start, end, value]
// in which the start and end refer to coordinate indexes in the lineString.
//
// TODO: localize this (how since it's outside of react? intl parameter?)
export function describeBikeInfra(
  lineString,
  cyclewayValues,
  roadClasses,
  start,
  end,
) {
  if (end <= start) return ''; // Ignore instruction steps that travel zero distance.

  const stepLineString = turf.lineString(
    lineString.coordinates.slice(start, end + 1),
  );

  // The approach here is to compute the total length traveled in this step,
  // and then tally what kinds of bike infra we encounter by percentage of that
  // distance.

  const stepTotalDistance = turfLength(stepLineString);

  // Don't describe steps less than 150 feet long.
  const MIN_DISTANCE_TO_DESCRIBE = turf.convertLength(
    150,
    'feet',
    'kilometers',
  );
  if (stepTotalDistance < MIN_DISTANCE_TO_DESCRIBE) return '';

  const MIN_STEEP_HILL_LENGTH = turf.convertLength(500, 'feet', 'kilometers');

  let cyclewayIndex = 0,
    roadClassIndex = 0;
  const distanceByInfraType = {};
  let gradesScratchpad = []; // array of [percent grade, length in km] tuples
  let maxGrade = 0;

  segmentEach(stepLineString, (cur, _f, _mf, _g, segmentIndex) => {
    const segmentStartIndexInWhole = segmentIndex + start;

    while (cyclewayValues[cyclewayIndex][1] <= segmentStartIndexInWhole)
      cyclewayIndex++;
    while (roadClasses[roadClassIndex][1] <= segmentStartIndexInWhole)
      roadClassIndex++;

    const segmentLength = turfLength(cur);
    if (segmentLength === 0) return; // nothing to compute for zero length segments

    const infraType = _describeBikeInfraFromCyclewayAndRoadClass(
      cyclewayValues[cyclewayIndex][2],
      roadClasses[roadClassIndex][2],
    );

    if (infraType) {
      distanceByInfraType[infraType] =
        (distanceByInfraType[infraType] || 0) +
        (segmentLength * 100) / stepTotalDistance;
    }

    // Compute windowed grade
    const segmentGrade = (100 * _elevationChangeInKm(cur)) / segmentLength;
    gradesScratchpad.push([segmentGrade, segmentLength]);

    // compute a weighted average until we reach the min length
    let lengthLeftToConsider = MIN_STEEP_HILL_LENGTH;
    let summedGrades = 0;
    let ix = gradesScratchpad.length;
    while (--ix >= 0 && lengthLeftToConsider > 0) {
      let [thisGrade, thisLen] = gradesScratchpad[ix];
      thisLen = Math.min(thisLen, lengthLeftToConsider);
      summedGrades += thisGrade * thisLen;
      lengthLeftToConsider -= thisLen;
    }

    if (lengthLeftToConsider > 0) return; // not enough distance for grade computation

    const windowedAverageGrade = Math.abs(summedGrades / MIN_STEEP_HILL_LENGTH);
    maxGrade = Math.max(maxGrade, windowedAverageGrade);
  });

  let infraTypes = Object.entries(distanceByInfraType);
  // Sort the infra types by most common first
  infraTypes.sort((a, b) => b[1] - a[1]);

  let descriptors = infraTypes
    .filter(([infraType, percent]) => percent > 25)
    .map(([infraType, percent]) => `${_describePercent(percent)} ${infraType}`);

  if (maxGrade > 14) {
    descriptors = [
      'very steep hill (max grade ' + maxGrade.toFixed(1) + '%)',
    ].concat(descriptors);
  } else if (maxGrade > 8) {
    descriptors = [
      'steep hill (max grade ' + maxGrade.toFixed(1) + '%)',
    ].concat(descriptors);
  }

  return descriptors.join(', ');
}

function _describePercent(percent) {
  if (percent > 75) return '';
  if (percent > 50) return 'mostly ';
  return 'partial ';
}

function _elevationChangeInKm(lineSegment) {
  return (
    (lineSegment.geometry.coordinates[1][2] -
      lineSegment.geometry.coordinates[0][2]) /
    1000
  );
}
