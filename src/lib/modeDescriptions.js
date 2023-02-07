import { ReactComponent as BikeIcon } from 'iconoir/icons/bicycle.svg';
import { ReactComponent as BusIcon } from 'iconoir/icons/bus.svg';
import { ReactComponent as TrainIcon } from 'iconoir/icons/train.svg';
import { ReactComponent as TramIcon } from 'iconoir/icons/tram.svg';
import { ReactComponent as MetroIcon } from 'iconoir/icons/metro.svg';
// There's no ferry icon in iconoir! Sea waves is the best I can do.
import { ReactComponent as FerryIcon } from 'iconoir/icons/sea-waves.svg';
import { ReactComponent as ArriveIcon } from 'iconoir/icons/triangle-flag.svg';

// TODO: localize the mode names

export const ModeIcons = {
  BIKE: 'bike',
  BUS: 'bus',
  TRAM: 'tram',
  TRAIN: 'train',
  METRO: 'metro',
  FERRY: 'ferry',
  ARRIVE: 'arrive', // not really a mode, true
};

export function getSvgComponentForIcon(iconType) {
  switch (iconType) {
    case ModeIcons.BIKE:
      return BikeIcon;
    case ModeIcons.BUS:
      return BusIcon;
    case ModeIcons.TRAM:
      return TramIcon;
    case ModeIcons.TRAIN:
      return TrainIcon;
    case ModeIcons.METRO:
      return MetroIcon;
    case ModeIcons.FERRY:
      return FerryIcon;
    case ModeIcons.ARRIVE:
      return ArriveIcon;
    default:
      return null;
  }
}

const _gtfsModes = {
  0: {
    // tram, streetcar, light rail
    name: 'train', // The more specific word 'tram' might confuse in a US context
    icon: ModeIcons.TRAM,
  },
  12: {
    // monorail
    name: 'train',
    icon: ModeIcons.TRAM,
  },
  1: {
    // subway, metro
    name: 'train',
    icon: ModeIcons.METRO,
  },
  2: {
    // rail (intercity, long distance)
    name: 'train',
    icon: ModeIcons.TRAIN,
  },
  3: {
    // bus
    name: 'bus',
    icon: ModeIcons.BUS,
  },
  11: {
    // trolleybus
    name: 'bus',
    icon: ModeIcons.BUS,
  },
  4: {
    // ferry
    name: 'ferry',
    icon: ModeIcons.FERRY,
  },
  5: {
    // cable tram
    name: 'cable car',
    icon: ModeIcons.TRAM,
  },
  6: {
    // aerial tram, suspended cable car
    name: 'cable car',
    icon: ModeIcons.TRAM,
  },
  7: {
    // funicular
    name: 'funicular',
    icon: ModeIcons.TRAM,
  },
  default: {
    name: 'line',
    icon: null,
  },
};

export function getIconForRouteType(gtfsRouteType) {
  return (_gtfsModes[gtfsRouteType] || _gtfsModes.default).icon;
}

export function describeRouteType(gtfsRouteType) {
  return (_gtfsModes[gtfsRouteType] || _gtfsModes.default).name;
}
