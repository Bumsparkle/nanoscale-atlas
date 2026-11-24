import { useEffect, useMemo, useState } from 'react'
import { useAtlas } from '../../state/store'
import { examPaper, EXAM_MINUTES, MAKE_MINUTES, MAKE_TOPICS, paperTitle, processingPaper, progress, type Filter } from '../progress'
import { grade } from '../engine'
import { realise, sci } from '../calcs'
import { layoutState } from '../../chapters/cmos/layout'
import { parseNumber } from './QuestionCard'
import type { Question } from '../schema'
import { SourceButton } from '../../ui/source/Source'

type Ans = { choice?: number; text?: string }

/**
 * A timed exam paper: 20 minutes, mixed calc and recall, one mark each.
 * Marked at the end (or when time runs out) with a worked solution per question.
 */
export function ExamSheet({ filter, onClose }: { filter: Filter; onClose: () => void }) {
  const [seed, setSeed] = useState<number | null>(null)
  const [answers, setAnswers] = useState<Record<string, Ans>>({})
  const [make, setMake] = useState(false)
  const minutes = make ? MAKE_MINUTES : EXAM_MINUTES
  const [left, setLeft] = useState(EXAM_MINUTES * 60)
  const [marked, setMarked] = useState(false)
  const set = useAtlas((s) => s.set)
  const paper = useMemo(() => (seed == null ? [] : (make ? processingPaper(seed) : examPaper(seed, filter)).map((q, i) => realise(q, seed + i + 1))), [seed, make]) // eslint-disable-line react-hooks/exhaustive-deps

  const respond = (q: Question, a: Ans) => {
    if (q.type === 'calc') return grade(q, { kind: 'number', value: parseNumber(a.text ?? '') }, useAtlas.getState(), layoutState.get())
    if (q.type === 'recall' && 'options' in q.answer) return grade(q, { kind: 'choice', index: a.choice ?? -1 }, useAtlas.getState(), layoutState.get())
    return grade(q, { kind: 'text', text: a.text ?? '' }, useAtlas.getState(), layoutState.get())
  }
  const submit = () => {
    if (marked) return
    for (const q of paper) progress.record(q.id, respond(q, answers[q.id] ?? {}))
    set({ progressVersion: useAtlas.getState().progressVersion + 1 })
    setMarked(true)
  }

  useEffect(() => {
    if (seed == null || marked) return
    const t = setInterval(() => setLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [seed, marked])
  useEffect(() => {
    if (left <= 0 && !marked && seed != null) submit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left])

  const score = marked ? paper.filter((q) => respond(q, answers[q.id] ?? {})).length : 0
  const mm = String(Math.max(0, Math.floor(left / 60))).padStart(2, '0')
  const ss = String(Math.max(0, left % 60)).padStart(2, '0')

  return (
    <div className="sheet exam" role="dialog" aria-label="Exam paper">
      <header className="sheet-head">
        <div>
          <p className="eyebrow">revise · exam paper</p>
          <h2>{make ? 'All processing (Topics 2–8) · timed paper' : paperTitle(filter)}</h2>
          <p className="sheet-sub mono">
            {minutes} minutes · {paper.length || (make ? MAKE_TOPICS.length * 4 : 14)} questions · calculations and recall · 1 mark each
            {!make && filter.topic && (filter.from !== 1 || filter.area) && ` · slides ${filter.from}–${filter.to}${filter.area ? ' · ' + filter.area : ''}`}
          </p>
        </div>
        <div className="exam-tools">
          {seed != null && !marked && (
            <span className={'exam-clock mono' + (left < 120 ? ' low' : '')} aria-live="off">
              {mm}:{ss}
            </span>
          )}
          {marked && (
            <span className="exam-score mono">
              {score} / {paper.length}
            </span>
          )}
          <button className="tool" onClick={onClose}>
            close
          </button>
        </div>
      </header>

      {seed == null ? (
        <div className="exam-start">
          <p>Answer on paper-style questions with no model to help. Calculations take a number in the unit shown (scientific notation like 1.6e-3 is fine). When the clock runs out the paper is marked automatically.</p>
          <button className="lp-next" onClick={() => { setMake(false); setLeft(EXAM_MINUTES * 60); setSeed(Date.now() % 2 ** 31) }}>
            start the {EXAM_MINUTES}-minute paper ({filter.topic ? 'this topic' : 'all topics'}) →
          </button>
          <button className="lp-next" onClick={() => { setMake(true); setLeft(MAKE_MINUTES * 60); setSeed(Date.now() % 2 ** 31) }}>
            the whole processing half: Topics 2–8, {MAKE_MINUTES} minutes →
          </button>
        </div>
      ) : (
        <ol className="exam-paper">
          {paper.map((q, n) => {
            const a = answers[q.id] ?? {}
            const ok = marked ? respond(q, a) : null
            return (
              <li key={q.id} className={'exam-q' + (ok === true ? ' ok' : ok === false ? ' no' : '')}>
                <header>
                  <span className="mono exam-n">Q{n + 1}</span>
                  {marked && <SourceButton refs={[q.source]} />}
                  <span className="mono exam-m">[1]</span>
                </header>
                <p className="qprompt">{q.prompt}</p>
                {q.type === 'recall' && 'options' in q.answer ? (
                  <ol className="qopts">
                    {q.answer.options.map((o, i) => (
                      <li key={i}>
                        <button
                          className={'qopt ' + (marked ? (i === (q.answer as { correct: number }).correct ? 'ok' : i === a.choice ? 'no' : '') : a.choice === i ? 'picked' : '')}
                          disabled={marked}
                          onClick={() => setAnswers({ ...answers, [q.id]: { choice: i } })}
                        >
                          <span className="qkey mono">{String.fromCharCode(65 + i)}</span>
                          {o}
                        </button>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="qinput">
                    <input
                      value={a.text ?? ''}
                      disabled={marked}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: { text: e.target.value } })}
                      inputMode={q.type === 'calc' ? 'decimal' : 'text'}
                      aria-label={`Answer to question ${n + 1}`}
                    />
                    {q.type === 'calc' && <span className="qunit mono">{q.answer.unit}</span>}
                  </div>
                )}
                {marked && (
                  <div className="qsolution">
                    <p className="eyebrow">{ok ? 'correct' : 'worked solution'}</p>
                    <p>{q.workedSolution}</p>
                    {q.type === 'calc' && (
                      <p className="mono qanswer">
                        = {sci(q.answer.value, 4)} {q.answer.unit}
                      </p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}
      {seed != null && (
        <footer className="exam-foot">
          {!marked ? (
            <button className="lp-next" onClick={submit}>
              hand in and mark →
            </button>
          ) : (
            <button
              className="lp-next"
              onClick={() => {
                setAnswers({})
                setMarked(false)
                setLeft(minutes * 60)
                setSeed(Date.now() % 2 ** 31)
              }}
            >
              new paper →
            </button>
          )}
        </footer>
      )}
    </div>
  )
}
