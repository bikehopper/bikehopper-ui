import { DateTime, Duration } from 'luxon';

// TODO localize all of these

export function formatTime(jsDate) {
  return DateTime.fromJSDate(jsDate).toLocaleString(DateTime.TIME_SIMPLE);
}

export function formatInterval(milliseconds) {
  let minutes = Math.ceil(milliseconds / 1000 / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  let hours = Math.floor(minutes / 60);
  minutes -= hours * 60;
  if (hours < 24) {
    return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
  }
  let days = Math.floor(hours / 24);
  hours -= days * 24;
  if (minutes > 0) {
    // add one to hours to make sure to always overestimate time
    hours += 1;
  }
  return hours === 0 ? `${days}d` : `${days}d ${hours}h`;
}

// Long description of the interval between two ISO time strings.
// TODO: Reconcile this with the above somehow.
export function formatDurationBetween(startTime, endTime) {
  const duration = DateTime.fromJSDate(endTime)
    .diff(DateTime.fromJSDate(startTime), ['days', 'hours', 'minutes'])
    .toObject();
  if (duration.days === 0) delete duration.days;
  if (duration.hours === 0) delete duration.hours;
  return Duration.fromObject(duration).toHuman({ maximumFractionDigits: 0 });
}
