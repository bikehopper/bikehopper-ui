// Describe a place from its Photon GeoJSON result hash.
// (If we were to switch back to Nominatim, parts of this would change)
// TODO: Replace the default "fallback" with null, fix anything that breaks,
// localize call sites relying on "Point" (or specifying an unlocalized fallback)
export default function describePlace(
  feature,
  { short = false, fallback = 'Point' } = {},
) {
  if (!feature || feature.type !== 'Feature' || !feature.properties)
    return fallback;

  const {
    name = '',
    housenumber,
    street = '',
    city = '',
    postcode = '',
  } = feature.properties;

  const descriptionElements = [
    name,
    housenumber != null && street ? housenumber + ' ' + street : street,
    city,
    postcode,
  ];

  if (short) {
    return descriptionElements.find((segment) => !!segment) || fallback;
  } else {
    return (
      descriptionElements.filter((segment) => !!segment).join(', ') || fallback
    );
  }
}
