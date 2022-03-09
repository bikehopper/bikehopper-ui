import { intervalToDuration } from "date-fns";
import formatDuration from "date-fns/formatDuration";

const DEFAULT_UNITS = [
    ['days', 'd'],
    ['hours', 'h'],
    ['minutes','m'],
];    

export function formatInterval(milliseconds, units = DEFAULT_UNITS) {
    const duration = intervalToDuration({start: 0, end: milliseconds});
    var durationString = '';
    for (const unit of units) {
        if (unit[0] in duration && duration[unit[0]] > 0) {
            durationString += `${duration[unit[0]]}${unit[1]} `;
        }
    }
    return durationString;
}