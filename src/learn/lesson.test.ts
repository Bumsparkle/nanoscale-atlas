import { beforeEach, describe, expect, it } from 'vitest'
import { POSITIONS, SECTIONS as ALL_SECTIONS, sectionMinutes, STEPS as ALL_STEPS, wordCount, STEP_BY_ID } from './lesson'
import { FACT_BY_ID, FACTS, QUESTION_BY_ID } from './bank'
import { applySceneNow, checkTarget, correctResponse, grade } from './engine'
import { CONTENT_BY_ID } from '../chapters/cmos/content'
import { useAtlas, type AtlasState } from '../state/store'
import { layoutState } from '../chapters/cmos/layout'
import type { Question } from './schema'

const initial = useAtlas.getState()
const store = { getState: () => useAtlas.getState(), setState: (p: Partial<AtlasState>) => useAtlas.setState(p) }
beforeEach(() => {
  useAtlas.setState({ ...initial, page: 'atlas' }, true)
  layoutState.reset()
})

/** the old slide-by-slide lesson this one replaced: 51 chunks, 1,662 words, 51 questions */
const OLD = { words: 1662, checks: 51 }
const MODEL = new Set(['do', 'predict', 'label', 'calc'])
const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9µλ.+−-]+/g, ' ').replace(/\s+/g, ' ').trim()
const grams = (t: string, n = 4) => {
  const w = norm(t).split(' ')
  const out = new Set<string>()
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(' '))
  return out
}
const answerText = (q: Question): string[] => {
  if (q.type === 'predict') return [q.answer.options[q.answer.correct]]
  if (q.type === 'recall') return 'options' in q.answer ? [q.answer.options[q.answer.correct]] : q.answer.accept
  return []
}
const SECTIONS = ALL_SECTIONS.filter((s) => s.chapter === 'ch1')
const STEPS = ALL_STEPS.filter((s) => s.chapter === 'ch1')
const Q = (id: string) => {
  const q = QUESTION_BY_ID[id]
  if (!q) throw new Error(`no question ${id}`)
  return q
}

