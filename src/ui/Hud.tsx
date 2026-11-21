import { useEffect } from 'react'
import { LAYERS, layerIndex } from '../chapters/cmos/layers'
import { useAtlas } from '../state/store'
import { transition } from '../scene/transition'
import { navigate } from '../state/url'
import { ScaleBar } from './ScaleBar'
import { Panel } from './Panel'
import { HoverLabel, SceneOutline } from './Inspect'
import { EXAGGERATION_NOTE } from '../chapters/cmos/display'
import { ViewBar } from './ViewBar'
import { Timeline } from './Timeline'
import { LayerControls } from './LayerControls'
import { LogicBench } from './LogicBench'
import { LayoutView } from './LayoutView'
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
  const sound = useAtlas((s) => s.sound)
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
      <div className="topbar-tools">
        <button className="tool" aria-pressed={reduced} onClick={() => set({ reducedMotion: !reduced })} title="Reduce motion: no camera flights, springs settle instantly">
          {reduced ? 'motion reduced' : 'motion full'}
        </button>
        <button className="tool" aria-pressed={sound} onClick={() => set({ sound: !sound })} title="Sound: snaps click, fab tools hum">
          {sound ? 'sound on' : 'sound off'}
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

const HINTS: Partial<Record<string, string>> = {
  wafer: 'Scroll to zoom into the marked die · click anything to inspect',
  die: 'Scroll toward the beacon to reach the inverter',
  transistor: 'Drag VG · scroll in to the gate oxide · Esc goes up',
  oxide: 'Scroll into the crystal for the silicon lattice · Esc goes up',
  lattice: 'Switch structure and dopant · Esc goes up',
}

function LayerHint() {
  const layer = useAtlas((s) => s.layer)
  const focus = useAtlas((s) => s.focus)
  const h = HINTS[layer]
  if (!h || focus) return null
  return <p className="layer-hint mono">{h}</p>
}

function ExaggerationNote() {
  const layer = useAtlas((s) => s.layer)
  const view = useAtlas((s) => s.view)
  if ((layer !== 'cell' && layer !== 'transistor') || view === 'layout') return null
  return <p className="exaggeration mono">{EXAGGERATION_NOTE}</p>
}

export function Hud() {
  useGlobalKeys()
  return (
    <>
      <TopBar />
      <SceneOutline />
      <ScaleBar />
      <ExaggerationNote />
      <LayerHint />
      <LabelOverlay />
      <SectionLegend />
      <ViewBar />
      <Timeline />
      <LayerControls />
      <LogicBench />
      <LayoutView />
      <HoverLabel />
      <Panel />
    </>
  )
}
