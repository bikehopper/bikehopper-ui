const turfConvex = require('@turf/convex').default;
const turfBuffer = require('@turf/buffer');
const turfCenterOfMass = require('@turf/center-of-mass').default;
const { filteredAgencyIds, manuallyFilteredRouteIds, gtfsPath } = require('./configs.json');
const { filterRouteIds, filterTripIds, getInterestingStopIds, getInterestingStopsAsGeoJsonPoints } = require('./gtfs-helpers');

(async () => {
  // computes a polygon to define the "transit service area"

  // run this with an unzipped 511 GTFS dump saved in the current directory

  // for non-Bay Area regions, you will want to change the next few lines that
  // filter specific parts of the Bay Area transit data, but the rest of this
  // algorithm should be usable

  // Bay Area: we want to filter out stops only served by ACE and Capitol
  // Corridor JPA since they go far outside the area we have local transit for
  // (e.g. Sacramento, Stockton)
  const FILTERED_AGENCY_IDS = new Set(filteredAgencyIds);

  // also let's manually filter the SolTrans B, which stops in Davis and Sacramento
  const MANUALLY_FILTERED_ROUTE_IDS = new Set(manuallyFilteredRouteIds);

  const filteredRouteIds = await filterRouteIds(FILTERED_AGENCY_IDS, MANUALLY_FILTERED_ROUTE_IDS, gtfsPath);

  const filteredTripIds = await filterTripIds(filteredRouteIds, gtfsPath);

  // now we do things a little backwards... instead of the set of all filtered
  // stops, we build a set of all interesting stops. that is because if a stop
  // is served both by a filtered agency AND a local transit agency, then we
  // want to include it.
  const interestingStopIds = await getInterestingStopIds(filteredTripIds, gtfsPath);

  // and now just aggregate all the interesting stop IDs as GeoJSON
  const interestingStopsAsGeoJsonPoints = await getInterestingStopsAsGeoJsonPoints(interestingStopIds, gtfsPath);
  const interestingStopsCollection = {
    type: 'FeatureCollection',
    features: interestingStopsAsGeoJsonPoints,
  };

  const convexHull = turfConvex(interestingStopsCollection);
  const bufferedHull = turfBuffer(convexHull, 5, {units: 'miles'});
  const centerOfBufferedHull = turfCenterOfMass(bufferedHull);

  console.log(JSON.stringify(centerOfBufferedHull));
  console.log(JSON.stringify(bufferedHull));
})();
