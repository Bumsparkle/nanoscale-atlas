import { describe, expect, it } from 'vitest'
import { CAPTURE, cutLabels, RELEASE, snapFor } from './section'
import { inverterProcess } from '../chapters/cmos/recipe'

describe('section plane snapping', () => {
  it('captures each of the three named sections from within the radius', () => {
    expect(snapFor('y', 2 + CAPTURE * 0.9, null)).toBe('slide27')
    expect(snapFor('y', 2 - CAPTURE * 0.9, null)).toBe('slide27')
    expect(snapFor('x', 10.8, null)).toBe('ngate')
    expect(snapFor('x', 33.1, null)).toBe('pgate')
  })
  it('does not capture outside the radius, or on the wrong axis', () => {
    expect(snapFor('y', 2 + CAPTURE + 0.1, null)).toBeNull()
    expect(snapFor('x', 2, null)).toBeNull()
    expect(snapFor('y', 10, null)).toBeNull()
    expect(snapFor('x', 22, null)).toBeNull()
  })
  it('holds the lock until RELEASE (hysteresis)', () => {
    expect(snapFor('y', 2 + CAPTURE + 0.5, 'slide27')).toBe('slide27')
    expect(snapFor('y', 2 + RELEASE + 0.1, 'slide27')).toBeNull()
  })
})

describe('cut labels', () => {
  const m = inverterProcess().final()
  it('slide 27 cut names the regions of slide 25/26 with their roles', () => {
    const labels = cutLabels(m, 'y', 2)
    const texts = labels.map((l) => l.text + (l.sub ? ':' + l.sub : ''))
    for (const t of ['p substrate', 'n well', 'n+:nMOS source', 'n+:nMOS drain', 'n+:well tap', 'p+:substrate tap', 'p+:pMOS source', 'p+:pMOS drain', 'metal1:GND', 'metal1:Y', 'metal1:VDD', 'contact', 'SiO₂', 'gate oxide ×50'])
      expect(texts, t).toContain(t)
    expect(texts.filter((t) => t.startsWith('polysilicon')).length).toBe(2)
  })
  it('gate cut shows the MOS stack', () => {
    const texts = cutLabels(m, 'x', 10).map((l) => l.text)
    expect(texts).toContain('polysilicon')
    expect(texts).toContain('gate oxide ×50')
    expect(texts).toContain('p substrate')
  })
})
