// Describe a place from its Photon GeoJSON result hash.
// (If we were to switch back to Nominatim, parts of this would change)
export default function describePlace(feature) {
  if (!feature || feature.type !== 'Feature' || !feature.properties)
    return 'Point';

  const {
    name = '',
    housenumber,
    street = '',
    city = '',
    postcode = '',
  } = feature.properties;

  const description = [
    name,
    housenumber != null ? housenumber + ' ' + street : street,
    city,
    postcode,
  ]
    .filter((segment) => !!segment)
    .join(', ');

  return description || 'Point';
}
