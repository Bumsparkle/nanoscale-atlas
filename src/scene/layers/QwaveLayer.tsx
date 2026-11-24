import * as THREE from 'three/webgpu'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { StudioLights } from '../Lighting'
import { ClearOnMiss, Inspectable, InspectSync } from '../Inspectable'
import { label, publish, useDive, useTabHome } from './shared'
import { useApp } from '../../state/store'
import { boxLevels, countStates, finitePsi, finiteWell, freeEnergy, HB, infiniteLevel, infinitePsi } from '../../chapters/nano/quantum'
import { Line } from './nanoShared'
import { P } from '../../theme/scene'

/**
 * Chapter 7 (Topic 8 slides 4–13, 23–31): wavefunctions, exactly.
 * - free: E = ħ²k²/2m and the travelling wave e^(ikx) (slide 5);
 * - well: infinite or finite well, levels, ψ or |ψ|² on each level, the
 *   infinite levels drawn faint for comparison (slides 6–10);
 * - confine: the same box confined in 1, 2 or 3 directions (slides 12–13);
 * - dos: counting states in k-space as the confinement grows (23–30).
 */
type N = ReturnType<typeof useApp.getState>['nano']

function Free() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const { k, m } = useApp((s) => s.nano)
  const KX = 40 // units per nm⁻¹
  const kmax = 1.2
  const EY = 80 / freeEnergy(kmax, m) // units per eV, so the parabola fits
  const par = useMemo(() => Array.from({ length: 121 }, (_, i) => { const kk = -kmax + (2 * kmax * i) / 120; return [kk * KX, freeEnergy(kk, m) * EY, 0] as [number, number, number] }), [m])
  const E = freeEnergy(k, m)
  const wave = useMemo(() => Array.from({ length: 300 }, (_, i) => { const x = -30 + (60 * i) / 299; return [x * 1.6, -25 + 8 * Math.cos(k * x), 0] as [number, number, number] }), [k])
  useFrame(() => {
    if (useApp.getState().quiz) return publish([])
    publish([
      label(camera, size, 'w-e', `k = ${k.toFixed(2)} nm⁻¹`, `E = ħ²k²/2m = ${(E * 1000).toFixed(1)} meV (m = ${m} m₀)`, [k * KX, E * EY, 0], 'right'),
      label(camera, size, 'w-psi', 'Re ψ = cos kx', `wavelength ${(2 * Math.PI / Math.max(k, 1e-3)).toFixed(1)} nm`, [52, -25, 0], 'right'),
    ])
  })
  return (
    <group>
      <Inspectable node="qv-dispersion" fit={1.6}>
        <Line pts={par} r={0.5} color={P.signal.beam} emissive={P.signal.beam} />
        <mesh position={[k * KX, E * EY, 0]}>
          <sphereGeometry args={[1.8, 16, 12]} />
          <meshStandardNodeMaterial color={P.signal.amber} emissive={P.signal.amber} emissiveIntensity={0.6} />
        </mesh>
        <Line pts={[[-kmax * KX, 0, 0], [kmax * KX, 0, 0]]} r={0.15} color={P.obj.steel} segs={4} />
        <Line pts={[[0, -2, 0], [0, 75, 0]]} r={0.15} color={P.obj.steel} segs={4} />
      </Inspectable>
      <Inspectable node="qv-psi" fit={1.6}>
        <Line pts={wave} r={0.35} color={P.signal.beamPale} />
      </Inspectable>
    </group>
  )
}

