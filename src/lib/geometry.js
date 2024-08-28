import * as turf from '@turf/helpers';
import { segmentEach } from '@turf/meta';
import transformRotate from '@turf/transform-rotate';
import bezierSpline from '@turf/bezier-spline';
import distance from '@turf/distance';
import turfLength from '@turf/length';
import lineSliceAlong from '@turf/line-slice-along';
import parseCoords from 'parse-coords';
import {
  darkenLegColor,
  DEFAULT_PT_COLOR,
  TRANSITION_COLOR,
  getTextColor,
} from './colors';

export const POINT_PRECISION = 5;

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

export function routesToGeoJSON(paths, intl) {
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
        intl,
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
function detailsToLines(details, coordinates, type, pathIdx, intl) {
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
    for (const k of keys) lineDetails[k] = details[k][indexes[k]][2];

    const line = coordinates?.slice(currentStart, currentEnd + 1);
    if (line.length > 1) {
      lines.push(
        turf.lineString(line, {
          path_index: pathIdx,
          type,
          ...lineDetails,
          bike_infra: describeStepAnnotation(
            _describeBikeInfraFromCyclewayAndRoadClass(
              lineDetails['cycleway'],
              lineDetails['road_class'],
            ),
            intl,
          ),
        }),
      );
    }

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

export const STEP_ANNOTATIONS = {
  path: 1,
  bikePath: 2,
  footPath: 3,
  promenade: 4,
  steps: 5,
  protectedBikeLane: 6,
  bikeLane: 7,
  sharedRoad: 8,
  shoulder: 9,
  mainRoad: 10,
  steepHill: 11,
  verySteepHill: 12,
};

export function describeStepAnnotation(sa, intl) {
  switch (sa) {
    case STEP_ANNOTATIONS.path:
      return intl.formatMessage({
        defaultMessage: 'path',
        description:
          'annotation for a step in a series of biking directions.' +
          ' A path, such as foot path or bike path.',
      });
    case STEP_ANNOTATIONS.bikePath:
      return intl.formatMessage({
        defaultMessage: 'bike path',
        description: 'annotation for a step in a series of biking directions.',
      });
    case STEP_ANNOTATIONS.footPath:
      return intl.formatMessage({
        defaultMessage: 'foot path',
        description: 'annotation for a step in a series of biking directions.',
      });
    case STEP_ANNOTATIONS.promenade:
      return intl.formatMessage({
        defaultMessage: 'promenade',
        description: 'annotation for a step in a series of biking directions.',
      });
    case STEP_ANNOTATIONS.steps:
      return intl.formatMessage({
        defaultMessage: 'steps',
        description:
          'annotation for a step in a series of biking directions.' +
          ' Steps or a staircase.',
      });
    case STEP_ANNOTATIONS.protectedBikeLane:
      return intl.formatMessage({
        defaultMessage: 'protected bike lane',
        description: 'annotation for a step in a series of biking directions.',
      });
    case STEP_ANNOTATIONS.bikeLane:
      return intl.formatMessage({
        defaultMessage: 'bike lane',
        description: 'annotation for a step in a series of biking directions.',
      });
    case STEP_ANNOTATIONS.sharedRoad:
      return intl.formatMessage({
        defaultMessage: 'shared road',
        description:
          'annotation for a step in a series of biking directions.' +
          ' A road intended for cycling but that cyclists must share with cars,' +
          ' without a bike lane.',
      });
    case STEP_ANNOTATIONS.shoulder:
      return intl.formatMessage({
        defaultMessage: 'shoulder',
        description:
          'annotation for a step in a series of biking directions.' +
          ' A road where bikes are recommended to ride on the shoulder.',
      });
    case STEP_ANNOTATIONS.mainRoad:
      return intl.formatMessage({
        defaultMessage: 'main road',
        description:
          'annotation for a step in a series of biking directions.' +
          ' A main road which might have lots of fast traffic.',
      });
    case STEP_ANNOTATIONS.steepHill:
      return intl.formatMessage({
        defaultMessage: 'steep hill',
        description: 'annotation for a step in a series of biking directions.',
      });
    case STEP_ANNOTATIONS.verySteepHill:
      return intl.formatMessage({
        defaultMessage: 'very steep hill',
        description: 'annotation for a step in a series of biking directions.',
      });
    default:
      return '';
  }
}

function _describeBikeInfraFromCyclewayAndRoadClass(cycleway, roadClass) {
  if (roadClass === 'path') return STEP_ANNOTATIONS.path;
  if (roadClass === 'cycleway') return STEP_ANNOTATIONS.bikePath;
  if (roadClass === 'footway') return STEP_ANNOTATIONS.footPath;
  if (roadClass === 'pedestrian') return STEP_ANNOTATIONS.promenade;
  if (roadClass === 'steps') return STEP_ANNOTATIONS.steps;
  if (cycleway === 'track') return STEP_ANNOTATIONS.protectedBikeLane;
  if (cycleway === 'lane') return STEP_ANNOTATIONS.bikeLane;
  if (cycleway === 'shared_lane') return STEP_ANNOTATIONS.sharedRoad;
  if (cycleway === 'sidepath') return STEP_ANNOTATIONS.path;
  if (cycleway === 'shoulder') return STEP_ANNOTATIONS.shoulder;
  if (MAIN_ROADS.includes(roadClass)) return STEP_ANNOTATIONS.mainRoad;
  return null;
}

// Describe the bike infra encountered at a particular step of the instructions which
// spans points 'start' to 'end' in 'lineString'.
//
// 'cyclewayValues' and 'roadClasses' are each arrays of triples [start, end, value]
// in which the start and end refer to coordinate indexes in the lineString.
//
// Return: array of STEP_ANNOTATIONS values.
export function describeBikeInfra(
  lineString,
  cyclewayValues,
  roadClasses,
  start,
  end,
) {
  if (end <= start) return []; // Ignore instruction steps that travel zero distance.

  const stepLineString = turf.lineString(
    lineString.coordinates.slice(start, end + 1),
  );

  // The approach here is to compute the total length traveled in this step,
  // and then tally what kinds of bike infra we encounter by percentage of that
  // distance.

  const stepTotalDistance = turfLength(stepLineString);

  const MIN_STEEP_HILL_LENGTH = turf.convertLength(500, 'feet', 'kilometers');

  let cyclewayIndex = 0,
    roadClassIndex = 0;
  const distanceByInfraType = new Map();
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
      distanceByInfraType.set(
        infraType,
        (distanceByInfraType.get(infraType) || 0) +
          (segmentLength * 100) / stepTotalDistance,
      );
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

  // Don't describe steps less than 150 feet long...
  // ...unless they contain literal steps.
  const MIN_DISTANCE_TO_DESCRIBE = turf.convertLength(
    150,
    'feet',
    'kilometers',
  );
  if (stepTotalDistance < MIN_DISTANCE_TO_DESCRIBE) {
    if (distanceByInfraType.has(STEP_ANNOTATIONS.steps))
      return [STEP_ANNOTATIONS.steps];
    return [];
  }

  let infraTypes = Array.from(distanceByInfraType.entries());
  // Sort the infra types by most common first
  infraTypes.sort((a, b) => b[1] - a[1]);

  let descriptors = infraTypes
    .filter(([infraType, percent]) => percent > 25)
    .map(([infraType, percent]) => infraType);

  if (maxGrade > 14) {
    descriptors.unshift(STEP_ANNOTATIONS.verySteepHill);
  } else if (maxGrade > 8) {
    descriptors.unshift(STEP_ANNOTATIONS.steepHill);
  }

  return descriptors;
}

function _elevationChangeInKm(lineSegment) {
  return (
    (lineSegment.geometry.coordinates[1][2] -
      lineSegment.geometry.coordinates[0][2]) /
    1000
  );
}

/* Parse a lat-lng string, such as "37.835889, -122.289222".
 *
 * This is for UI-facing use. Note that this is LAT-LNG order, for consistency
 * with the user interfaces of other commonly used mapping apps, and NOT in the
 * LNG-LAT order that BikeHopper uses in URLs and in most places internally.
 *
 * In fact, the return value is in [lng, lat] format, or null if not parseable
 * as a lat-lng string.
 */
export function parsePossibleCoordsString(str) {
  // In the parse coords lib, commas are optional.
  // This means something like "33 19" gets parsed as coords when in SF that
  // should return 33 19th Avenue. So as a pre-filter, require at least one of
  // comma, degree, minute or second symbol.
  if (!str.match(/[,'"°]/)) return null;

  const result = parseCoords(str);
  return result ? [result.lng, result.lat] : null;
}

/* Stringify coordinates for display in the UI.
 * As with the corresponding parse function, it is assumed that in the UI we
 * will have LAT-LNG order rather than the LNG-LAT order we use internally in
 * the code.
 */
export function stringifyCoords([lng, lat]) {
  return `${lat.toFixed(POINT_PRECISION)}, ${lng.toFixed(POINT_PRECISION)}`;
}
