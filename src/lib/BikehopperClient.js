export async function getRoute({
  profile = 'bike2',
  optimize = false,
  pointsEncoded = false,
  points,
  signal,
}) {
  const route = await fetch(`${process.env.REACT_APP_BIKEHOPPER_DOMAIN}/v1/route?point=${points[0]}&point=${points[1]}&profile=${profile}&optimize=${optimize}&points_encoded=${pointsEncoded}`, {
    method: 'GET',
    headers: {'Content-Type': 'application/json'},
    signal,
  });

  return route.json();
}
