import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { POSITIONS, positionsOf, reviewKey, SECTION_BY_ID, sectionMinutes, sectionsOf, STEP_BY_ID, type FlatStep, type Section } from '../lesson'
import { QUESTION_BY_ID } from '../bank'
import { driveScene } from '../drive'
import { progress } from '../progress'
import { CHAPTER_BY_ID, CHAPTERS } from '../../chapters/cmos/layers'
import { useAtlas } from '../../state/store'
import { QuestionCard, type Outcome } from './QuestionCard'
import { CollapseToggle, useCollapsed } from './Collapse'
import { SourceButton } from '../../ui/source/Source'

const useProgress = () => useSyncExternalStore(progress.subscribe, () => progress.lesson())

/** first-try outcomes this visit, for the section summary */
const outcomes: Record<string, Outcome> = {}

const parse = (at: string) => {
  if (at.startsWith('review:')) {
    const section = SECTION_BY_ID[at.slice(7)]
    return section ? { section, step: null as FlatStep | null } : null
  }
  const step = STEP_BY_ID[at]
  return step ? { section: SECTION_BY_ID[step.section], step } : null
}

/**
 * Lesson mode: Topic 2 in 15 sections. Each step teaches one idea and drives
 * the model to show it; then its check takes over the panel, with the text
 * folded into a bar you can peek at (a peeked answer doesn't count as
 * mastered). Each section ends with a mixed review and a summary. A position
 * unlocks the next once its questions are answered or their solutions opened.
 */
