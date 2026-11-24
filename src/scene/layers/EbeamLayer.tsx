import * as THREE from 'three/webgpu'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { StudioLights } from '../Lighting'
import { ClearOnMiss, Inspectable, InspectSync } from '../Inspectable'
import { label, publish, useDive, useTabHome, useUnits } from './shared'
import { useAtlas } from '../../state/store'
import { kanayaRangeNm, PMMA, SI, simulate } from '../../chapters/litho/ebeam'
import { Line } from './nanoShared'
import { LIFTOFF } from '../../chapters/litho/resist'

/**
 * Chapter 6 (Topic 7 slides 19–22): the electron-beam writer.
 * - write: the column (gun, alignment coil, condensers, blanking plates,
 *   limiting aperture, final lens and deflection coils, stage) scanning a
 *   pattern into resist, the beam blanked between shapes;
 * - liftoff: slide 20's six steps on a cross-section;
 * - proximity: Monte Carlo electron paths in PMMA on Si (slide 21).
 *
 * LINK POINT (Measure half): the column is "just like an SEM with on–off
 * capability" (slide 19). When the SEM scene exists, the `sem-link` object
 * dives to it; until then its panel says where it will go.
 */
const COLUMN = [
  { y: 70, r: 5, h: 10, col: '#3b4248', name: 'gun' },
  { y: 60, r: 4, h: 3, col: '#c58a4a', name: 'alignment coil' },
  { y: 50, r: 6, h: 6, col: '#8a949a', name: 'first condenser' },
  { y: 41, r: 3, h: 2, col: '#d9b45a', name: 'blanking plates' },
  { y: 33, r: 6, h: 6, col: '#8a949a', name: 'second condenser' },
  { y: 25, r: 4, h: 1, col: '#59626a', name: 'limiting aperture' },
  { y: 15, r: 9, h: 10, col: '#7c868d', name: 'final lens, coils' },
]

/** the pattern the beam writes: three bars and a square, in stage units */
const SHAPES = [
  { x0: -14, x1: -10, z0: -10, z1: 10 },
  { x0: -6, x1: -2, z0: -10, z1: 10 },
  { x0: 2, x1: 6, z0: -10, z1: 10 },
  { x0: 9, x1: 15, z0: -3, z1: 3 },
]
/** raster path: rows across the field; on = inside a shape */
function raster() {
  const pts: { x: number; z: number; on: boolean }[] = []
  for (let z = -11; z <= 11; z += 1) for (let x = -16; x <= 16; x += 0.5) pts.push({ x: z % 2 ? -x : x, z, on: SHAPES.some((s) => x >= s.x0 && x <= s.x1 && z >= s.z0 && z <= s.z1) })
  return pts
}

function Write() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const beam = useRef<THREE.Mesh>(null)
  const written = useRef<THREE.InstancedMesh>(null)
  const path = useMemo(raster, [])
  const t = useRef(0)
  const dot = useMemo(() => new THREE.Object3D(), [])
  useFrame((_, dt) => {
    const st = useAtlas.getState()
    t.current = (t.current + (st.reducedMotion ? 0 : dt) * 60) % path.length
    const k = Math.floor(t.current)
    const p = path[k]
    if (beam.current) {
      beam.current.visible = p.on
      beam.current.position.set(p.x * 0.6, 6, p.z * 0.6)
    }
    if (written.current) {
      let n = 0
      for (let i = 0; i <= k && n < 1500; i++)
        if (path[i].on) {
          dot.position.set(path[i].x * 0.6, 0.65, path[i].z * 0.6)
          dot.updateMatrix()
          written.current.setMatrixAt(n++, dot.matrix)
        }
      written.current.count = n
      written.current.instanceMatrix.needsUpdate = true
    }
    if (st.quiz) return publish([])
    publish([
      label(camera, size, 'e-blank', p.on ? 'beam on' : 'blanked', 'the plates deflect the beam into the aperture', [12, 41, 0], 'right'),
      label(camera, size, 'e-px', 'one pixel at a time', 'pattern under computer control', [16, 2, 0], 'right'),
    ])
  })
  return (
    <group>
      <Inspectable node="eb-column" fit={1.3}>
        {COLUMN.map((c) => (
          <mesh key={c.name} position={[0, c.y, 0]}>
            <cylinderGeometry args={[c.r, c.r, c.h, 32]} />
            <meshStandardNodeMaterial color={c.col} metalness={0.7} roughness={0.35} />
          </mesh>
        ))}
        <mesh position={[0, 42, 0]}>
          <cylinderGeometry args={[10, 10, 60, 32, 1, true]} />
          <meshStandardNodeMaterial color="#9aa3aa" metalness={0.7} roughness={0.35} transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </Inspectable>
      <Inspectable node="eb-blanker" fit={3}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 2.2, 41, 0]}>
            <boxGeometry args={[0.4, 4, 4]} />
            <meshStandardNodeMaterial color="#d9b45a" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
      </Inspectable>
      <mesh ref={beam} raycast={() => null}>
        <cylinderGeometry args={[0.25, 0.25, 12, 8]} />
        <meshBasicNodeMaterial color="#9fd8ff" />
      </mesh>
      <Inspectable node="eb-resist" fit={2}>
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[24, 0.6, 18]} />
          <meshStandardNodeMaterial color="#d8c9a8" roughness={0.4} transparent opacity={0.85} />
        </mesh>
        <instancedMesh ref={written} args={[undefined, undefined, 1500]} raycast={() => null}>
          <boxGeometry args={[0.32, 0.1, 0.62]} />
          <meshBasicNodeMaterial color="#7dd3fc" />
        </instancedMesh>
      </Inspectable>
      <mesh position={[0, -2, 0]}>
        <boxGeometry args={[34, 3, 28]} />
        <meshStandardNodeMaterial color="#30363b" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* LINK POINT → SEM (Measure half) */}
      <Inspectable node="sem-link" fit={3}>
        <mesh position={[-26, 30, 0]}>
          <boxGeometry args={[10, 14, 8]} />
          <meshStandardNodeMaterial color="#4a5a66" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[-26, 30, 4.05]}>
          <planeGeometry args={[8, 6]} />
          <meshBasicNodeMaterial color="#9fb8c8" />
        </mesh>
      </Inspectable>
    </group>
  )
}