/** levels and wavefunctions of the well; x in nm × XS, E scaled to fit */
function Well() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const n = useApp((s) => s.nano)
  const XS = 4
  const fin = useMemo(() => (n.finite ? finiteWell(n.L, n.V0, n.m) : []), [n.finite, n.L, n.V0, n.m])
  const count = n.finite ? fin.length : 4
  const Etop = n.finite ? n.V0 * 1.2 : infiniteLevel(4, n.L, n.m) * 1.15
  const EY = 110 / Etop
  const half = (n.L / 2) * XS
  const span = Math.max(n.L * 1.2, 10)
  const levels = n.finite ? fin.map((l) => ({ n: l.n, E: l.E })) : [1, 2, 3, 4].map((k) => ({ n: k, E: infiniteLevel(k, n.L, n.m) }))
  const curves = useMemo(() => levels.map((lv, i) => {
    const psi = n.finite ? finitePsi(fin[i], n.L, n.V0, n.m) : (x: number) => infinitePsi(lv.n, n.L, x)
    const amp = (Etop * EY) / (count + 1) / 2 / Math.sqrt(2 / n.L)
    const pts: [number, number, number][] = []
    for (let j = 0; j <= 240; j++) {
      const x = -span / 2 + (span * j) / 240 + n.L / 2 // x from the left wall
      const v = psi(x)
      pts.push([(x - n.L / 2) * XS, lv.E * EY + (n.prob ? (v * v * amp * amp) / (amp * Math.sqrt(2 / n.L)) * 0.9 : v * amp), 0.5])
    }
    return pts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [n.finite, n.L, n.V0, n.m, n.prob, fin, EY])
  useFrame(() => {
    if (useApp.getState().quiz) return publish([])
    const sel = levels[Math.min(levels.length, n.level) - 1]
    publish([
      ...levels.map((lv) => label(camera, size, `wl-${lv.n}`, `n = ${lv.n}`, `${(lv.E * 1000).toFixed(1)} meV${n.finite ? ` (infinite: ${(infiniteLevel(lv.n, n.L, n.m) * 1000).toFixed(1)})` : ''}`, [span * XS * 0.5 + 2, lv.E * EY, 0], 'right')),
      ...(sel ? [label(camera, size, 'wl-sel', n.finite ? `${count} bound level${count === 1 ? '' : 's'}` : 'infinite walls', n.finite ? `depth V₀ = ${(n.V0 * 1000).toFixed(0)} meV` : `L = ${n.L} nm · m = ${n.m} m₀`, [0, Etop * EY + 6, 0], 'top')] : []),
    ])
  })
  return (
    <group>
      <Inspectable node="qv-well" fit={1.6}>
        {n.finite ? (
          [-1, 1].map((s) => (
            <mesh key={s} position={[s * (half + (span * XS) / 4), (n.V0 * EY) / 2, -2]}>
              <boxGeometry args={[(span * XS) / 2 - 0.1, n.V0 * EY, 4]} />
              <meshStandardNodeMaterial color={P.obj.substrate} transparent opacity={0.6} />
            </mesh>
          ))
        ) : (
          [-1, 1].map((s) => (
            <mesh key={s} position={[s * (half + 3), (Etop * EY) / 2 + 5, -2]}>
              <boxGeometry args={[6, Etop * EY + 10, 4]} />
              <meshStandardNodeMaterial color={P.obj.substrate} />
            </mesh>
          ))
        )}
        <mesh position={[0, -0.5, -2]}>
          <boxGeometry args={[span * XS, 1, 4]} />
          <meshStandardNodeMaterial color={P.obj.barrier} />
        </mesh>
      </Inspectable>
      <Inspectable node="qv-level" fit={2}>
        {levels.map((lv) => (
          <Line key={lv.n} pts={[[-(n.finite ? span * XS * 0.5 : half), lv.E * EY, 0.3], [n.finite ? span * XS * 0.5 : half, lv.E * EY, 0.3]]} r={lv.n === n.level ? 0.35 : 0.18} color={lv.n === n.level ? P.signal.amber : P.signal.level} segs={4} />
        ))}
        {n.finite && levels.map((lv) => (
          <Line key={`inf${lv.n}`} pts={[[-half, infiniteLevel(lv.n, n.L, n.m) * EY, -0.5], [half, infiniteLevel(lv.n, n.L, n.m) * EY, -0.5]]} r={0.1} color={P.signal.ghost} segs={4} />
        ))}
      </Inspectable>
      <Inspectable node="qv-psi" fit={2}>
        {curves.map((pts, i) => <Line key={i} pts={pts} r={i + 1 === n.level ? 0.4 : 0.22} color={n.prob ? P.signal.holeWarm : P.signal.beam} emissive={i + 1 === n.level ? (n.prob ? P.signal.holeWarm : P.signal.beam) : undefined} />)}
      </Inspectable>
    </group>
  )
}

function Confine() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const n = useApp((s) => s.nano)
  const U = 3
  const big = 40
  const dims = n.dims
  const sx = dims >= 3 ? n.c * U : big * U // x: free unless a dot
  const sy = n.a * U // y: always confined
  const sz = dims >= 2 ? n.b * U : big * U
  const lv = useMemo(() => boxLevels(dims, n.a, n.b, n.c, n.m, 5), [dims, n.a, n.b, n.c, n.m])
  const EY = 110 / Math.max(lv[lv.length - 1].E * 1.1, 1e-3)
  const glow = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (useApp.getState().quiz) return publish([])
    publish([
      label(camera, size, 'c-what', dims === 1 ? 'quantum well: confined in 1 direction' : dims === 2 ? 'quantum wire: confined in 2' : 'quantum dot: confined in 3', dims === 1 ? 'free in the plane: a subband above each level' : dims === 2 ? 'free along its length' : 'discrete levels only: an artificial atom', [0, sy / 2 + 14, 0], 'top'),
      ...lv.map((l, i) => label(camera, size, `c-${i}`, `(${l.q.join(',')})`, `${(l.E * 1000).toFixed(0)} meV`, [Math.max(sx, 40) / 2 + 30, l.E * EY - 40, 0], 'right')),
    ])
  })
  return (
    <group>
      <Inspectable node="qv-box" fit={1.5}>
        <mesh>
          <boxGeometry args={[sx, sy, sz]} />
          <meshStandardNodeMaterial color={P.obj.well} transparent opacity={0.35 * P.k.sheet} roughness={0.3} depthWrite={false} />
        </mesh>
        <mesh ref={glow} scale={[dims >= 3 ? sx * 0.3 : sx * 0.48, sy * 0.3, dims >= 2 ? sz * 0.3 : sz * 0.48]}>
          <sphereGeometry args={[1, 24, 16]} />
          <meshBasicNodeMaterial color={P.signal.beam} transparent opacity={0.45 * P.k.sheet} depthWrite={false} />
        </mesh>
      </Inspectable>
      <Inspectable node="qv-level" fit={2}>
        {lv.map((l, i) => (
          <group key={i}>
            <Line pts={[[Math.max(sx, 40) / 2 + 12, l.E * EY - 40, 0], [Math.max(sx, 40) / 2 + 28, l.E * EY - 40, 0]]} r={0.35} color={P.signal.amber} segs={4} />
            {dims < 3 && (
              <mesh position={[Math.max(sx, 40) / 2 + 20, l.E * EY - 40 + 4, -0.5]} raycast={() => null}>
                <planeGeometry args={[16, 8]} />
                <meshBasicNodeMaterial color={P.signal.amber} transparent opacity={0.12 * P.k.sheet} />
              </mesh>
            )}
          </group>
        ))}
      </Inspectable>
    </group>
  )
}

