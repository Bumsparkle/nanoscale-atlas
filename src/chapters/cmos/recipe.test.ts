import { describe, expect, it } from 'vitest'
import { colAt, signature, stackAt } from '../../sim/model'
import { componentAt, mesh } from '../../sim/mesher'
import { regions, section, surfaceSequence } from '../../sim/slicer'
import type { Model } from '../../sim/types'
import { MESH_OPTS } from './display'
import { GRID, SLIDE27_Y } from './masks'
import { inverterProcess, STEPS, T } from './recipe'

const P = inverterProcess()
const after = (id: string): Model => {
  const k = P.indexOf(id)
  if (k < 0) throw new Error('no step ' + id)
  return P.snapshot(k)
}
/** signature of the column whose centre is nearest (x + .5, y + .5) on the slide 27 line */
const sig = (m: Model, x: number, y = SLIDE27_Y) => signature(stackAt(m, x + 0.5, y + 0.5))

// sample points along the slide 27 line (λ)
const X = {
  field: -4,
  subTap: 2, // contact cut
  nSource: 5, // contact cut
  nSourceBare: 7, // n+ between contact and gate (under GND arm: x < 8)
  nSourceOpen: 8, // n+, no metal above
  nGate: 9,
  nDrain: 11,
  nDrainCut: 13,
  gap: 18,
  wellField: 24,
  pDrainCut: 29,
  pGate: 33,
  pSourceCut: 37,
  wellTapCut: 41,
  wellEdge: 47,
  outside: 52,
}

describe('recipe structure', () => {
  it('has a step for every fab slide 29–45 and every step cites its slide', () => {
    const slides = new Set(STEPS.map((s) => s.slide))
    for (let s = 29; s <= 45; s++) {
      if (s === 38 || s === 39 || s === 40 || s === 41 || s === 42 || s === 43 || s === 44 || s === 45 || s <= 37)
        expect(slides.has(s), `slide ${s}`).toBe(true)
    }
    for (const s of STEPS) {
      expect(s.slide).toBeGreaterThanOrEqual(29)
      expect(s.slide).toBeLessThanOrEqual(45)
      expect(s.tool.length).toBeGreaterThan(0)
      expect(s.chemistry.length).toBeGreaterThan(0)
    }
  })
  it('step ids are unique', () => {
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(STEPS.length)
  })
})

