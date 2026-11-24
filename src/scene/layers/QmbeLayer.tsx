import * as THREE from 'three/webgpu'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { StudioLights } from '../Lighting'
import { ClearOnMiss, Inspectable, InspectSync } from '../Inspectable'
import { label, publish, useDive } from './shared'
import { useApp } from '../../state/store'
import { MAT, SAMPLE, spans } from '../../chapters/nano/hetero'
import { P } from '../../theme/scene'

/**
 * Chapter 7 (Topic 8): a III–V MBE chamber growing a heterostructure layer by
 * layer (slides 9, 14, 22; the chamber itself is Topic 6's). Each layer opens
 * the shutters of its elements; the inset beside the substrate shows the
 * stack grown so far, to scale. Scroll in to the sample.
 */
const CELLS = [
  { id: 'Ga', col: P.obj.gallium, a: -0.66 },
  { id: 'Al', col: P.obj.aluminium, a: -0.22 },
  { id: 'In', col: P.obj.indium, a: 0.22 },
  { id: 'As', col: P.obj.arsenic, a: 0.66 },
  { id: 'P', col: P.obj.phosphorus, a: 1.1 },
  { id: 'Sb', col: P.obj.antimony, a: -1.1 },
]
/** elements in each material (which shutters are open while it grows) */
export const ELEMENTS: Record<string, string[]> = {
  GaAs: ['Ga', 'As'], AlGaAs: ['Al', 'Ga', 'As'], InGaAs: ['In', 'Ga', 'As'], InGaAs40: ['In', 'Ga', 'As'], InAs: ['In', 'As'],
  GaSb: ['Ga', 'Sb'], InP: ['In', 'P'], InGaAsP: ['In', 'Ga', 'As'], InAlAs: ['In', 'Al', 'As'],
}

export default function QmbeLayer() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const sampleId = useApp((s) => s.nano.sample)
  const grown = useApp((s) => s.nano.grown)
  const h = SAMPLE[sampleId] ?? SAMPLE.qw
  useDive('cleanroom', 'qsample', { home: [0, 6, 0] })
  const growing = grown > 0 ? h.layers[Math.min(grown, h.layers.length) - 1] : null
  const open = new Set(growing ? ELEMENTS[growing.mat] ?? [] : [])
  const sub = useRef<THREE.Group>(null)
  const beams = useMemo(() => new THREE.MeshBasicNodeMaterial({ color: P.signal.amber, transparent: true, opacity: 0.16 * P.k.sheet, depthWrite: false }), [])
  const sp = spans(h)
  const total = sp.length ? sp[sp.length - 1].z1 : 1
  const scale = 22 / total
  useFrame((_, dt) => {
    const st = useApp.getState()
    if (sub.current) sub.current.rotation.y += (st.reducedMotion ? 0 : dt) * 0.6
    if (st.quiz) return publish([])
    publish([
      label(camera, size, 'q-sample', h.name, `${Math.min(grown, h.layers.length)} of ${h.layers.length} layers grown`, [30, 14, 0], 'right'),
      label(camera, size, 'q-now', growing ? `growing ${MAT[growing.mat].name}` : 'shutters closed', growing ? `${growing.nm} nm · ${[...open].join(' + ')} beams` : 'press “grow next layer”', [0, -30, 18], 'bottom'),
    ])
  })
  return (
    <>
      <StudioLights scale={5} />
      <Inspectable node="qmbe-chamber" fit={1.1}>
        <mesh rotation-y={Math.PI / 2}>
          <sphereGeometry args={[40, 48, 24, Math.PI * 0.35, Math.PI * 1.3]} />
          <meshStandardNodeMaterial color={P.obj.steelLight} metalness={0.8} roughness={0.3} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation-y={Math.PI / 2}>
          <sphereGeometry args={[36, 40, 20, Math.PI * 0.35, Math.PI * 1.3]} />
          <meshStandardNodeMaterial color={P.obj.chamberWall} metalness={0.4} roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
      </Inspectable>
      <group ref={sub} position={[0, 12, 0]}>
        <Inspectable node="qmbe-substrate" fit={3}>
          <mesh>
            <cylinderGeometry args={[6, 6, 0.8, 40]} />
            <meshStandardNodeMaterial color={P.obj.substrate} metalness={0.6} roughness={0.2} emissive={P.heat.cellGlow} emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, 3, 0]}>
            <cylinderGeometry args={[7, 7, 4, 40]} />
            <meshStandardNodeMaterial color={P.obj.cryoPanel} metalness={0.8} roughness={0.35} />
          </mesh>
        </Inspectable>
      </group>
      {/* the stack grown so far, drawn to scale beside the substrate */}
      <Inspectable node="qmbe-stack" fit={2}>
        {sp.slice(0, grown).map((l, i) => (
          <mesh key={i} position={[22, 2 + (l.z0 + l.z1) * scale * 0.5, 0]}>
            <boxGeometry args={[8, Math.max(0.15, l.nm * scale), 8]} />
            <meshStandardNodeMaterial color={MAT[l.mat].col} roughness={0.4} emissive={i === grown - 1 ? P.signal.amber : P.signal.none} emissiveIntensity={i === grown - 1 ? 0.25 : 0} />
          </mesh>
        ))}
        <mesh position={[22, 1.5, 0]}>
          <boxGeometry args={[9, 1, 9]} />
          <meshStandardNodeMaterial color={P.obj.stageDark} />
        </mesh>
      </Inspectable>
      <Inspectable node="qmbe-cells" fit={1.6}>
        {CELLS.map((c) => {
          const pos = new THREE.Vector3(Math.sin(c.a) * 30, -24, Math.cos(c.a) * 14)
          const dir = new THREE.Vector3(0, 12, 0).sub(pos).normalize()
          const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
          const isOpen = open.has(c.id)
          return (
            <group key={c.id} position={pos.toArray()} quaternion={q}>
              <mesh>
                <cylinderGeometry args={[2.6, 2.6, 14, 20]} />
                <meshStandardNodeMaterial color={P.obj.shutter} metalness={0.8} roughness={0.3} />
              </mesh>
              <mesh position={[0, 7.2, 0]}>
                <cylinderGeometry args={[1.8, 1.8, 0.6, 20]} />
                <meshStandardNodeMaterial color={c.col} emissive={P.heat.emberGlow} emissiveIntensity={isOpen ? 0.9 : 0.2} />
              </mesh>
              <mesh position={[0, 10, 0]} rotation={[isOpen ? 1.2 : 0, 0, 0]}>
                <boxGeometry args={[6, 0.3, 6]} />
                <meshStandardNodeMaterial color={P.obj.copper} metalness={0.8} roughness={0.3} />
              </mesh>
            </group>
          )
        })}
      </Inspectable>
      {CELLS.filter((c) => open.has(c.id)).map((c) => {
        const pos = new THREE.Vector3(Math.sin(c.a) * 30, -24, Math.cos(c.a) * 14)
        const mid = pos.clone().add(new THREE.Vector3(0, 12, 0)).multiplyScalar(0.5)
        const dir = new THREE.Vector3(0, 12, 0).sub(pos)
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
        return (
          <mesh key={c.id} position={mid.toArray()} quaternion={q} material={beams} raycast={() => null}>
            <cylinderGeometry args={[6, 1.5, dir.length(), 16, 1, true]} />
          </mesh>
        )
      })}
      <InspectSync />
      <ClearOnMiss radius={4000} />
    </>
  )
}