export function LessonPanel() {
  const storeAt = useAtlas((s) => s.lessonAt)
  const set = useAtlas((s) => s.set)
  const lp = useProgress()
  const [menu, setMenu] = useState(false)
  const [collapsed, setCollapsed] = useCollapsed()

  // resume where you left off when no position is in the URL
  useEffect(() => {
    if (!storeAt || !parse(storeAt)) set({ lessonAt: lp.at })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const at = storeAt && parse(storeAt) ? storeAt : lp.at
  const { section, step } = parse(at) ?? parse(POSITIONS[0])!
  const i = POSITIONS.indexOf(at)
  const SECTIONS = sectionsOf(section.chapter)
  const chapter = CHAPTER_BY_ID[section.chapter]
  const chapterPositions = positionsOf(section.chapter)
  const lastPos = chapterPositions[chapterPositions.length - 1]
  const si = SECTIONS.indexOf(section)
  const reach = useMemo(() => progress.reachable(at), [lp, at]) // eslint-disable-line react-hooks/exhaustive-deps
  const done = lp.done.includes(at)

  const go = (j: number) => {
    const k = Math.max(0, Math.min(POSITIONS.length - 1, j))
    if (k > reach && !lp.done.includes(POSITIONS[k])) return
    set({ lessonAt: POSITIONS[k] })
  }
  const next = () => go(i + 1)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('input, textarea, select')) return
      // < and > (the [ ] keys belong to the animation speed)
      if (e.key === '>' && (done || i < reach)) go(i + 1)
      if (e.key === '<') go(i - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const sectionDone = (s: Section) => lp.done.includes(reviewKey(s.id))
  const firstOpen = (s: Section) => {
    const ps = [...s.steps.map((st) => st.id), reviewKey(s.id)]
    return ps.find((p) => !lp.done.includes(p)) ?? ps[0]
  }

  return (
    <aside className={'learn-panel' + (collapsed ? ' collapsed' : '')} aria-label="Lesson">
      <header className="lp-top">
        <div className="lp-row1">
          <CollapseToggle collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
          <p className="eyebrow">lesson · ch.{chapter.n} · {chapter.title}</p>
          <button className="lp-menu-btn mono" aria-expanded={menu} onClick={() => setMenu(!menu)}>
            § {String(si + 1).padStart(2, '0')} / {SECTIONS.length} ▾
          </button>
        </div>
        <div className="lp-track" aria-hidden>
          {SECTIONS.map((s, k) => (
            <i key={s.id} className={(sectionDone(s) ? 'done ' : '') + (k === si ? 'here' : '')} />
          ))}
        </div>
        {menu && (
          <div className="lp-chapters seg" role="group" aria-label="Chapter">
            {CHAPTERS.map((c) => (
              <button key={c.id} aria-pressed={c.id === section.chapter} onClick={() => set({ lessonAt: firstOpen(sectionsOf(c.id).find((x) => !sectionDone(x)) ?? sectionsOf(c.id)[0]) })}>
                ch.{c.n} {c.title}
              </button>
            ))}
          </div>
        )}
        {menu && (
          <ol className="lp-menu">
            {SECTIONS.map((s, k) => {
              const target = firstOpen(s)
              const open = POSITIONS.indexOf(target) <= reach || lp.done.includes(target)
              return (
                <li key={s.id}>
                  <button
                    disabled={!open}
                    aria-current={k === si}
                    onClick={() => {
                      setMenu(false)
                      set({ lessonAt: target })
                    }}
                  >
                    <span className="mono">{String(k + 1).padStart(2, '0')}</span> {s.title}
                    <span className="lp-menu-min mono">~{Math.round(sectionMinutes(s))} min</span>
                    {sectionDone(s) && <i className="tick">✓</i>}
                  </button>
                </li>
              )
            })}
          </ol>
        )}
      </header>

      {step ? (
        <StepView key={step.id} section={section} step={step} done={done} onNext={next} last={at === lastPos} />
      ) : (
        <ReviewView key={section.id} section={section} index={si} done={done} onNext={next} last={at === lastPos} />
      )}

      <footer className="lp-foot">
        <button className="chip" disabled={i === 0} onClick={() => go(i - 1)}>
          ← back
        </button>
        <span className="lp-foot-note mono">
          {step ? `step ${section.steps.findIndex((s) => s.id === step.id) + 1} of ${section.steps.length}` : 'section review'}
          {done ? ' · done' : ''}
        </span>
        <button className="lp-next" disabled={!done || i === POSITIONS.length - 1} onClick={next}>
          {i === POSITIONS.length - 1 ? 'lesson complete' : 'next →'}
        </button>
      </footer>
    </aside>
  )
}

const record = (id: string, o: Outcome) => {
  if (!(id in outcomes)) outcomes[id] = o
  progress.record(id, o === 'right' ? true : o === 'peeked' ? 'peeked' : false)
  const st = useAtlas.getState()
  st.set({ progressVersion: st.progressVersion + 1 })
}

/** one teaching step: teach, then its checks one at a time */
function StepView({ section, step, done, onNext, last }: { section: Section; step: FlatStep; done: boolean; onNext: () => void; last: boolean }) {
  const set = useAtlas((s) => s.set)
  const [phase, setPhase] = useState<'teach' | 'check'>('teach')
  const [ready, setReady] = useState(false)
  const [k, setK] = useState(0)
  const [answered, setAnswered] = useState<boolean[]>([])
  const [peek, setPeek] = useState(false)
  const [peeked, setPeeked] = useState(false)
  const body = useRef<HTMLDivElement>(null)
  const n = section.steps.findIndex((s) => s.id === step.id)

  // drive the scene to what the step teaches
  useEffect(() => {
    let live = true
    progress.setAt(step.id)
    set({ look: null, hint: null, focus: null, quiz: false })
    body.current?.scrollTo({ top: 0 })
    driveScene(step.scene).then(() => live && setReady(true))
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id])

  const startCheck = () => {
    setPhase('check')
    setK(0)
    setAnswered([])
    setPeek(false)
    setPeeked(false)
    body.current?.scrollTo({ top: 0 })
  }
  const q = QUESTION_BY_ID[step.checks[k]]
  const thisDone = answered[k]
  const allDone = step.checks.every((_, j) => answered[j])

  const text = (
    <>
      <p className="lp-narration">{step.text}</p>
      {step.example && (
        <div className={'lp-example lp-example-' + step.example.kind}>
          <p className="eyebrow">{step.example.kind === 'worked' ? 'worked example' : 'try it on the model'}</p>
          <p>{step.example.text}</p>
        </div>
      )}
      {step.related.length > 0 && (
        <p className="lp-related">
          <span className="eyebrow">also taught in chapter 1</span>
          {step.related.map((id) => (
            <button key={id} className="chip" onClick={() => set({ lessonAt: id })}>{STEP_BY_ID[id]?.title ?? id} →</button>
          ))}
        </p>
      )}
    </>
  )

  return (
    <div className="lp-scroll" ref={body} data-testid="lesson-step" data-step={step.id} data-phase={phase}>
      {phase === 'teach' && n === 0 && <SectionIntro section={section} />}
      <div className="lc-head lp-step-head">
        <p className="eyebrow lp-eyebrow">
          § {sectionsOf(section.chapter).indexOf(section) + 1} · {section.title}
        </p>
        <SourceButton refs={step.sources} />
      </div>
      <h2 className="lp-title">{step.title}</h2>

      {phase === 'teach' ? (
        <>
          {text}
          <div className="lp-actions">
            <button className="lp-next lp-check-btn" disabled={!ready} onClick={startCheck} data-testid="start-check">
              {ready ? (done ? 'check again' : 'check your understanding →') : 'moving to the model…'}
            </button>
            {done && (
              <button className="chip" onClick={onNext} disabled={last}>
                next step →
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className={'lp-fold' + (peek ? ' open' : '')}>
            <button
              className="lp-peek mono"
              aria-expanded={peek}
              data-testid="peek"
              onClick={() => {
                if (!peek && !thisDone) setPeeked(true)
                setPeek(!peek)
              }}
            >
              {peek ? 'hide the step text ▴' : 'peek at the step ▾'}
            </button>
            {peek && <div className="lp-fold-body">{text}</div>}
          </div>
          <p className="lp-qcount mono">
            check {k + 1} of {step.checks.length}
            {peeked && !thisDone ? ' · peeked: this one won’t count as mastered' : ''}
          </p>
          <QuestionCard
            key={q.id}
            q={q}
            peeked={peeked}
            onFirst={(o) => record(q.id, o)}
            onDone={() => {
              const a = [...answered]
              a[k] = true
              setAnswered(a)
              if (step.checks.every((_, j) => a[j])) progress.complete(step.id, peeked)
            }}
          />
          {thisDone && (
            <div className="lp-actions">
              {k < step.checks.length - 1 ? (
                <button
                  className="lp-next"
                  onClick={() => {
                    setK(k + 1)
                    setPeek(false)
                    setPeeked(false)
                    body.current?.scrollTo({ top: 0 })
                  }}
                >
                  next question →
                </button>
              ) : (
                allDone && (
                  <button className="lp-next" onClick={onNext} disabled={last} data-testid="continue">
                    {n === section.steps.length - 1 ? 'on to the section review →' : 'next step →'}
                  </button>
                )
              )}
              <button className="chip" onClick={() => setPhase('teach')}>
                back to the step
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SectionIntro({ section }: { section: Section }) {
  return (
    <div className="lp-intro" data-testid="section-intro">
      <p className="eyebrow">
        section {sectionsOf(section.chapter).indexOf(section) + 1} of {sectionsOf(section.chapter).length} · about {Math.round(sectionMinutes(section))} min
      </p>
      <h1 className="lp-section-title">{section.title}</h1>
      <p>{section.intro}</p>
      <ol className="lp-steplist">
        {section.steps.map((s) => (
          <li key={s.id}>{s.title}</li>
        ))}
        <li className="lp-steplist-review">Section review</li>
      </ol>
    </div>
  )
}

/** the mixed mini-review, one question at a time, then a summary */
function ReviewView({ section, index, done, onNext, last }: { section: Section; index: number; done: boolean; onNext: () => void; last: boolean }) {
  const set = useAtlas((s) => s.set)
  const [k, setK] = useState(0)
  const [answered, setAnswered] = useState<boolean[]>([])
  const [summary, setSummary] = useState(done)
  const body = useRef<HTMLDivElement>(null)

  useEffect(() => {
    progress.setAt(reviewKey(section.id))
    set({ look: null, hint: null, focus: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.id])

  if (summary) return <SectionSummary section={section} index={index} onNext={onNext} last={last} onRetake={() => (setSummary(false), setK(0), setAnswered([]))} />

  const q = QUESTION_BY_ID[section.review[k]]
  return (
    <div className="lp-scroll" ref={body} data-testid="lesson-review">
      <p className="eyebrow lp-eyebrow">
        § {index + 1} · {section.title}
      </p>
      <h2 className="lp-title">Section review</h2>
      <p className="lp-narration lp-review-note">
        {index === 0 ? 'Questions on this section, without the step text to lean on.' : 'Questions on this section mixed with earlier ones, without the step text to lean on.'}
      </p>
      <p className="lp-qcount mono">
        question {k + 1} of {section.review.length}
      </p>
      <QuestionCard
        key={q.id}
        q={q}
        onFirst={(o) => record(q.id, o)}
        onDone={() => {
          const a = [...answered]
          a[k] = true
          setAnswered(a)
        }}
      />
      {answered[k] && (
        <div className="lp-actions">
          <button
            className="lp-next"
            data-testid="continue"
            onClick={() => {
              body.current?.scrollTo({ top: 0 })
              if (k < section.review.length - 1) setK(k + 1)
              else {
                progress.complete(reviewKey(section.id))
                setSummary(true)
              }
            }}
          >
            {k < section.review.length - 1 ? 'next question →' : 'finish the section →'}
          </button>
        </div>
      )}
    </div>
  )
}

function SectionSummary({ section, index, onNext, last, onRetake }: { section: Section; index: number; onNext: () => void; last: boolean; onRetake: () => void }) {
  const ids = [...section.steps.flatMap((s) => s.checks), ...section.review]
  const seen = ids.filter((id) => id in outcomes)
  const right = seen.filter((id) => outcomes[id] === 'right').length
  const peeked = seen.filter((id) => outcomes[id] === 'peeked').length
  const missed = seen.filter((id) => outcomes[id] === 'wrong')
  return (
    <div className="lp-scroll" data-testid="section-summary">
      <p className="eyebrow lp-eyebrow">
        § {index + 1} · section complete
      </p>
      <h2 className="lp-title">{section.title}</h2>
      {seen.length > 0 && (
        <p className="lp-score">
          <span className="mono lp-score-n">
            {right}/{seen.length}
          </span>{' '}
          right first time{peeked ? `, ${peeked} after a peek` : ''}.
        </p>
      )}
      <ol className="lp-steplist done">
        {section.steps.map((s) => (
          <li key={s.id}>{s.title}</li>
        ))}
      </ol>
      {missed.length > 0 && (
        <p className="lp-narration">
          {missed.length === 1 ? 'One question' : `${missed.length} questions`} you missed {missed.length === 1 ? 'is' : 'are'} now in box 1 of Revise, so {missed.length === 1 ? 'it comes' : 'they come'} back first.
        </p>
      )}
      <div className="lp-actions">
        <button className="lp-next" onClick={onNext} disabled={last}>
          {last ? 'lesson complete' : `next: ${sectionsOf(section.chapter)[index + 1]?.title ?? 'next chapter'} →`}
        </button>
        <button className="chip" onClick={onRetake}>
          redo the review
        </button>
      </div>
    </div>
  )
}
