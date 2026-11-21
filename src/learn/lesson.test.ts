import { beforeEach, describe, expect, it } from 'vitest'
import { LESSON } from './lesson'
import { FACT_BY_ID, QUESTION_BY_ID } from './bank'
import { applySceneNow, checkTarget, correctResponse, grade } from './engine'
import { CONTENT_BY_ID } from '../chapters/cmos/content'
import { useAtlas, type AtlasState } from '../state/store'
import { layoutState } from '../chapters/cmos/layout'

const initial = useAtlas.getState()
const store = { getState: () => useAtlas.getState(), setState: (p: Partial<AtlasState>) => useAtlas.setState(p) }
beforeEach(() => {
  useAtlas.setState({ ...initial, page: 'atlas' }, true)
  layoutState.reset()
})

describe('the Topic 2 lesson', () => {
  it('runs in lecture order and covers every slide', () => {
    for (let i = 1; i < LESSON.length; i++) expect(LESSON[i].slides[0], LESSON[i].id).toBeGreaterThanOrEqual(LESSON[i - 1].slides[0])
    const slides = new Set(LESSON.flatMap((c) => c.slides))
    for (let s = 1; s <= 49; s++) expect(slides.has(s), `slide ${s}`).toBe(true)
  })
  it('chunk ids are unique; facts and looks exist', () => {
    expect(new Set(LESSON.map((c) => c.id)).size).toBe(LESSON.length)
    for (const c of LESSON) {
      for (const f of c.factIds) expect(FACT_BY_ID[f], `${c.id} → ${f}`).toBeTruthy()
      if (c.scene.look) expect(CONTENT_BY_ID[c.scene.look], c.id).toBeTruthy()
    }
  })
  it('every chunk is followed by a question that tests only what it taught', () => {
    for (const c of LESSON) {
      const q = QUESTION_BY_ID[c.question]
      expect(q, `${c.id} → ${c.question}`).toBeTruthy()
      for (const f of q.factIds) expect(c.factIds, `${c.id}: ${q.id} tests ${f}`).toContain(f)
    }
  })
  it('can be completed start to finish, answering every question correctly against live state', () => {
    for (const c of LESSON) {
      applySceneNow(c.scene, store)
      const q = QUESTION_BY_ID[c.question]
      if (q.scene) applySceneNow(q.scene, store)
      if (q.type === 'do') {
        expect(checkTarget(q.answer.target, useAtlas.getState(), layoutState.get()), `${c.id} pre-solved`).toBe(false)
        applySceneNow(q.answer.solve, store)
      }
      expect(grade(q, correctResponse(q), useAtlas.getState(), layoutState.get()), c.id).toBe(true)
    }
  })
})
