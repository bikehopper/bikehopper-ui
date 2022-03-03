import * as turf from '@turf/helpers';
import transformRotate from '@turf/transform-rotate';
import bezierSpline from '@turf/bezier-spline';
import distance from '@turf/distance';
import lineSliceAlong from '@turf/line-slice-along';

export function routeToGeoJSON(route) {
  if (!(route?.paths?.length > 0)) return null;

  const features = [];
  const paths = route.paths;

  // For-each path
  for (let pathIdx = 0; pathIdx < paths.length; pathIdx++) {
    const path = paths[pathIdx];

    // For-each leg in the path
    for (let legIdx = 0; legIdx < path.legs.length; legIdx++) {
      const leg = path.legs[legIdx];

      // Add a LineString feature for the leg
      const legFeature = turf.lineString(leg.geometry.coordinates, {
        route_color: leg.route_color ? '#' + leg.route_color : null,
        route_name: leg.route_name,
        type: leg.type,
        path_index: pathIdx,
        is_transition: false,
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
            route_color: 'darkgray',
            path_index: pathIdx,
            is_transition: true,
          },
          resolution: 1000,
        });
        if (transitionFeature) features.push(transitionFeature);
      }

      // Add detail features for cycleway quality
      if (leg.details?.cycleway) {
        const cycleway_features = [];
        for (const segment of leg.details?.cycleway) {
          const [start, end, type] = segment;
          if (type === 'other') continue;

          const line = leg.geometry.coordinates?.slice(start, end);

          if (line?.length < 2) continue;

          cycleway_features.push(
            turf.lineString(line, {
              route_color:
                type === 'lane' ? 'yellow' : type === 'yes' ? 'orange' : 'red',
              route_name: type,
              path_index: pathIdx,
              is_transition: false,
            }),
          );
        }
        features.push(...cycleway_features);
      }
      if (leg.details?.road_class) {
        const road_class_segments = leg.details?.road_class.filter(
          ([, , value]) => value === 'cycleway',
        );
        const road_class_features = [];
        for (const [start, end] of road_class_segments) {
          const line = leg.geometry.coordinates?.slice(start, end);

          if (line?.length < 2) continue;

          road_class_features.push(
            turf.lineString(line, {
              route_color: 'green',
              route_name: 'fully dedicated',
              path_index: pathIdx,
              is_transition: false,
            }),
          );
        }

        features.push(...road_class_features);
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
