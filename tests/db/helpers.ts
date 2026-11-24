import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const URL_ = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
export const ANON = process.env.VITE_SUPABASE_ANON_KEY || ''
export const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!URL_ || !ANON || !SERVICE) throw new Error('test:db needs SUPABASE_URL, VITE_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY (see .env.example) and a running local Supabase')
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(URL_)) throw new Error('test:db only runs against a local Supabase: it creates and deletes users')

const opts = { auth: { persistSession: false, autoRefreshToken: false } }
export const admin = createClient(URL_, SERVICE, opts)
export const anon = () => createClient(URL_, ANON, opts)

const run = Date.now().toString(36)
let n = 0
export const uclEmail = (tag: string) => `test-${tag}-${run}-${++n}@ucl.ac.uk`

export interface TestUser {
  id: string
  email: string
  client: SupabaseClient
}

/** a confirmed UCL user, signed in with a password */
export async function makeUser(tag: string): Promise<TestUser> {
  const email = uclEmail(tag)
  const password = 'pw-' + crypto.randomUUID()
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (error || !data.user) throw new Error('createUser: ' + error?.message)
  const client = anon()
  const s = await client.auth.signInWithPassword({ email, password })
  if (s.error) throw new Error('signIn: ' + s.error.message)
  created.push(data.user.id)
  return { id: data.user.id, email, client }
}

const created: string[] = []
export async function cleanup() {
  for (const id of created.splice(0)) await admin.auth.admin.deleteUser(id)
}

export const iso = (ms: number) => new Date(ms).toISOString()
