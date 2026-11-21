import { useEffect, useRef, useState } from 'react'
import type { Question } from '../schema'
import { checkTarget, grade, type Response } from '../engine'
import { driveScene } from '../drive'
import { useAtlas } from '../../state/store'
import { layoutState } from '../../chapters/cmos/layout'
import { CONTENT_BY_ID } from '../../chapters/cmos/content'
import { sound } from '../../ui/sound'
import { SourceButton } from '../../ui/source/Source'

/**
 * One question of any type. "do" watches the live store and layout; "label"
 * watches what you click in the model; "predict" plays the reveal after you
 * commit. Two tries: a wrong answer shows a hint and outlines part of the
 * model, a second wrong answer opens the worked solution. "Stuck? get a hint"
 * spends the first try. Predict gets one try (the reveal is the answer).
 * Reports the first outcome once (for Leitner): 'peeked' when it was right
 * but the step text had been re-opened, which doesn't count as mastered.
 */
export type Outcome = 'right' | 'wrong' | 'peeked'
const TYPE_LABEL: Record<Question['type'], string> = {
  do: 'do it on the model',
  predict: 'predict, then watch',
  calc: 'calculate',
  label: 'find it on the model',
  recall: 'recall',
}
export const TRIES = 2

export function parseNumber(s: string): number {
  const t = s.trim().replace(/\s+/g, '').replace(/,/g, '.').replace(/[×x*]10\^?/i, 'e').replace(/⁻/g, '-').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (d) => String('⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(d)))
  return t === '' ? NaN : Number(t)
}


type Status = 'setup' | 'open' | 'revealing' | 'right' | 'wrong' | 'failed'

export function QuestionCard({
  q,
  onFirst,
  onDone,
  autoScene = true,
  peeked = false,
}: {
  q: Question
  onFirst: (o: Outcome) => void
  onDone: () => void
  autoScene?: boolean
  /** the step text was re-opened while answering: a right answer won't count as mastered */
  peeked?: boolean
}) {
  const [status, setStatus] = useState<Status>(autoScene && q.scene ? 'setup' : 'open')
  const [tries, setTries] = useState(0)
  const [choice, setChoice] = useState<number | null>(null)
  const [ruledOut, setRuledOut] = useState<number[]>([])
  const [text, setText] = useState('')
  const [solution, setSolution] = useState(false)
  const [lastClick, setLastClick] = useState<string | null>(null)
  const first = useRef<Outcome | null>(null)
  const done = useRef(false)
  const peekRef = useRef(peeked)
  peekRef.current = peeked
  const st = () => useAtlas.getState()

  const report = (correct: boolean) => {
    if (first.current == null) {
      first.current = correct ? (peekRef.current ? 'peeked' : 'right') : 'wrong'
      onFirst(first.current)
    }
  }
  const finish = () => {
    if (!done.current) {
      done.current = true
      onDone()
    }
  }
  const hintFor = (n: number) => q.hints[Math.min(Math.max(0, n - 1), q.hints.length - 1)]
  const solved = useRef(false)
  const succeed = () => {
    // store writes below re-trigger the live checks; solve exactly once
    if (solved.current) return
    solved.current = true
    report(true)
    setStatus('right')
    st().set({ hint: null, quiz: false })
    sound.click(0.8)
    finish()
  }
  // point at the model: the hint's own highlight, or the object the question is about (never a label answer)
  const outline = (n: number) => st().set({ hint: hintFor(n).highlight ?? (q.type === 'label' ? null : q.objectRef) })
  const showSolution = () => {
    report(false)
    setSolution(true)
    solved.current = true
    setStatus('failed')
    st().set({ quiz: false, hint: q.type === 'label' ? q.answer.objects[0] : q.objectRef })
    finish()
  }
  /** a wrong answer, or "get a hint": spends a try */
  const miss = () => {
    report(false)
    const n = tries + 1
    setTries(n)
    if (n >= TRIES) return showSolution()
    setStatus('wrong')
    outline(n)
  }

  // set up the scene, then open the question
  useEffect(() => {
    let live = true
    st().set({ hint: null, focus: null, quiz: q.type !== 'do' })
    if (autoScene && q.scene) driveScene(q.scene).then(() => live && setStatus('open'))
    return () => {
      live = false
      st().set({ hint: null, quiz: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.id])

  const answerable = status === 'open' || status === 'wrong'

  // "do": watch the real state
  useEffect(() => {
    if (q.type !== 'do' || !answerable) return
    const check = () => {
      if (checkTarget(q.answer.target, st(), layoutState.get())) succeed()
    }
    check()
    const a = useAtlas.subscribe(check)
    const b = layoutState.subscribe(check)
    return () => (a(), b())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.id, answerable])

  // "label": watch what gets clicked in the model
  useEffect(() => {
    if (q.type !== 'label' || !answerable) return
    return useAtlas.subscribe((s, p) => {
      if (!s.focus || s.focus === p.focus) return
      const obj = s.focus
      setLastClick(obj)
      if (grade(q, { kind: 'click', object: obj }, s, layoutState.get())) succeed()
      else {
        miss()
        // let the camera settle back; the wrong part is not the answer
        setTimeout(() => useAtlas.getState().set({ focus: null }), 350)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.id, answerable, tries])

  const submit = (r: Response) => {
    if (!answerable) return
    if (grade(q, r, st(), layoutState.get())) succeed()
    else miss()
  }

  const choose = (i: number) => {
    if (!answerable || ruledOut.includes(i)) return
    setChoice(i)
    if (q.type === 'predict') {
      setStatus('revealing')
      st().set({ quiz: false })
      void driveScene(q.answer.reveal, { animate: true })
      setTimeout(() => {
        if (i === q.answer.correct) succeed()
        else {
          // the reveal has shown the answer: one try only
          report(false)
          setTries(TRIES)
          showSolution()
        }
      }, 1300)
    } else if (q.type === 'recall' && 'options' in q.answer && i !== q.answer.correct) {
      setRuledOut((r) => [...r, i])
      miss()
    } else submit({ kind: 'choice', index: i })
  }

  const showMe = () => {
    if (q.type === 'do') void driveScene(q.answer.solve, { animate: true })
    if (q.type === 'predict') void driveScene(q.answer.reveal, { animate: true })
  }

  const options = q.type === 'predict' ? q.answer.options : q.type === 'recall' && 'options' in q.answer ? q.answer.options : null
  const correctIndex = q.type === 'predict' ? q.answer.correct : q.type === 'recall' && 'options' in q.answer ? q.answer.correct : -1
  const over = status === 'right' || status === 'failed'
  const hint = status === 'wrong' ? hintFor(tries) : null
  const triesLeft = TRIES - tries

  return (
    <section className={'qcard qcard-' + status} aria-label="Question" data-testid="question" data-qid={q.id} data-qtype={q.type}>
      <header className="qcard-head">
        <span className={'qtype qtype-' + q.type}>{TYPE_LABEL[q.type]}</span>
        <SourceButton refs={[q.source]} />
        <span className="qdiff" aria-label={`difficulty ${q.difficulty} of 3`}>
          {[1, 2, 3].map((d) => (
            <i key={d} className={d <= q.difficulty ? 'on' : ''} />
          ))}
        </span>
      </header>
      <p className="qprompt">{q.prompt}</p>

      {options && (
        <ol className="qopts" role="list">
          {options.map((o, i) => {
            const state = over ? (i === correctIndex ? 'ok' : i === choice ? 'no' : '') : status === 'revealing' && i === choice ? 'picked' : ruledOut.includes(i) ? 'no' : ''
            return (
              <li key={i}>
                <button className={'qopt ' + state} disabled={!answerable || ruledOut.includes(i)} onClick={() => choose(i)}>
                  <span className="qkey mono">{String.fromCharCode(65 + i)}</span>
                  {o}
                </button>
              </li>
            )
          })}
        </ol>
      )}

      {(q.type === 'calc' || (q.type === 'recall' && 'accept' in q.answer)) && (
        <form
          className="qinput"
          onSubmit={(e) => {
            e.preventDefault()
            submit(q.type === 'calc' ? { kind: 'number', value: parseNumber(text) } : { kind: 'text', text })
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={over}
            inputMode={q.type === 'calc' ? 'decimal' : 'text'}
            placeholder={q.type === 'calc' ? 'number, e.g. 1.6e-3' : 'your answer'}
            aria-label="Your answer"
            autoFocus
          />
          {q.type === 'calc' && <span className="qunit mono">{q.answer.unit}</span>}
          <button className="qcheck" disabled={over || !text.trim()}>
            Check
          </button>
        </form>
      )}

      {q.type === 'do' && !over && (
        <p className="qwatch mono" aria-live="polite">
          <i className="qpulse" /> {status === 'setup' ? 'setting up the model…' : 'watching the model: do it with the controls'}
        </p>
      )}
      {q.type === 'label' && !over && (
        <p className="qwatch mono" aria-live="polite">
          <i className="qpulse" /> {status === 'setup' ? 'setting up the model…' : lastClick && status === 'wrong' ? `that was ${CONTENT_BY_ID[lastClick]?.title ?? 'not it'}` : 'click a part of the model'}
        </p>
      )}
      {status === 'revealing' && (
        <p className="qwatch mono">
          <i className="qpulse" /> watch the model…
        </p>
      )}

      {status === 'right' && (
        <p className="qresult ok" role="status">
          Correct{first.current === 'peeked' ? ' (with a peek, so it will come back in Revise)' : ''}. {q.type === 'predict' ? q.answer.result : ''}
        </p>
      )}
      {status === 'wrong' && hint && (
        <div className="qresult no" role="status" data-testid="hint">
          <p>
            {lastClick || choice != null || text ? 'Not yet. ' : ''}
            {triesLeft === 1 ? 'One more try.' : `${triesLeft} tries left.`}
          </p>
          <p className="qhint">
            <span className="eyebrow">hint</span> {hint.text}
            {(hint.highlight || (q.type !== 'label' && q.objectRef)) && <span className="qhint-mark"> · outlined on the model</span>}
          </p>
        </div>
      )}
      {status === 'failed' && (
        <p className="qresult no" role="status">
          {q.type === 'predict' && choice != null ? `Not quite. ${q.answer.result}` : 'Here is how it works.'}
        </p>
      )}

      {over ? (
        <div className="qsolution" data-testid="solution">
          <p className="eyebrow">worked solution</p>
          <p>{q.workedSolution}</p>
          {q.type === 'calc' && (
            <p className="mono qanswer">
              = {q.answer.value} {q.answer.unit}
            </p>
          )}
          {(q.type === 'do' || q.type === 'predict') && solution && (
            <button className="chip" onClick={showMe}>
              show me on the model
            </button>
          )}
        </div>
      ) : status === 'wrong' ? (
        <button className="qreveal" onClick={showSolution}>
          show the worked solution
        </button>
      ) : (
        q.type !== 'predict' && (
          <button className="qreveal" onClick={miss} disabled={status !== 'open'}>
            stuck? get a hint
          </button>
        )
      )}
    </section>
  )
}
