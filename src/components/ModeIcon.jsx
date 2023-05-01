import * as React from 'react';
import TransitModes from '../lib/TransitModes';

import { ReactComponent as BusIcon } from 'iconoir/icons/bus.svg';
import { ReactComponent as TrainIcon } from 'iconoir/icons/train.svg';
import { ReactComponent as TramIcon } from 'iconoir/icons/tram.svg';
import { ReactComponent as MetroIcon } from 'iconoir/icons/metro.svg';
// There's no ferry icon in iconoir! Sea waves is the best I can do.
import { ReactComponent as FerryIcon } from 'iconoir/icons/sea-waves.svg';

/*
 * An icon to represent a transit mode, such as bus, ferry, or streetcar.
 * The mode should be a numeric value as used by the GTFS standard.
 *
 * Returns a rendered SVG component which should be wrapped by <Icon>.
 *
 * NOTE: That's different from PlaceIcon, which does render the wrapping
 * <Icon> for you.
 */

export default function ModeIcon({ mode, width, height, fallback = BusIcon }) {
  let IconSvg;

  switch (mode) {
    case TransitModes.TRAM_STREETCAR_LIGHT_RAIL:
    case TransitModes.MONORAIL:
    case TransitModes.CABLE_TRAM:
    case TransitModes.AERIAL_TRAM_SUSPENDED_CABLE_CAR:
    case TransitModes.FUNICULAR:
      IconSvg = TramIcon;
      break;
    case TransitModes.SUBWAY_METRO:
      IconSvg = MetroIcon;
      break;
    case TransitModes.RAIL_INTERCITY_LONG_DISTANCE:
      IconSvg = TrainIcon;
      break;
    case TransitModes.BUS:
    case TransitModes.TROLLEYBUS:
      IconSvg = BusIcon;
      break;
    case TransitModes.FERRY:
      IconSvg = FerryIcon;
      break;
    default:
      if (!fallback) return null;
      IconSvg = fallback;
      break;
  }

  return <IconSvg width={width} height={height} />;
}
