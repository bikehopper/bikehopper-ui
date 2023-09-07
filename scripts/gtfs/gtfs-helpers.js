const { parse } = require('csv-parse');

async function filterRouteIds(filteredAgencyIds, manuallyFilteredRouteIds, gtfsReadableStream) {
  const filteredRouteIds = new Set(manuallyFilteredRouteIds);
  let routesKey = null;
  let first = true;
  const parser = gtfsReadableStream.pipe(parse());
  for await (const route of parser) {
    if (first) {
      routesKey = route;
      first = false;
      continue;
    }
    if (filteredAgencyIds.has(route[routesKey.indexOf('agency_id')])) {
      filteredRouteIds.add(route[routesKey.indexOf('route_id')])
    }
  }
  return filteredRouteIds;
}

async function filterTripIds(filteredRouteIds, gtfsReadableStream) {
  const filterTripIds = new Set();
  let tripsKey = null;
  let first = true;
  const parser = gtfsReadableStream.pipe(parse());

  for await (const trip of parser) {
    if (first) {
      tripsKey = trip;
      first = false;
      continue;
    }
    if (filteredRouteIds.has(trip[tripsKey.indexOf('route_id')])) {
      filterTripIds.add(trip[tripsKey.indexOf('trip_id')]);
    }
  }

  return filterTripIds;
}

async function getInterestingStopIds(filteredTripIds, gtfsReadableStream) {
  const interestingStopIds = new Set([]);
  let stopTimesKey = null;
  let first = true;
  const parser = gtfsReadableStream.pipe(parse());

  for await (const stopTime of parser) {
    if (first) {
      stopTimesKey = stopTime;
      first = false;
      continue;
    }
    const stopTimesTripIdIndex = stopTimesKey.indexOf('trip_id');
    const stopTimesStopIdIndex = stopTimesKey.indexOf('stop_id');

    const stopId = stopTime[stopTimesStopIdIndex];
    const tripId = stopTime[stopTimesTripIdIndex];
    if (!filteredTripIds.has(tripId)) {
      interestingStopIds.add(stopId);
    }
  }

  return interestingStopIds;
}

async function getInterestingStopsAsGeoJsonPoints(interestingStopIds, gtfsReadableStream) {
  const stops = [];
  let stopsKey, lngIndex, latIndex, stopIdIndex, stopNameIndex;
  let first = true;
  const parser = gtfsReadableStream.pipe(parse());

  for await (const stopCsv of parser) {
    if (first) {
      stopsKey = stopCsv;
      lngIndex = stopsKey.indexOf('stop_lon');
      latIndex = stopsKey.indexOf('stop_lat');
      stopIdIndex = stopsKey.indexOf('stop_id');
      stopNameIndex = stopsKey.indexOf('stop_name');
      first = false;
      continue;
    }

    const lng = Number(stopCsv[lngIndex]), lat = Number(stopCsv[latIndex]);
    const stopName = stopCsv[stopNameIndex];
    const stopId = stopCsv[stopIdIndex];

    if (!interestingStopIds.has(stopId)) continue;

    if (Number.isNaN(lng) || Number.isNaN(lat)) {
      console.error(`invalid lng, lat for stop ID ${stopId}`);
      process.exit(1);
    }
    stops.push({
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [lng, lat],
      },
      "properties": {
        "name": `${stopName} (${stopId})`,
      },
    });
  }
  return stops;
}

module.exports = {
  filterRouteIds,
  filterTripIds,
  getInterestingStopIds,
  getInterestingStopsAsGeoJsonPoints,
};
