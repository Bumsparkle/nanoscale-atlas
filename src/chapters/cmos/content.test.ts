import { describe, expect, it } from 'vitest'
import { mesh } from '../../sim/mesher'
import { MESH_OPTS } from './display'
import { CONTENT, resolveComponents } from './content'
import { inverterProcess, STEPS } from './recipe'

/**
 * Build-time integrity: every clickable mesh has a content file, and every
 * content file points at a mesh that exists (at some fab step).
 */
describe('content ↔ mesh integrity', () => {
  const P = inverterProcess()
  const cellContent = CONTENT.filter((c) => c.layer === 'cell')
  const used = new Set<string>()

  it('every component at every fab step resolves to a content file', () => {
    for (let k = 0; k < P.length; k++) {
      const res = mesh(P.snapshot(k), MESH_OPTS)
      const map = resolveComponents(res)
      for (const comp of res.components) {
        const id = map.get(comp.id)
        expect(id, `step ${STEPS[k].id}: component ${comp.key} at ${comp.min.map((v) => v.toFixed(1))} has no content`).toBeTruthy()
        used.add(id!)
      }
    }
  })

  it('every cell content file is used by some mesh', () => {
    for (const c of cellContent) expect(used.has(c.id), `${c.id} matches no mesh`).toBe(true)
  })

  it('the finished cell resolves each named object to exactly its own component', () => {
    const res = mesh(P.final(), MESH_OPTS)
    const map = resolveComponents(res)
    const ids = [...map.values()]
    for (const id of ['substrate', 'nwell', 'nmos-source', 'nmos-drain', 'pmos-source', 'pmos-drain', 'substrate-tap', 'well-tap', 'poly-gate', 'gate-oxide', 'field-oxide', 'metal-gnd', 'metal-y', 'metal-vdd'])
      expect(ids.filter((x) => x === id).length, id).toBe(1)
    expect(ids.filter((x) => x === 'contact').length).toBe(6)
    expect(ids).not.toContain('aluminium-film')
  })

  it('every panel cites a slide and names its fab step when it has one', () => {
    const stepIds = new Set(STEPS.map((s) => s.id))
    for (const c of CONTENT) {
      expect(c.slides.length).toBeGreaterThan(0)
      if (c.fabStep) expect(stepIds.has(c.fabStep), `${c.id} → ${c.fabStep}`).toBe(true)
      for (const b of c.beyond) expect(b.source.length).toBeGreaterThan(3)
    }
  })

  it('content ids are unique', () => {
    expect(new Set(CONTENT.map((c) => c.id)).size).toBe(CONTENT.length)
  })
})