describe('the Topic 2 lesson', () => {
  it('has 12–15 sections of 3–6 steps, with unique ids', () => {
    expect(SECTIONS.length).toBeGreaterThanOrEqual(12)
    expect(SECTIONS.length).toBeLessThanOrEqual(15)
    for (const s of SECTIONS) expect(s.steps.length, s.id).toBeGreaterThanOrEqual(3)
    expect(new Set(SECTIONS.map((s) => s.id)).size).toBe(SECTIONS.length)
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(STEPS.length)
    expect(new Set(POSITIONS).size).toBe(POSITIONS.length)
  })
  it('is at least as long as the slide-by-slide lesson it replaced', () => {
    const words = SECTIONS.reduce((n, s) => n + wordCount(s.intro) + s.steps.reduce((m, st) => m + wordCount(st.text) + wordCount(st.example?.text ?? ''), 0), 0)
    const checks = STEPS.reduce((n, s) => n + s.checks.length, 0)
    expect(words).toBeGreaterThanOrEqual(OLD.words)
    expect(checks).toBeGreaterThanOrEqual(OLD.checks)
  })
  it('teaches every fact in the inventory', () => {
    const taught = new Set(STEPS.flatMap((s) => s.factIds))
    const missing = FACTS.filter((f) => f.source.topic === 'topic2' && !taught.has(f.id)).map((f) => f.id)
    expect(missing).toEqual([])
  })
  it('each section takes about 5–10 minutes', () => {
    for (const s of SECTIONS) {
      const m = sectionMinutes(s)
      expect(m, `${s.id}: ${m.toFixed(1)} min`).toBeGreaterThanOrEqual(5)
      expect(m, `${s.id}: ${m.toFixed(1)} min`).toBeLessThanOrEqual(10)
    }
  })
  it('steps reference real facts, looks and slides', () => {
    for (const st of STEPS) {
      for (const f of st.factIds) expect(FACT_BY_ID[f], `${st.id} → ${f}`).toBeTruthy()
      if (st.scene.look) expect(CONTENT_BY_ID[st.scene.look], st.id).toBeTruthy()
      for (const r of st.sources) expect(r.slide).toBeLessThanOrEqual(49)
      for (const id of st.related) expect(STEP_BY_ID[id], `${st.id} → ${id}`).toBeTruthy()
    }
  })
  it('one check per step, two only when one is a calculation; checks test only what the step taught', () => {
    for (const st of STEPS) {
      if (st.checks.length === 2) expect(st.checks.some((id) => Q(id).type === 'calc'), st.id).toBe(true)
      for (const id of st.checks) for (const f of Q(id).factIds) expect(st.factIds, `${st.id}: ${id} tests ${f}`).toContain(f)
    }
  })
  it('at least half of each section’s checks use the model (do, predict, label, calc)', () => {
    for (const s of SECTIONS) {
      const ids = [...s.steps.flatMap((st) => st.checks), ...s.review]
      const model = ids.filter((id) => MODEL.has(Q(id).type)).length
      expect(model / ids.length, `${s.id}: ${model}/${ids.length}`).toBeGreaterThanOrEqual(0.5)
    }
  })
  it('no check can be answered by matching words in its step', () => {
    for (const st of STEPS) {
      const text = `${st.title} ${st.text} ${st.example?.text ?? ''}`
      const nt = ` ${norm(text)} `
      const tg = grams(text)
      for (const id of st.checks) {
        const q = Q(id)
        for (const a of answerText(q)) {
          const na = norm(a)
          if (na.split(' ').length >= 2 || na.length > 6) expect(nt.includes(` ${na} `), `${id}: “${a}” appears in ${st.id}`).toBe(false)
          for (const g of grams(a)) expect(tg.has(g), `${id}: “${g}” appears in ${st.id}`).toBe(false)
        }
        if (q.type === 'calc') {
          const nums = text.match(/\d+(?:[.,]\d+)?/g)?.map((n) => Number(n.replace(',', ''))) ?? []
          expect(nums.includes(q.answer.value), `${id}: ${q.answer.value} stated in ${st.id}`).toBe(false)
        }
      }
    }
  })
  it('reviews mix this section with earlier ones and never repeat a step check', () => {
    const checks = new Set(STEPS.flatMap((s) => s.checks))
    const earlierFacts = new Set<string>()
    for (const [i, s] of SECTIONS.entries()) {
      const mine = new Set(s.steps.flatMap((st) => st.factIds))
      for (const id of s.review) expect(checks.has(id), `${s.id} review repeats ${id}`).toBe(false)
      expect(s.review.some((id) => Q(id).factIds.some((f) => mine.has(f))), `${s.id}: no review of this section`).toBe(true)
      if (i > 0) expect(s.review.some((id) => Q(id).factIds.some((f) => earlierFacts.has(f))), `${s.id}: no review of earlier sections`).toBe(true)
      for (const id of s.review) for (const f of Q(id).factIds) expect(mine.has(f) || earlierFacts.has(f), `${s.id}: review ${id} tests ${f}, not yet taught`).toBe(true)
      mine.forEach((f) => earlierFacts.add(f))
    }
  })
  it('can be completed start to finish against live state', () => {
    for (const s of SECTIONS) {
      const ids = [...s.steps.flatMap((st) => st.checks.map((id) => [st.scene, id] as const)), ...s.review.map((id) => [undefined, id] as const)]
      for (const [scene, id] of ids) {
        if (scene) applySceneNow(scene, store)
        const q = Q(id)
        if (q.scene) applySceneNow(q.scene, store)
        if (q.type === 'do') {
          expect(checkTarget(q.answer.target, useAtlas.getState(), layoutState.get()), `${id} pre-solved`).toBe(false)
          applySceneNow(q.answer.solve, store)
        }
        expect(grade(q, correctResponse(q), useAtlas.getState(), layoutState.get()), id).toBe(true)
      }
    }
  })
  it('label answers and hint highlights are objects in the model', () => {
    for (const st of STEPS)
      for (const id of st.checks) {
        const q = Q(id)
        if (q.type === 'label') for (const o of q.answer.objects) expect(CONTENT_BY_ID[o], `${id} → ${o}`).toBeTruthy()
        for (const h of q.hints) if (h.highlight) expect(CONTENT_BY_ID[h.highlight], `${id} hint → ${h.highlight}`).toBeTruthy()
        if (q.type === 'label') for (const h of q.hints) expect(q.answer.objects, `${id} hint gives it away`).not.toContain(h.highlight)
      }
  })
})

