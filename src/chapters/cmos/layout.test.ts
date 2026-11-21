import { describe, expect, it } from 'vitest'
import { BOUNDS, DEFAULT_LAYOUT, MASK_IDS, layoutState, moveEdge, snap, transistors, type Layout, type Side } from './layout'
import { checkLayout, checkMetal2, checksForEdge, checkVias, describe as describeCheck, RULES, type RuleId } from './rules'
import { processFor, inverterProcess } from './recipe'
import { mesh } from '../../sim/mesher'
import { signature, stackAt } from '../../sim/model'
import { surfaceSequence } from '../../sim/slicer'
import { MESH_OPTS } from './display'
import { resolveComponents } from './content'
import type { Rect } from '../../sim/types'

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 })
const empty = (): Layout => ({ nwell: [], poly: [], nplus: [], pplus: [], contact: [], metal: [] })
const violated = (l: Layout) => checkLayout(l).filter((c) => !c.ok)
const rules = (cs: { rule: RuleId }[]) => [...new Set(cs.map((c) => c.rule))].sort()

describe('λ snapping and edge moves', () => {
  it('snaps to whole λ', () => {
    expect(snap(2.4)).toBe(2)
    expect(snap(2.6)).toBe(3)
    expect(snap(-0.4)).toBe(0)
    expect(Object.is(snap(-0.4), -0)).toBe(false)
  })
  it('moves one edge, snapped, without mutating the input', () => {
    const before = JSON.stringify(DEFAULT_LAYOUT)
    const l = moveEdge(DEFAULT_LAYOUT, 'poly', 0, 'x1', 12.3)
    expect(l.poly[0].x1).toBe(12)
    expect(l.poly[1]).toBe(DEFAULT_LAYOUT.poly[1]) // untouched rects are shared
    expect(JSON.stringify(DEFAULT_LAYOUT)).toBe(before)
  })
  it('keeps every rectangle at least 1λ and inside the simulation grid', () => {
    expect(moveEdge(DEFAULT_LAYOUT, 'poly', 0, 'x1', 3).poly[0].x1).toBe(10) // x0 = 9 → min 1λ
    expect(moveEdge(DEFAULT_LAYOUT, 'nwell', 0, 'x1', 999).nwell[0].x1).toBe(BOUNDS.x1)
    expect(moveEdge(DEFAULT_LAYOUT, 'metal', 0, 'y0', -999).metal[0].y0).toBe(BOUNDS.y0)
  })
  it('returns the same object when the snapped value does not change', () => {
    expect(moveEdge(DEFAULT_LAYOUT, 'poly', 0, 'x1', 11.2)).toBe(DEFAULT_LAYOUT)
  })
})

