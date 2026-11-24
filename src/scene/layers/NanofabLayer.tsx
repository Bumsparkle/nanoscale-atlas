import * as THREE from 'three/webgpu'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import { StudioLights } from '../Lighting'
import { ClearOnMiss, Inspectable, InspectSync } from '../Inspectable'
import { label, publish, rand, useDive, useTabHome, useUnits } from './shared'
import { useAtlas } from '../../state/store'
import { colloidColour, colloidGapEv, qdLaserThreshold, skState, VLS_STEPS } from '../../chapters/nano/fab'

/**
 * Chapter 7 (Topic 8 slides 14–22, 32–33): making nanostructures.
 * Wires: an etched ridge and split gates (slide 15); VLS nanowires with a
 * gold or self-catalysed droplet (16); dots by etched pillars (18), colloidal
 * synthesis (19), patterned growth (20) and Stranski–Krastanov self-assembly
 * (21–22); and the quantum-dot laser (32–33).
 */
const C = { gaas: '#5f7486', algaas: '#9aa7b4', ingaas: '#d08a4a', inas: '#c8553d', au: '#e8c547', ga: '#c9ced2', sio2: '#c9d6dc', gate: '#b0b8be' }

function Box({ p, s, c, o = 1, e }: { p: [number, number, number]; s: [number, number, number]; c: string; o?: number; e?: number }) {
  return (
    <mesh position={p}>
      <boxGeometry args={s} />
      <meshStandardNodeMaterial color={c} roughness={0.45} transparent={o < 1} opacity={o} emissive={c} emissiveIntensity={e ?? 0} />
    </mesh>
  )
}

/** A/B/A well; (a) etched into a ridge, (b) under split gates */
function Wires() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  useFrame(() => {
    if (useAtlas.getState().quiz) return publish([])
    publish([
      label(camera, size, 'w-a', '(a) etching', 'the ridge walls confine the well sideways', [-40, 34, 0], 'top'),
      label(camera, size, 'w-b', '(b) split gates', 'negative gates deplete all but a strip under the gap', [40, 34, 0], 'top'),
    ])
  })
  const stack = (x: number, w: number) => (
    <>
      <Box p={[x, 4, 0]} s={[w, 8, 50]} c={C.algaas} />
      <Box p={[x, 10, 0]} s={[w, 4, 50]} c={C.ingaas} e={0.15} />
      <Box p={[x, 16, 0]} s={[w, 8, 50]} c={C.algaas} />
    </>
  )
  return (
    <group>
      <Inspectable node="nf-mesa" fit={1.6}>
        <Box p={[-40, -4, 0]} s={[50, 8, 50]} c={C.gaas} />
        {stack(-40, 10)}
      </Inspectable>
      <Inspectable node="nf-gates" fit={1.6}>
        <Box p={[40, -4, 0]} s={[50, 8, 50]} c={C.gaas} />
        {stack(40, 50)}
        <Box p={[27, 21, 0]} s={[18, 2, 50]} c={C.gate} />
        <Box p={[53, 21, 0]} s={[18, 2, 50]} c={C.gate} />
        <Box p={[40, 10, 0]} s={[6, 4.2, 50.5]} c="#7dd3fc" o={0.6} e={0.4} />
      </Inspectable>
    </group>
  )
}

