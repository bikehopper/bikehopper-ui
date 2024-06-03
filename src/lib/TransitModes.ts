import type { IntlShape } from 'react-intl';

// The meaning of the route "route_type" enum in GTFS.
// See: https://gtfs.org/schedule/reference/#routestxt

export const MODES = {
  TRAM_STREETCAR_LIGHT_RAIL: 0,
  SUBWAY_METRO: 1,
  RAIL_INTERCITY_LONG_DISTANCE: 2,
  MONORAIL: 12,

  BUS: 3,
  TROLLEYBUS: 11,

  FERRY: 4,

  CABLE_TRAM: 5,
  AERIAL_TRAM_SUSPENDED_CABLE_CAR: 6,
  FUNICULAR: 7,
};
export type Mode = (typeof MODES)[keyof typeof MODES];

export const CATEGORIES = {
  TRAINS: 'trains',
  BUSES: 'buses',
  FERRIES: 'ferries',
};
export type ModeCategory = (typeof CATEGORIES)[keyof typeof CATEGORIES];

export const CATEGORY_TO_MODES: Record<ModeCategory, Mode[]> = {
  [CATEGORIES.TRAINS]: [
    MODES.TRAM_STREETCAR_LIGHT_RAIL,
    MODES.SUBWAY_METRO,
    MODES.RAIL_INTERCITY_LONG_DISTANCE,
    MODES.MONORAIL,
    MODES.CABLE_TRAM,
    MODES.AERIAL_TRAM_SUSPENDED_CABLE_CAR,
    MODES.FUNICULAR,
  ],
  [CATEGORIES.BUSES]: [MODES.BUS, MODES.TROLLEYBUS],
  [CATEGORIES.FERRIES]: [MODES.FERRY],
};

export function getModeLabel(mode: Mode, intl: IntlShape) {
  switch (mode) {
    case MODES.TRAM_STREETCAR_LIGHT_RAIL:
      return intl.formatMessage({
        defaultMessage: 'Train',
        description:
          'labels a transit line as being operated by a tram, streetcar or light rail.' +
          ' Appears next to the name or number of the line.' +
          ' For American English, we match common usage by saying "train",' +
          ' but "tram" might be appropriate for other dialects of English.',
      });
    case MODES.MONORAIL:
      return intl.formatMessage({
        defaultMessage: 'Monorail',
        description:
          'labels a transit line as being operated by a tram, streetcar or light rail.' +
          ' Appears next to the name or number of the line.',
      });
    case MODES.SUBWAY_METRO:
      return intl.formatMessage({
        defaultMessage: 'Train',
        description:
          'labels a transit line as being operated by a train;' +
          ' specifically a subway or metro train but the label need not be that specific.' +
          ' Appears next to the name or number of the line.',
      });
    case MODES.RAIL_INTERCITY_LONG_DISTANCE:
      return intl.formatMessage({
        defaultMessage: 'Train',
        description:
          'labels a transit line as being operated by a train;' +
          ' specifically intercity or long-distance rail,' +
          ' but the label need not be that specific.' +
          ' Appears next to the name or number of the line.',
      });
    case MODES.BUS:
      return intl.formatMessage({
        defaultMessage: 'Bus',
        description:
          'labels a transit line as being operated by a bus.' +
          ' Appears next to the name or number of the bus line.',
      });
    case MODES.TROLLEYBUS:
      return intl.formatMessage({
        defaultMessage: 'Bus',
        description:
          'labels a transit line as being operated by a bus.' +
          ' Specifically a trolleybus but the label need not be that specific.' +
          ' Appears next to the name or number of the bus line.',
      });
    case MODES.FERRY:
      return intl.formatMessage({
        defaultMessage: 'Ferry',
        description:
          'labels a transit line as being operated by a ferry.' +
          ' Appears next to the name or number of the line.',
      });
    case MODES.CABLE_TRAM:
      return intl.formatMessage({
        defaultMessage: 'Cable car',
        description:
          'labels a transit line as being operated by a cable tram/cable car.' +
          ' Appears next to the name or number of the line.',
      });
    case MODES.AERIAL_TRAM_SUSPENDED_CABLE_CAR:
      return intl.formatMessage({
        defaultMessage: 'Cable car',
        description:
          'labels a transit line as being operated by an aerial tram or' +
          ' suspended cable car.' +
          ' Appears next to the name or number of the line.',
      });
    case MODES.FUNICULAR:
      return intl.formatMessage({
        defaultMessage: 'Funicular',
        description:
          'labels a transit line as being operated by a funicular.' +
          ' Appears next to the name or number of the bus line.',
      });
    default:
      return intl.formatMessage({
        defaultMessage: 'Transit line',
        description:
          'label for transit line when the mode (bus, train, etc) is unknown.' +
          ' Appears next to the name or number of the line.',
      });
  }
}
