// Push the auth config (site URL, redirects, the UCL-only hook, 6-digit codes, the email
// templates and the Resend SMTP sender) to the live Supabase project.
//   node scripts/push-auth-config.mjs
// Asks for the Resend API key in a hidden prompt: it goes only into this process's
// environment for `supabase config push`, never to a file, a log or the repository.
// supabase/config.jsonc holds the local values; this builds a production copy in a
// temporary folder, so localhost URLs never reach the live project.
import { spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createInterface } from 'node:readline'

const REF = 'fsrhpubygmipnenlgsbq'
const SITE = 'https://nanoscale-atlas.vercel.app'
const DOMAIN = process.env.MAIL_DOMAIN ?? 'atlas.txtbook.co.uk'
const SENDER = process.env.MAIL_FROM ?? `signin@${DOMAIN}`

function hidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    rl._writeToOutput = (s) => rl.output.write(s.includes(question) ? s : '')
    rl.question(question, (a) => {
      rl.close()
      process.stdout.write('\n')
      resolve(a.trim())
    })
  })
}

const key = process.env.RESEND_API_KEY || (await hidden('Resend API key (hidden): '))
if (!/^re_[A-Za-z0-9_]+$/.test(key)) {
  console.error('That does not look like a Resend API key (they start with re_).')
  process.exit(1)
}

// the sending domain must be verified, or every sign-in email bounces
const r = await fetch('https://api.resend.com/domains', { headers: { Authorization: `Bearer ${key}` } })
if (!r.ok) {
  console.error(`Resend refused the key (${r.status}). It needs "Full access" to read the domain status, or set SKIP_DOMAIN_CHECK=1.`)
  if (!process.env.SKIP_DOMAIN_CHECK) process.exit(1)
} else {
  const d = ((await r.json()).data ?? []).find((x) => x.name === DOMAIN)
  console.log(`Resend domain ${DOMAIN}: ${d ? d.status : 'not added yet'}`)
  if (d?.status !== 'verified' && !process.env.SKIP_DOMAIN_CHECK) {
    console.error('Wait until Resend shows it as verified, then run this again.')
    process.exit(1)
  }
}

const dir = mkdtempSync(join(tmpdir(), 'atlas-auth-'))
try {
  cpSync('supabase', join(dir, 'supabase'), { recursive: true, filter: (p) => !p.includes('.temp') })
  const file = join(dir, 'supabase', 'config.jsonc')
  let s = readFileSync(file, 'utf8')
  const swap = (a, b) => {
    if (!s.includes(a)) throw new Error('config.jsonc changed: cannot find ' + a)
    s = s.replace(a, b)
  }
  swap('"site_url": "http://localhost:5173"', `"site_url": "${SITE}"`)
  s = s.replace(/"additional_redirect_urls": \[[^\]]*\]/, `"additional_redirect_urls": ["${SITE}/gate/**"]`)
  swap('"max_frequency": "1s"', '"max_frequency": "60s"')
  swap('"email_sent": 2,', '"email_sent": 60,')
  // leave unrelated remote settings as they are
  s = s.replace(/("vector": \{\s*"enabled": )true/, '$1false')
  s = s.replace(/("totp": \{\s*"enroll_enabled": )false(,\s*"verify_enabled": )false/, '$1true$2true')
  s = s.replace(/("sms": \{[\s\S]*?"enable_confirmations": )false/, '$1true')
  swap(
    '      // Use a production-ready SMTP server\n',
    `      "smtp": { "enabled": true, "host": "smtp.resend.com", "port": 465, "user": "resend", "pass": "env(ATLAS_SMTP_PASS)", "admin_email": "${SENDER}", "sender_name": "Nanoscale Atlas" },\n`,
  )
  writeFileSync(file, s)
  const res = spawnSync('npx', ['supabase', 'config', 'push', '--project-ref', REF, '--workdir', dir], {
    stdio: 'inherit',
    env: { ...process.env, ATLAS_SMTP_PASS: key },
  })
  if (res.status !== 0) process.exit(res.status ?? 1)
  console.log(`Done: sign-in emails for ${SITE} now come from ${SENDER}.`)
} finally {
  rmSync(dir, { recursive: true, force: true })
}
