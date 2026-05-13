import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor configuration for the FableCode iOS build.
 *
 * webDir points at the Vite renderer output.  Run `npm run build:web` to
 * produce the web assets, then `npm run cap:sync` to copy them into the
 * Xcode project before building.
 *
 * server.url is populated at dev-time when running `npm run dev` so the
 * app loads from the Vite HMR server instead of the bundled assets.
 * Remove the server block (or set it to undefined) for production builds.
 */
const config: CapacitorConfig = {
  appId: 'com.fableharbinger.fablecode',
  appName: 'FableCode',
  webDir: 'dist/renderer',
  plugins: {
    // Capacitor Filesystem — used for future local file access on-device.
    Filesystem: {},
    // Capacitor Preferences — can be used in place of localStorage if needed.
    Preferences: {}
  }
  // Uncomment and set to your local Vite dev server for live-reload during
  // Xcode Simulator development:
  //
  // server: {
  //   url: 'http://192.168.x.x:5173',
  //   cleartext: true
  // }
};

export default config;
