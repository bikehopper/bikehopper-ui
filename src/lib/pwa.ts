export function isPWA(): boolean {
  return !!(
    (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone
    ) // nonstandard iOS Safari feature
  );
}
