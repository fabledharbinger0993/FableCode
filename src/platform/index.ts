/**
 * Platform API factory.
 *
 * Returns the correct FableApi implementation for the current runtime:
 *
 *   Electron  → the preload-injected `window.fable` object (IPC bridge)
 *   Capacitor / browser → HttpPlatformApi (fetches from the companion server)
 *
 * The backend URL is resolved in this priority order:
 *   1. Vite build-time env var  VITE_BACKEND_URL
 *   2. localStorage key         fablecode_backend_url  (user-configurable at runtime)
 *   3. Hard-coded default       http://localhost:3333
 */

import type { FableApi } from '../shared/types';
import { HttpPlatformApi } from './http';

export { HttpPlatformApi } from './http';

const DEFAULT_BACKEND_URL = 'http://localhost:3333';

/** True when running inside the Electron preload sandbox. */
function isElectron(): boolean {
  return typeof globalThis !== 'undefined' && 'fable' in globalThis;
}

/** Read the backend URL from Vite env, localStorage, or default. */
function resolveBackendUrl(): string {
  // Vite replaces import.meta.env at build time; the cast is safe in a
  // browser/Capacitor bundle but may be undefined in other environments.
  const viteEnv = (import.meta as { env?: { VITE_BACKEND_URL?: string } }).env;
  if (viteEnv?.VITE_BACKEND_URL) {
    return viteEnv.VITE_BACKEND_URL;
  }

  try {
    const stored = localStorage.getItem('fablecode_backend_url');
    if (stored) {
      return stored;
    }
  } catch {
    // localStorage may be unavailable in certain SSR/test contexts.
  }

  return DEFAULT_BACKEND_URL;
}

let _api: FableApi | null = null;

/**
 * Returns the platform API singleton.
 * Safe to call multiple times — the instance is created once per page load.
 */
export function getPlatformApi(): FableApi {
  if (_api) {
    return _api;
  }

  if (isElectron()) {
    _api = (globalThis as unknown as { fable: FableApi }).fable;
  } else {
    _api = new HttpPlatformApi(resolveBackendUrl());
  }

  if (!_api) {
    throw new Error('FableCode platform API could not be initialised.');
  }
  return _api;
}

/**
 * True when the app is running on the HTTP / Capacitor platform.
 * Use this to hide Electron-only UI (toolchain depot, Holograim subprocess, etc.).
 */
export function isHttpPlatform(): boolean {
  return !isElectron();
}
