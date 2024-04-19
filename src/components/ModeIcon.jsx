import * as React from 'react';
import { MODES } from '../lib/TransitModes';

import BusIcon from 'iconoir/icons/bus.svg?react';
import TrainIcon from 'iconoir/icons/train.svg?react';
import TramIcon from 'iconoir/icons/tram.svg?react';
import MetroIcon from 'iconoir/icons/metro.svg?react';
// There's no ferry icon in iconoir! Sea waves is the best I can do.
import FerryIcon from 'iconoir/icons/sea-waves.svg?react';

/*
 * An icon to represent a transit mode, such as bus, ferry, or streetcar.
 * The mode should be a numeric value as used by the GTFS standard.
 *
 * Returns a rendered SVG component which should be wrapped by <Icon>.
 *
 * NOTE: That's different from PlaceIcon, which does render the wrapping
 * <Icon> for you.
 */

export default function ModeIcon({
  mode,
  width,
  height,
  onClick,
  fallback = BusIcon,
}) {
  let IconSvg;

  switch (mode) {
    case MODES.TRAM_STREETCAR_LIGHT_RAIL:
    case MODES.MONORAIL:
    case MODES.CABLE_TRAM:
    case MODES.AERIAL_TRAM_SUSPENDED_CABLE_CAR:
    case MODES.FUNICULAR:
      IconSvg = TramIcon;
      break;
    case MODES.SUBWAY_METRO:
      IconSvg = MetroIcon;
      break;
    case MODES.RAIL_INTERCITY_LONG_DISTANCE:
      IconSvg = TrainIcon;
      break;
    case MODES.BUS:
    case MODES.TROLLEYBUS:
      IconSvg = BusIcon;
      break;
    case MODES.FERRY:
      IconSvg = FerryIcon;
      break;
    default:
      if (!fallback) return null;
      IconSvg = fallback;
      break;
  }

  return <IconSvg width={width} height={height} onClick={onClick} />;
}
