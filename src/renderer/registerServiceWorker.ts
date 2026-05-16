/**
 * registerServiceWorker.ts — register the FableCode PWA worker.
 *
 * Only runs in the `web` build mode. Electron loads via file:// where
 * service workers are unreliable, and we don't need offline caching there
 * because the asar already ships the entire bundle locally.
 */

export function registerServiceWorker(): void {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  // Electron preload exposes `fable`; skip SW registration there.
  if ('fable' in globalThis) return;
  // Only register when served over http(s); file:// or other schemes break SW.
  if (!/^https?:$/.test(window.location.protocol)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js', { scope: './' })
      .catch((error) => {
        // Non-fatal: app still works without offline caching.
        console.warn('[FableCode] service worker registration failed:', error);
      });
  });
}
