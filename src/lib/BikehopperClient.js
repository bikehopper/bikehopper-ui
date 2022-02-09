export async function getRoute({
  profile = 'pt',
  optimize = false,
  pointsEncoded = false,
  points,
  signal,
}) {
  const route = await fetch(`${process.env.REACT_APP_BIKEHOPPER_DOMAIN}/v1/route-pt?point=${points[0]}&point=${points[1]}&locale=en-US&pt.earliest_departure_time=${encodeURIComponent(new Date().toISOString())}&elevation=true&profile=${profile}&use_miles=false&selected_detail=Elevation&layer=OpenStreetMap&points_encoded=${pointsEncoded}`, {
    method: 'GET',
    headers: {'Content-Type': 'application/json'},
    signal,
  });

  return route.json();
}
