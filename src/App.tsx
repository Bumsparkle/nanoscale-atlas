import { lazy, Suspense, useEffect, useState } from 'react'
import { useAtlas } from './state/store'
import { startUrlSync } from './state/url'
import { Home } from './ui/Home'
import { StylePage } from './ui/StylePage'

export const loadShell = () => import('./AtlasShell')
const AtlasShell = lazy(loadShell)

export function App() {
  const page = useAtlas((s) => s.page)
  const view = useAtlas((s) => s.view)
  const layer = useAtlas((s) => s.layer)
  useEffect(() => startUrlSync(), [])
  // on the door page, the three.js shell loads only after the door has painted
  // and the main thread is idle; deep links load it immediately
  const [shellReady, setShellReady] = useState(page !== 'home')
  useEffect(() => {
    if (shellReady) return
    if (page !== 'home') return setShellReady(true)
    const ric = (window as unknown as { requestIdleCallback?: (f: () => void, o?: object) => number }).requestIdleCallback
    const go = () => setShellReady(true)
    const id = ric ? ric(go, { timeout: 1200 }) : window.setTimeout(go, 400)
    return () => ((window as unknown as { cancelIdleCallback?: (n: number) => void }).cancelIdleCallback ?? clearTimeout)(id)
  }, [page, shellReady])
  useEffect(() => {
    document.documentElement.dataset.view = layer === 'cell' ? view : 'explore'
    document.documentElement.dataset.layer = layer
  }, [view, layer])
  return (
    <>
      {page !== 'style' && shellReady && (
        <Suspense fallback={null}>
          <AtlasShell />
        </Suspense>
      )}
      {page === 'home' && <Home />}
      {page === 'style' && <StylePage />}
    </>
  )
}
