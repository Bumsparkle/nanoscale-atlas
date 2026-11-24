import { beforeEach, describe, expect, it } from 'vitest'
import { QUESTIONS } from './bank'
import { applySceneNow, checkTarget, correctResponse, grade, stepIndex } from './engine'
import { useApp, type AppState } from '../state/store'
import { layoutState } from '../chapters/cmos/layout'
import { processFor } from '../chapters/cmos/recipe'
import { mesh } from '../sim/mesher'
import { MESH_OPTS } from '../chapters/cmos/display'
import { CONTENT_BY_ID, resolveComponents } from '../chapters/cmos/content'
import { LAYER_NODES } from '../chapters/cmos/nodes'
import type { Question } from './schema'

/** a fresh app state, as on first load of /cmos/inverter */
const initial = useApp.getState()
const store = { getState: () => useApp.getState(), setState: (p: Partial<AppState>) => useApp.setState(p) }
beforeEach(() => {
  useApp.setState({ ...initial, page: 'study' }, true)
  layoutState.reset()
})

const ofType = <T extends Question['type']>(t: T) => QUESTIONS.filter((q): q is Extract<Question, { type: T }> => q.type === t)

describe('"do" questions are checked against real app state', () => {
  for (const q of ofType('do')) {
    it(q.id, () => {
      if (q.scene) applySceneNow(q.scene, store)
      expect(checkTarget(q.answer.target, useApp.getState(), layoutState.get()), 'already solved by its own setup').toBe(false)
      applySceneNow(q.answer.solve, store)
      expect(checkTarget(q.answer.target, useApp.getState(), layoutState.get()), 'solution does not reach the target').toBe(true)
      expect(grade(q, { kind: 'state' }, useApp.getState(), layoutState.get())).toBe(true)
    })
  }
})

/** names of clickable objects in the 3D cell at a fab step */
const cellObjects = (step?: string) => {
  const P = processFor(layoutState.get())
  const m = step ? P.snapshot(stepIndex(step)) : P.final()
  return new Set(resolveComponents(mesh(m, MESH_OPTS)).values())
}

describe('"label" answers are clickable objects in the scene the question sets up', () => {
  for (const q of ofType('label')) {
    it(q.id, () => {
      const sc = q.scene
      const layer = sc.layer ?? 'cell'
      for (const id of q.answer.objects) {
        const c = CONTENT_BY_ID[id]
        if (layer === 'cell' && sc.view === 'layout') {
          expect(c.layer, `${id} is not a layout object`).toBe('layout')
          expect(id === 'min-transistor' || id.startsWith('mask-'), `${id} has no click target in the Layout view`).toBe(true)
          expect(sc.editMode ?? false, 'shapes are only clickable outside edit mode').toBe(false)
        } else if (layer === 'cell') {
          expect(cellObjects(sc.view === 'fab' ? sc.step : undefined).has(id), `${id} is not a mesh at this step`).toBe(true)
        } else {
          expect(c.layer, `${id} lives on another layer`).toBe(layer)
          expect((LAYER_NODES as Record<string, readonly string[]>)[layer]?.includes(c.node ?? ''), `${id} has no node in ${layer}`).toBe(true)
        }
      }
      // the correct click grades correct, a click on something else does not
      expect(grade(q, { kind: 'click', object: q.answer.objects[0] }, useApp.getState(), layoutState.get())).toBe(true)
      expect(grade(q, { kind: 'click', object: 'not-it' }, useApp.getState(), layoutState.get())).toBe(false)
    })
  }
})

describe('"predict" reveals actually change the scene', () => {
  for (const q of ofType('predict')) {
    it(q.id, () => {
      if (q.scene) applySceneNow(q.scene, store)
      const before = JSON.stringify(useApp.getState())
      applySceneNow(q.answer.reveal, store)
      const after = JSON.stringify(useApp.getState())
      // a junction reveal may re-show the same bias: it then just brings the bench into view
      if (q.scene?.bench?.tab !== 'junction') expect(after, 'reveal changes nothing').not.toBe(before)
    })
  }
})

describe('grading', () => {
  it('every question accepts its own correct response', () => {
    for (const q of QUESTIONS) {
      if (q.type === 'do') continue
      expect(grade(q, correctResponse(q), useApp.getState(), layoutState.get()), q.id).toBe(true)
    }
  })
  it('calc answers respect tolerance', () => {
    for (const q of ofType('calc')) {
      expect(grade(q, { kind: 'number', value: q.answer.value + q.answer.tol * 0.9 }, useApp.getState(), layoutState.get()), q.id).toBe(true)
      expect(grade(q, { kind: 'number', value: q.answer.value + q.answer.tol * 3 + Math.abs(q.answer.value) * 0.2 + 0.01 }, useApp.getState(), layoutState.get()), q.id).toBe(false)
    }
  })
  it('short answers are case- and punctuation-insensitive', () => {
    const q = QUESTIONS.find((x) => x.id === 'q-s02-cmos')!
    expect(grade(q, { kind: 'text', text: '  Complementary Metal-Oxide-Semiconductor ' }, useApp.getState(), layoutState.get())).toBe(true)
    expect(grade(q, { kind: 'text', text: 'complementary metal' }, useApp.getState(), layoutState.get())).toBe(false)
  })
  it('scene fab steps exist in the recipe', () => {
    for (const q of QUESTIONS) for (const sc of [q.scene, q.type === 'do' ? q.answer.solve : undefined, q.type === 'predict' ? q.answer.reveal : undefined]) if (sc?.step) expect(stepIndex(sc.step), `${q.id}: ${sc.step}`).toBeGreaterThanOrEqual(0)
  })
})
