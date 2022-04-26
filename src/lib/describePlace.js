// Describe a place from its Photon GeoJSON result hash.
// (If we were to switch back to Nominatim, parts of this would change)
export default function describePlace(feature, { short = false } = {}) {
  if (!feature || feature.type !== 'Feature' || !feature.properties)
    return 'Point';

  const {
    name = '',
    housenumber,
    street = '',
    city = '',
    postcode = '',
  } = feature.properties;

  const descriptionElements = [
    name,
    housenumber != null ? housenumber + ' ' + street : street,
    city,
    postcode,
  ];

  if (short) {
    return descriptionElements.find((segment) => !!segment) || 'Point';
  } else {
    return (
      descriptionElements.filter((segment) => !!segment).join(', ') || 'Point'
    );
  }
}
