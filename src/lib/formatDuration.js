import { DateTime, Duration } from 'luxon';

export default function formatDuration(startTime, endTime) {
  const duration = DateTime.fromISO(endTime)
    .diff(DateTime.fromISO(startTime), ['hours', 'minutes'])
    .toObject();
  if (duration.hours === 0) delete duration.hours;
  return Duration.fromObject(duration).toHuman({ maximumFractionDigits: 0 });
}
