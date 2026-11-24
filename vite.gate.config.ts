import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * The landing page: the cleanroom door with the access code and sign-in
 * (gate/index.html) and the privacy page (gate/privacy.html). Built on its own
 * into dist/gate/ with its assets under /gate/assets/, so it shares no file
 * with the app: the middleware serves /gate/ to anyone and gates everything
 * else. Run after the main build (which empties dist/).
 */
export default defineConfig({
  plugins: [react()],
  publicDir: false,
  define: { __APP_BUILD__: 'false' },
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: false,
    assetsDir: 'gate/assets',
    rollupOptions: { input: { gate: 'gate/index.html', privacy: 'gate/privacy.html' } },
  },
})