/** the same rules for the Chapter 2 (Topic 3) and Chapter 3 (Topic 4) lessons */
for (const [ch, topic] of [['ch2', 'topic3'], ['ch3', 'topic4'], ['ch4', 'topic5'], ['ch5', 'topic6'], ['ch6', 'topic7'], ['ch7', 'topic8']] as const) {
  describe(`the ${topic} lesson (${ch})`, () => {
    const secs = ALL_SECTIONS.filter((s) => s.chapter === ch)
    const steps = ALL_STEPS.filter((s) => s.chapter === ch)
    it('has sections of 3–6 steps', () => {
      expect(secs.length).toBeGreaterThanOrEqual(5)
      for (const s of secs) expect(s.steps.length, s.id).toBeGreaterThanOrEqual(3)
    })
    it('teaches every fact of its inventory', () => {
      const taught = new Set(steps.flatMap((s) => s.factIds))
      expect(FACTS.filter((f) => f.source.topic === topic && !taught.has(f.id)).map((f) => f.id)).toEqual([])
    })
    it('each section takes about 5–10 minutes', () => {
      for (const s of secs) {
        const m = sectionMinutes(s)
        expect(m, `${s.id}: ${m.toFixed(1)}`).toBeGreaterThanOrEqual(5)
        expect(m, `${s.id}: ${m.toFixed(1)}`).toBeLessThanOrEqual(10)
      }
    })
    it('checks test only what their step taught; two only with a calculation', () => {
      for (const st of steps) {
        if (st.checks.length === 2) expect(st.checks.some((id) => Q(id).type === 'calc'), st.id).toBe(true)
        for (const id of st.checks) for (const f of Q(id).factIds) expect(st.factIds, `${st.id}: ${id} tests ${f}`).toContain(f)
        for (const id of st.related) expect(STEP_BY_ID[id]?.chapter, `${st.id} → ${id}`).toBe('ch1')
      }
    })
    it('at least half of each section’s checks use the model (do, predict, label, calc)', () => {
      for (const s of secs) {
        const ids = [...s.steps.flatMap((st) => st.checks), ...s.review]
        const model = ids.filter((id) => MODEL.has(Q(id).type)).length
        expect(model / ids.length, `${s.id}: ${model}/${ids.length}`).toBeGreaterThanOrEqual(0.5)
      }
    })
    it('no check can be answered by matching words in its step', () => {
      for (const st of steps) {
        const text = `${st.title} ${st.text} ${st.example?.text ?? ''}`
        const nt = ` ${norm(text)} `
        const tg = grams(text)
        for (const id of st.checks) {
          const q = Q(id)
          for (const a of answerText(q)) {
            const na = norm(a)
            if (na.split(' ').length >= 2 || na.length > 6) expect(nt.includes(` ${na} `), `${id}: “${a}” appears in ${st.id}`).toBe(false)
            for (const g of grams(a)) expect(tg.has(g), `${id}: “${g}” appears in ${st.id}`).toBe(false)
          }
          if (q.type === 'calc') {
            const nums = text.match(/\d+(?:[.,]\d+)?/g)?.map((n) => Number(n.replace(',', ''))) ?? []
            expect(nums.includes(q.answer.value), `${id}: ${q.answer.value} stated in ${st.id}`).toBe(false)
          }
        }
      }
    })
    it('reviews mix the section with earlier ones and never repeat a step check', () => {
      const checks = new Set(steps.flatMap((s) => s.checks))
      const earlier = new Set<string>()
      for (const [i, s] of secs.entries()) {
        const mine = new Set(s.steps.flatMap((st) => st.factIds))
        for (const id of s.review) expect(checks.has(id), `${s.id} review repeats ${id}`).toBe(false)
        expect(s.review.some((id) => Q(id).factIds.some((f) => mine.has(f))), `${s.id}: no review of this section`).toBe(true)
        if (i > 0) expect(s.review.some((id) => Q(id).factIds.some((f) => earlier.has(f))), `${s.id}: no earlier review`).toBe(true)
        for (const id of s.review) for (const f of Q(id).factIds) expect(mine.has(f) || earlier.has(f), `${s.id}: ${id} tests ${f} not yet taught`).toBe(true)
        mine.forEach((f) => earlier.add(f))
      }
    })
    it('can be completed start to finish against live state', () => {
      for (const s of secs) {
        const ids = [...s.steps.flatMap((st) => st.checks.map((id) => [st.scene, id] as const)), ...s.review.map((id) => [undefined, id] as const)]
        for (const [scene, id] of ids) {
          if (scene) applySceneNow(scene, store)
          const q = Q(id)
          if (q.scene) applySceneNow(q.scene, store)
          if (q.type === 'do') {
            expect(checkTarget(q.answer.target, useAtlas.getState(), layoutState.get()), `${id} pre-solved`).toBe(false)
            applySceneNow(q.answer.solve, store)
          }
          expect(grade(q, correctResponse(q), useAtlas.getState(), layoutState.get()), id).toBe(true)
        }
      }
    })
  })
}
