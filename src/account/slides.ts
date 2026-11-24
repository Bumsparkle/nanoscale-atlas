import { api } from './client'

/**
 * Lecture slide images come from the private `slides` bucket through signed
 * URLs that expire after a few minutes (made by /api/slides for a signed-in
 * user who passed the access code). They are cached here until shortly
 * before they expire.
 */
export const slidePath = (topic: string, slide: number) => `${topic}/slide-${String(slide).padStart(2, '0')}.jpg`

const cache = new Map<string, { url: string; until: number }>()
const inflight = new Map<string, Promise<string | null>>()

export async function slideUrls(paths: string[]): Promise<Record<string, string>> {
  const now = Date.now()
  const out: Record<string, string> = {}
  const missing = paths.filter((p) => {
    const c = cache.get(p)
    if (c && c.until > now) return !(out[p] = c.url)
    return true
  })
  if (missing.length) {
    try {
      const r = await api('/api/slides', { method: 'POST', body: JSON.stringify({ paths: missing }) })
      if (r.ok) {
        const { urls, expiresIn } = (await r.json()) as { urls: Record<string, string>; expiresIn: number }
        const until = Date.now() + Math.max(10, expiresIn - 30) * 1000
        for (const [p, url] of Object.entries(urls)) {
          cache.set(p, { url, until })
          out[p] = url
        }
      }
    } catch {
      /* offline: the Source modal says the image is unavailable */
    }
  }
  return out
}

export function slideUrl(path: string): Promise<string | null> {
  const c = cache.get(path)
  if (c && c.until > Date.now()) return Promise.resolve(c.url)
  let p = inflight.get(path)
  if (!p) {
    p = slideUrls([path]).then((r) => r[path] ?? null).finally(() => inflight.delete(path))
    inflight.set(path, p)
  }
  return p
}
