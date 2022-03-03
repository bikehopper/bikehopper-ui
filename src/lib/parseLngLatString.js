// Parse a string representing a lng-lat pair, such as "-122.4, 37.8", or
// return null if the passed string cannot be parsed as valid coordinates.
export default function parseLngLatString(s) {
  const points = s.split(',').map((part) => Number(part.trim()));

  if (
    points.length !== 2 ||
    Number.isNaN(points[0]) ||
    points[0] < -180 ||
    points[0] > 180 ||
    Number.isNaN(points[1]) ||
    points[1] < -90 ||
    points[1] > 90
  ) {
    return null;
  }

  return points;
}
