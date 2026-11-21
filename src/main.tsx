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
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// test hook: expose the store for screenshot / e2e scripts
import { useAtlas, live } from './state/store'
;(window as unknown as { __live: unknown }).__live = live
;(window as unknown as { __atlas_set: unknown }).__atlas_set = (p: object) => useAtlas.getState().set(p)
;(window as unknown as { __atlas: unknown }).__atlas = new Proxy({}, { get: (_, k) => (useAtlas.getState() as never)[k] })
