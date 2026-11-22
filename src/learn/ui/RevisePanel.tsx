import { useEffect, useMemo, useState } from 'react'
import { useAtlas } from '../../state/store'
import { FACTS, QUESTIONS, SLIDES_OF } from '../bank'
import { TOPIC_IDS, TOPIC_SLIDES, type TopicId } from '../../sources'
import { boxCounts, factMastered, progress, queue, type Filter } from '../progress'
import { QuestionCard } from './QuestionCard'
import { CollapseToggle, useCollapsed } from './Collapse'
import { CoverageSheet } from './CoverageSheet'
import { ExamSheet } from './ExamSheet'

export const AREA_NAME: Record<string, string> = {
  intro: 'intro', materials: 'materials', junction: 'p-n junction', devices: 'MOS devices', logic: 'logic gates',
  structure: 'cross-section', fabrication: 'fabrication', layout: 'layout & rules', summary: 'summary',
  crystal: 'crystal', bands: 'bands', growth: 'crystal growth', defects: 'defects', process: 'process flow',
  cleanroom: 'cleanroom', cleaning: 'cleaning', gettering: 'gettering', yield: 'yield',
}
const TOPIC_NAME = AREA_NAME
const DECK: Record<TopicId, string> = { topic2: 'T2 · CMOS', topic3: 'T3 · growth', topic4: 'T4 · cleaning' }

/**
 * Revise mode. Drill: spaced repetition (Leitner boxes) over the whole bank,
 * filtered by slide range or topic. Coverage: per-slide mastery. Exam: a
 * timed paper of calc and recall questions.
 */