/** VLS: catalyst → eutectic → supersaturation and nucleation → growth → tapering (1 unit = 10 nm) */
function Vls() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const { fstep, seed } = useAtlas((s) => s.nano)
  const s = Math.min(fstep, VLS_STEPS.length - 1)
  const H = [0, 0, 3, 40, 60][s]
  const r = 4
  const drop = seed === 'au' ? C.au : C.ga
  const dropR = s === 0 ? 3 : 4.6
  useFrame(() => {
    if (useAtlas.getState().quiz) return publish([])
    publish([label(camera, size, 'v', `${s + 1}. ${VLS_STEPS[s].t}`, `${seed === 'au' ? 'Au seed' : 'self-catalysed: Ga droplet'} · ${VLS_STEPS[s].p}`, [-8, H / 2 + 6, 0], 'side')])
  })
  return (
    <group>
      <Box p={[0, -3, 0]} s={[60, 6, 40]} c={C.gaas} />
      {H > 0 && (
        <Inspectable node="nf-nanowire" fit={1.6}>
          <mesh position={[0, H / 2, 0]}>
            <cylinderGeometry args={[r, s >= 4 ? r * 1.8 : r, H, 6]} />
            <meshStandardNodeMaterial color={C.gaas} roughness={0.35} metalness={0.2} flatShading />
          </mesh>
        </Inspectable>
      )}
      <Inspectable node="nf-droplet" fit={3}>
        <mesh position={[0, H + dropR * 0.55, 0]} scale={[1, 0.8, 1]}>
          <sphereGeometry args={[dropR, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          <meshStandardNodeMaterial color={drop} metalness={0.9} roughness={0.2} />
        </mesh>
      </Inspectable>
      {/* Ga and As arriving */}
      {s >= 1 && s <= 3 && [[-12, 1], [12, 0], [-8, 0], [9, 1]].map(([x, as], i) => (
        <mesh key={i} position={[x, H + 12 + i * 2, (i % 2) * 6 - 3]}>
          <sphereGeometry args={[0.9, 10, 8]} />
          <meshBasicNodeMaterial color={as ? '#8a8f6a' : C.ga} />
        </mesh>
      ))}
    </group>
  )
}

/** etched pillars in a QW stack: GaAs / AlGaAs / InGaAs / AlGaAs / GaAs (slide 18) */
function Pillars() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const etched = useAtlas((s) => s.nano.fstep) >= 1
  useFrame(() => {
    if (useAtlas.getState().quiz) return publish([])
    publish([label(camera, size, 'p', etched ? 'pillars etched after e-beam lithography' : 'quantum-well wafer', etched ? 'the well confines vertically, the pillar walls sideways · damaged walls (red)' : 'press next to pattern and etch', [0, 34, 0], 'top')])
  })
  const xs = etched ? [-30, -10, 10, 30] : [0]
  const w = etched ? 9 : 80
  return (
    <group>
      <Box p={[0, -4, 0]} s={[90, 8, 60]} c={C.gaas} />
      <Inspectable node="nf-pillar" fit={1.6}>
        {xs.flatMap((x) => (etched ? [-15, 15] : [0]).map((z) => (
          <group key={`${x},${z}`} position={[x, 0, z]}>
            <Box p={[0, 3, 0]} s={[w, 6, etched ? w : 60]} c={C.gaas} />
            <Box p={[0, 8, 0]} s={[w, 4, etched ? w : 60]} c={C.algaas} />
            <Box p={[0, 11, 0]} s={[w, 2, etched ? w : 60]} c={C.ingaas} e={0.2} />
            <Box p={[0, 14, 0]} s={[w, 4, etched ? w : 60]} c={C.algaas} />
            <Box p={[0, 18, 0]} s={[w, 4, etched ? w : 60]} c={C.gaas} />
            {etched && <Box p={[0, 10, 0]} s={[w + 0.6, 20, w + 0.6]} c="#e0453c" o={0.18} />}
          </group>
        )))}
      </Inspectable>
    </group>
  )
}