describe('cross-sections along the slide 27 line, slide by slide', () => {
  it('slide 29: blank p substrate', () => {
    const m = after('start')
    for (const x of Object.values(X)) expect(sig(m, x)).toBe('si:p')
  })

  it('slide 30: SiO2 grown over the whole wafer', () => {
    const m = after('nwell-ox')
    for (const x of Object.values(X)) expect(sig(m, x)).toBe('si:p/ox')
    expect(stackAt(m, 0.5, 2.5)[1].z1).toBeCloseTo(T.maskOx)
  })

  it('slide 31: photoresist spun over the oxide', () => {
    const m = after('n-well-spin')
    for (const x of Object.values(X)) expect(sig(m, x)).toBe('si:p/ox/resist')
  })

  it('slide 32: resist exposed through the n-well mask and developed away there only', () => {
    const exposed = after('n-well-expose')
    expect(sig(exposed, X.wellField)).toBe('si:p/ox/resist:exposed')
    expect(sig(exposed, X.nGate)).toBe('si:p/ox/resist')
    const m = after('n-well-develop')
    expect(sig(m, X.wellField)).toBe('si:p/ox')
    expect(sig(m, X.wellTapCut)).toBe('si:p/ox')
    expect(sig(m, X.nGate)).toBe('si:p/ox/resist')
    expect(sig(m, X.outside)).toBe('si:p/ox/resist')
  })

  it('slide 33: HF etches oxide only where the resist is open', () => {
    const m = after('n-well-etch')
    expect(sig(m, X.wellField)).toBe('si:p')
    expect(sig(m, X.nGate)).toBe('si:p/ox/resist')
    expect(sig(m, X.outside)).toBe('si:p/ox/resist')
  })

  it('slide 34: piranha strips the remaining resist', () => {
    const m = after('n-well-strip')
    expect(sig(m, X.wellField)).toBe('si:p')
    expect(sig(m, X.nGate)).toBe('si:p/ox')
  })

  it('slide 35: n-well forms only in the exposed silicon (oxide blocks the As)', () => {
    const m = after('nwell-implant')
    expect(sig(m, X.wellField)).toBe('si:p/si:nwell')
    expect(sig(m, X.pGate)).toBe('si:p/si:nwell')
    expect(sig(m, X.nGate)).toBe('si:p/ox')
    expect(sig(m, X.gap)).toBe('si:p/ox')
    const well = stackAt(m, X.wellField + 0.5, 2.5).find((i) => i.dop === 'nwell')!
    expect(well.z1 - well.z0).toBeCloseTo(T.nwell)
  })

  it('slide 36: oxide stripped, bare wafer with n-well', () => {
    const m = after('nwell-strip-ox')
    expect(sig(m, X.wellField)).toBe('si:p/si:nwell')
    expect(sig(m, X.nGate)).toBe('si:p')
  })

  it('slide 37: thin gate oxide (< 20 Å) then polysilicon everywhere', () => {
    const m = after('gate-poly')
    expect(sig(m, X.nGate)).toBe('si:p/gox/poly')
    expect(sig(m, X.wellField)).toBe('si:p/si:nwell/gox/poly')
    const gox = stackAt(m, 9.5, 2.5).find((i) => i.mat === 'gox')!
    expect(gox.z1 - gox.z0).toBeLessThan(2.0001) // < 20 Å
  })

  it('slide 38: poly (and its thin oxide) remain only on the two gates', () => {
    const m = after('gate-strip')
    expect(sig(m, X.nGate)).toBe('si:p/gox/poly')
    expect(sig(m, X.pGate)).toBe('si:p/si:nwell/gox/poly')
    expect(sig(m, X.nSourceOpen)).toBe('si:p')
    expect(sig(m, X.nDrain)).toBe('si:p')
    expect(sig(m, X.wellField)).toBe('si:p/si:nwell')
    // the bridge of the U at y = 10..12 connects the two legs: one poly node
    expect(signature(stackAt(m, 20.5, 10.5))).toBe('si:p/gox/poly')
  })

  it('slide 39: oxide covers silicon and poly', () => {
    const m = after('n-ox')
    expect(sig(m, X.nGate)).toBe('si:p/gox/poly/ox')
    expect(sig(m, X.nSourceOpen)).toBe('si:p/ox')
  })

  it('slide 40: oxide opened over the nMOS and the well tap only', () => {
    const m = after('n+-strip')
    expect(sig(m, X.nSourceOpen)).toBe('si:p')
    expect(sig(m, X.nGate)).toBe('si:p/gox/poly')
    expect(sig(m, X.wellTapCut)).toBe('si:p/si:nwell')
    expect(sig(m, X.subTap)).toBe('si:p/ox')
    expect(sig(m, X.pDrainCut)).toBe('si:p/si:nwell/ox')
    expect(sig(m, X.pGate)).toBe('si:p/si:nwell/gox/poly/ox')
  })

  it('slide 41: n+ forms beside the gate; the gate blocks it (self-aligned)', () => {
    const m = after('n-implant')
    expect(sig(m, X.nSource)).toBe('si:p/si:n+')
    expect(sig(m, X.nDrain)).toBe('si:p/si:n+')
    expect(sig(m, X.nGate)).toBe('si:p/gox/poly') // channel stays p-type
    expect(sig(m, X.wellTapCut)).toBe('si:p/si:nwell/si:n+')
    expect(sig(m, X.subTap)).toBe('si:p/ox')
  })

  it('slide 42: oxide stripped after n+', () => {
    const m = after('n-strip-ox')
    expect(sig(m, X.nSource)).toBe('si:p/si:n+')
    expect(sig(m, X.pDrainCut)).toBe('si:p/si:nwell')
    expect(sig(m, X.subTap)).toBe('si:p')
  })

  it('slide 43: p+ for the pMOS and the substrate tap, again self-aligned', () => {
    const m = after('p-strip-ox')
    expect(sig(m, X.subTap)).toBe('si:p/si:p+')
    expect(sig(m, X.pDrainCut)).toBe('si:p/si:nwell/si:p+')
    expect(sig(m, X.pSourceCut)).toBe('si:p/si:nwell/si:p+')
    expect(sig(m, X.pGate)).toBe('si:p/si:nwell/gox/poly')
    expect(sig(m, X.nSource)).toBe('si:p/si:n+')
    expect(sig(m, X.wellTapCut)).toBe('si:p/si:nwell/si:n+')
  })

  it('slide 44: thick field oxide with contact cuts down to the diffusions', () => {
    const m = after('contacts-strip')
    for (const x of [X.subTap, X.nSource, X.nDrainCut, X.pDrainCut, X.pSourceCut, X.wellTapCut]) {
      const s = sig(m, x)
      expect(s.endsWith('fox'), `cut at ${x}: ${s}`).toBe(false)
    }
    expect(sig(m, X.nSourceOpen)).toBe('si:p/si:n+/fox')
    expect(sig(m, X.nGate)).toBe('si:p/gox/poly/fox')
    expect(sig(m, X.gap)).toBe('si:p/fox')
  })

  it('slide 45: aluminium fills the cuts and is patterned into GND, Y and VDD', () => {
    const m = P.final()
    expect(sig(m, X.subTap)).toBe('si:p/si:p+/al:plug/al')
    expect(sig(m, X.nSource)).toBe('si:p/si:n+/al:plug/al')
    expect(sig(m, X.nSourceBare)).toBe('si:p/si:n+/fox/al')
    expect(sig(m, X.nSourceOpen)).toBe('si:p/si:n+/fox')
    expect(sig(m, X.nGate)).toBe('si:p/gox/poly/fox')
    expect(sig(m, X.gap)).toBe('si:p/fox/al')
    expect(sig(m, X.pGate)).toBe('si:p/si:nwell/gox/poly/fox')
    expect(sig(m, X.wellTapCut)).toBe('si:p/si:nwell/si:n+/al:plug/al')
    expect(sig(m, X.outside)).toBe('si:p/fox')
  })
})

