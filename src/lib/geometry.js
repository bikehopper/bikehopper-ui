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
        route_color: '#' + leg['route_color'],
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
            path_idx: pathIdx,
            is_transition: true,
          },
        });
        features.push(transitionFeature);
      }
    }
  }

  return turf.featureCollection(features);
}

export function curveBetween(start, end, properties) {
  const D = distance(start, end) / 2;
  const angle = 30;
  const R = D / Math.cos((angle * Math.PI) / 180);
  const rotated = transformRotate(turf.lineString([start, end]), angle, {
    pivot: start,
  });
  const sliced = lineSliceAlong(rotated, 0, R);

  return bezierSpline(
    turf.lineString(
      [sliced.geometry.coordinates[0], sliced.geometry.coordinates[1], end],
      properties,
    ),
  );
}
