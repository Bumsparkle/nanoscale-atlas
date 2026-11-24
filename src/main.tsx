import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/app.css'
import { currentUser, hasAccess } from './account/client'
import { IS_APP } from './platform'

/**
 * Boot: nothing of the app runs until we know who is signed in.
 * Web: the middleware only serves this page to a signed-in user who passed
 * the access code; if the session has lapsed since, back to the gate.
 * Mac app: the gate is shown here, in the window, until there is both an
 * access token and a session in the Keychain.
 * Then this user's local store is opened (progress, settings) before the
 * app modules load, so they start from it.
 */
async function boot() {
  const root = createRoot(document.getElementById('root')!)
  const [user, access] = await Promise.all([currentUser(), IS_APP ? hasAccess() : Promise.resolve(true)])
  if (!user || !access) {
    if (!IS_APP) {
      location.replace('/gate/?next=' + encodeURIComponent(location.pathname + location.search))
      return
    }
    const { Gate } = await import('./gate/Gate')
    root.render(
      <StrictMode>
        <Gate app onDone={() => location.reload()} />
      </StrictMode>,
    )
    return
  }
  const { startAccount } = await import('./account/account')
  startAccount(user)
  const [{ App }, { useApp, live }] = await Promise.all([import('./App'), import('./state/store')])
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )

  // test hook: expose the store for screenshot / e2e scripts
  const w = window as unknown as Record<string, unknown>
  w.__live = live
  w.__app_set = (p: object) => useApp.getState().set(p)
  w.__app = new Proxy({}, { get: (_, k) => (useApp.getState() as never)[k] })
  // screenshot scripts: merge a patch, with shorthands for the process lab
  w.__appSet = (p: Record<string, unknown>) => {
    const st = useApp.getState()
    const { procOp, tone, ...rest } = p
    if (procOp || tone) st.set({ proc: { ...st.proc, ...(procOp ? { op: procOp as never } : {}), ...(tone ? { tone: tone as never } : {}) } })
    if (Object.keys(rest).length) st.set(rest as never)
  }
}
void boot()
