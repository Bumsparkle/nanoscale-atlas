import { useEffect } from 'react'
import { IS_APP } from '../platform'
import { LAYERS, layerIndex } from '../chapters/cmos/layers'
import { useAtlas } from '../state/store'
import { transition } from '../scene/transition'
import { navigate } from '../state/url'
import { ScaleBar } from './ScaleBar'
import { Panel } from './Panel'
import { HoverLabel, SceneOutline } from './Inspect'
import { ViewBar } from './ViewBar'
import { Timeline } from './Timeline'
import { LayerControls } from './LayerControls'
import { LogicBench } from './LogicBench'
import { LayoutView } from './LayoutView'
import { LearnHost, ModeSwitch } from '../learn/ui/LearnHost'
import { SourceModal } from './source/Source'
import '../ui/layercontrols.css'
import { LabelOverlay, SectionLegend } from './Overlay'
import './hud.css'

export function Breadcrumbs() {
  const layer = useAtlas((s) => s.layer)
  const device = useAtlas((s) => s.device)
  const idx = layerIndex(layer)
  return (
    <nav className="crumbs" aria-label="Zoom path">
      <ol>
        {LAYERS.slice(0, idx + 1).map((l, i) => {
          const name = l.id === 'transistor' ? (device === 'pmos' ? 'pMOS' : 'nMOS') : l.crumb
          const current = i === idx
          return (
            <li key={l.id}>
              {current ? (
                <span aria-current="location">{name}</span>
              ) : (
                <button onClick={() => transition.go(l.id)}>{name}</button>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export function TopBar() {
  const reduced = useAtlas((s) => s.reducedMotion)
  const set = useAtlas((s) => s.set)
  return (
    <header className="topbar">
      <a className="brand" href="/" onClick={(e) => { e.preventDefault(); navigate('/') }}>
        <span className="brand-mark" aria-hidden />
        <span>Nanoscale Atlas</span>
        <span className="brand-ch">Ch.1 · CMOS inverter</span>
      </a>
      <Breadcrumbs />
      <ModeSwitch />
      <div className="topbar-tools">
        <button className="tool" aria-pressed={reduced} onClick={() => set({ reducedMotion: !reduced })} title="Reduce motion: no camera flights, springs settle instantly">
          {reduced ? 'motion reduced' : 'motion full'}
        </button>
      </div>
    </header>
  )
}

/** Global keys: Esc goes up a level (or closes the panel first). */
export function useGlobalKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('input, textarea, select')) return
      const st = useAtlas.getState()
      if (st.page !== 'atlas') return
      // ⌥D: the renderer / debug readout (handy in the desktop app, which has no address bar)
      if (e.altKey && e.code === 'KeyD') return navigate('/debug')
      if (e.key === 'Escape') {
        if (st.focus) st.set({ focus: null })
        else if (st.view !== 'explore') st.set({ view: 'explore' })
        else void transition.up()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

/** desktop app: the strip under the title bar drags the window (Tauri drag region) */
function AppDragStrip() {
  if (!IS_APP) return null
  return <div className="app-drag" data-tauri-drag-region aria-hidden />
}

export function Hud() {
  useGlobalKeys()
  return (
    <>
      <AppDragStrip />
      <TopBar />
      <SceneOutline />
      <ScaleBar />
      <LabelOverlay />
      <SectionLegend />
      <ViewBar />
      <Timeline />
      <LayerControls />
      <LogicBench />
      <LayoutView />
      <LearnHost />
      <SourceModal />
      <HoverLabel />
      <Panel />
    </>
  )
}
