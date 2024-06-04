export default function lngLatToCoords(
  lngLat: {lng: number, lat: number}
): [number, number] {
  return [lngLat.lng, lngLat.lat];
}