export function RevisePanel() {
  const rv = useAtlas((s) => s.revise)
  const set = useAtlas((s) => s.set)
  const pv = useAtlas((s) => s.progressVersion)
  const filter: Filter = { topic: rv.topic, from: rv.from, to: rv.to, area: rv.area }
  const fkey = `${rv.topic}-${rv.from}-${rv.to}-${rv.area}`
  const SLIDES = rv.topic ? SLIDES_OF(rv.topic) : []
  const areas = [...new Set(FACTS.filter((f) => !rv.topic || f.source.topic === rv.topic).map((f) => f.area))].filter((a) => a !== 'summary')
  const [ahead, setAhead] = useState(false)
  const [current, setCurrent] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [round, setRound] = useState(0)
  const [collapsed, setCollapsed] = useCollapsed()

  const due = useMemo(() => queue(filter, Date.now(), false), [fkey, pv, round]) // eslint-disable-line react-hooks/exhaustive-deps
  const list = ahead && due.length === 0 ? queue(filter, Date.now(), true) : due
  const boxes = useMemo(() => boxCounts(filter), [fkey, pv]) // eslint-disable-line react-hooks/exhaustive-deps
  const total = boxes.reduce((a, b) => a + b, 0)
  const factsIn = FACTS.filter((f) => (!rv.topic || (f.source.topic === rv.topic && f.source.slide >= rv.from && f.source.slide <= rv.to)) && (!rv.area || f.area === rv.area))
  const mastered = factsIn.filter((f) => factMastered(f.id)).length

  // pick the next card whenever the filter changes or a card is finished
  useEffect(() => {
    setAnswered(false)
    setCurrent(list[0]?.id ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fkey, round, ahead])

  const q = QUESTIONS.find((x) => x.id === current) ?? null
  const setRv = (p: Partial<typeof rv>) => set({ revise: { ...rv, ...p } })

  return (
    <>
      <aside className={'learn-panel' + (collapsed ? ' collapsed' : '')} aria-label="Revise">
        <header className="lp-top">
          <div className="lp-row1">
            <CollapseToggle collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
            <p className="eyebrow">revise · {rv.topic ? DECK[rv.topic] : 'all topics'}</p>
            <span className="mono lp-count">
              {mastered}/{factsIn.length} facts mastered
            </span>
          </div>
          <nav className="rv-tabs" role="tablist">
            {(['drill', 'coverage', 'exam'] as const).map((t) => (
              <button key={t} role="tab" aria-selected={rv.tab === t} onClick={() => setRv({ tab: t })}>
                {t === 'drill' ? 'Drill' : t === 'coverage' ? 'Coverage' : 'Exam paper'}
              </button>
            ))}
          </nav>
        </header>

        <div className="lp-scroll">
          <section className="rv-filter" aria-label="Filter">
            <div className="rv-topics" role="group" aria-label="Lecture">
              <button className="chip" aria-pressed={!rv.topic} onClick={() => setRv({ topic: null, area: null })}>all topics</button>
              {TOPIC_IDS.map((t) => (
                <button key={t} className="chip" aria-pressed={rv.topic === t} onClick={() => setRv({ topic: t, from: 1, to: TOPIC_SLIDES[t], area: null })}>{DECK[t]}</button>
              ))}
            </div>
            {rv.topic && <label>
              <span className="eyebrow">slides</span>
              <select value={rv.from} onChange={(e) => setRv({ from: +e.target.value, to: Math.max(+e.target.value, rv.to) })}>
                {SLIDES.map((s) => (
                  <option key={s.slide} value={s.slide}>
                    {s.slide}
                  </option>
                ))}
              </select>
              <span className="mono">–</span>
              <select value={rv.to} onChange={(e) => setRv({ to: +e.target.value, from: Math.min(+e.target.value, rv.from) })}>
                {SLIDES.map((s) => (
                  <option key={s.slide} value={s.slide}>
                    {s.slide}
                  </option>
                ))}
              </select>
              {(rv.from !== 1 || rv.to !== SLIDES.length || rv.area) && (
                <button className="chip" onClick={() => setRv({ from: 1, to: SLIDES.length, area: null })}>
                  all
                </button>
              )}
            </label>}
            <div className="rv-topics" role="group" aria-label="Topic">
              {areas.map((t) => (
                <button key={t} className="chip" aria-pressed={rv.area === t} onClick={() => setRv({ area: rv.area === t ? null : t })}>
                  {TOPIC_NAME[t]}
                </button>
              ))}
            </div>
          </section>

          <section className="rv-boxes" aria-label="Leitner boxes">
            {boxes.map((n, b) => (
              <div key={b} className={'rv-box' + (b === 0 ? ' new' : '')} title={b === 0 ? 'not yet seen' : `box ${b}`}>
                <i style={{ height: `${total ? Math.max(2, (n / total) * 46) : 2}px` }} />
                <span className="mono">{b === 0 ? 'new' : b}</span>
                <b className="mono">{n}</b>
              </div>
            ))}
            <p className="rv-due mono">{due.length} due now</p>
          </section>

          {rv.tab === 'drill' &&
            (q ? (
              <>
                <QuestionCard
                  key={q.id + round}
                  q={q}
                  onFirst={(ok) => {
                    progress.record(q.id, ok === 'right')
                    set({ progressVersion: useAtlas.getState().progressVersion + 1 })
                  }}
                  onDone={() => setAnswered(true)}
                />
                <div className="rv-next">
                  <button className="lp-next" disabled={!answered} onClick={() => setRound(round + 1)}>
                    next card →
                  </button>
                  <button className="chip" onClick={() => setRound(round + 1)} disabled={answered}>
                    skip
                  </button>
                </div>
              </>
            ) : (
              <div className="rv-empty">
                <p>Nothing due in this selection. Cards you got right come back after 1, 3, 7 and 21 days.</p>
                <button className="chip" onClick={() => setAhead(true)}>
                  practise ahead anyway
                </button>
              </div>
            ))}
        </div>
      </aside>
      {rv.tab === 'coverage' && <CoverageSheet onDrill={(topic, slide) => setRv({ tab: 'drill', topic, from: slide, to: slide, area: null })} onClose={() => setRv({ tab: 'drill' })} />}
      {rv.tab === 'exam' && <ExamSheet filter={filter} onClose={() => setRv({ tab: 'drill' })} />}
    </>
  )
}
