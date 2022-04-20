import Color from 'color';

export function darkenLegColor(legColorString) {
  if (legColorString == null) return null;

  const color = Color(`#${legColorString}`);

  const factor = 0.1 + color.luminosity() * 0.2;
  return color
    .darken(factor)
    .saturate(factor * 0.5)
    .hex();
}
