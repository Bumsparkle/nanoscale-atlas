/**
 * Chapter 7 (Topic 8): the heterostructure model. A sample is a stack of
 * epitaxial layers; each layer is a material with a band gap, band offsets
 * and effective masses. Everything downstream (the 3D layer stack, the band
 * diagram, the confined levels and wavefunctions) is derived from this one
 * description, so the characterisation half can reuse it for the 2DEG and
 * the HEMT by adding layers and doping. See README "Heterostructure model".
 *
 * Beyond the lecture: material parameters are 300 K values from Vurgaftman,
 * Meyer & Ram-Mohan, J. Appl. Phys. 89, 5815 (2001). Band edges are placed on
 * one absolute scale by the valence-band offset (VBO): Ev = VBO, Ec = VBO + Eg.
 * Alloys are given directly (no interpolation), with offsets chosen to match
 * the commonly quoted ratios: GaAs/AlGaAs ≈ 60:40, InGaAs/GaAs ≈ 60:40,
 * InGaAs/InP ΔEc ≈ 0.25 eV. Strain shifts are ignored.
 */
import { solveProfile } from './quantum'
import { P } from '../../theme/scene'

export interface Material {
  id: string
  name: string
  /** band gap (eV), 300 K */
  Eg: number
  /** valence-band edge on the common scale (eV) */
  VBO: number
  /** electron and heavy-hole effective masses (units of m₀) */
  me: number
  mh: number
  /** lattice constant (Å) */
  a: number
  /** display colour */
  col: string
}

export const MATERIALS: Material[] = [
  { id: 'GaAs', name: 'GaAs', Eg: 1.424, VBO: -0.8, me: 0.067, mh: 0.5, a: 5.653, col: P.hetero.gaas },
  { id: 'AlGaAs', name: 'Al₀.₃Ga₀.₇As', Eg: 1.798, VBO: -0.95, me: 0.092, mh: 0.55, a: 5.655, col: P.hetero.algaas },
  { id: 'InGaAs', name: 'In₀.₂Ga₀.₈As', Eg: 1.134, VBO: -0.684, me: 0.058, mh: 0.45, a: 5.734, col: P.hetero.ingaas },
  { id: 'InGaAs40', name: 'In₀.₄Ga₀.₆As', Eg: 0.882, VBO: -0.583, me: 0.048, mh: 0.43, a: 5.815, col: P.hetero.ingaas40 },
  { id: 'InAs', name: 'InAs', Eg: 0.354, VBO: -0.59, me: 0.023, mh: 0.41, a: 6.058, col: P.hetero.inas },
  { id: 'GaSb', name: 'GaSb', Eg: 0.726, VBO: -0.03, me: 0.039, mh: 0.4, a: 6.096, col: P.hetero.gasb },
  { id: 'InP', name: 'InP', Eg: 1.344, VBO: -0.94, me: 0.08, mh: 0.6, a: 5.869, col: P.hetero.inp },
  { id: 'InGaAsP', name: 'In₀.₅₃Ga₀.₄₇As', Eg: 0.75, VBO: -0.6, me: 0.041, mh: 0.45, a: 5.869, col: P.hetero.ingaasp },
  { id: 'InAlAs', name: 'In₀.₅₂Al₀.₄₈As', Eg: 1.46, VBO: -0.79, me: 0.075, mh: 0.5, a: 5.869, col: P.hetero.inalas },
]
export const MAT: Record<string, Material> = Object.fromEntries(MATERIALS.map((m) => [m.id, m]))
export const Ec = (m: Material) => m.VBO + m.Eg
export const Ev = (m: Material) => m.VBO

export interface Layer {
  mat: string
  /** thickness (nm) */
  nm: number
  /** role, for inspection and the 3D view */
  role: 'substrate' | 'buffer' | 'barrier' | 'well' | 'cladding' | 'cap' | 'dots' | 'spacer'
  /** donor or acceptor density (cm⁻³), for the 2DEG/HEMT later; positive = n, negative = p */
  doping?: number
}

export interface Heterostructure {
  id: string
  name: string
  /** layers from the substrate up */
  layers: Layer[]
  /** slide this sample illustrates */
  slide: number
}

/** the samples the MBE chamber can grow */
export const SAMPLES: Heterostructure[] = [
  {
    id: 'qw', name: 'GaAs quantum well in AlGaAs', slide: 9,
    layers: [
      { mat: 'GaAs', nm: 40, role: 'substrate' },
      { mat: 'AlGaAs', nm: 30, role: 'barrier' },
      { mat: 'GaAs', nm: 10, role: 'well' },
      { mat: 'AlGaAs', nm: 30, role: 'barrier' },
      { mat: 'GaAs', nm: 10, role: 'cap' },
    ],
  },
  {
    id: 'mqw', name: 'InGaAs/GaAs multiple quantum wells', slide: 14,
    layers: [
      { mat: 'GaAs', nm: 40, role: 'substrate' },
      { mat: 'InGaAs', nm: 8, role: 'well' },
      { mat: 'GaAs', nm: 20, role: 'barrier' },
      { mat: 'InGaAs', nm: 8, role: 'well' },
      { mat: 'GaAs', nm: 20, role: 'barrier' },
      { mat: 'InGaAs', nm: 8, role: 'well' },
      { mat: 'GaAs', nm: 30, role: 'cap' },
    ],
  },
  {
    id: 'type2', name: 'InP / InAlAs (type II)', slide: 11,
    layers: [
      { mat: 'InP', nm: 40, role: 'substrate' },
      { mat: 'InAlAs', nm: 20, role: 'barrier' },
      { mat: 'InP', nm: 10, role: 'well' },
      { mat: 'InAlAs', nm: 20, role: 'barrier' },
      { mat: 'InP', nm: 10, role: 'cap' },
    ],
  },
  {
    id: 'qdlaser', name: 'Quantum-dot laser', slide: 33,
    layers: [
      { mat: 'GaAs', nm: 40, role: 'substrate', doping: 2e18 },
      { mat: 'AlGaAs', nm: 40, role: 'cladding', doping: 1e18 },
      { mat: 'GaAs', nm: 20, role: 'spacer' },
      { mat: 'InGaAs40', nm: 6, role: 'dots' },
      { mat: 'GaAs', nm: 20, role: 'spacer' },
      { mat: 'AlGaAs', nm: 40, role: 'cladding', doping: -1e18 },
      { mat: 'GaAs', nm: 10, role: 'cap', doping: -5e18 },
    ],
  },
]
export const SAMPLE: Record<string, Heterostructure> = Object.fromEntries(SAMPLES.map((s) => [s.id, s]))

