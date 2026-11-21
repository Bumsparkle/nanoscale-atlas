import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { LESSON, CHUNK_BY_ID, chunkIndex } from '../lesson'
import { QUESTION_BY_ID } from '../bank'
import { driveScene } from '../drive'
import { progress } from '../progress'
import { useAtlas } from '../../state/store'
import { QuestionCard } from './QuestionCard'
import { CollapseToggle, useCollapsed } from './Collapse'

const useProgress = () => useSyncExternalStore(progress.subscribe, () => progress.lesson())

/**
 * Lesson mode: Topic 2 in lecture order. Each chunk moves the scene to what
 * it teaches, gives a short narration, then asks its question straight away.
 * Next unlocks after a correct answer or the worked solution.
 */
export function LessonPanel() {
  const storeChunk = useAtlas((s) => s.chunk)
  const set = useAtlas((s) => s.set)
  const lp = useProgress()
  const [ready, setReady] = useState(false)
  const [menu, setMenu] = useState(false)
  const [collapsed, setCollapsed] = useCollapsed()
  const body = useRef<HTMLDivElement>(null)

  // resume where you left off when no chunk is in the URL
  useEffect(() => {
    if (!storeChunk || !CHUNK_BY_ID[storeChunk]) set({ chunk: lp.chunk })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const chunk = CHUNK_BY_ID[storeChunk ?? ''] ?? CHUNK_BY_ID[lp.chunk] ?? LESSON[0]
  const i = chunkIndex(chunk.id)
  const q = QUESTION_BY_ID[chunk.question]
  const solved = lp.done.includes(chunk.id)
  const reach = useMemo(() => progress.reachable(), [lp])

  // drive the scene for the chunk, then ask its question
  useEffect(() => {
    let live = true
    setReady(false)
    progress.setChunk(chunk.id)
    set({ look: null, hint: null, focus: null })
    body.current?.scrollTo({ top: 0 })
    driveScene(chunk.scene).then(() => live && setReady(true))
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunk.id])

  const go = (j: number) => {
    const c = LESSON[Math.max(0, Math.min(LESSON.length - 1, j))]
    set({ chunk: c.id })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('input, textarea, select')) return
      if (e.key === ']' && (solved || i < reach)) go(i + 1)
      if (e.key === '[') go(i - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <aside className={'learn-panel' + (collapsed ? ' collapsed' : '')} aria-label="Lesson">
      <header className="lp-top">
        <div className="lp-row1">
          <CollapseToggle collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
          <p className="eyebrow">lesson · topic 2</p>
          <button className="lp-menu-btn mono" aria-expanded={menu} onClick={() => setMenu(!menu)}>
            {String(i + 1).padStart(2, '0')} / {LESSON.length} ▾
          </button>
        </div>
        <div className="lp-track" aria-hidden>
          {LESSON.map((c, k) => (
            <i key={c.id} className={(lp.done.includes(c.id) ? 'done ' : '') + (k === i ? 'here' : '')} />
          ))}
        </div>
        {menu && (
          <ol className="lp-menu">
            {LESSON.map((c, k) => (
              <li key={c.id}>
                <button
                  disabled={k > reach && !lp.done.includes(c.id)}
                  aria-current={k === i}
                  onClick={() => {
                    setMenu(false)
                    go(k)
                  }}
                >
                  <span className="mono">{String(k + 1).padStart(2, '0')}</span> {c.title}
                  {lp.done.includes(c.id) && <i className="tick">✓</i>}
                </button>
              </li>
            ))}
          </ol>
        )}
      </header>

      <div className="lp-scroll" ref={body}>
        <h2 className="lp-title">{chunk.title}</h2>
        <p className="lp-slides">
          {chunk.slides.map((s) => (
            <span key={s} className="slide-ref">
              slide {s}
            </span>
          ))}
        </p>
        <p className="lp-narration">{chunk.narration}</p>
        {ready ? (
          <QuestionCard
            key={q.id}
            q={q}
            onFirst={(ok) => {
              progress.record(q.id, ok)
              set({ progressVersion: useAtlas.getState().progressVersion + 1 })
            }}
            onDone={() => progress.complete(chunk.id)}
          />
        ) : (
          <p className="qwatch mono">
            <i className="qpulse" /> moving to the model…
          </p>
        )}
      </div>

      <footer className="lp-foot">
        <button className="chip" disabled={i === 0} onClick={() => go(i - 1)}>
          ← back
        </button>
        <span className="lp-foot-note mono">{solved ? 'unlocked' : 'answer to unlock the next part'}</span>
        <button className="lp-next" disabled={!solved || i === LESSON.length - 1} onClick={() => go(i + 1)}>
          {i === LESSON.length - 1 ? 'lesson complete' : 'next →'}
        </button>
      </footer>
    </aside>
  )
}
