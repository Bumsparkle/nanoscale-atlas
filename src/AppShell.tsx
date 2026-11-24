import { Stage } from './scene/Stage'
import { Hud } from './ui/Hud'
import { DebugPanel } from './ui/DebugPanel'
import { useApp } from './state/store'
import { useEffect } from 'react'

/** Everything that needs three.js: one lazy chunk behind the cleanroom door. */
export default function AppShell() {
  const page = useApp((s) => s.page)
  useEffect(() => {
    useApp.setState((s) => ({ boot: { ...s.boot, shell: true } }))
  }, [])
  return (
    <>
      <Stage />
      {(page === 'study' || page === 'debug') && <Hud />}
      {page === 'debug' && <DebugPanel />}
    </>
  )
}
