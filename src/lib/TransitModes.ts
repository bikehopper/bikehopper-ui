// The meaning of the route "route_type" enum in GTFS.
// See: https://gtfs.org/schedule/reference/#routestxt

import type { IntlShape } from 'react-intl';

export enum TransitMode {
  TRAM_STREETCAR_LIGHT_RAIL = 0,
  SUBWAY_METRO = 1,
  RAIL_INTERCITY_LONG_DISTANCE = 2,
  MONORAIL = 12,

  BUS = 3,
  TROLLEYBUS = 11,

  FERRY = 4,

  CABLE_TRAM = 5,
  AERIAL_TRAM_SUSPENDED_CABLE_CAR = 6,
  FUNICULAR = 7,
}

export enum TransitModeCategory {
  TRAINS = 'trains',
  BUSES = 'buses',
  FERRIES = 'ferries',
}

export const CATEGORY_TO_MODE: Record<TransitModeCategory, TransitMode[]> = {
  [TransitModeCategory.TRAINS]: [
    TransitMode.TRAM_STREETCAR_LIGHT_RAIL,
    TransitMode.SUBWAY_METRO,
    TransitMode.RAIL_INTERCITY_LONG_DISTANCE,
    TransitMode.MONORAIL,
    TransitMode.CABLE_TRAM,
    TransitMode.AERIAL_TRAM_SUSPENDED_CABLE_CAR,
    TransitMode.FUNICULAR,
  ],
  [TransitModeCategory.BUSES]: [TransitMode.BUS, TransitMode.TROLLEYBUS],
  [TransitModeCategory.FERRIES]: [TransitMode.FERRY],
};

export function getModeLabel(mode: TransitMode, intl: IntlShape) {
  switch (mode) {
    case TransitMode.TRAM_STREETCAR_LIGHT_RAIL:
      return intl.formatMessage({
        defaultMessage: 'Train',
        description:
          'labels a transit line as being operated by a tram, streetcar or light rail.' +
          ' Appears next to the name or number of the line.' +
          ' For American English, we match common usage by saying "train",' +
          ' but "tram" might be appropriate for other dialects of English.',
      });
    case TransitMode.MONORAIL:
      return intl.formatMessage({
        defaultMessage: 'Monorail',
        description:
          'labels a transit line as being operated by a tram, streetcar or light rail.' +
          ' Appears next to the name or number of the line.',
      });
    case TransitMode.SUBWAY_METRO:
      return intl.formatMessage({
        defaultMessage: 'Train',
        description:
          'labels a transit line as being operated by a train;' +
          ' specifically a subway or metro train but the label need not be that specific.' +
          ' Appears next to the name or number of the line.',
      });
    case TransitMode.RAIL_INTERCITY_LONG_DISTANCE:
      return intl.formatMessage({
        defaultMessage: 'Train',
        description:
          'labels a transit line as being operated by a train;' +
          ' specifically intercity or long-distance rail,' +
          ' but the label need not be that specific.' +
          ' Appears next to the name or number of the line.',
      });
    case TransitMode.BUS:
      return intl.formatMessage({
        defaultMessage: 'Bus',
        description:
          'labels a transit line as being operated by a bus.' +
          ' Appears next to the name or number of the bus line.',
      });
    case TransitMode.TROLLEYBUS:
      return intl.formatMessage({
        defaultMessage: 'Bus',
        description:
          'labels a transit line as being operated by a bus.' +
          ' Specifically a trolleybus but the label need not be that specific.' +
          ' Appears next to the name or number of the bus line.',
      });
    case TransitMode.FERRY:
      return intl.formatMessage({
        defaultMessage: 'Ferry',
        description:
          'labels a transit line as being operated by a ferry.' +
          ' Appears next to the name or number of the line.',
      });
    case TransitMode.CABLE_TRAM:
      return intl.formatMessage({
        defaultMessage: 'Cable car',
        description:
          'labels a transit line as being operated by a cable tram/cable car.' +
          ' Appears next to the name or number of the line.',
      });
    case TransitMode.AERIAL_TRAM_SUSPENDED_CABLE_CAR:
      return intl.formatMessage({
        defaultMessage: 'Cable car',
        description:
          'labels a transit line as being operated by an aerial tram or' +
          ' suspended cable car.' +
          ' Appears next to the name or number of the line.',
      });
    case TransitMode.FUNICULAR:
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
