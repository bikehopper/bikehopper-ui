export default function parseLngLatString(s) {
  if (!s || !s.length) return;
  if (!s.match(/^\s*-?\d*\.\d*\s*,\s*-?\d*\.\d*\s*$/)) return;
  // Looks like we were given a lon-lat pair, e.g. -122.4, 37.8
  let point = s
    .split(',')
    ?.slice(0, 2)
    ?.map((part) => part.trim());

  if (!point || !point.length) return;

  for (const i in point) {
    if (isNaN(Number(point[i]))) return;
    point[i] = Number(point[i]);
  }
  return point;
}