/** slide 20: Si with 58 nm SiO₂ → PMMA → expose → develop → Ti/Au → lift-off (1 unit = 10 nm, PMMA drawn 100 nm) */
function Liftoff() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const s = useAtlas((st) => st.litho.eb)
  const openings = [[-20, -12], [10, 18]]
  const pm = 10
  useFrame(() => {
    if (useAtlas.getState().quiz) return publish([])
    publish([label(camera, size, 'lo', s === 0 ? 'start' : `${s}. ${LIFTOFF[s - 1]}`, s === 6 ? 'only the metal in the openings stays' : undefined, [0, 30, 0], 'top')])
  })
  const resistSpans = s >= 4 ? [[-40, -20], [-12, 10], [18, 40]] : [[-40, 40]]
  return (
    <group>
      <Inspectable node="eb-substrate" fit={2}>
        <mesh position={[0, -10, 0]}>
          <boxGeometry args={[80, 20, 24]} />
          <meshStandardNodeMaterial color="#5f7486" roughness={0.35} />
        </mesh>
        <mesh position={[0, 2.9, 0]}>
          <boxGeometry args={[80, 5.8, 24]} />
          <meshStandardNodeMaterial color="#c9d6dc" roughness={0.3} transparent opacity={0.85} />
        </mesh>
      </Inspectable>
      {s >= 2 && s < 6 && (
        <Inspectable node="eb-resist" fit={2}>
          {resistSpans.map(([a, b]) => (
            <mesh key={a} position={[(a + b) / 2, 5.8 + pm / 2, 0]}>
              <boxGeometry args={[b - a, pm, 24]} />
              <meshStandardNodeMaterial color={s === 3 ? '#e4d3ae' : '#d8c9a8'} roughness={0.4} />
            </mesh>
          ))}
          {s === 3 && openings.map(([a, b]) => (
            <mesh key={a} position={[(a + b) / 2, 5.8 + pm / 2, 0]}>
              <boxGeometry args={[b - a + 0.1, pm + 0.1, 24.1]} />
              <meshBasicNodeMaterial color="#7dd3fc" transparent opacity={0.5} />
            </mesh>
          ))}
        </Inspectable>
      )}
      {s === 3 && openings.map(([a, b]) => (
        <mesh key={a} position={[(a + b) / 2, 30, 0]} raycast={() => null}>
          <cylinderGeometry args={[0.4, 0.4, 30, 8]} />
          <meshBasicNodeMaterial color="#9fd8ff" />
        </mesh>
      ))}
      {s >= 5 && (
        <Inspectable node="liftoff-metal" fit={2}>
          {(s === 5 ? [...openings.map(([a, b]) => [a, b, 5.8]), ...resistSpans.map(([a, b]) => [a, b, 5.8 + pm])] : openings.map(([a, b]) => [a, b, 5.8])).map(([a, b, y], i) => (
            <group key={i}>
              <mesh position={[(a + b) / 2, y + 0.15, 0]}>
                <boxGeometry args={[b - a, 0.3, 24]} />
                <meshStandardNodeMaterial color="#8a8f96" metalness={0.9} roughness={0.3} />
              </mesh>
              <mesh position={[(a + b) / 2, y + 0.3 + 0.85, 0]}>
                <boxGeometry args={[b - a, 1.7, 24]} />
                <meshStandardNodeMaterial color="#e8c547" metalness={0.95} roughness={0.2} />
              </mesh>
            </group>
          ))}
        </Inspectable>
      )}
    </group>
  )
}

