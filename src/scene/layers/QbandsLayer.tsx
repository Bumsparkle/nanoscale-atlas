import * as THREE from 'three/webgpu'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { StudioLights } from '../Lighting'
import { ClearOnMiss, Inspectable, InspectSync } from '../Inspectable'
import { label, publish, useDive, useTabHome } from './shared'
import { useAtlas } from '../../state/store'
import { alignment, confinedLevels, Ec, Ev, MAT, SAMPLE, spans, type Heterostructure } from '../../chapters/nano/hetero'
import { Line } from './nanoShared'
import { P } from '../../theme/scene'

/**
 * Chapter 7 (Topic 8 slides 9–11): the layers become a potential.
 * x = depth (1 unit = 1 nm), y = energy (100 units = 1 eV).
 * - bands: the conduction and valence band edges of the sample, with the
 *   confined electron and hole levels and their |ψ|² (solved by finite
 *   differences on the actual profile);
 * - align: any two materials as barrier / well / barrier: where the electron
 *   and the hole fall decides type I or type II.
 */
export const EV = 70
const DEPTH = 12

/** a well of `well` between barriers of `barrier`, for the alignment tab */
export const alignSample = (well: string, barrier: string): Heterostructure => ({
  id: 'align', name: `${MAT[well].name} between ${MAT[barrier].name}`, slide: 11,
  layers: [
    { mat: barrier, nm: 30, role: 'barrier' },
    { mat: well, nm: 15, role: 'well' },
    { mat: barrier, nm: 30, role: 'barrier' },
  ],
})

function Edges({ h, x0, e0 }: { h: Heterostructure; x0: number; e0: number }) {
  const sp = spans(h)
  const y = (E: number) => (E - e0) * EV
  const pts = (f: (m: string) => number) => {
    const out: [number, number, number][] = []
    for (const l of sp) {
      out.push([x0 + l.z0, y(f(l.mat)), 0], [x0 + l.z1, y(f(l.mat)), 0])
    }
    return out
  }
  const slab = (f: (m: string) => number, col: string) =>
    sp.map((l, i) => (
      <mesh key={i} position={[x0 + (l.z0 + l.z1) / 2, y(f(l.mat)), 0]}>
        <boxGeometry args={[l.nm, 0.8, DEPTH]} />
        <meshStandardNodeMaterial color={col} roughness={0.4} emissive={col} emissiveIntensity={0.15} />
      </mesh>
    ))
  return (
    <>
      <Inspectable node="qb-cb" fit={1.6}>{slab((m) => Ec(MAT[m]), P.signal.beam)}<Line pts={pts((m) => Ec(MAT[m]))} r={0.3} color={P.signal.beam} segs={sp.length * 40} /></Inspectable>
      <Inspectable node="qb-vb" fit={1.6}>{slab((m) => Ev(MAT[m]), P.signal.amber)}<Line pts={pts((m) => Ev(MAT[m]))} r={0.3} color={P.signal.amber} segs={sp.length * 40} /></Inspectable>
    </>
  )
}

function Bands() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const sampleId = useAtlas((s) => s.nano.sample)
  const h = SAMPLE[sampleId] ?? SAMPLE.qw
  const sp = spans(h)
  const total = sp[sp.length - 1].z1
  const e0 = 0
  const lv = useMemo(() => ({ e: confinedLevels(h, 'e', 0.2, 3), h: confinedLevels(h, 'h', 0.2, 3) }), [h])
  const curves = (set: ReturnType<typeof confinedLevels>, col: string, sign: 1 | -1) =>
    set.levels.map((L, k) => {
      const pts: [number, number, number][] = set.z.map((z, i) => [z - total / 2, (L.E - e0) * EV + sign * L.psi[i] ** 2 * 45, DEPTH / 2 + 0.5])
      const line: [number, number, number][] = [[set.z[0] - total / 2, (L.E - e0) * EV, DEPTH / 2 + 0.4], [set.z[set.z.length - 1] - total / 2, (L.E - e0) * EV, DEPTH / 2 + 0.4]]
      return (
        <group key={k}>
          <Line pts={line} r={0.12} color={col} segs={8} />
          <Line pts={pts.filter((_, i) => i % 2 === 0)} r={0.22} color={col} emissive={col} />
        </group>
      )
    })
  useFrame(() => {
    if (useAtlas.getState().quiz) return publish([])
    const e1 = lv.e.levels[0]
    const h1 = lv.h.levels[0]
    publish([
      label(camera, size, 'b-cb', 'conduction band edge Ec', undefined, [total / 2 + 4, Ec(MAT[sp[sp.length - 1].mat]) * EV, 0], 'right'),
      label(camera, size, 'b-vb', 'valence band edge Ev', undefined, [total / 2 + 4, Ev(MAT[sp[sp.length - 1].mat]) * EV, 0], 'right'),
      ...(e1 && h1 ? [label(camera, size, 'b-gap', `e1 → hh1: ${(e1.E - h1.E).toFixed(3)} eV`, `${(1239.84 / (e1.E - h1.E)).toFixed(0)} nm emission`, [0, (Ec(MAT[sp[0].mat]) + 0.25) * EV, 0], 'top')] : []),
    ])
  })
  return (
    <group>
      <Edges h={h} x0={-total / 2} e0={e0} />
      <Inspectable node="qb-level" fit={2}>
        {curves(lv.e, P.signal.beamPale, 1)}
        {curves(lv.h, P.signal.holeWarm, -1)}
      </Inspectable>
    </group>
  )
}