export const totalNm = (h: Heterostructure) => h.layers.reduce((a, l) => a + l.nm, 0)

/** the first `n` layers: the stack as grown so far */
export const grownTo = (h: Heterostructure, n: number): Heterostructure => ({ ...h, layers: h.layers.slice(0, Math.max(0, Math.min(h.layers.length, n))) })

/** a layer's span [z0, z1) in nm from the substrate's bottom */
export function spans(h: Heterostructure) {
  let z = 0
  return h.layers.map((l) => {
    const s = { ...l, z0: z, z1: z + l.nm }
    z += l.nm
    return s
  })
}

/**
 * Band profile sampled every dz nm: conduction and valence band edges and
 * the electron and hole masses at each point (flat bands, no doping fields).
 */
export function bandProfile(h: Heterostructure, dz = 0.25) {
  const sp = spans(h)
  const N = Math.max(2, Math.round(totalNm(h) / dz))
  const z: number[] = []
  const Ecz: number[] = []
  const Evz: number[] = []
  const me: number[] = []
  const mh: number[] = []
  for (let i = 0; i < N; i++) {
    const zz = (i + 0.5) * dz
    const l = sp.find((s) => zz >= s.z0 && zz < s.z1) ?? sp[sp.length - 1]
    const m = MAT[l.mat]
    z.push(zz)
    Ecz.push(Ec(m))
    Evz.push(Ev(m))
    me.push(m.me)
    mh.push(m.mh)
  }
  return { z, Ec: Ecz, Ev: Evz, me, mh, dz }
}

/**
 * Band alignment of a layer of `well` between `barrier` layers (slide 11).
 * Type I: the narrow gap nests inside the wide one. Type II: staggered, the
 * conduction minimum in one material and the valence maximum in the other.
 * Type III (broken gap): one conduction band lies below the other valence band.
 */
export function alignment(well: Material, barrier: Material): { type: 'I' | 'II' | 'III'; electronIn: 'well' | 'barrier'; holeIn: 'well' | 'barrier'; dEc: number; dEv: number } {
  const dEc = Ec(barrier) - Ec(well)
  const dEv = Ev(well) - Ev(barrier)
  const electronIn = dEc >= 0 ? 'well' : 'barrier'
  const holeIn = dEv >= 0 ? 'well' : 'barrier'
  let type: 'I' | 'II' | 'III' = electronIn === holeIn ? 'I' : 'II'
  if (Ec(well) < Ev(barrier) || Ec(barrier) < Ev(well)) type = 'III'
  return { type, electronIn, holeIn, dEc, dEv }
}

/** lattice mismatch of a layer to the substrate (fraction) */
export const mismatch = (layer: Material, sub: Material) => (layer.a - sub.a) / sub.a

/**
 * Confined levels of electrons ('e') or holes ('h') in the sample: solved on
 * the region from the first barrier (or cladding) to the last, so the thick
 * substrate and cap do not trap states of their own. Energies are absolute
 * (eV on the band-edge scale): electron levels above Ec, hole levels below Ev.
 */
export function confinedLevels(h: Heterostructure, carrier: 'e' | 'h', dz = 0.2, count = 4) {
  const sp = spans(h)
  const conf = sp.filter((s) => s.role === 'barrier' || s.role === 'cladding')
  const z0 = conf.length ? conf[0].z0 : 0
  const z1 = conf.length ? conf[conf.length - 1].z1 : totalNm(h)
  const p = bandProfile(h, dz)
  const idx = p.z.map((z, i) => [z, i] as const).filter(([z]) => z >= z0 && z < z1).map(([, i]) => i)
  const edge = carrier === 'e' ? idx.map((i) => p.Ec[i]) : idx.map((i) => -p.Ev[i])
  const mass = carrier === 'e' ? idx.map((i) => p.me[i]) : idx.map((i) => p.mh[i])
  const base = Math.min(...edge)
  const top = Math.max(...edge)
  const V = edge.map((e) => e - base)
  const sol = solveProfile(V, mass, dz, count, top - base)
  return {
    z: idx.map((i) => p.z[i]),
    levels: sol.map((s) => ({ E: carrier === 'e' ? base + s.E : -(base + s.E), psi: s.psi })),
    depth: top - base,
  }
}