describe('every rule in the slide 47 table, passing and failing', () => {
  const cases: { rule: RuleId; pass: Layout; fail: Layout }[] = [
    { rule: 'metal1.width', pass: { ...empty(), metal: [r(0, 0, 4, 10)] }, fail: { ...empty(), metal: [r(0, 0, 3, 10)] } },
    { rule: 'metal1.spacing', pass: { ...empty(), metal: [r(0, 0, 4, 10), r(8, 0, 12, 10)] }, fail: { ...empty(), metal: [r(0, 0, 4, 10), r(7, 0, 11, 10)] } },
    { rule: 'diffusion.width', pass: { ...empty(), nplus: [r(0, 0, 4, 4)] }, fail: { ...empty(), pplus: [r(0, 0, 3, 4)] } },
    { rule: 'diffusion.spacing', pass: { ...empty(), nplus: [r(0, 0, 4, 4), r(8, 0, 12, 4)] }, fail: { ...empty(), nplus: [r(0, 0, 4, 4), r(7, 0, 11, 4)] } },
    { rule: 'poly.width', pass: { ...empty(), poly: [r(0, 0, 2, 10)] }, fail: { ...empty(), poly: [r(0, 0, 1, 10)] } },
    { rule: 'poly.spacing', pass: { ...empty(), poly: [r(0, 0, 2, 10), r(5, 0, 7, 10)] }, fail: { ...empty(), poly: [r(0, 0, 2, 10), r(4, 0, 6, 10)] } },
    { rule: 'poly.gateExtension', pass: { ...empty(), nplus: [r(0, 0, 10, 4)], poly: [r(4, -2, 6, 6)] }, fail: { ...empty(), nplus: [r(0, 0, 10, 4)], poly: [r(4, -1, 6, 6)] } },
    { rule: 'nwell.diffInside', pass: { ...empty(), nwell: [r(0, 0, 16, 16)], pplus: [r(6, 6, 10, 10)] }, fail: { ...empty(), nwell: [r(0, 0, 16, 16)], pplus: [r(5, 6, 9, 10)] } },
    { rule: 'nwell.diffOutside', pass: { ...empty(), nwell: [r(0, 0, 10, 10)], nplus: [r(16, 0, 20, 4)] }, fail: { ...empty(), nwell: [r(0, 0, 10, 10)], nplus: [r(15, 0, 19, 4)] } },
    { rule: 'contact.size', pass: { ...empty(), contact: [r(1, 1, 3, 3)], nplus: [r(0, 0, 4, 4)], metal: [r(0, 0, 4, 4)] }, fail: { ...empty(), contact: [r(1, 1, 4, 3)], nplus: [r(0, 0, 5, 4)], metal: [r(0, 0, 5, 4)] } },
    { rule: 'contact.metalSurround', pass: { ...empty(), contact: [r(1, 1, 3, 3)], nplus: [r(0, 0, 4, 4)], metal: [r(0, 0, 4, 4)] }, fail: { ...empty(), contact: [r(1, 1, 3, 3)], nplus: [r(0, 0, 4, 4)], metal: [r(1, 0, 5, 4)] } },
    { rule: 'contact.diffSurround', pass: { ...empty(), contact: [r(1, 1, 3, 3)], nplus: [r(0, 0, 4, 4)], metal: [r(0, 0, 4, 4)] }, fail: { ...empty(), contact: [r(1, 1, 3, 3)], nplus: [r(0, 0, 4, 3)], metal: [r(0, 0, 4, 4)] } },
  ]
  for (const c of cases) {
    it(c.rule, () => {
      const pass = checkLayout(c.pass).filter((x) => x.rule === c.rule)
      expect(pass.length, 'rule exercised').toBeGreaterThan(0)
      expect(pass.every((x) => x.ok)).toBe(true)
      const fail = checkLayout(c.fail).filter((x) => x.rule === c.rule && !x.ok)
      expect(fail.length, 'violation found').toBeGreaterThan(0)
    })
  }
  it('metal2 width and spacing (not used by the inverter)', () => {
    expect(checkMetal2([r(0, 0, 4, 10), r(8, 0, 12, 10)]).every((c) => c.ok)).toBe(true)
    expect(rules(checkMetal2([r(0, 0, 3, 10), r(6, 0, 10, 10)]).filter((c) => !c.ok))).toEqual(['metal2.spacing', 'metal2.width'])
  })
  it('via spacing 3λ (not used by the inverter)', () => {
    expect(checkVias([r(0, 0, 2, 2), r(5, 0, 7, 2)]).every((c) => c.ok)).toBe(true)
    expect(checkVias([r(0, 0, 2, 2), r(4, 0, 6, 2)]).some((c) => !c.ok)).toBe(true)
  })
  it('the rule values are the slide 47 table', () => {
    expect(RULES.metal1).toEqual({ width: 4, spacing: 4 })
    expect(RULES.poly).toEqual({ width: 2, spacing: 3, gateExtension: 2 })
    expect(RULES.via.spacing).toBe(3)
  })
})

describe('the default (slide 27–28) layout', () => {
  const checks = checkLayout(DEFAULT_LAYOUT)
  it('every edge of every mask shape has at least one rule, and none is violated', () => {
    for (const mask of MASK_IDS)
      DEFAULT_LAYOUT[mask].forEach((_, index) => {
        for (const side of ['x0', 'x1', 'y0', 'y1'] as Side[]) {
          const cs = checksForEdge(checks, { mask, index, side })
          expect(cs.length, `${mask}[${index}].${side} has no rule`).toBeGreaterThan(0)
          expect(cs.every((c) => c.ok), `${mask}[${index}].${side}`).toBe(true)
        }
      })
  })
  it('hover text reads like the slide', () => {
    const polyW = checks.find((c) => c.rule === 'poly.width' && c.measured === 2)!
    expect(describeCheck(polyW)).toBe('Poly width: 2λ (min 2λ) · slide 47')
    expect(polyW.tight).toBe(true)
  })
  it('tight spots include both metal spacings (4λ) and the 2λ gates', () => {
    const tight = checks.filter((c) => c.tight).map((c) => c.rule)
    expect(tight.filter((r) => r === 'metal1.spacing').length).toBe(2)
    expect(tight).toContain('poly.width')
  })
})

