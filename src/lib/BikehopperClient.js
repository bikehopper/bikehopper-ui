export async function fetchRoute({
  profile = 'pt',
  optimize = false,
  pointsEncoded = false,
  points,
  signal,
}) {
  const route = await fetch(
    `${getRequestHost()}/v1/graphhopper/route-pt?point=${points[0]}&point=${
      points[1]
    }&locale=en-US&pt.earliest_departure_time=${encodeURIComponent(
      new Date().toISOString(),
    )}&elevation=true&profile=${profile}&use_miles=false&selected_detail=Elevation&layer=OpenStreetMap&points_encoded=${pointsEncoded}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal,
    },
  );

  if (!route.ok) throw new Error(route.statusText);

  return route.json();
}

export async function geocode(
  placeString,
  { limit = 1, format = 'geojson', signal },
) {
  const url = `${
    getRequestHost()
  }/v1/nominatim/search?q=${encodeURIComponent(
    placeString,
  )}&limit=${limit}&format=${format}`;

  // We might want to support bounding the results based on the map viewport,
  // prioritizing closer results, etc., but this is not straightforward in the
  // Nominatim search API. You can only give Nominatim a *strict* bounding box,
  // in which case it absolutely will not return anything outside that box, or
  // (as we do now) get results from everywhere with no proximity weighting.

  const geocoding = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal,
  });

  if (!geocoding.ok) throw new Error(geocoding.statusText);

  return geocoding.json();
}

function getRequestHost() {
  if (process.env.NODE_ENV === 'development')
    return window.location.protocol + '//' + window.location.host;
  return process.env.REACT_APP_BIKEHOPPER_DOMAIN;
}
