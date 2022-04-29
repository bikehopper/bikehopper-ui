import Color from 'color';

export const DEFAULT_BIKE_COLOR = '#5c5c3d';
export const DEFAULT_PT_COLOR = '#4169e1';
export const DEFAULT_INACTIVE_COLOR = 'darkgray';
export const BIKEHOPPER_THEME_COLOR = '#5aaa0a';

export function darkenLegColor(legColorString) {
  if (legColorString == null) return null;

  const color = Color(legColorString);

  const factor = 0.1 + color.luminosity() * 0.2;
  return color
    .darken(factor)
    .saturate(factor * 0.5)
    .hex();
}

export function getTextColor(legColorString) {
  if (legColorString == null) return 'white';

  const color = Color(legColorString);
  if (color.luminosity() > 0.5) {
    return { main: 'black', halo: color.lighten(0.4).hex() };
  } else {
    return { main: 'white', halo: darkenLegColor(legColorString) };
  }
}