describe('a deliberately broken layout', () => {
  let l = DEFAULT_LAYOUT
  l = moveEdge(l, 'poly', 0, 'x1', 10) // nMOS gate 1λ wide
  l = moveEdge(l, 'metal', 2, 'x0', 10) // Y wire 2λ from the GND arm
  l = moveEdge(l, 'pplus', 1, 'x0', 25) // pMOS diffusion 3λ from the well edge
  l = moveEdge(l, 'contact', 2, 'x1', 16) // drain contact 3λ wide, past its diffusion
  const bad = violated(l)

  it('produces exactly the expected violations', () => {
    expect(rules(bad)).toEqual(['contact.diffSurround', 'contact.size', 'metal1.spacing', 'nwell.diffInside', 'poly.width'])
  })
  it('reports how far each one is short', () => {
    const find = (rule: RuleId) => bad.find((c) => c.rule === rule)!
    expect(describeCheck(find('poly.width'))).toBe('Poly width: 1λ (min 2λ) · short by 1λ · slide 47')
    expect(describeCheck(find('metal1.spacing'))).toBe('Metal1 spacing: 2λ (min 4λ) · short by 2λ · slide 47')
    expect(find('nwell.diffInside').measured).toBe(3)
    expect(describeCheck(find('contact.size'))).toBe('Contact size: 3λ (must be 2λ) · off by 1λ · slide 47')
  })
  it('reset restores a clean layout', () => {
    layoutState.set(l)
    expect(layoutState.isDefault()).toBe(false)
    layoutState.reset()
    expect(violated(layoutState.get())).toEqual([])
  })
})

describe('slide 48: minimum transistor read from the layout', () => {
  it('both gates are W = 4λ, L = 2λ (L is the poly width, slide 46)', () => {
    const t = transistors(DEFAULT_LAYOUT)
    expect(t.map((x) => x.type).sort()).toEqual(['nmos', 'pmos'])
    for (const x of t) expect([x.W, x.L]).toEqual([4, 2])
  })
  it('follows edits: a 3λ gate is L = 3λ', () => {
    const t = transistors(moveEdge(DEFAULT_LAYOUT, 'poly', 0, 'x1', 12))
    expect(t.find((x) => x.type === 'nmos')!.L).toBe(3)
  })
})

describe('edited masks regenerate a valid 3D model', () => {
  // widen the nMOS gate to 3λ and the Y wire's right end by 2λ: still rule-clean
  let l = moveEdge(DEFAULT_LAYOUT, 'poly', 0, 'x1', 12)
  l = moveEdge(l, 'metal', 2, 'x1', 32)
  const P = processFor(l)
  const m = P.final()

  it('the edited layout passes the rules', () => {
    expect(violated(l)).toEqual([])
  })
  it('the gate in the slide 27 section is now 3λ long, with n+ on both sides', () => {
    expect(signature(stackAt(m, 11.5, 2.5))).toBe('si:p/gox/poly/fox')
    expect(signature(stackAt(m, 12.5, 2.5))).toBe('si:p/si:n+/fox/al')
    const seq = surfaceSequence(m, 'y', 2.5, MESH_OPTS)
    expect(seq.slice(0, 5)).toEqual(['si:p', 'si:p+', 'si:n+', 'si:p', 'si:n+'])
  })
  it('meshes into the same set of objects, all with content', () => {
    const res = mesh(m, MESH_OPTS)
    const count = (k: string) => res.components.filter((c) => c.key === k).length
    expect(count('al:plug')).toBe(6)
    expect(count('al')).toBe(3)
    expect(count('poly')).toBe(1)
    const names = resolveComponents(res)
    for (const c of res.components) expect(names.get(c.id), c.key).toBeTruthy()
  })
  it('the current process follows the layout state', () => {
    layoutState.set(l)
    expect(inverterProcess()).toBe(P)
    layoutState.reset()
    expect(inverterProcess()).not.toBe(P)
  })
})
