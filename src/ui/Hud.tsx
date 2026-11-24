import { useEffect, useState } from 'react'
import { IS_APP } from '../platform'
import { ancestry, CHAPTER_BY_ID, CHAPTERS, chapterOf, LAYER_BY_ID, layerIndex } from '../chapters/cmos/layers'
import { useApp } from '../state/store'
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
import { LearnHost } from '../learn/ui/LearnHost'
import { SourceModal } from './source/Source'
import '../ui/layercontrols.css'
import { LabelOverlay, SectionLegend } from './Overlay'
import './hud.css'
import { TopIcons } from './TopIcons'

export function Breadcrumbs() {
  const layer = useApp((s) => s.layer)
  const device = useApp((s) => s.device)
  const idx = layerIndex(layer)
  // the zoom path within this layer's chapter, plus the layer just above it
  const ch = LAYER_BY_ID[layer].chapter
  const chain = ancestry(layer).map((id) => LAYER_BY_ID[id])
  const start = Math.max(0, chain.findIndex((l) => l.chapter === ch) - 1)
  const shown = chain.slice(start)
  return (
    <nav className="crumbs" aria-label="Zoom path">
      <ol>
        {shown.map((l) => {
          const i = layerIndex(l.id)
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

/** the three chapters: where you are, and a jump to the start of each */
export function ChapterMenu() {
  const layer = useApp((s) => s.layer)
  const tab = useApp((s) => s.tab)
  const [open, setOpen] = useState(false)
  const cur = CHAPTER_BY_ID[chapterOf(layer, tab)]
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => !(e.target as HTMLElement).closest?.('.chapters') && setOpen(false)
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [open])
  return (
    <div className="chapters">
      <button className="brand-ch" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(!open)}>
        Ch.{cur.n} · {cur.title} ▾
      </button>
      {open && (
        <ul className="chapters-menu" role="menu">
          {CHAPTERS.map((c) => (
            <li key={c.id} role="none">
              <button role="menuitem" aria-current={c.id === cur.id} onClick={() => (setOpen(false), void transition.go(c.entry.layer, { tab: c.entry.tab }))}>
                <span className="mono">Ch.{c.n}</span> <b>{c.title}</b>
                <span className="chapters-blurb">Topic {c.topic.slice(5)} · {c.blurb}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function TopBar() {
  return (
    <header className="topbar">
      <a className="brand" href="/" onClick={(e) => { e.preventDefault(); navigate('/') }}>
        <span className="brand-mark" aria-hidden />
        <span>Nanoscale Revision</span>
      </a>
      <ChapterMenu />
      <Breadcrumbs />
      <TopIcons />
    </header>
  )
}

/** Global keys: Esc goes up a level (or closes the panel first). */
export function useGlobalKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('input, textarea, select')) return
      const st = useApp.getState()
      if (st.page !== 'study') return
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
