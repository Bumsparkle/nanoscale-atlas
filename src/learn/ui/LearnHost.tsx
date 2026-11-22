import { useEffect } from 'react'
import { useAtlas, type Mode } from '../../state/store'
import { LessonPanel } from './LessonPanel'
import { RevisePanel } from './RevisePanel'
import { progress } from '../progress'
import { chapterOfPosition, positionsOf } from '../lesson'
import { chapterOf } from '../../chapters/cmos/layers'
import '../learn.css'

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: 'explore', label: 'Explore', hint: 'The sandbox: every view, no questions' },
  { id: 'lesson', label: 'Lesson', hint: 'This chapter’s lesson, a question after each part' },
  { id: 'revise', label: 'Revise', hint: 'Spaced repetition, coverage by slide, timed paper' },
]

/** resume the lesson of the chapter you are looking at */
function lessonStart() {
  const st = useAtlas.getState()
  const ch = chapterOf(st.layer, st.tab)
  const at = progress.lesson().at
  if (chapterOfPosition(at) === ch) return at
  const list = positionsOf(ch)
  return list.find((p) => !progress.lesson().done.includes(p)) ?? list[0]
}

export function ModeSwitch() {
  const mode = useAtlas((s) => s.mode)
  const set = useAtlas((s) => s.set)
  return (
    <nav className="modes" aria-label="Mode">
      {MODES.map((m) => (
        <button
          key={m.id}
          aria-pressed={mode === m.id}
          title={m.hint}
          onClick={() =>
            set({
              mode: m.id,
              lessonAt: m.id === 'lesson' ? lessonStart() : useAtlas.getState().lessonAt,
              hint: null,
              look: null,
              quiz: false,
              focus: null,
              mastery: m.id === 'explore' ? useAtlas.getState().mastery : false,
            })
          }
        >
          {m.label}
        </button>
      ))}
    </nav>
  )
}

/** Explore: tint the model by mastery */
export function MasteryToggle() {
  const mode = useAtlas((s) => s.mode)
  const on = useAtlas((s) => s.mastery)
  const set = useAtlas((s) => s.set)
  if (mode !== 'explore') return null
  return (
    <button className="tool" aria-pressed={on} onClick={() => set({ mastery: !on, view: 'explore' })} title="Tint each part by how well you know its facts">
      mastery
    </button>
  )
}

function MasteryLegend() {
  const on = useAtlas((s) => s.mastery)
  const mode = useAtlas((s) => s.mode)
  const layer = useAtlas((s) => s.layer)
  if (!on || mode !== 'explore') return null
  return (
    <aside className="mastery-legend" aria-label="Mastery legend">
      <p className="eyebrow">mastery{layer !== 'cell' ? ' · see the parts list' : ''}</p>
      <ul>
        <li><i className="mdot mdot-weak" /> weak</li>
        <li><i className="mdot mdot-learning" /> learning</li>
        <li><i className="mdot mdot-strong" /> strong</li>
        <li><i className="mdot mdot-untested" /> untested</li>
      </ul>
      <p className="ml-note">Click a weak or untested part to open the lesson that teaches it.</p>
    </aside>
  )
}

export function LearnHost() {
  const mode = useAtlas((s) => s.mode)
  // Esc closes a revise sheet before anything else
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = useAtlas.getState()
      if (e.key === 'Escape' && st.mode === 'revise' && st.revise.tab !== 'drill') {
        e.stopImmediatePropagation()
        st.set({ revise: { ...st.revise, tab: 'drill' } })
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])
  return (
    <>
      <MasteryLegend />
      {mode === 'lesson' && <LessonPanel />}
      {mode === 'revise' && <RevisePanel />}
    </>
  )
}
