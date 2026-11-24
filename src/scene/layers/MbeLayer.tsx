import * as THREE from 'three/webgpu'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { StudioLights } from '../Lighting'
import { ClearOnMiss, Inspectable, InspectSync } from '../Inspectable'
import { label, publish, useDive } from './shared'
import { useAtlas } from '../../state/store'
import { flux, mlPerSecond, rheedIntensity } from '../../chapters/films/physics'
import { mbeLive } from '../../chapters/films/live'
import { P } from '../../theme/scene'

/**
 * Chapter 5 (Topic 6): an MBE growth chamber, 1 unit = 1 cm (slides 17–25).
 * Effusion cells with shutters aim at the heated, rotating substrate; a
 * RHEED gun grazes the surface and the screen's streaks pulse once per
 * monolayer while the Ga shutter is open. Scroll in to the growing surface.
 */
const CELLS = [
  { id: 'Ga', col: P.obj.gallium, a: -0.55 },
  { id: 'As', col: P.obj.arsenic, a: -0.18 },
  { id: 'Al', col: P.obj.aluminium, a: 0.18 },
  { id: 'Si', col: P.obj.steelBlue, a: 0.55 },
]

export default function MbeLayer() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const shutter = useAtlas((s) => s.epi.shutter)
  useDive('cleanroom', 'surface', { home: [0, 8, 0] })
  const sub = useRef<THREE.Group>(null)
  const streaks = useMemo(() => new THREE.MeshBasicNodeMaterial({ color: P.signal.rheed, transparent: true, opacity: 0.8 }), [])
  const beams = useMemo(() => new THREE.MeshBasicNodeMaterial({ color: P.signal.amber, transparent: true, opacity: 0.18, depthWrite: false }), [])

  useFrame((_, dt) => {
    const st = useAtlas.getState()
    const step = st.reducedMotion ? 0 : dt
    if (sub.current) sub.current.rotation.y += step * 0.8
    const rate = mlPerSecond(flux(Math.pow(10, st.epi.logGa), 69.72, 1200))
    mbeLive.t += step
    if (st.epi.shutter) mbeLive.ml += rate * step
    // with the shutter closed the surface smooths: intensity recovers towards its maximum
    const I = st.epi.shutter ? rheedIntensity(mbeLive.ml) : Math.min(1, (mbeLive.trace.at(-1)?.I ?? 1) + step * 0.15)
    mbeLive.trace.push({ t: mbeLive.t, I })
    if (mbeLive.trace.length > 600) mbeLive.trace.shift()
    streaks.opacity = 0.2 + 0.8 * I
    beams.opacity = st.epi.shutter ? 0.18 : 0.03
    if (st.quiz) return publish([])
    publish([
      label(camera, size, 'm-rheed', 'RHEED screen', `${mbeLive.ml.toFixed(1)} monolayers`, [-34, 10, -6], 'side'),
      label(camera, size, 'm-cells', 'effusion cells', st.epi.shutter ? 'Ga shutter open' : 'Ga shutter closed', [0, -30, 18], 'bottom'),
      label(camera, size, 'm-rate', `${rate.toFixed(2)} ML/s`, `${((rate * 0.2827 * 3600) / 1000).toFixed(2)} µm/h`, [0, 18, 0], 'top'),
    ])
  })

  return (
    <>
      <StudioLights scale={5} />
      <Inspectable node="mbe-chamber" fit={1.1}>
        {/* the cut-away opens towards the default camera */}
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
        <Inspectable node="mbe-substrate" fit={3}>
          <mesh>
            <cylinderGeometry args={[6, 6, 0.8, 40]} />
            <meshStandardNodeMaterial color={P.obj.steelBlue} metalness={0.6} roughness={0.2} emissive={P.heat.cellGlow} emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, 3, 0]}>
            <cylinderGeometry args={[7, 7, 4, 40]} />
            <meshStandardNodeMaterial color={P.obj.cryoPanel} metalness={0.8} roughness={0.35} />
          </mesh>
        </Inspectable>
      </group>
      <Inspectable node="mbe-cell" fit={1.6}>
        {CELLS.map((c) => {
          const pos = new THREE.Vector3(Math.sin(c.a) * 30, -24, Math.cos(c.a) * 14)
          const dir = new THREE.Vector3(0, 12, 0).sub(pos).normalize()
          const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
          return (
            <group key={c.id} position={pos.toArray()} quaternion={q}>
              <mesh>
                <cylinderGeometry args={[2.6, 2.6, 14, 20]} />
                <meshStandardNodeMaterial color={P.obj.shutter} metalness={0.8} roughness={0.3} />
              </mesh>
              <mesh position={[0, 7.2, 0]}>
                <cylinderGeometry args={[1.8, 1.8, 0.6, 20]} />
                <meshStandardNodeMaterial color={c.col} emissive={P.heat.emberGlow} emissiveIntensity={0.5} />
              </mesh>
            </group>
          )
        })}
      </Inspectable>
      <Inspectable node="mbe-shutter" fit={3}>
        {CELLS.map((c) => {
          const open = c.id !== 'Ga' || shutter
          const pos = new THREE.Vector3(Math.sin(c.a) * 30, -24, Math.cos(c.a) * 14)
          const dir = new THREE.Vector3(0, 12, 0).sub(pos).normalize()
          const at = pos.clone().addScaledVector(dir, 10)
          return (
            <mesh key={c.id} position={at.toArray()} rotation={[open ? 1.2 : 0, 0, c.a]}>
              <boxGeometry args={[6, 0.3, 6]} />
              <meshStandardNodeMaterial color={P.obj.copper} metalness={0.8} roughness={0.3} />
            </mesh>
          )
        })}
      </Inspectable>
      {/* the beams from the open cells */}
      {CELLS.filter((c) => c.id !== 'Si').map((c) => {
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
      <Inspectable node="rheed-gun" fit={3}>
        <mesh position={[32, 13, -6]} rotation-z={Math.PI / 2 - 0.05}>
          <cylinderGeometry args={[1.6, 1.6, 14, 16]} />
          <meshStandardNodeMaterial color={P.obj.steel} metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[16, 12.6, -3]} rotation-z={Math.PI / 2 - 0.05} raycast={() => null}>
          <cylinderGeometry args={[0.15, 0.15, 32, 6]} />
          <meshBasicNodeMaterial color={P.signal.electron} />
        </mesh>
      </Inspectable>
      <Inspectable node="rheed-screen" fit={3}>
        <mesh position={[-34, 13, -6]} rotation-y={Math.PI / 2}>
          <circleGeometry args={[6, 32]} />
          <meshStandardNodeMaterial color={P.mbe.screen} />
        </mesh>
        {[-2.4, -0.8, 0.8, 2.4].map((z) => (
          <mesh key={z} position={[-33.8, 13, -6 + z]} rotation-y={Math.PI / 2} material={streaks}>
            <planeGeometry args={[0.35, 6]} />
          </mesh>
        ))}
      </Inspectable>
      <InspectSync />
      <ClearOnMiss radius={4000} />
    </>
  )
}
