import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'

/**
 * Vercel runs middleware.ts and api/*.ts as plain Node ES modules, which only
 * resolve relative imports that name the file (`./access.js`). Vite and Vitest
 * resolve `./access` anyway, so without this check a missing extension only
 * shows up on the deployed site, as a 500 on every request.
 */
describe('server code runs as plain Node ESM', () => {
  const files = ['middleware.ts', ...readdirSync('api').map((f) => 'api/' + f), ...readdirSync('server').filter((f) => !f.endsWith('.test.ts') && f !== 'devPlugin.ts' && f !== 'publicEnv.ts').map((f) => 'server/' + f)]
  it('every relative import ends in .js', () => {
    const bad = files.flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/from\s+'(\.{1,2}\/[^']+)'/g)].map((m) => m[1]).filter((p) => !p.endsWith('.js')).map((p) => `${f}: ${p}`))
    expect(bad).toEqual([])
  })
})
