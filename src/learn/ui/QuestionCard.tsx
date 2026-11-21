import { useEffect, useRef, useState } from 'react'
import type { Question } from '../schema'
import { checkTarget, grade, type Response } from '../engine'
import { driveScene } from '../drive'
import { useAtlas } from '../../state/store'
import { layoutState } from '../../chapters/cmos/layout'
import { CONTENT_BY_ID } from '../../chapters/cmos/content'
import { sound } from '../../ui/sound'

/**
 * One question of any type. "do" watches the live store and layout; "label"
 * watches what you click in the model; "predict" plays the reveal after you
 * commit. Reports the first outcome once (for Leitner), then "done" when
 * the question is solved or its worked solution has been opened.
 */
const TYPE_LABEL: Record<Question['type'], string> = {
  do: 'do it on the model',
  predict: 'predict, then watch',
  calc: 'calculate',
  label: 'find it on the model',
  recall: 'recall',
}

export function parseNumber(s: string): number {
  const t = s.trim().replace(/\s+/g, '').replace(/,/g, '.').replace(/[×x*]10\^?/i, 'e').replace(/⁻/g, '-').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (d) => String('⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(d)))
  return t === '' ? NaN : Number(t)
}

type Status = 'setup' | 'open' | 'revealing' | 'right' | 'wrong'

export function QuestionCard({ q, onFirst, onDone, autoScene = true }: { q: Question; onFirst: (correct: boolean) => void; onDone: () => void; autoScene?: boolean }) {
  const [status, setStatus] = useState<Status>(autoScene && q.scene ? 'setup' : 'open')
  const [wrong, setWrong] = useState(0)
  const [choice, setChoice] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [solution, setSolution] = useState(false)
  const [lastClick, setLastClick] = useState<string | null>(null)
  const first = useRef<boolean | null>(null)
  const done = useRef(false)
  const st = () => useAtlas.getState()

  const report = (correct: boolean) => {
    if (first.current == null) {
      first.current = correct
      onFirst(correct)
    }
  }
  const finish = () => {
    if (!done.current) {
      done.current = true
      onDone()
    }
  }
  const hintFor = (n: number) => q.hints[Math.min(n - 1, q.hints.length - 1)]
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
  const fail = () => {
    report(false)
    const n = wrong + 1
    setWrong(n)
    setStatus('wrong')
    const h = hintFor(n)
    // point at the model: the hint's own highlight, or the object the question is about (never a label answer)
    st().set({ hint: h.highlight ?? (q.type === 'label' ? null : q.objectRef) })
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

  // "do": watch the real state
  useEffect(() => {
    if (q.type !== 'do' || status === 'setup' || status === 'right') return
    const check = () => {
      if (checkTarget(q.answer.target, st(), layoutState.get())) succeed()
    }
    check()
    const a = useAtlas.subscribe(check)
    const b = layoutState.subscribe(check)
    return () => (a(), b())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.id, status])

  // "label": watch what gets clicked in the model
  useEffect(() => {
    if (q.type !== 'label' || status === 'setup' || status === 'right') return
    return useAtlas.subscribe((s, p) => {
      if (!s.focus || s.focus === p.focus) return
      const obj = s.focus
      setLastClick(obj)
      if (grade(q, { kind: 'click', object: obj }, s, layoutState.get())) succeed()
      else {
        fail()
        // let the camera settle back; the wrong part is not the answer
        setTimeout(() => useAtlas.getState().set({ focus: null }), 350)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.id, status, wrong])

  const submit = (r: Response) => {
    if (status === 'right' || status === 'setup' || status === 'revealing') return
    if (grade(q, r, st(), layoutState.get())) succeed()
    else fail()
  }

  const choose = (i: number) => {
    if (status === 'right' || status === 'revealing' || status === 'setup') return
    setChoice(i)
    if (q.type === 'predict') {
      setStatus('revealing')
      st().set({ quiz: false })
      void driveScene(q.answer.reveal, { animate: true })
      setTimeout(() => {
        if (i === q.answer.correct) succeed()
        else {
          fail()
          // the reveal has shown the answer: the question is done either way
          finish()
        }
      }, 1300)
    } else submit({ kind: 'choice', index: i })
  }

  const openSolution = () => {
    report(false)
    setSolution(true)
    st().set({ quiz: false, hint: q.type === 'label' ? q.answer.objects[0] : q.objectRef })
    finish()
  }

  const showMe = () => {
    if (q.type === 'do') void driveScene(q.answer.solve, { animate: true })
    if (q.type === 'predict') void driveScene(q.answer.reveal, { animate: true })
  }

  const options = q.type === 'predict' ? q.answer.options : q.type === 'recall' && 'options' in q.answer ? q.answer.options : null
  const correctIndex = q.type === 'predict' ? q.answer.correct : q.type === 'recall' && 'options' in q.answer ? q.answer.correct : -1
  const locked = status === 'right' || status === 'revealing' || (q.type === 'predict' && choice != null) || solution
  const hint = status === 'wrong' ? hintFor(wrong) : null

  return (
    <section className={'qcard qcard-' + status} aria-label="Question" data-testid="question" data-qid={q.id} data-qtype={q.type}>
      <header className="qcard-head">
        <span className={'qtype qtype-' + q.type}>{TYPE_LABEL[q.type]}</span>
        <span className="slide-ref">slide {q.slide}</span>
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
            const state = locked && (status === 'right' || solution || status === 'wrong' || status === 'revealing') ? (i === correctIndex && status !== 'revealing' ? 'ok' : i === choice ? (status === 'revealing' ? 'picked' : 'no') : '') : i === choice && status === 'wrong' ? 'no' : ''
            return (
              <li key={i}>
                <button className={'qopt ' + state} disabled={locked || status === 'setup'} onClick={() => choose(i)}>
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
            disabled={status === 'right' || solution}
            inputMode={q.type === 'calc' ? 'decimal' : 'text'}
            placeholder={q.type === 'calc' ? 'number, e.g. 1.6e-3' : 'your answer'}
            aria-label="Your answer"
            autoFocus
          />
          {q.type === 'calc' && <span className="qunit mono">{q.answer.unit}</span>}
          <button className="qcheck" disabled={status === 'right' || solution || !text.trim()}>
            Check
          </button>
        </form>
      )}

      {q.type === 'do' && status !== 'right' && (
        <p className="qwatch mono" aria-live="polite">
          <i className="qpulse" /> {status === 'setup' ? 'setting up the model…' : 'watching the model: do it with the controls'}
        </p>
      )}
      {q.type === 'label' && status !== 'right' && (
        <p className="qwatch mono" aria-live="polite">
          <i className="qpulse" /> {status === 'setup' ? 'setting up the model…' : lastClick && status === 'wrong' ? `that was ${CONTENT_BY_ID[lastClick]?.title ?? 'not it'}` : 'click a part of the model'}
        </p>
      )}
      {status === 'revealing' && <p className="qwatch mono"><i className="qpulse" /> watch the model…</p>}

      {status === 'right' && (
        <p className="qresult ok" role="status">
          Correct. {q.type === 'predict' ? q.answer.result : ''}
        </p>
      )}
      {status === 'wrong' && hint && (
        <div className="qresult no" role="status">
          <p>{q.type === 'predict' ? `Not quite. ${q.answer.result}` : 'Not yet.'}</p>
          <p className="qhint">
            <span className="eyebrow">hint</span> {hint.text}
            {(hint.highlight || (q.type !== 'label' && q.objectRef)) && <span className="qhint-mark"> · outlined on the model</span>}
          </p>
        </div>
      )}

      {(solution || status === 'right' || (q.type === 'predict' && status === 'wrong')) ? (
        <div className="qsolution">
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
      ) : (
        <button className="qreveal" onClick={openSolution} disabled={status === 'setup'}>
          {wrong >= 1 ? 'show the worked solution' : 'stuck? show the worked solution'}
        </button>
      )}
    </section>
  )
}