describe('the finished inverter (slides 25–27)', () => {
  const m = P.final()

  it('material sequence at the silicon surface along the slide 27 line', () => {
    expect(surfaceSequence(m, 'y', SLIDE27_Y + 0.5, MESH_OPTS)).toEqual([
      'si:p', // field
      'si:p+', // substrate tap
      'si:n+', // nMOS source
      'si:p', // nMOS channel under the gate
      'si:n+', // nMOS drain
      'si:p', // field between transistors
      'si:nwell',
      'si:p+', // pMOS drain
      'si:nwell', // pMOS channel
      'si:p+', // pMOS source
      'si:n+', // well tap
      'si:nwell',
      'si:p',
    ])
  })

  it('nMOS sits in the p substrate, pMOS in the n-well (slide 25)', () => {
    const nGate = stackAt(m, 10, 2.5)
    expect(nGate[0].dop).toBe('p')
    const pGate = stackAt(m, 34, 2.5)
    expect(pGate.some((i) => i.dop === 'nwell')).toBe(true)
  })

  it('taps: GND metal lands on p+ in the substrate, VDD on n+ in the well (slide 26)', () => {
    const sub = stackAt(m, 2, 2.5)
    expect(sub.some((i) => i.dop === 'p+')).toBe(true)
    expect(sub.some((i) => i.plug)).toBe(true)
    const tap = stackAt(m, 42, 2.5)
    expect(tap.some((i) => i.dop === 'n+')).toBe(true)
    expect(tap.some((i) => i.dop === 'nwell')).toBe(true)
  })

  it('section regions along the slide 27 line include every legend material', () => {
    const keys = new Set(regions(section(m, 'y', SLIDE27_Y + 0.5, MESH_OPTS)).map((r) => r.key))
    for (const k of ['si:p', 'si:nwell', 'si:n+', 'si:p+', 'gox', 'poly', 'fox', 'al', 'al:plug']) expect(keys.has(k), k).toBe(true)
  })

  it('section along the nMOS gate shows the MOS stack: poly / gate oxide / p body', () => {
    const rects = section(m, 'x', 10, MESH_OPTS)
    const under = rects.filter((r) => r.u0 <= 2 && r.u1 > 2).sort((a, b) => a.z0 - b.z0).map((r) => r.key)
    expect(under).toEqual(['si:p', 'gox', 'poly', 'fox'])
  })

  it('mesh: components are the physical objects of the cell', () => {
    const res = mesh(m, MESH_OPTS)
    const count = (k: string) => res.components.filter((c) => c.key === k).length
    expect(count('al:plug')).toBe(6) // six contacts (slide 28)
    expect(count('al')).toBe(3) // GND, Y, VDD
    expect(count('poly')).toBe(1) // one U-shaped poly node: input A
    // gate oxide lies under the whole poly U (no field oxide before poly in this flow): one piece
    expect(count('gox')).toBe(1)
    expect(count('si:n+')).toBe(3) // nMOS source, drain, well tap
    expect(count('si:p+')).toBe(3) // pMOS source, drain, substrate tap
    expect(count('si:nwell')).toBe(1)
    expect(componentAt(res, 'si:n+', 6, 2)).not.toBe(componentAt(res, 'si:n+', 14, 2))
  })

  it('every column stays ordered and gap-free', () => {
    for (const col of m.cols) {
      for (let i = 1; i < col.length; i++) {
        expect(col[i].z0).toBeCloseTo(col[i - 1].z1, 6)
        expect(col[i].z1).toBeGreaterThan(col[i].z0)
      }
    }
    expect(colAt(GRID, 0, 0)).toBeGreaterThanOrEqual(0)
  })
})

