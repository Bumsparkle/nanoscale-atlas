import { useEffect } from 'react'
import { LAYERS, layerIndex } from '../chapters/cmos/layers'
import { useAtlas } from '../state/store'
import { transition } from '../scene/transition'
import { ScaleBar } from './ScaleBar'
import { Panel } from './Panel'
import { HoverLabel, SceneOutline } from './Inspect'
import { EXAGGERATION_NOTE } from '../chapters/cmos/display'
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
  const set = useAtlas((s) => s.set)
  return (
    <header className="topbar">
      <a className="brand" href="/" onClick={(e) => { e.preventDefault(); set({ page: 'home' }) }}>
        <span className="brand-mark" aria-hidden />
        <span>Nanoscale Atlas</span>
        <span className="brand-ch">Ch.1 · CMOS inverter</span>
      </a>
      <Breadcrumbs />
      <div className="topbar-tools">
        <button className="tool" aria-pressed={sound} onClick={() => set({ sound: !sound })} title="Sound">
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

function ExaggerationNote() {
  const layer = useAtlas((s) => s.layer)
  if (layer !== 'cell' && layer !== 'transistor') return null
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
      <HoverLabel />
      <Panel />
    </>
  )
}
