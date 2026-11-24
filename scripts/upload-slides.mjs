// Upload the rendered lecture slides (private/slides/<topic>/slide-NN.jpg, made by
// `npm run slides`, never in git) to the private Supabase Storage bucket `slides`.
//   npm run slides:upload                 uses .env.local (local Supabase)
//   ENV_FILE=.env.production.local npm run slides:upload    another project
// Needs SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY. Existing
// objects are replaced. Prints counts only: no keys, no signed URLs.
import { createClient } from '@supabase/supabase-js'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const envFile = process.env.ENV_FILE ?? '.env.local'
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
if (!url || !key) {
  console.error('slides: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (in .env.local or the environment)')
  process.exit(1)
}
const root = join('private', 'slides')
if (!existsSync(root)) {
  console.error(`slides: ${root} not found. Render the slides first (npm run slides).`)
  process.exit(1)
}
const sb = createClient(url, key, { auth: { persistSession: false } })
const files = readdirSync(root)
  .filter((t) => /^topic\d+$/.test(t))
  .flatMap((t) => readdirSync(join(root, t)).filter((f) => /^slide-\d{2,3}\.jpg$/.test(f)).map((f) => `${t}/${f}`))
let done = 0
let failed = 0
const queue = [...files]
async function worker() {
  for (let p = queue.shift(); p; p = queue.shift()) {
    const { error } = await sb.storage.from('slides').upload(p, readFileSync(join(root, p)), { contentType: 'image/jpeg', upsert: true, cacheControl: '3600' })
    if (error) {
      failed++
      console.error(`slides: ${p}: ${error.message}`)
    } else done++
  }
}
await Promise.all(Array.from({ length: 6 }, worker))
console.log(`slides: uploaded ${done} of ${files.length} to the private bucket${failed ? `, ${failed} failed` : ''}`)
process.exit(failed ? 1 : 0)
