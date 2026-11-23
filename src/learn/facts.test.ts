import { describe, expect, it } from 'vitest'
import t2 from '../../content/topic2/facts.json'
import t3 from '../../content/topic3/facts.json'
import t4 from '../../content/topic4/facts.json'
import t5 from '../../content/topic5/facts.json'
import t6 from '../../content/topic6/facts.json'
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
  for (const [t, raw] of [['topic3', t3], ['topic4', t4], ['topic5', t5], ['topic6', t6]] as [string, unknown][]) {
    EARLIER[t] = new Set(acc)
    FactFileSchema.parse(raw).facts.forEach((f) => acc.add(f.id))
  }
}

for (const [topic, raw] of [['topic3', t3], ['topic4', t4], ['topic5', t5], ['topic6', t6]] as [TopicId, unknown][]) {
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
