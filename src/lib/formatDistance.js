// TODO: localize this

export default function formatDistance(meters) {
  const feet = meters / 0.3048;
  const miles = feet / 5280;

  if (miles >= 10) return `${Math.round(miles)}mi`;
  else if (miles >= 0.1) return `${Math.ceil(miles * 10) / 10}mi`;
  else return `${Math.round(feet)}ft`;
}
