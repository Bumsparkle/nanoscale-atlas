import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { cpSync, createReadStream, existsSync, rmSync, statSync } from 'node:fs'
import { join, normalize } from 'node:path'

/**
 * Two builds share this config:
 *  - web (default): the Vercel site. Slides are copied into dist/slides,
 *    behind the site password.
 *  - app (ATLAS_APP=1, used by Tauri): the desktop app. Slides are bundled
 *    only with INCLUDE_SLIDES=1 (a personal build); otherwise none are copied
 *    and the Source buttons are hidden.
 */
const APP = process.env.ATLAS_APP === '1'
const SLIDES = !APP || process.env.INCLUDE_SLIDES === '1'

/**
 * Lecture slides live in private/slides (gitignored, never in the repo).
 * Dev: served at /slides/*. Build: copied into dist/slides when SLIDES.
 */
function privateSlides(): Plugin {
  const root = join(process.cwd(), 'private', 'slides')
  // Vite also calls closeBundle when a dev or test server (Vitest) shuts down: only a real
  // `vite build` may touch dist/, or a test run during an app build would leak slides into it
  let building = false
  return {
    name: 'private-slides',
    configResolved(c) {
      building = c.command === 'build' && !process.env.VITEST
    },
    configureServer(server) {
      if (!SLIDES) return
      server.middlewares.use('/slides', (req, res, nextFn) => {
        const rel = normalize(decodeURIComponent((req.url ?? '').split('?')[0])).replace(/^(\.\.[/\\])+/, '')
        const file = join(root, rel)
        if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
          res.statusCode = 404
          return res.end('slide not found')
        }
        res.setHeader('Content-Type', 'image/jpeg')
        res.setHeader('Cache-Control', 'private, max-age=3600')
        createReadStream(file).pipe(res)
        void nextFn
      })
    },
    closeBundle() {
      if (!building) return
      const out = join(process.cwd(), 'dist', 'slides')
      // never leave slides from an earlier build in an app bundle that should have none
      if (!SLIDES) return rmSync(out, { recursive: true, force: true })
      if (existsSync(root)) cpSync(root, out, { recursive: true })
    },
  }
}

export default defineConfig({
  plugins: [react(), privateSlides()],
  define: {
    __APP_BUILD__: JSON.stringify(APP),
    __SLIDES__: JSON.stringify(SLIDES),
  },
  build: {
    target: 'es2022',
    // the three.js shell is one deliberately lazy chunk (~1.8 MB min, ~480 KB gz),
    // loaded behind the home page; the entry chunk is ~75 KB gz
    chunkSizeWarningLimit: 2000,
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
} as never)
