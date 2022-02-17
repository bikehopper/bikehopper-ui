export async function getRoute({
  profile = 'pt',
  optimize = false,
  pointsEncoded = false,
  points,
  signal,
}) {
  const route = await fetch(
    `${process.env.REACT_APP_BIKEHOPPER_DOMAIN}/v1/graphhopper/route-pt?point=${
      points[0]
    }&point=${
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
  { zoom = 12, lat, lon, limit = 1, signal },
) {
  let url = `${
    process.env.REACT_APP_BIKEHOPPER_DOMAIN
  }/v1/photon/geocode?q=${encodeURIComponent(placeString)}&limit=${limit}`;
  if (lat != null && lon != null) url += `&lat=${lat}&lon=${lon}&zoom=${zoom}`;

  const geocoding = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal,
  });

  if (!geocoding.ok) throw new Error(geocoding.statusText);

  return geocoding.json();
}