describe('fractional steps (timeline scrubbing has no pops)', () => {
  /** per-material thickness summed over all columns (nm·columns) */
  const inventory = (m: Model) => {
    const t = new Map<string, number>()
    for (const c of m.cols) for (const iv of c) {
      const k = iv.mat === 'si' ? 'si:' + iv.dop : iv.mat
      t.set(k, (t.get(k) ?? 0) + iv.z1 - iv.z0)
    }
    return t
  }
  const dist = (a: Map<string, number>, b: Map<string, number>) => {
    let d = 0
    for (const k of new Set([...a.keys(), ...b.keys()])) d += Math.abs((a.get(k) ?? 0) - (b.get(k) ?? 0))
    return d
  }

  it('every step starts at the previous snapshot and ends at its own', () => {
    for (let k = 0; k < P.length - 1; k++) {
      const a = inventory(P.snapshot(k))
      const b = inventory(P.snapshot(k + 1))
      const total = dist(a, b)
      const near0 = dist(a, inventory(P.at(k + 0.001)))
      const near1 = dist(b, inventory(P.at(k + 0.999)))
      expect(near0, `start of step ${STEPS[k + 1].id}`).toBeLessThanOrEqual(total * 0.01 + 1e-6)
      expect(near1, `end of step ${STEPS[k + 1].id}`).toBeLessThanOrEqual(total * 0.01 + 1e-6)
    }
  })

  it('progress is monotonic within a step', () => {
    for (let k = 0; k < P.length - 1; k++) {
      const a = inventory(P.snapshot(k))
      let last = 0
      for (const t of [0.2, 0.4, 0.6, 0.8]) {
        const d = dist(a, inventory(P.at(k + t)))
        expect(d + 1e-6).toBeGreaterThanOrEqual(last)
        last = d
      }
    }
  })
})
