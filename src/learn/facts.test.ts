import { describe, expect, it } from 'vitest'
import t2 from '../../content/topic2/facts.json'
import t3 from '../../content/topic3/facts.json'
import t4 from '../../content/topic4/facts.json'
import t5 from '../../content/topic5/facts.json'
import t6 from '../../content/topic6/facts.json'
import t7 from '../../content/topic7/facts.json'
import t8 from '../../content/topic8/facts.json'
import { FactFileSchema } from './schema'
import { TOPIC_SLIDES, type TopicId } from '../sources'

/**
 * The Topic 3 and Topic 4 fact inventories: complete (every slide has a
 * fact, a link to an earlier deck's fact, or is listed as having nothing
 * examinable), consistent, and honest about the slides they correct.
 */
const T2 = FactFileSchema.parse(t2)
const EARLIER: Record<string, Set<string>> = {}
{
  const acc = new Set(T2.facts.map((f) => f.id))
  for (const [t, raw] of [['topic3', t3], ['topic4', t4], ['topic5', t5], ['topic6', t6], ['topic7', t7], ['topic8', t8]] as [string, unknown][]) {
    EARLIER[t] = new Set(acc)
    FactFileSchema.parse(raw).facts.forEach((f) => acc.add(f.id))
  }
}

for (const [topic, raw] of [['topic3', t3], ['topic4', t4], ['topic5', t5], ['topic6', t6], ['topic7', t7], ['topic8', t8]] as [TopicId, unknown][]) {
  describe(`${topic} fact inventory`, () => {
    const file = FactFileSchema.parse(raw)
    const n = TOPIC_SLIDES[topic]
    const prefix = `t${topic.slice(5)}-`

    it('lists every slide once, in order', () => {
      expect(file.topic).toBe(topic)
      expect(file.slides.map((s) => s.slide)).toEqual(Array.from({ length: n }, (_, i) => i + 1))
    })
    it('every slide has a fact, a link to an earlier topic, or a reason it has none', () => {
      for (let s = 1; s <= n; s++) {
        const has = file.facts.some((f) => f.source.slide === s) || file.links.some((l) => l.slide === s) || file.noFacts.some((x) => x.slide === s)
        expect(has, `slide ${s}`).toBe(true)
      }
    })
    it('fact ids are unique, prefixed by the topic, and match their slide', () => {
      expect(new Set(file.facts.map((f) => f.id)).size).toBe(file.facts.length)
      for (const f of file.facts) {
        expect(f.id.startsWith(prefix), f.id).toBe(true)
        expect(f.source.topic, f.id).toBe(topic)
        expect(f.id.slice(4, 6), f.id).toBe(String(f.source.slide).padStart(2, '0'))
      }
    })
    it('numbers, process steps and rules are key', () => {
      for (const f of file.facts) if (f.kind === 'number' || f.kind === 'process-step' || f.kind === 'rule') expect(f.key, f.id).toBe(true)
    })
    it('links point at real facts of earlier topics instead of duplicating them', () => {
      for (const l of file.links) for (const id of l.facts) expect(EARLIER[topic].has(id), `${topic} slide ${l.slide} → ${id}`).toBe(true)
    })
    it('slides with no facts are not also given facts', () => {
      for (const x of file.noFacts) expect(file.facts.some((f) => f.source.slide === x.slide), `slide ${x.slide}`).toBe(false)
    })
    it('every correction records what the slide says', () => {
      for (const f of file.facts.filter((f) => f.corrects)) expect(f.corrects!.length, f.id).toBeGreaterThan(20)
    })
  })
}

