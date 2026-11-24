import { describe, expect, it } from 'vitest'
import { barrierProbability, boxLevels, countStates, dos1, dos2, dos3, dotLevel, finitePsi, finiteWell, HB, infiniteLevel, infinitePsi, solveProfile, wireLevel } from './quantum'
import { alignment, bandProfile, confinedLevels, Ec, MAT, SAMPLE, spans, totalNm } from './hetero'

const hbar = 1.054571817e-34, m0 = 9.1093837015e-31, q = 1.602176634e-19

describe('infinite well (slides 6–8)', () => {
  it('Eₙ = n²π²ħ²/2mL² exactly', () => {
    expect(HB).toBeCloseTo(0.0380998, 6)
    const L = 10
    const E1 = (Math.PI ** 2 * hbar ** 2) / (2 * m0 * (L * 1e-9) ** 2) / q
    expect(infiniteLevel(1, L) / E1).toBeCloseTo(1, 9)
    for (const n of [1, 2, 3, 4, 5]) expect(infiniteLevel(n, L) / infiniteLevel(1, L)).toBeCloseTo(n * n, 9)
    // slide 8: 3.8, 15, 34, 60, 94 meV for 10 nm and the free-electron mass
    expect([1, 2, 3, 4, 5].map((n) => Math.round(infiniteLevel(n, 10) * 1000))).toEqual([4, 15, 34, 60, 94])
  })
  it('ψₙ = √(2/L) sin(nπx/L) is normalised and has n − 1 nodes', () => {
    const L = 7
    for (const n of [1, 2, 3]) {
      let s = 0
      let nodes = 0
      let prev = infinitePsi(n, L, 1e-6)
      for (let i = 1; i < 2000; i++) {
        const x = (i / 2000) * L
        const v = infinitePsi(n, L, x)
        s += v * v * (L / 2000)
        if (Math.sign(v) !== Math.sign(prev) && Math.abs(v) > 1e-9) nodes++
        prev = v
      }
      expect(s).toBeCloseTo(1, 3)
      expect(nodes).toBe(n - 1)
    }
  })
  it('levels crowd together as L grows (the classical limit)', () => {
    const gap = (L: number) => infiniteLevel(2, L) - infiniteLevel(1, L)
    expect(gap(100)).toBeLessThan(gap(10) / 50)
  })
})

describe('finite well (slide 10)', () => {
  const L = 10, V0 = 0.3, m = 0.067
  const fin = finiteWell(L, V0, m)
  it('every level lies below the infinite-well level of the same width', () => {
    expect(fin.length).toBeGreaterThanOrEqual(2)
    for (const l of fin) expect(l.E).toBeLessThan(infiniteLevel(l.n, L, m))
  })
  it('a deeper well approaches the infinite well for the low levels', () => {
    const r = (V: number) => finiteWell(L, V, m)[0].E / infiniteLevel(1, L, m)
    expect(r(0.1)).toBeLessThan(r(1))
    expect(r(1)).toBeLessThan(r(10))
    expect(r(100)).toBeGreaterThan(0.95)
  })
  it('the wavefunction leaks into the barrier (tunnelling tails), more for higher levels', () => {
    const p1 = barrierProbability(fin[0], L, V0, m)
    const p2 = barrierProbability(fin[1], L, V0, m)
    expect(p1).toBeGreaterThan(0.01)
    expect(p2).toBeGreaterThan(p1)
    const psi = finitePsi(fin[0], L, V0, m)
    expect(Math.abs(psi(0))).toBeGreaterThan(0.05)
    expect(Math.abs(psi(-5))).toBeLessThan(Math.abs(psi(0)))
  })
  it('finite differences agree with the transcendental solution', () => {
    const dz = 0.05
    const N = Math.round(60 / dz)
    const V: number[] = []
    const ms: number[] = []
    for (let i = 0; i < N; i++) {
      const z = (i + 0.5) * dz - 30
      V.push(Math.abs(z) < L / 2 ? 0 : V0)
      ms.push(m)
    }
    const fd = solveProfile(V, ms, dz, fin.length, V0)
    for (let i = 0; i < fin.length; i++) expect(fd[i].E).toBeCloseTo(fin[i].E, 3)
  })
  it('with different barrier mass the matching uses ψ′/m (BenDaniel–Duke)', () => {
    const a = finiteWell(L, V0, 0.067, 0.092)
    const dz = 0.05
    const N = Math.round(60 / dz)
    const V: number[] = []
    const ms: number[] = []
    for (let i = 0; i < N; i++) {
      const z = (i + 0.5) * dz - 30
      const inside = Math.abs(z) < L / 2
      V.push(inside ? 0 : V0)
      ms.push(inside ? 0.067 : 0.092)
    }
    const fd = solveProfile(V, ms, dz, 2, V0)
    expect(fd[0].E).toBeCloseTo(a[0].E, 2)
  })
})

