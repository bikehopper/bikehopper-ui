export function isPWA() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    navigator.standalone
  );
}
