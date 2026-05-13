import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  // Electron renderer needs a relative base so assets load from the filesystem.
  // The Capacitor / web build needs an absolute base so Capacitor's WebView can
  // resolve paths correctly.
  base: mode === 'web' ? '/' : './',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: false
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: false
  }
}));
