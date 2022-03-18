export async function fetchRoute({
  profile = 'pt',
  connectingProfile = 'bike2',
  optimize = false,
  pointsEncoded = false,
  details,
  points,
  signal,
}) {
  const detail_param = details?.join('&details=') || '';
  const route = await fetch(
    `${process.env.REACT_APP_GRAPHHOPPER_PATH}/route-pt?point=${
      points[0]
    }&point=${
      points[1]
    }&locale=en-US&pt.earliest_departure_time=${encodeURIComponent(
      new Date().toISOString(),
    )}&elevation=true&profile=${profile}&pt.connecting_profile=${connectingProfile}&use_miles=false&selected_detail=Elevation&layer=OpenStreetMap&points_encoded=${pointsEncoded}&details=${detail_param}`,
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
    url += `&lat=${latitude}&lon=${longitude}&zoom=${zoom}&location_bias_scale=${locationBias}`;
  }

  const geocoding = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal,
  });

  if (!geocoding.ok) throw new Error(geocoding.statusText);

  return geocoding.json();
}