describe('wires, dots and the density of states (slides 12–13, 23–30)', () => {
  it('wire and dot levels add the confined directions', () => {
    expect(wireLevel(1, 1, 10, 10)).toBeCloseTo(2 * infiniteLevel(1, 10), 9)
    expect(dotLevel(1, 1, 1, 10, 10, 10)).toBeCloseTo(3 * infiniteLevel(1, 10), 9)
    expect(dotLevel(2, 1, 1, 10, 10, 10)).toBeCloseTo(6 * infiniteLevel(1, 10), 9)
    const dot = boxLevels(3, 10, 10, 10)
    expect(dot[0].q).toEqual([1, 1, 1])
    expect(dot[1].E).toBeCloseTo(6 * infiniteLevel(1, 10), 9) // (2,1,1) and its permutations: degenerate
  })
  it('counting k-space points reproduces N for 3D, 2D and 1D', () => {
    for (const dims of [1, 2, 3] as const) {
      const { counted, formula } = countStates(dims, 3, 60)
      expect(Math.abs(counted - formula) / formula, `${dims}D`).toBeLessThan(dims === 3 ? 0.12 : 0.06)
    }
  })
  it('ρ = (1/V) dN/dE: E^½, constant, E^−½', () => {
    const m = 0.067
    const N3 = (E: number) => Math.pow((m * E) / HB, 1.5) / (3 * Math.PI ** 2)
    const N2 = (E: number) => ((m * E) / HB) / (2 * Math.PI)
    const N1 = (E: number) => (2 * Math.sqrt((m * E) / HB)) / Math.PI
    const E = 0.05
    const d = 1e-7
    expect((N3(E + d) - N3(E - d)) / (2 * d)).toBeCloseTo(dos3(E, m), 3)
    expect((N2(E + d) - N2(E - d)) / (2 * d)).toBeCloseTo(dos2(E, m), 3)
    expect((N1(E + d) - N1(E - d)) / (2 * d)).toBeCloseTo(dos1(E, m), 3)
    expect(dos3(4 * E, m) / dos3(E, m)).toBeCloseTo(2, 6)
    expect(dos2(4 * E, m) / dos2(E, m)).toBeCloseTo(1, 6)
    expect(dos1(4 * E, m) / dos1(E, m)).toBeCloseTo(0.5, 6)
  })
})

describe('the heterostructure model', () => {
  it('GaAs/AlGaAs is type I with about 60:40 offsets', () => {
    const a = alignment(MAT.GaAs, MAT.AlGaAs)
    expect(a.type).toBe('I')
    expect(a.dEc / (a.dEc + a.dEv)).toBeGreaterThan(0.55)
    expect(a.dEc / (a.dEc + a.dEv)).toBeLessThan(0.65)
  })
  it('InP between InAlAs is type II: electrons in InP, holes in InAlAs', () => {
    const a = alignment(MAT.InP, MAT.InAlAs)
    expect(a.type).toBe('II')
    expect(a.electronIn).toBe('well')
    expect(a.holeIn).toBe('barrier')
  })
  it('the band profile of the QW sample confines levels in its 10 nm GaAs well', () => {
    const h = SAMPLE.qw
    const p = bandProfile(h, 0.1)
    expect(p.z.length).toBe(Math.round(totalNm(h) / 0.1))
    const well = spans(h).find((s) => s.role === 'well')!
    const lv = confinedLevels(h, 'e', 0.1)
    expect(lv.levels[0].E - Ec(MAT.GaAs)).toBeLessThan(infiniteLevel(1, 10, 0.067))
    expect(lv.levels[0].E - Ec(MAT.GaAs)).toBeGreaterThan(0.02)
    expect(lv.levels.length).toBeGreaterThan(0)
    // the ground state lives in the well
    let inWell = 0
    lv.z.forEach((z, i) => { if (z >= well.z0 && z < well.z1) inWell += lv.levels[0].psi[i] ** 2 * p.dz })
    expect(inWell).toBeGreaterThan(0.6)
  })
})
