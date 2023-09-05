function filterRouteIds(filteredAgencyIds, manuallyFilteredRouteIds, routesKey, routes) {
  const filteredRouteIds = new Set(routes.filter(
    route => filteredAgencyIds.has(route[routesKey.indexOf('agency_id')])
  ).map(
    route => route[routesKey.indexOf('route_id')]
  ));
  for (const manualFilteredId of manuallyFilteredRouteIds) {
    filteredRouteIds.add(manualFilteredId);
  }

  return filteredRouteIds
}

function filterTripIds(filteredRouteIds, tripsKey, trips) {
  return new Set(trips.filter(
    trip => filteredRouteIds.has(trip[tripsKey.indexOf('route_id')])
  ).map(
    trip => trip[tripsKey.indexOf('trip_id')]
  ));
}

function getInterestingStopIds(stopTimesKey, filteredTripIds, stopTimes) {
  const interestingStopIds = new Set([]);
  const stopTimesTripIdIndex = stopTimesKey.indexOf('trip_id');
  const stopTimesStopIdIndex = stopTimesKey.indexOf('stop_id');
  for (let stopTime of stopTimes) {
    const stopId = stopTime[stopTimesStopIdIndex];
    const tripId = stopTime[stopTimesTripIdIndex];
    if (!filteredTripIds.has(tripId)) {
      interestingStopIds.add(stopId);
    }
  }
  return interestingStopIds;
}

function getInterestingStopsAsGeoJsonPoints(stopsKey, interestingStopIds, stops) {
  const lngIndex = stopsKey.indexOf('stop_lon');
  const latIndex = stopsKey.indexOf('stop_lat');
  const stopIdIndex = stopsKey.indexOf('stop_id');
  const stopNameIndex = stopsKey.indexOf('stop_name');

  return stops.map(stopCsv => {
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
}

module.exports = {
  filterRouteIds,
  filterTripIds,
  getInterestingStopIds,
  getInterestingStopsAsGeoJsonPoints,
};
