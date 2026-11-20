import { lazy, Suspense, useEffect } from 'react'
import { useAtlas } from './state/store'
import { startUrlSync } from './state/url'
import { Home } from './ui/Home'
import { StylePage } from './ui/StylePage'

export const loadShell = () => import('./AtlasShell')
const AtlasShell = lazy(loadShell)

export function App() {
  const page = useAtlas((s) => s.page)
  useEffect(() => startUrlSync(), [])
  return (
    <>
      {page !== 'style' && (
        <Suspense fallback={null}>
          <AtlasShell />
        </Suspense>
      )}
      {page === 'home' && <Home />}
      {page === 'style' && <StylePage />}
    </>
  )
}
