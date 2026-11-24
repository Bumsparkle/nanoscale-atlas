import { defineConfig, loadEnv } from 'vite'

/**
 * Integration tests against a real local Supabase (npx supabase start, then
 * npm run test:db): row-level security, the UCL-only sign-up hook, the
 * access-code rate limit, and sync and import end to end. Uses .env.local.
 */
export default defineConfig(({ mode }) => {
  for (const [k, v] of Object.entries(loadEnv(mode, process.cwd(), ''))) process.env[k] ??= v
  return {
    test: { include: ['tests/db/**/*.test.ts'], environment: 'node', testTimeout: 30_000, fileParallelism: false },
  } as never
})
