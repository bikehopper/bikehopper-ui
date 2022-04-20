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

export function getTextColor(legColorString) {
  if (legColorString == null) return 'white';

  const color = Color(`#${legColorString}`);
  if (color.luminosity() > 0.5) {
    return 'black';
  } else {
    return 'white';
  }
}
