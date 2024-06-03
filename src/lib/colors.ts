import Color from 'color';

export const DEFAULT_BIKE_COLOR = '#6b6b47';
export const BIKE_LANE_COLOR = '#33cc33';
export const CYCLE_TRACK_COLOR = '#0c8014';
export const DEFAULT_PT_COLOR = '#4169e1';
export const DEFAULT_INACTIVE_COLOR = 'darkgray';
export const BIKEHOPPER_THEME_COLOR = '#5aaa0a';
export const TRANSITION_COLOR = DEFAULT_BIKE_COLOR;

export function darkenLegColor(legColor: string) {
  const color = Color(legColor);

  const factor = 0.1 + color.luminosity() * 0.2;
  return color
    .darken(factor)
    .saturate(factor * 0.5)
    .hex();
}

export function getTextColor(legColor: string): {
  main: string;
  halo: string;
} {
  const color = Color(legColor);
  if (color.luminosity() > 0.5) {
    return { main: 'black', halo: color.lighten(0.4).hex() };
  } else {
    return { main: 'white', halo: darkenLegColor(legColor) };
  }
}
