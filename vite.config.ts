import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { devGate } from './server/devPlugin.ts'
import { publicSupabaseEnv } from './server/publicEnv.ts'

/**
 * Two builds share this config:
 *  - web (default): the Vercel site, behind the access gate (middleware.ts).
 *  - app (ATLAS_APP=1, used by Tauri): the desktop app.
 * The landing page (/gate/) is a third, separate build: vite.gate.config.ts.
 *
 * Neither build contains a lecture slide: they live in a private Supabase
 * Storage bucket and are shown through short-lived signed URLs (/api/slides).
 */
const APP = process.env.ATLAS_APP === '1'

export default defineConfig(({ mode }) => {
  // the dev gate runs the server code, which reads process.env (as on Vercel)
  for (const [k, v] of Object.entries(loadEnv(mode, process.cwd(), ''))) process.env[k] ??= v
  publicSupabaseEnv(process.env)
  return {
    plugins: [react(), devGate()],
    define: {
      __APP_BUILD__: JSON.stringify(APP),
    },
    build: {
      target: 'es2022',
      // the three.js shell is one deliberately lazy chunk (~1.8 MB min, ~480 KB gz),
      // loaded behind the home page; the entry chunk is ~75 KB gz
      chunkSizeWarningLimit: 2000,
    },
    test: {
      include: ['src/**/*.test.ts', 'server/**/*.test.ts'],
      environment: 'node',
    },
  } as never
})
