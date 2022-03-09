export function formatInterval(milliseconds) {
  let minutes = Math.ceil(milliseconds / 1000 / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  let hours = Math.floor(minutes / 60);
  minutes -= hours * 60;
  if (hours < 24) {
    return `${hours}h ${minutes}m`;
  }
  let days = Math.floor(hours / 24);
  hours -= days * 24;
  if (minutes > 0) {
    // add one to hours to make sure to always overestimate time
    hours += 1;
  }
  return `${days}d ${hours}h`;
}
