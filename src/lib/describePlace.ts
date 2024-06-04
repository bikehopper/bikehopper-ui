import type { PhotonOsmHash } from './BikehopperClient';

// Describe a place from its Photon GeoJSON result hash.
// (If we were to switch back to Nominatim, parts of this would change)
// TODO: Replace the default "fallback" with null, fix anything that breaks,
// localize call sites relying on "Point" (or specifying an unlocalized fallback)
export default function describePlace(
  feature: GeoJSON.Feature<GeoJSON.Point> | PhotonOsmHash,
  { short = false, fallback = 'Point' } = {},
): string {
  if (!feature || feature.type !== 'Feature' || !feature.properties)
    return fallback;

  // Nominatim uses a different format. This flag is only for dev/demo, so this
  // display might be verbose / isn't tuned to be user friendly
  if (import.meta.env.VITE_USE_PUBLIC_NOMINATIM) {
    return (feature.properties as any)?.display_name || fallback;
  }

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