/** k-space: the allowed standing waves on a grid of spacing π/L; the states below E fill a sphere, disc or line */
function Dos() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const n = useApp((s) => s.nano)
  const Lbox = 60
  const step = Math.PI / Lbox
  const M = 12
  const U = 6 // units per grid step
  const kE = Math.sqrt(((n.E / 1000) * n.m) / HB)
  const R = (kE / step) * U
  const dims = (n.dof === 0 ? 0 : n.dof) as 0 | 1 | 2 | 3
  const inst = useRef<THREE.InstancedMesh>(null)
  const pts = useMemo(() => {
    const out: [number, number, number][] = []
    if (dims === 0) return out
    for (let a = 1; a <= M; a++) for (let b = 1; b <= (dims >= 2 ? M : 1); b++) for (let c = 1; c <= (dims >= 3 ? M : 1); c++) out.push([a, dims >= 2 ? b : 0, dims >= 3 ? c : 0])
    return out
  }, [dims])
  const cnt = dims ? countStates(dims, kE, Lbox) : { counted: 0, formula: 0 }
  useEffect(() => {
    const m = inst.current
    if (!m) return
    const o = new THREE.Object3D()
    const cIn = new THREE.Color(P.signal.amber)
    const cOut = new THREE.Color(P.signal.off)
    pts.forEach((p, i) => {
      o.position.set(p[0] * U, p[2] * U, p[1] * U)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
      const inside = Math.hypot(p[0], p[1], p[2]) * U <= R
      m.setColorAt(i, inside ? cIn : cOut)
    })
    m.count = pts.length
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [pts, R])
  useFrame(() => {
    if (useApp.getState().quiz) return publish([])
    publish(dims === 0
      ? [label(camera, size, 'd-0', '0D: no k-space to fill', 'states only at discrete energies: ρ = 2δ(E − Eₙ)', [30, 30, 30], 'top')]
      : [label(camera, size, 'd-n', `${cnt.counted} states below ${n.E} meV (×2 spin)`, `formula ${dims === 3 ? 'k³V/3π²' : dims === 2 ? 'k²A/2π' : '2kL/π'} = ${cnt.formula.toFixed(0)}`, [R * 0.7, dims >= 3 ? R * 0.7 : 4, R * 0.4], 'top')])
  })
  return (
    <group>
      <Inspectable node="qv-kspace" fit={1.4}>
        <instancedMesh key={dims} ref={inst} args={[undefined, undefined, Math.max(1, pts.length)]}>
          <sphereGeometry args={[0.9, 8, 6]} />
          <meshStandardNodeMaterial color={P.obj.white} />
        </instancedMesh>
        {dims === 3 && (
          <mesh raycast={() => null}>
            <sphereGeometry args={[Math.max(0.1, R), 40, 24, Math.PI / 2, Math.PI / 2, 0, Math.PI / 2]} />
            <meshStandardNodeMaterial color={P.signal.beam} transparent opacity={0.22 * P.k.sheet} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        )}
        {dims === 2 && (
          <mesh rotation-x={Math.PI / 2} raycast={() => null}>
            <circleGeometry args={[Math.max(0.1, R), 48, 0, Math.PI / 2]} />
            <meshBasicNodeMaterial color={P.signal.beam} transparent opacity={0.25 * P.k.sheet} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        )}
        {dims === 1 && <Line pts={[[0, 0, 0], [Math.max(0.1, R), 0, 0]]} r={0.6} color={P.signal.beam} segs={4} />}
        {dims === 0 && [1, 2, 3].map((k) => (
          <mesh key={k} position={[k * 18, 10, 0]}>
            <boxGeometry args={[1.2, 30, 1.2]} />
            <meshStandardNodeMaterial color={P.signal.amber} emissive={P.signal.amber} emissiveIntensity={0.5} />
          </mesh>
        ))}
        {/* axes */}
        <Line pts={[[0, 0, 0], [(M + 1) * U, 0, 0]]} r={0.2} color={P.obj.steel} segs={4} />
        {dims >= 2 && <Line pts={[[0, 0, 0], [0, 0, (M + 1) * U]]} r={0.2} color={P.obj.steel} segs={4} />}
        {dims >= 3 && <Line pts={[[0, 0, 0], [0, (M + 1) * U, 0]]} r={0.2} color={P.obj.steel} segs={4} />}
      </Inspectable>
    </group>
  )
}

const HOMES: Record<string, { target: [number, number, number]; polar: number; azimuth: number; dist: number }> = {
  free: { target: [16, 14, 0], polar: 1.52, azimuth: 0.05, dist: 230 },
  well: { target: [28, 60, 0], polar: 1.52, azimuth: 0.08, dist: 260 },
  confine: { target: [40, 0, 0], polar: 1.25, azimuth: 0.6, dist: 300 },
  dos: { target: [44, 18, 30], polar: 1.05, azimuth: 0.78, dist: 260 },
}

export default function QwaveLayer() {
  const tab = useApp((s) => s.tab) || 'free'
  useDive('qbands', null)
  useTabHome('qwave', HOMES[tab] ?? HOMES.free, tab)
  return (
    <>
      <StudioLights scale={4} />
      {tab === 'well' ? <Well /> : tab === 'confine' ? <Confine /> : tab === 'dos' ? <Dos /> : <Free />}
      <InspectSync />
      <ClearOnMiss radius={4000} />
    </>
  )
}

export type { N as NanoState }
