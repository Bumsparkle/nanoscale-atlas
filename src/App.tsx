import { lazy, Suspense, useEffect, useState } from 'react'
import { useApp } from './state/store'
import { startUrlSync } from './state/url'
import { Home } from './ui/Home'
import { StylePage } from './ui/StylePage'
import { IS_APP } from './platform'
import { ImportPrompt } from './account/ImportPrompt'

export const loadShell = () => import('./AppShell')
const AppShell = lazy(loadShell)
// desktop app only: the update check (never loaded on the web)
const UpdatePrompt = lazy(() => import('./app/UpdatePrompt'))

export function App() {
  const page = useApp((s) => s.page)
  const view = useApp((s) => s.view)
  const layer = useApp((s) => s.layer)
  const quiz = useApp((s) => s.quiz)
  const mode = useApp((s) => s.mode)
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
    document.documentElement.dataset.quiz = quiz ? '1' : '0'
    document.documentElement.dataset.mode = mode
  }, [view, layer, quiz, mode])
  return (
    <>
      {page !== 'style' && shellReady && (
        <Suspense fallback={null}>
          <AppShell />
        </Suspense>
      )}
      {page === 'home' && <Home />}
      {page === 'style' && <StylePage />}
      {page !== 'style' && <ImportPrompt />}
      {IS_APP && (
        <Suspense fallback={null}>
          <UpdatePrompt />
        </Suspense>
      )}
    </>
  )
}
