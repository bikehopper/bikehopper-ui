export function isPWA(): boolean {
  return !!(
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any) /* nonstandard iOS Safari thing */.standalone
  );
}