/** colloidal dots: core–shell spheres; size sets the colour (slide 19) */
function Colloid() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const d = useAtlas((s) => s.nano.dotNm)
  const col = colloidColour(d)
  const dots = useMemo(() => {
    const r = rand(4)
    return Array.from({ length: 40 }, () => ({ p: [(r() - 0.5) * 60, (r() - 0.5) * 30, (r() - 0.5) * 30] as [number, number, number], s: 1 + (r() - 0.5) * 0.3 }))
  }, [])
  useFrame(() => {
    if (useAtlas.getState().quiz) return publish([])
    const E = colloidGapEv(d)
    publish([label(camera, size, 'c', `${d} nm CdSe core, ZnS shell`, `emits ≈ ${(1239.84 / E).toFixed(0)} nm · size dispersion ±15 %`, [0, 22, 0], 'top')])
  })
  return (
    <Inspectable node="nf-colloid" fit={1.4}>
      {dots.map((o, i) => (
        <group key={i} position={o.p} scale={o.s * d * 0.6}>
          <mesh>
            <sphereGeometry args={[1, 16, 12]} />
            <meshStandardNodeMaterial color={col} emissive={col} emissiveIntensity={0.9} />
          </mesh>
          <mesh>
            <sphereGeometry args={[1.35, 16, 12]} />
            <meshStandardNodeMaterial color="#e8eef2" transparent opacity={0.25} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </Inspectable>
  )
}

/** pyramid recesses in an SiO₂ mask on (111)B GaAs; a dot at each apex (slide 20) */
function Patterned() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const grown = useAtlas((s) => s.nano.fstep) >= 1
  useFrame(() => {
    if (useAtlas.getState().quiz) return publish([])
    publish([label(camera, size, 'pg', grown ? 'GaAs dots at the pyramid tips' : 'SiO₂ mask with triangular openings', 'the density is set by the mask pattern', [0, 26, 0], 'top')])
  })
  const sites = [[-24, -12], [0, -12], [24, -12], [-12, 12], [12, 12]]
  return (
    <group>
      <Box p={[0, -4, 0]} s={[80, 8, 60]} c={C.gaas} />
      <Inspectable node="nf-pyramid" fit={1.5}>
        <Box p={[0, 0.5, 0]} s={[80, 1, 60]} c={C.sio2} o={0.7} />
        {grown && sites.map(([x, z], i) => (
          <group key={i} position={[x, 1, z]}>
            <mesh position={[0, 6, 0]}>
              <coneGeometry args={[7, 12, 3]} />
              <meshStandardNodeMaterial color={C.algaas} flatShading roughness={0.4} />
            </mesh>
            <mesh position={[0, 10.5, 0]}>
              <coneGeometry args={[1.6, 2.8, 3]} />
              <meshStandardNodeMaterial color={C.ingaas} emissive={C.ingaas} emissiveIntensity={0.4} flatShading />
            </mesh>
          </group>
        ))}
      </Inspectable>
    </group>
  )
}

/** Stranski–Krastanov: a wetting layer, then islands above the critical thickness (slides 21–22); 1 unit = 1 nm */
function Sk() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const ml = useAtlas((s) => s.nano.fstep) * 0.5
  const st = skState(ml)
  const islands = useMemo(() => {
    const r = rand(9)
    const out: { x: number; z: number; k: number }[] = []
    for (let tries = 0; out.length < 8 && tries < 400; tries++) {
      const c = { x: (r() - 0.5) * 130, z: (r() - 0.5) * 80, k: 0.8 + r() * 0.35 }
      if (out.every((o) => Math.hypot(o.x - c.x, o.z - c.z) > 44)) out.push(c)
    }
    return out
  }, [])
  useFrame(() => {
    if (useAtlas.getState().quiz) return publish([])
    publish([label(camera, size, 'sk', `${ml.toFixed(1)} ML of InAs on GaAs`, st.islands ? `islands ~${st.h.toFixed(0)} nm high, ~${st.w.toFixed(0)} nm wide on the wetting layer` : 'a strained 2D wetting layer', [0, 22, 0], 'top')])
  })
  return (
    <group>
      <Box p={[0, -5, 0]} s={[160, 10, 110]} c={C.gaas} />
      <Inspectable node="nf-wetting" fit={1.5}>
        <Box p={[0, st.wet / 2, 0]} s={[160, Math.max(0.05, st.wet), 110]} c={C.inas} />
      </Inspectable>
      {st.islands && (
        <Inspectable node="nf-island" fit={1.6}>
          {islands.map((o, i) => (
            <mesh key={i} position={[o.x, st.wet, o.z]} scale={[(st.w / 2) * o.k, st.h * o.k, (st.w / 2) * o.k]}>
              <sphereGeometry args={[1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardNodeMaterial color={C.inas} roughness={0.35} emissive={C.inas} emissiveIntensity={0.15} />
            </mesh>
          ))}
        </Inspectable>
      )}
    </group>
  )
}

/** the QD laser of slide 33, as a ridge; layer thicknesses drawn ×20 (1 unit = 10 µm along the ridge) */
function Laser() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const T = useAtlas((s) => s.nano.T)
  const qd = qdLaserThreshold(T, 'qd')
  const qw = qdLaserThreshold(T, 'qw')
  useFrame(() => {
    if (useAtlas.getState().quiz) return publish([])
    publish([
      label(camera, size, 'l-t', `${T} °C`, `threshold: QD ${qd.toFixed(0)} mA · QW ${qw.toFixed(0)} mA`, [0, 40, 0], 'top'),
      label(camera, size, 'l-len', '1 mm cavity', 'In₀.₄Ga₀.₆As with quantum dots', [-52, 10, 0], 'side'),
    ])
  })
  const layers: [string, number, string][] = [['n⁺ GaAs substrate', 8, C.gaas], ['Al₀.₃Ga₀.₇As', 8, C.algaas], ['GaAs', 4, C.gaas], ['dots', 2, C.ingaas], ['GaAs', 4, C.gaas], ['Al₀.₃Ga₀.₇As', 8, C.algaas]]
  let y = 0
  return (
    <Inspectable node="nf-laser" fit={1.3}>
      {layers.map(([n, h, c], i) => {
        const yy = y + h / 2
        y += h
        const ridge = i >= 4
        return <Box key={n + i} p={[0, yy, 0]} s={[100, h, ridge ? 12 : 50]} c={c} e={n === 'dots' ? Math.min(1, 40 / qd) : 0} />
      })}
      <Box p={[0, y + 1, 0]} s={[100, 2, 9]} c="#e8c547" />
      {/* light out of the facet */}
      <mesh position={[58, 13, 0]} rotation-z={Math.PI / 2} raycast={() => null}>
        <coneGeometry args={[3, 16, 20, 1, true]} />
        <meshBasicNodeMaterial color="#e0453c" transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </Inspectable>
  )
}

const HOMES: Record<string, { target: [number, number, number]; polar: number; azimuth: number; dist: number }> = {
  wires: { target: [20, 10, 0], polar: 1.25, azimuth: 0.5, dist: 200 },
  vls: { target: [14, 28, 0], polar: 1.3, azimuth: 0.5, dist: 190 },
  pillars: { target: [16, 8, 0], polar: 1.05, azimuth: 0.6, dist: 200 },
  colloid: { target: [14, 0, 0], polar: 1.3, azimuth: 0.4, dist: 160 },
  patterned: { target: [16, 5, 0], polar: 1.0, azimuth: 0.6, dist: 180 },
  sk: { target: [24, 4, 0], polar: 1.05, azimuth: 0.5, dist: 250 },
  laser: { target: [22, 14, 0], polar: 1.2, azimuth: 0.7, dist: 230 },
}

export default function NanofabLayer() {
  const tab = useAtlas((s) => s.tab) || 'wires'
  useDive('cleanroom', null)
  useUnits(tab === 'vls' ? 1e-8 : null)
  useTabHome('nanofab', HOMES[tab] ?? HOMES.wires, tab)
  return (
    <>
      <StudioLights scale={5} />
      {tab === 'vls' ? <Vls /> : tab === 'pillars' ? <Pillars /> : tab === 'colloid' ? <Colloid /> : tab === 'patterned' ? <Patterned /> : tab === 'sk' ? <Sk /> : tab === 'laser' ? <Laser /> : <Wires />}
      <mesh rotation-x={-Math.PI / 2} position={[0, -12, 0]}>
        <circleGeometry args={[800, 48]} />
        <meshStandardNodeMaterial color="#25292c" roughness={1} />
      </mesh>
      <InspectSync />
      <ClearOnMiss radius={6000} />
    </>
  )
}
