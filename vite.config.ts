import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { cpSync, createReadStream, existsSync, statSync } from 'node:fs'
import { join, normalize } from 'node:path'

/**
 * Lecture slides live in private/slides (gitignored, never in the repo).
 * Dev: served at /slides/*. Build: copied into dist/slides, where the
 * Vercel middleware puts them behind the site password.
 */
function privateSlides(): Plugin {
  const root = join(process.cwd(), 'private', 'slides')
  return {
    name: 'private-slides',
    configureServer(server) {
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
      if (existsSync(root)) cpSync(root, join(process.cwd(), 'dist', 'slides'), { recursive: true })
    },
  }
}

export default defineConfig({
  plugins: [react(), privateSlides()],
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
