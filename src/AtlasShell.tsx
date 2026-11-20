import { Stage } from './scene/Stage'
import { Hud } from './ui/Hud'
import { DebugPanel } from './ui/DebugPanel'
import { useAtlas } from './state/store'
import { useEffect } from 'react'

/** Everything that needs three.js: one lazy chunk behind the cleanroom door. */
export default function AtlasShell() {
  const page = useAtlas((s) => s.page)
  useEffect(() => {
    useAtlas.setState((s) => ({ boot: { ...s.boot, shell: true } }))
  }, [])
  return (
    <>
      <Stage />
      {(page === 'atlas' || page === 'debug') && <Hud />}
      {page === 'debug' && <DebugPanel />}
    </>
  )
}
