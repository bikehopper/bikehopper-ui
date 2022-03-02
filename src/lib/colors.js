import Color from 'color';

export function darkenLegColor(legColorString, factor) {
  if (legColorString == null) return null;

  const color = Color(`#${legColorString}`);
  return color.darken(factor).hex();
}
