import { useEffect, useRef, useState, type FormEvent } from 'react'
import { DoorLeaves } from '../ui/DoorLeaves'
import { ThemeIcon } from '../ui/ThemeIcon'
import { configured, hasAccess, isUclEmail, submitCode, supabase } from '../account/client'
import { Privacy } from './PrivacyText'
import '../ui/home.css'
import './gate.css'

/**
 * The access gate: the cleanroom bay door, locked. First the access code
 * (checked by the server, which sets an httpOnly cookie, or hands the Mac app
 * a token for its Keychain), then sign-in with a UCL email: a magic link
 * (web) or a 6-digit code (both), or a password. Sign-up is the same form;
 * the server refuses any address that is not @ucl.ac.uk.
 */
type Step = 'checking' | 'code' | 'email' | 'sent' | 'password' | 'done'

/** only same-site paths, never another origin */
export function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\') || raw.startsWith('/gate')) return '/'
  return raw
}

const friendly = (msg: string | undefined) => {
  if (!msg) return 'Something went wrong. Try again.'
  if (/ucl\.ac\.uk|database error saving new user/i.test(msg)) return 'Only @ucl.ac.uk email addresses can sign up.'
  if (/rate limit|too many|security purposes/i.test(msg)) return 'Too many emails asked for. Wait a minute and try again.'
  if (/expired|invalid.*(otp|token)|token.*(invalid|expired)/i.test(msg)) return 'That code is wrong or has expired.'
  if (/invalid login credentials/i.test(msg)) return 'Wrong email or password.'
  if (/email not confirmed/i.test(msg)) return 'Confirm your email first: use the link or code we sent.'
  if (/password should be|weak/i.test(msg)) return 'Use a longer password (at least 8 characters).'
  if (/fetch|network/i.test(msg)) return 'Could not reach the server. Check your connection.'
  return msg
}

