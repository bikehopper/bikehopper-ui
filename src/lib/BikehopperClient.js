const POINT_PRECISION = 5;

export async function fetchRoute({
  profile = 'pt',
  connectingProfile = 'bike2',
  arriveBy = false,
  earliestDepartureTime,
  optimize = false,
  pointsEncoded = false,
  details,
  points,
  signal,
}) {
  const params = new URLSearchParams({
    locale: 'en-US',
    elevation: true,
    useMiles: false,
    layer: 'OpenStreetMap',
    profile,
    optimize,
    pointsEncoded,
    'pt.earliest_departure_time': earliestDepartureTime
      ? new Date(earliestDepartureTime).toISOString()
      : new Date().toISOString(),
    'pt.connecting_profile': connectingProfile,
    'pt.arrive_by': arriveBy,
  });
  for (const detail of details || []) params.append('details', detail);
  for (const pt of points)
    params.append(
      'point',
      pt.map((coord) => coord.toFixed(POINT_PRECISION)),
    );

  const url = `${process.env.REACT_APP_GRAPHHOPPER_PATH}/route-pt?${params}`;
  const route = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal,
  });

  if (!route.ok) throw new Error(route.statusText);

  return route.json();
}

export async function geocode(
  placeString,
  {
    limit = 1,
    latitude,
    longitude,
    zoom = 12,
    lang = 'en',
    locationBias = '0.1',
    signal,
  },
) {
  let url = `${
    process.env.REACT_APP_BIKEHOPPER_DOMAIN
  }/v1/photon/geocode?q=${encodeURIComponent(
    placeString,
  )}&lang=${lang}&limit=${limit}`;

  if (latitude != null && longitude != null) {
    zoom = Math.round(zoom); // Photon doesn't accept float zoom values
    url += `&lat=${latitude.toFixed(POINT_PRECISION)}&lon=${longitude.toFixed(
      POINT_PRECISION,
    )}&zoom=${zoom}&location_bias_scale=${locationBias}`;
  }

  const geocoding = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal,
  });

  if (!geocoding.ok) throw new Error(geocoding.statusText);

  return geocoding.json();
}