describe('known slide errors are corrected, never taught', () => {
  const F3 = FactFileSchema.parse(t3).facts
  const F4 = FactFileSchema.parse(t4).facts
  const by = (fs: typeof F3, id: string) => fs.find((f) => f.id === id)!
  it('boron is group III (Topic 3 slide 12 lists it as group V)', () => {
    expect(by(F3, 't3-s12-donors').statement).not.toMatch(/\bB\b/)
    expect(by(F3, 't3-s12-acceptors').statement).toMatch(/\bB\b/)
    expect(by(F3, 't3-s12-donors').corrects).toMatch(/boron/)
  })
  it('donor ions are Nd (Topic 3 slide 13 writes Na)', () => expect(by(F3, 't3-s13-nd').statement).toMatch(/donor ions of concentration Nd/))
  it('the first crystal has Cs = k0·C0 (slide 19 writes k0M0)', () => expect(by(F3, 't3-s19-start').statement).toMatch(/k0·C0/))
  it('magnesium is Mg²⁺ (Topic 4 slide 10 writes Mg³⁺)', () => {
    expect(by(F4, 't4-s10-sc2').statement).toMatch(/Mg²⁺/)
    expect(by(F4, 't4-s10-sc2').statement).not.toMatch(/Mg³⁺/)
  })
  it('O₂/H₂O releases four electrons (Topic 4 slide 19 writes 2e⁻)', () => expect(by(F4, 't4-s19-o2').statement).toMatch(/4e⁻/))
  it('no fact statement repeats a corrected error', () => {
    const all = [...F3, ...F4].map((f) => f.statement).join('\n')
    expect(all).not.toMatch(/Group V atoms \(B/)
    expect(all).not.toMatch(/k0M0|K0M0/)
    expect(all).not.toMatch(/Mg³⁺/)
  })
})

describe('Topic 5 and 6 slide errors are corrected', () => {
  const F5 = FactFileSchema.parse(t5).facts
  const F6 = FactFileSchema.parse(t6).facts
  const all = [...F5, ...F6].map((f) => f.statement).join('\n')
  it('trimethyl groups are CH₃', () => expect(all).not.toMatch(/\(CH₄\)₃/))
  it('nitride reactions balance', () => {
    expect(all).not.toMatch(/NH₄ →/)
    expect(F5.find((f) => f.id === 't5-s25-nitrides')!.statement).toMatch(/6HCl \+ 6H₂/)
  })
  it('SIMOX is separation by implantation of oxygen', () => expect(F6.find((f) => f.id === 't6-s28-makers')!.statement).toMatch(/separation by implantation of oxygen/))
})

describe('Topic 7 and 8 slide errors are corrected', () => {
  const F7 = FactFileSchema.parse(t7).facts
  const F8 = FactFileSchema.parse(t8).facts
  const by = (id: string) => [...F7, ...F8].find((f) => f.id === id)!
  const all = [...F7, ...F8].map((f) => f.statement).join('\n')
  it('the 157 nm source is the F₂ laser, not "FF"', () => {
    expect(all).not.toMatch(/\bFF\b/)
    expect(by('t7-s04-lasers').statement).toMatch(/F₂, λ = 157 nm/)
  })
  it('the DOF formula is ±k₂λ/NA², consistent with the worked example', () => {
    expect(by('t7-s09-dof').statement).toMatch(/±k₂·λ\/NA²/)
    const R = (0.75 * 248) / 0.6 / 1000
    const DOF = (0.5 * 248) / 0.36 / 1000
    expect(R).toBeCloseTo(0.31, 2)
    expect(DOF).toBeCloseTo(0.344, 3)
    expect(by('t7-s09-example').statement).toMatch(/±0\.34 µm/)
  })
  it('particle wavelengths are de Broglie wavelengths, not hc/E', () => {
    const h = 6.62607015e-34, me = 9.1093837e-31, mp = 1.67262192e-27, q = 1.602176634e-19, c = 2.99792458e8
    const E = 20e3 * q
    const lamE = h / Math.sqrt(2 * me * E * (1 + E / (2 * me * c * c)))
    const lamP = h / Math.sqrt(2 * mp * 100e3 * q)
    expect(lamE * 1e10).toBeCloseTo(0.086, 3)
    expect(lamP * 1e10).toBeCloseTo(9e-4, 4)
    expect(by('t7-s18-particles').statement).toMatch(/0\.086 Å/)
    expect(by('t7-s18-particles').statement).not.toMatch(/0\.62 Å/)
  })
  it('quantum numbers are positive, boundary (not bonding) conditions, a delta (not σ) for 0D', () => {
    expect(all).not.toMatch(/±1, ±2/)
    expect(all).not.toMatch(/bonding conditions/)
    expect(by('t8-s30-0d').statement).toMatch(/2δ\(E − E_c\)/)
    expect(all).not.toMatch(/σ\(E/)
  })
  it('the 1D and 2D DoS prefactors re-derive (the slide’s 1D is half the true value)', () => {
    // count standing waves directly: k = nπ/L, n = 1, 2, 3…, two spins
    const L = 200, k = 1.7
    const n1 = Math.floor((k * L) / Math.PI)
    expect(2 * n1).toBeCloseTo((2 * k * L) / Math.PI, -1)
    let n2 = 0
    for (let a = 1; a < 200; a++) for (let b = 1; b < 200; b++) if ((Math.PI / L) ** 2 * (a * a + b * b) <= k * k) n2++
    expect((2 * n2) / ((k * k * L * L) / (2 * Math.PI))).toBeCloseTo(1, 1)
    // ρ = (1/size) dN/dE with k² = 2mE/ħ²: 2D m/(πħ²); 1D (1/π)√(2m/ħ²)E^(−1/2)
    const m = 1, hbar = 1, E = 0.37, d = 1e-6
    const N2 = (e: number) => ((2 * m * e) / hbar ** 2) * L * L / (2 * Math.PI)
    const N1 = (e: number) => (2 * Math.sqrt((2 * m * e) / hbar ** 2) * L) / Math.PI
    expect((N2(E + d) - N2(E - d)) / (2 * d) / (L * L)).toBeCloseTo(m / (Math.PI * hbar ** 2), 6)
    expect((N1(E + d) - N1(E - d)) / (2 * d) / L).toBeCloseTo((1 / Math.PI) * Math.sqrt((2 * m) / hbar ** 2) / Math.sqrt(E), 6)
    expect(by('t8-s27-2d').statement).toMatch(/m\/\(πħ²\)/)
    expect(by('t8-s28-1d').statement).toMatch(/2kL\/π/)
    expect(by('t8-s29-1d').statement).toMatch(/\(1\/π\)√\(2m\/ħ²\)·E\^\(−1\/2\)/)
    expect(all).not.toMatch(/1\/2π\)√\(2m/)
  })
})