export function Gate({ app = false, onDone }: { app?: boolean; onDone?: () => void }) {
  const [step, setStep] = useState<Step>('checking')
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [privacy, setPrivacy] = useState(false)
  const [signupSent, setSignupSent] = useState(false)
  const [creating, setCreating] = useState(false)
  const field = useRef<HTMLInputElement>(null)

  const next = () => (app ? '/' : safeNext(new URLSearchParams(location.search).get('next')))
  const finish = () => {
    setStep('done')
    if (onDone) onDone()
    else location.replace(next())
  }

  // where are we? (a magic link lands here with ?code=…, which the client exchanges on load)
  useEffect(() => {
    let live = true
    void (async () => {
      if (!configured()) {
        setError('This copy of the site is not connected to its database yet.')
        return setStep('code')
      }
      const params = new URLSearchParams(location.search)
      const linkError = params.get('error_description')
      const [access, session] = await Promise.all([hasAccess(), supabase().auth.getSession()])
      if (!live) return
      if (!access) return setStep('code')
      if (session.data.session) return finish()
      if (linkError) setError(friendly(linkError))
      else if (params.has('code')) setError('That link was opened in a different browser from the one you asked from. Type the 6-digit code from the email instead.')
      setStep('email')
    })()
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    field.current?.focus()
  }, [step])

  const run = async (f: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await f()
    } catch (e) {
      setError(friendly(e instanceof Error ? e.message : undefined))
    } finally {
      setBusy(false)
    }
  }

  const onCode = (e: FormEvent) => {
    e.preventDefault()
    void run(async () => {
      const r = await submitCode(code)
      if (!r.ok) {
        const mins = r.retryAfter ? Math.ceil(r.retryAfter / 60) : 0
        throw new Error(mins ? `Too many wrong codes. Try again in ${mins} minute${mins === 1 ? '' : 's'}.` : r.error)
      }
      setCode('')
      const { data } = await supabase().auth.getSession()
      if (data.session) return finish()
      setStep('email')
    })
  }

  const checkEmail = () => {
    if (!isUclEmail(email)) throw new Error('Use your @ucl.ac.uk email address.')
  }

  const onEmail = (e: FormEvent) => {
    e.preventDefault()
    void run(async () => {
      checkEmail()
      const redirect = app ? undefined : `${location.origin}/gate/?next=${encodeURIComponent(next())}`
      const { error } = await supabase().auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true, emailRedirectTo: redirect } })
      if (error) throw error
      setSignupSent(false)
      setStep('sent')
    })
  }

  const onOtp = (e: FormEvent) => {
    e.preventDefault()
    void run(async () => {
      const token = otp.replace(/\D/g, '')
      if (token.length !== 6) throw new Error('The code has 6 digits.')
      let { error } = await supabase().auth.verifyOtp({ email: email.trim(), token, type: 'email' })
      if (error && signupSent) ({ error } = await supabase().auth.verifyOtp({ email: email.trim(), token, type: 'signup' }))
      if (error) throw error
      finish()
    })
  }

  const onPassword = (mode: 'in' | 'up') => (e?: FormEvent) => {
    e?.preventDefault()
    setCreating(mode === 'up')
    void run(async () => {
      checkEmail()
      if (mode === 'in') {
        const { error } = await supabase().auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
        return finish()
      }
      if (password.length < 8) throw new Error('Use a longer password (at least 8 characters).')
      const redirect = app ? undefined : `${location.origin}/gate/?next=${encodeURIComponent(next())}`
      const { data, error } = await supabase().auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: redirect } })
      if (error) throw error
      if (data.session) return finish()
      setSignupSent(true)
      setStep('sent')
    })
  }

  return (
    <main className="home gate" aria-label="Nanoscale Revision: access">
      <DoorLeaves />
      <div className="home-theme">
        <ThemeIcon />
      </div>
      <section className="home-card gate-card" data-step={step}>
        <p className="eyebrow">ELEC0031 · UCL · access controlled</p>
        <h1>Nanoscale Revision</h1>

        {step === 'checking' && <p className="gate-note mono">checking the door…</p>}

        {step === 'code' && (
          <form onSubmit={onCode} className="gate-form">
            <p className="home-lede">This bay is for the ELEC0031 cohort. Enter the access code from the course page to unlock the door.</p>
            <label className="gate-field">
              <span className="mono">access code</span>
              <input ref={field} name="access-code" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" autoCapitalize="off" spellCheck={false} maxLength={200} required data-testid="access-code" />
            </label>
            <button className="home-cta" disabled={busy || !code.trim()} data-testid="access-submit">
              {busy ? 'checking…' : 'Unlock the door'}
            </button>
          </form>
        )}

        {step === 'email' && (
          <form onSubmit={onEmail} className="gate-form">
            <p className="home-lede">Sign in with your UCL email. New here? The same step creates your account: your progress then follows you between devices.</p>
            <label className="gate-field">
              <span className="mono">UCL email</span>
              <input ref={field} type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@ucl.ac.uk" autoComplete="email" required data-testid="email" />
            </label>
            <button className="home-cta" disabled={busy || !email.trim()} data-testid="email-submit">
              {busy ? 'sending…' : app ? 'Email me a code' : 'Email me a sign-in link'}
            </button>
            <p className="gate-alt mono">
              <button type="button" onClick={() => (setError(null), setStep('password'))} data-testid="use-password">
                use a password instead
              </button>
            </p>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={onPassword('in')} className="gate-form">
            <p className="home-lede">Sign in with your UCL email and password, or create an account with one.</p>
            <label className="gate-field">
              <span className="mono">UCL email</span>
              <input ref={field} type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@ucl.ac.uk" autoComplete="username" required />
            </label>
            <label className="gate-field">
              <span className="mono">password</span>
              <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" minLength={8} required />
            </label>
            <div className="gate-row">
              <button className="home-cta" disabled={busy || !email.trim() || !password}>
                {busy && !creating ? 'signing in…' : 'Sign in'}
              </button>
              <button type="button" className="gate-secondary" disabled={busy || !email.trim() || !password} onClick={() => onPassword('up')()}>
                {busy && creating ? 'creating…' : 'Create account'}
              </button>
            </div>
            <p className="gate-alt mono">
              <button type="button" onClick={() => (setError(null), setStep('email'))}>
                {app ? 'email me a code instead' : 'email me a link instead'}
              </button>
            </p>
          </form>
        )}

        {step === 'sent' && (
          <form onSubmit={onOtp} className="gate-form">
            <p className="home-lede">
              {signupSent ? 'Confirm your address: we sent ' : 'We sent '}
              {app ? 'a 6-digit code' : 'a sign-in link and a 6-digit code'} to <strong>{email.trim()}</strong>.{' '}
              {app ? 'Type it here.' : 'Open the link in this browser, or type the code here.'}
            </p>
            <label className="gate-field">
              <span className="mono">6-digit code</span>
              <input
                ref={field}
                name="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^\d ]/g, '').slice(0, 7))}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="gate-otp"
                placeholder="••••••"
                required
                data-testid="otp"
              />
            </label>
            <button className="home-cta" disabled={busy || otp.replace(/\D/g, '').length !== 6} data-testid="otp-submit">
              {busy ? 'checking…' : 'Sign in'}
            </button>
            <p className="gate-alt mono">
              <button type="button" onClick={() => (setOtp(''), setError(null), setStep('email'))}>
                use a different email
              </button>
            </p>
          </form>
        )}

        {step === 'done' && <p className="gate-note mono">door open…</p>}

        {error && (
          <p className="gate-error" role="alert" data-testid="gate-error">
            {error}
          </p>
        )}

        <nav className="home-links gate-links" aria-label="About">
          <span>No analytics, no trackers.</span>
          {app ? (
            <button type="button" onClick={() => setPrivacy(true)}>
              privacy
            </button>
          ) : (
            <a href="/gate/privacy">privacy</a>
          )}
        </nav>
      </section>
      {privacy && (
        <div className="gate-scrim" onClick={() => setPrivacy(false)}>
          <article className="gate-privacy" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Privacy">
            <Privacy />
            <button className="home-cta" onClick={() => setPrivacy(false)}>
              Close
            </button>
          </article>
        </div>
      )}
    </main>
  )
}