function Align() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const well = useAtlas((s) => s.nano.well)
  const barrier = useAtlas((s) => s.nano.barrier)
  const h = alignSample(well, barrier)
  const a = alignment(MAT[well], MAT[barrier])
  const total = 75
  const eRef = useRef<THREE.Mesh>(null)
  const hRef = useRef<THREE.Mesh>(null)
  const t = useRef(0)
  useEffect(() => void (t.current = 0), [well, barrier])
  const minEc = Math.min(Ec(MAT[well]), Ec(MAT[barrier]))
  const maxEv = Math.max(Ev(MAT[well]), Ev(MAT[barrier]))
  // final positions: the electron at the lowest Ec, the hole at the highest Ev (holes float up in electron energy)
  const ex = a.electronIn === 'well' ? 0 : -26
  const hx = a.holeIn === 'well' ? 0 : 26
  useFrame((_, dt) => {
    const st = useAtlas.getState()
    t.current = Math.min(1, t.current + (st.reducedMotion ? 1 : dt * 0.6))
    const k = 1 - Math.pow(1 - t.current, 3)
    if (eRef.current) eRef.current.position.set(ex * k + -10 * (1 - k), (minEc + 0.03) * EV + (1 - k) * 40, DEPTH / 2 + 2)
    if (hRef.current) hRef.current.position.set(hx * k + 10 * (1 - k), (maxEv - 0.03) * EV - (1 - k) * 40, DEPTH / 2 + 2)
    if (st.quiz) return publish([])
    publish([
      label(camera, size, 'a-type', `type ${a.type}`, a.type === 'I' ? 'electron and hole in the same layer: efficient recombination' : 'electron and hole in different layers: long recombination time', [-total / 2 - 4, (Ec(MAT[barrier]) + 0.05) * EV, 0], 'side'),
      label(camera, size, 'a-dec', `ΔEc ${(a.dEc * 1000).toFixed(0)} meV`, `ΔEv ${(a.dEv * 1000).toFixed(0)} meV`, [total / 2 + 4, (Ec(MAT[barrier]) + Ec(MAT[well])) * EV * 0.5, 0], 'right'),
    ])
  })
  return (
    <group>
      <Edges h={h} x0={-total / 2} e0={0} />
      <Inspectable node="qb-electron" fit={3}>
        <mesh ref={eRef}>
          <sphereGeometry args={[2.2, 20, 14]} />
          <meshStandardNodeMaterial color={P.signal.beam} emissive={P.signal.beam} emissiveIntensity={0.6} />
        </mesh>
      </Inspectable>
      <Inspectable node="qb-hole" fit={3}>
        <mesh ref={hRef}>
          <sphereGeometry args={[2.2, 20, 14]} />
          <meshStandardNodeMaterial color={P.signal.amber} emissive={P.signal.amber} emissiveIntensity={0.5} transparent opacity={0.85} />
        </mesh>
      </Inspectable>
      {/* layer bands behind, so the materials are named in space */}
      {spans(h).map((l, i) => (
        <mesh key={i} position={[-total / 2 + (l.z0 + l.z1) / 2, (Ev(MAT[barrier]) * EV + Ec(MAT[barrier]) * EV) / 2, -DEPTH / 2 - 1]} raycast={() => null}>
          <planeGeometry args={[l.nm, (Ec(MAT[barrier]) - Ev(MAT[barrier])) * EV + 40]} />
          <meshBasicNodeMaterial color={MAT[l.mat].col} transparent opacity={0.25} />
        </mesh>
      ))}
    </group>
  )
}

export default function QbandsLayer() {
  const tab = useAtlas((s) => s.tab) || 'bands'
  useDive('hetero', 'qwave', { home: [0, 0, 0] })
  useTabHome('qbands', { target: [24, -8, 0], polar: 1.5, azimuth: 0.15, dist: 330 }, tab)
  return (
    <>
      <StudioLights scale={4} />
      {tab === 'align' ? <Align /> : <Bands />}
      <InspectSync />
      <ClearOnMiss radius={4000} />
    </>
  )
}
