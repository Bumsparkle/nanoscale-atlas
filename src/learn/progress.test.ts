import { beforeEach, describe, expect, it } from 'vitest'
import { boxCounts, stepForObject, examPaper, MAKE_TOPICS, processingPaper, factMastered, objectMastery, progress, queue, slideCoverage } from './progress'
import { QUESTIONS, QUESTIONS_FOR_FACT } from './bank'
import { POSITIONS } from './lesson'

const ALL = { from: 1, to: 49, area: null }
beforeEach(() => progress._load({}))

describe('Leitner boxes', () => {
  it('first-try right goes to box 2; each later right moves up; a miss resets to box 1', () => {
    progress.record('q-s30-temp', true, 0)
    expect(progress.card('q-s30-temp')!.box).toBe(2)
    progress.record('q-s30-temp', true, 0)
    progress.record('q-s30-temp', true, 0)
    expect(progress.card('q-s30-temp')!.box).toBe(4)
    progress.record('q-s30-temp', false, 0)
    expect(progress.card('q-s30-temp')!.box).toBe(1)
  })
  it('box 1 cards come back first; promoted cards wait their interval', () => {
    progress.record('q-s30-temp', false, 0)
    progress.record('q-s37-nm', true, 0)
    const q = queue(ALL, 1000)
    expect(q[0].id).toBe('q-s30-temp')
    expect(q.find((x) => x.id === 'q-s37-nm')).toBeUndefined()
    expect(queue(ALL, 1000, true).some((x) => x.id === 'q-s37-nm')).toBe(true)
  })
  it('filters by slide range and topic', () => {
    expect(queue({ topic: 'topic2', from: 47, to: 47, area: null }).every((q) => q.source.slide === 47)).toBe(true)
    const fab = queue({ topic: 'topic2', from: 1, to: 49, area: 'fabrication' })
    expect(fab.length).toBeGreaterThan(20)
    expect(fab.every((q) => q.source.slide >= 24 && q.source.slide <= 45)).toBe(true)
    expect(boxCounts(ALL)[0]).toBe(QUESTIONS.length)
  })
})

describe('mastery', () => {
  it('a fact is mastered once its questions are in high boxes', () => {
    for (const q of QUESTIONS_FOR_FACT['s30-temp']) for (let i = 0; i < 3; i++) progress.record(q.id, true, 0)
    expect(factMastered('s30-temp')).toBe(true)
    const s30 = slideCoverage().find((s) => s.slide === 30)!
    expect(s30.mastered).toBe(1)
    expect(s30.facts).toBe(2)
  })
  it('objects start untested, turn weak after misses, and lead to their lesson step', () => {
    expect(objectMastery('nwell')!.level).toBe('untested')
    for (const q of QUESTIONS.filter((x) => x.factIds.includes('s25-nwell'))) progress.record(q.id, false, 0)
    expect(objectMastery('nwell')!.level).toBe('weak')
    expect(stepForObject('nwell')).toBeTruthy()
    expect(objectMastery('no-such-object')).toBeNull()
  })
})

describe('exam paper', () => {
  it('mixes calc and recall only, stable for a seed', () => {
    const p = examPaper(42, ALL)
    expect(p.length).toBe(14)
    expect(p.every((q) => q.type === 'calc' || q.type === 'recall')).toBe(true)
    expect(p.filter((q) => q.type === 'calc').length).toBeGreaterThanOrEqual(5)
    expect(examPaper(42, ALL).map((q) => q.id)).toEqual(p.map((q) => q.id))
  })
})

describe('lesson progress', () => {
  it('a peeked right answer keeps the box and is due again now', () => {
    progress.record('q-s30-temp', true, 0)
    progress.record('q-s30-temp', 'peeked', 5000)
    const c = progress.card('q-s30-temp')!
    expect(c.box).toBe(2)
    expect(c.due).toBe(5000)
    expect(c.right).toBe(1)
  })
  it('positions unlock in order: steps, then the section review', () => {
    progress.reset()
    expect(progress.reachable()).toBe(0)
    expect(progress.canOpen(POSITIONS[1])).toBe(false)
    progress.complete(POSITIONS[0])
    expect(progress.canOpen(POSITIONS[1])).toBe(true)
    expect(POSITIONS).toContain('review:silicon')
    progress.reset()
  })
})

describe('the all-processing paper', () => {
  it('draws four questions from every topic of the Make half, with calculations, and is stable per seed', () => {
    const p = processingPaper(7)
    expect(MAKE_TOPICS.length).toBe(7)
    expect(p.length).toBe(28)
    for (const t of MAKE_TOPICS) expect(p.filter((q) => q.source.topic === t).length, t).toBe(4)
    expect(p.filter((q) => q.type === 'calc').length).toBeGreaterThanOrEqual(10)
    expect(processingPaper(7).map((q) => q.id)).toEqual(p.map((q) => q.id))
  })
})
