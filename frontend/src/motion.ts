// Animations are skipped when the system asks for less motion, and where there is no
// matchMedia (jsdom in tests), so tests see every change at once.
export function motionAllowed(): boolean {
  return typeof window.matchMedia === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
