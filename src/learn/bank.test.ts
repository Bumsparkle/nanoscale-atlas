import { describe, expect, it } from 'vitest'
import { FACT_FILE, FACTS, FACT_BY_ID, QUESTIONS, QUESTIONS_FOR_FACT } from './bank'
import { CONTENT_BY_ID } from '../chapters/cmos/content'

describe('fact inventory (content/topic2/facts.json)', () => {
  it('covers all 49 slides', () => {
    const slides = new Set(FACTS.map((f) => f.source.slide))
    for (let s = 1; s <= 49; s++) expect(slides.has(s), `slide ${s} has no fact`).toBe(true)
  })
  it('fact ids are unique and match their slide', () => {
    expect(new Set(FACTS.map((f) => f.id)).size).toBe(FACTS.length)
    for (const f of FACTS) expect(f.id.slice(1, 3), f.id).toBe(String(f.source.slide).padStart(2, '0'))
  })
  it('numbers, fab steps and rules are all marked key', () => {
    for (const f of FACTS) if (f.kind === 'number' || f.kind === 'process-step' || f.kind === 'rule') expect(f.key, f.id).toBe(true)
  })
  it('fact objects exist as content', () => {
    for (const f of FACTS) for (const o of f.objects) expect(CONTENT_BY_ID[o], `${f.id} → ${o}`).toBeTruthy()
  })
  it('lists the slides that could not be read fully', () => {
    expect(FACT_FILE.unreadable.length).toBeGreaterThan(0)
  })
})

describe('question bank', () => {
  it('question ids are unique', () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length)
  })
  it('every question points at real facts, and its slide is one of theirs', () => {
    for (const q of QUESTIONS) {
      for (const id of q.factIds) expect(FACT_BY_ID[id], `${q.id} → ${id}`).toBeTruthy()
      expect(q.factIds.some((id) => FACT_BY_ID[id].source.slide === q.source.slide), `${q.id} slide ${q.source.slide}`).toBe(true)
    }
  })
  it('every fact has at least one question', () => {
    const missing = FACTS.filter((f) => QUESTIONS_FOR_FACT[f.id].length === 0).map((f) => f.id)
    expect(missing).toEqual([])
  })
  it('every key fact has at least two questions of different types', () => {
    const weak = FACTS.filter((f) => f.key)
      .filter((f) => new Set(QUESTIONS_FOR_FACT[f.id].map((q) => q.type)).size < 2)
      .map((f) => `${f.id}: ${QUESTIONS_FOR_FACT[f.id].map((q) => q.type).join(',') || 'none'}`)
    expect(weak).toEqual([])
  })
  it('object references, hint highlights and label answers are real content', () => {
    for (const q of QUESTIONS) {
      if (q.objectRef) expect(CONTENT_BY_ID[q.objectRef], `${q.id} objectRef`).toBeTruthy()
      for (const h of q.hints) if (h.highlight) expect(CONTENT_BY_ID[h.highlight], `${q.id} hint`).toBeTruthy()
      if (q.type === 'label') for (const o of q.answer.objects) expect(CONTENT_BY_ID[o], `${q.id} → ${o}`).toBeTruthy()
    }
  })
  it('multiple-choice answers are in range and options unique', () => {
    for (const q of QUESTIONS) {
      if ((q.type === 'recall' && 'options' in q.answer) || q.type === 'predict') {
        const a = q.answer as { options: string[]; correct: number }
        expect(a.correct, q.id).toBeLessThan(a.options.length)
        expect(new Set(a.options).size, q.id).toBe(a.options.length)
      }
    }
  })
  it('label hints never highlight the answer', () => {
    for (const q of QUESTIONS) if (q.type === 'label') for (const h of q.hints) expect(q.answer.objects.includes(h.highlight ?? ''), q.id).toBe(false)
  })
})