/** slide 21: electron paths in 500 nm of PMMA on Si; 1 unit = 50 nm */
function Proximity() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const keV = useAtlas((s) => s.litho.keV)
  const sim = useMemo(() => simulate(keV, 70, 500, 21), [keV])
  const u = 50
  const tNm = 500
  useFrame(() => {
    if (useAtlas.getState().quiz) return publish([])
    publish([
      label(camera, size, 'p-kev', `${keV} keV`, `backscattered ${(sim.backscatter * 100).toFixed(0)} % · reach ${(sim.maxRadiusNm / 1000).toFixed(1)} µm sideways`, [0, 6, 0], 'top'),
      label(camera, size, 'p-res', 'PMMA', 'secondaries (2–50 eV) expose it within nm', [-28, -(tNm / u) / 2, 0], 'side'),
      label(camera, size, 'p-si', 'Si', `range ≈ ${(kanayaRangeNm(SI, keV) / 1000).toFixed(1)} µm`, [-28, -30, 0], 'side'),
    ])
  })
  return (
    <group>
      <Inspectable node="eb-trajectories" fit={1.3}>
        {sim.trajs.map((tr, i) => (
          <Line key={i} pts={tr.pts.map(([x, z], k) => [x / u, -z / u, ((i * 7) % 11) - 5 + k * 0] as [number, number, number])} r={0.09} color={tr.backscattered ? '#7dd3fc' : '#f0f4f8'} emissive={tr.backscattered ? '#7dd3fc' : undefined} />
        ))}
        {sim.trajs.flatMap((tr, i) => tr.sparks.slice(0, 6).map(([x, z], k) => (
          <mesh key={`${i}-${k}`} position={[x / u, -z / u, ((i * 7) % 11) - 5]} raycast={() => null}>
            <sphereGeometry args={[0.18, 6, 4]} />
            <meshBasicNodeMaterial color="#f0b43c" />
          </mesh>
        )))}
      </Inspectable>
      <Inspectable node="eb-resist" fit={2}>
        <mesh position={[0, -tNm / u / 2, 0]}>
          <boxGeometry args={[120, tNm / u, 14]} />
          <meshStandardNodeMaterial color="#d8c9a8" transparent opacity={0.28} depthWrite={false} />
        </mesh>
      </Inspectable>
      <mesh position={[0, -tNm / u - 40, 0]}>
        <boxGeometry args={[120, 80, 14]} />
        <meshStandardNodeMaterial color="#5f7486" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <mesh position={[0, 12, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.2, 0.2, 24, 8]} />
        <meshBasicNodeMaterial color="#9fd8ff" />
      </mesh>
    </group>
  )
}

const HOMES: Record<string, { target: [number, number, number]; polar: number; azimuth: number; dist: number }> = {
  write: { target: [10, 32, 0], polar: 1.3, azimuth: 0.55, dist: 190 },
  liftoff: { target: [14, 4, 0], polar: 1.3, azimuth: 0.35, dist: 170 },
  proximity: { target: [16, -22, 0], polar: 1.53, azimuth: 0.0, dist: 170 },
}

export default function EbeamLayer() {
  const tab = useAtlas((s) => s.tab) || 'write'
  useDive('litho', null)
  useUnits(tab === 'liftoff' ? 1e-8 : tab === 'proximity' ? 5e-8 : null)
  useTabHome('ebeam', HOMES[tab] ?? HOMES.write, tab)
  return (
    <>
      <StudioLights scale={5} />
      {tab === 'liftoff' ? <Liftoff /> : tab === 'proximity' ? <Proximity /> : <Write />}
      {tab === 'write' && (
        <mesh rotation-x={-Math.PI / 2} position={[0, -4, 0]}>
          <circleGeometry args={[800, 48]} />
          <meshStandardNodeMaterial color="#25292c" roughness={1} />
        </mesh>
      )}
      <InspectSync />
      <ClearOnMiss radius={6000} />
    </>
  )
}

export { PMMA }
