import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * Dev and preview only: runs the real Vercel middleware and API handlers
 * inside the Vite server, so the access gate, sign-in and slides work
 * locally exactly as deployed. Nothing here is part of a build.
 */
const API: Record<string, 'access' | 'slides' | 'account'> = { '/api/access': 'access', '/api/slides': 'slides', '/api/account': 'account' }

async function toRequest(req: IncomingMessage, origin: string): Promise<Request> {
  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) {
    if (v == null || k.startsWith(':')) continue
    for (const one of Array.isArray(v) ? v : [v]) headers.append(k, one)
  }
  headers.set('x-real-ip', req.socket.remoteAddress ?? '127.0.0.1')
  let body: Buffer | undefined
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks: Buffer[] = []
    for await (const c of req) chunks.push(c as Buffer)
    body = Buffer.concat(chunks)
  }
  return new Request(new URL(req.url ?? "/", origin), { method: req.method, headers, body: body ? new Uint8Array(body) : undefined })
}

async function send(res: ServerResponse, r: Response) {
  res.statusCode = r.status
  r.headers.forEach((v, k) => {
    if (k === 'set-cookie') return
    res.setHeader(k, v)
  })
  const cookies = r.headers.getSetCookie?.() ?? []
  if (cookies.length) res.setHeader('set-cookie', cookies)
  res.end(Buffer.from(await r.arrayBuffer()))
}

type Load = (id: string) => Promise<Record<string, unknown>>

/**
 * `all`: gate every request (preview, which serves the real build). The dev
 * server serves source modules rather than the built assets, so there only
 * pages and the API go through the gate (the gate page itself is built from
 * those same modules); the asset rules are covered by the middleware tests
 * and by `npm run preview`. Under `tauri dev` (ATLAS_APP=1) the app shows
 * its own gate in the window, so only the API is gated.
 */
function mount(use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void, load: Load, origin: () => string, all: boolean) {
  use((req, res, nextFn) => {
    void (async () => {
      try {
        const path = (req.url ?? '/').split('?')[0]
        const page = req.method === 'GET' && (req.headers['sec-fetch-mode'] === 'navigate' || String(req.headers.accept ?? '').includes('text/html'))
        const appDev = process.env.ATLAS_APP === '1'
        if (!all && (!page || appDev) && !path.startsWith('/api/')) return nextFn()
        const request = await toRequest(req, origin())
        const mw = (await load('/middleware.ts')).default as (r: Request) => Promise<Response>
        const gate = await mw(request.clone())
        if (gate.headers.get('x-middleware-next') !== '1') return send(res, gate)
        const name = API[path]
        if (name) {
          const h = await load('/server/handlers.ts')
          const fn = h[name] as (r: Request, d: unknown) => Promise<Response>
          return send(res, await fn(request, (h.defaultDeps as () => unknown)()))
        }
        nextFn()
      } catch (e) {
        res.statusCode = 500
        res.end('dev gate error: ' + (e instanceof Error ? e.message : 'unknown'))
      }
    })()
  })
}

export function devGate(): Plugin {
  return {
    name: 'atlas-dev-gate',
    configureServer(s) {
      const origin = () => `http://${s.config.server.host === true ? 'localhost' : s.config.server.host || 'localhost'}:${s.config.server.port ?? 5173}`
      mount((fn) => s.middlewares.use(fn), (id) => s.ssrLoadModule(id), origin, false)
    },
    configurePreviewServer(s) {
      // `vite preview`: load the TS through a throwaway dev server's module loader
      const loader = import('vite').then(({ createServer }) => createServer({ server: { middlewareMode: true }, appType: 'custom', configFile: false }))
      mount((fn) => s.middlewares.use(fn), async (id) => (await loader).ssrLoadModule(id), () => `http://localhost:${s.config.preview.port ?? 4173}`, true)
    },
  }
}
