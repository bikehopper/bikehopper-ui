export function isTouchMoveSignificant(
  firstClientX: number,
  firstClientY: number,
  secondClientX: number,
  secondClientY: number,
): boolean {
  // This is almost trivial, but we needed it in two places, so why not extract it and
  // make sure the threshold is consistent?
  const dx = secondClientX - firstClientX;
  const dy = secondClientY - firstClientY;
  const distanceMoved = Math.sqrt(dx * dx + dy * dy);
  return distanceMoved > 7;
}
