const { readFileSync, writeFileSync } = require('fs');
const { parse } = require('csv/sync');
const turfConvex = require('@turf/convex').default;
const turfBuffer = require('@turf/buffer');

// computes a polygon to define the "transit service area"

// run this with an unzipped 511 GTFS dump saved in the current directory

// for non-Bay Area regions, you will want to change the next few lines that
// filter specific parts of the Bay Area transit data, but the rest of this
// algorithm should be usable

// Bay Area: we want to filter out stops only served by ACE and Capitol
// Corridor JPA since they go far outside the area we have local transit for
// (e.g. Sacramento, Stockton)
const FILTERED_AGENCY_IDS = new Set(['CE', 'AM']);

// also let's manually filter the SolTrans B, which stops in Davis and Sacramento
const MANUALLY_FILTERED_ROUTE_IDS = new Set(['ST:B']);

const [routesKey, ...routes] = parse(readFileSync('routes.txt', 'utf8'));
const filteredRouteIds = new Set(routes.filter(
  route => FILTERED_AGENCY_IDS.has(route[routesKey.indexOf('agency_id')])
).map(
  route => route[routesKey.indexOf('route_id')]
));
for (const manualFilteredId of MANUALLY_FILTERED_ROUTE_IDS)
  filteredRouteIds.add(manualFilteredId);

const [tripsKey, ...trips] = parse(readFileSync('trips.txt', 'utf8'));
const filteredTripIds = new Set(trips.filter(
  trip => filteredRouteIds.has(trip[tripsKey.indexOf('route_id')])
).map(
  trip => trip[tripsKey.indexOf('trip_id')]
));

// now we do things a little backwards... instead of the set of all filtered
// stops, we build a set of all interesting stops. that is because if a stop
// is served both by a filtered agency AND a local transit agency, then we
// want to include it.
const interestingStopIds = new Set([]);
const [stopTimesKey, ...stopTimes] = parse(readFileSync('stop_times.txt', 'utf8'));
const stopTimesTripIdIndex = stopTimesKey.indexOf('trip_id');
const stopTimesStopIdIndex = stopTimesKey.indexOf('stop_id');
for (let stopTime of stopTimes) {
  const stopId = stopTime[stopTimesStopIdIndex];
  const tripId = stopTime[stopTimesTripIdIndex];
  if (!filteredTripIds.has(tripId)) {
    interestingStopIds.add(stopId);
  }
}

// and now just aggregate all the interesting stop IDs as GeoJSON

const [stopsKey, ...stops] = parse(readFileSync('stops.txt', 'utf8'));

const lngIndex = stopsKey.indexOf('stop_lon');
const latIndex = stopsKey.indexOf('stop_lat');
const stopIdIndex = stopsKey.indexOf('stop_id');
const stopNameIndex = stopsKey.indexOf('stop_name');

const interestingStopsAsGeoJsonPoints = stops.map(stopCsv => {
  const lng = Number(stopCsv[lngIndex]), lat = Number(stopCsv[latIndex]);
  const stopName = stopCsv[stopNameIndex];
  const stopId = stopCsv[stopIdIndex];

  if (!interestingStopIds.has(stopId)) return null;

  if (Number.isNaN(lng) || Number.isNaN(lat)) {
    console.error(`invalid lng, lat for stop ID ${stopId}`);
    process.exit(1);
  }
  return {
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": [lng, lat],
    },
    "properties": {
      "name": `${stopName} (${stopId})`,
    },
  };
}).filter(pt => pt != null);

const interestingStopsCollection = {
  type: 'FeatureCollection',
  features: interestingStopsAsGeoJsonPoints,
};

const convexHull = turfConvex(interestingStopsCollection);
const bufferedHull = turfBuffer(convexHull, 5, {units: 'miles'});

console.log(JSON.stringify(bufferedHull));
