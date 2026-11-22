import * as THREE from 'three/webgpu'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { useLabEnvironment } from '../Lighting'
import { ClearOnMiss, Inspectable, InspectSync } from '../Inspectable'
import { label, publish, rand, useDive } from './shared'
import { useAtlas } from '../../state/store'
import { remaining, RCA_STEPS } from '../../chapters/clean/physics'

/**
 * Chapter 3: the cleanroom (1 unit = 10 cm), Topic 4 slides 2–8.
 * Room: ceiling HEPA filters with the recirculating air handlers above,
 * air falling through the yellow-lit bay, out through the perforated floor
 * and back up the service chase. Operators, a book and gloves can be
 * switched on as particle sources; a 1 ft³ box shows the class count.
 * Wet bench (slides 9–11, 18–19): the RCA tanks and a close-up of the wafer
 * surface whose contaminants disappear step by step.
 */
const BAY = { x: 48, z: 30, h: 30 }
const N_AIR = 520

/** a point on the air loop at phase t ∈ [0,1), lane offsets u, v ∈ [0,1) */
function airPath(t: number, u: number, v: number, out: THREE.Vector3) {
  const x = -BAY.x + 2 + u * (2 * BAY.x - 4)
  const z = -BAY.z + 2 + v * (2 * BAY.z - 4)
  if (t < 0.5) return out.set(x, BAY.h - (t / 0.5) * BAY.h, z) // falling through the bay
  if (t < 0.62) return out.set(x + ((t - 0.5) / 0.12) * (58 - x), -3, z * 0.6) // under the floor to the chase
  if (t < 0.8) return out.set(58, -3 + ((t - 0.62) / 0.18) * 40, z * 0.6) // up the service chase
  return out.set(58 - ((t - 0.8) / 0.2) * (58 - x), 37, z) // back over the ceiling to the fans
}

function person(x: number, z: number, rot: number) {
  const g = new THREE.Group()
  const suit = new THREE.MeshStandardNodeMaterial({ color: '#eef1f2', roughness: 0.8 })
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(2.2, 8, 6, 16), suit)
  body.position.y = 7
  const head = new THREE.Mesh(new THREE.SphereGeometry(1.9, 16, 12), suit)
  head.position.y = 14
  const visor = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1, 0.6), new THREE.MeshStandardNodeMaterial({ color: '#1d2124', roughness: 0.2, metalness: 0.5 }))
  visor.position.set(0, 14.2, 1.7)
  g.add(body, head, visor)
  g.position.set(x, 0, z)
  g.rotation.y = rot
  return g
}

function Room() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const air = useMemo(() => {
    const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.18, 6, 4), new THREE.MeshBasicNodeMaterial({ color: '#a8d8f0', transparent: true, opacity: 0.55 }), N_AIR)
    im.raycast = () => null
    return im
  }, [])
  const lanes = useMemo(() => {
    const r = rand(4)
    return Array.from({ length: N_AIR }, () => [r(), r(), r()])
  }, [])
  const dirt = useMemo(() => {
    const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.28, 6, 4), new THREE.MeshBasicNodeMaterial({ color: '#f39477' }), 240)
    im.raycast = () => null
    return im
  }, [])
  const cube = useMemo(() => {
    const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 4, 3), new THREE.MeshBasicNodeMaterial({ color: '#f2f4f3' }), 1000)
    im.raycast = () => null
    return im
  }, [])
  const ppl = useMemo(() => [person(-18, 6, 0.4), person(22, -4, -2.2)], [])
  const t = useRef(0)
  const o = useMemo(() => new THREE.Object3D(), [])
  const v = useMemo(() => new THREE.Vector3(), [])
  const lastCls = useRef(-1)
  const sources: [number, number, number][] = [[-18, 12, 6], [12, 9.5, 14], [-6, 9.5, -14]]

  useFrame((_, dt) => {
    const st = useAtlas.getState()
    t.current += st.reducedMotion ? 0 : dt
    for (let i = 0; i < N_AIR; i++) {
      const [u, w, ph] = lanes[i]
      airPath((ph + t.current * 0.045) % 1, u, w, v)
      o.position.copy(v)
      o.updateMatrix()
      air.setMatrixAt(i, o.matrix)
    }
    air.instanceMatrix.needsUpdate = true
    // particles shed by the switched-on sources fall and are swept to the floor
    const on = [st.clean.sources.person, st.clean.sources.book, st.clean.sources.gloves]
    let n = 0
    on.forEach((yes, s) => {
      if (!yes) return
      for (let k = 0; k < 80; k++) {
        const [u, w, ph] = lanes[k + s * 80]
        const p = (ph + t.current * 0.12) % 1
        const [sx, sy, sz] = sources[s]
        o.position.set(sx + (u - 0.5) * 6 * p, sy - p * sy, sz + (w - 0.5) * 6 * p)
        o.updateMatrix()
        dirt.setMatrixAt(n++, o.matrix)
      }
    })
    dirt.count = n
    dirt.instanceMatrix.needsUpdate = true
    // the 1 ft³ box: one dot per particle ≥ 0.5 µm allowed by the class (up to 1000 drawn)
    if (lastCls.current !== st.clean.cls) {
      lastCls.current = st.clean.cls
      const r = rand(st.clean.cls)
      const shown = Math.min(1000, st.clean.cls)
      for (let i = 0; i < shown; i++) {
        o.position.set((r() - 0.5) * 3.05, (r() - 0.5) * 3.05, (r() - 0.5) * 3.05)
        o.updateMatrix()
        cube.setMatrixAt(i, o.matrix)
      }
      cube.count = shown
      cube.instanceMatrix.needsUpdate = true
    }
    if (st.quiz) return publish([])
    publish([
      label(camera, size, 'r-hepa', 'HEPA filters in the ceiling', 'fans above them recirculate the air', [-20, BAY.h, -BAY.z], 'top'),
      label(camera, size, 'r-chase', 'service chase', 'return air · plant outside the bay', [58, 18, 0], 'right'),
      label(camera, size, 'r-floor', 'perforated floor', 'air leaves downwards', [-30, 0, BAY.z], 'bottom'),
      label(camera, size, 'r-cube', `1 ft³ · class ${st.clean.cls.toLocaleString('en-GB')}`, st.clean.cls > 1000 ? `< ${st.clean.cls.toLocaleString('en-GB')} particles ≥ 0.5 µm (1000 drawn)` : `< ${st.clean.cls} particles ≥ 0.5 µm`, [34, 13, 20], 'right'),
    ])
  })

  const panel = useMemo(() => new THREE.MeshStandardNodeMaterial({ color: '#e7ebed', roughness: 0.7, emissive: '#f4f6f7', emissiveIntensity: 0.25 }), [])
  return (
    <>
      {/* walls (cut away at the front) */}
      <mesh position={[0, BAY.h / 2, -BAY.z]} raycast={() => null}>
        <boxGeometry args={[2 * BAY.x, BAY.h, 0.6]} />
        <meshStandardNodeMaterial color="#d8d2c4" roughness={0.9} />
      </mesh>
      <mesh position={[-BAY.x, BAY.h / 2, 0]} raycast={() => null}>
        <boxGeometry args={[0.6, BAY.h, 2 * BAY.z]} />
        <meshStandardNodeMaterial color="#d8d2c4" roughness={0.9} />
      </mesh>
      <mesh position={[BAY.x, BAY.h / 2, 0]} raycast={() => null}>
        <boxGeometry args={[0.6, BAY.h, 2 * BAY.z]} />
        <meshStandardNodeMaterial color="#cfc8b8" roughness={0.9} transparent opacity={0.35} />
      </mesh>
      <Inspectable node="hepa-filter" fit={1.2}>
        {Array.from({ length: 6 * 4 }, (_, i) => (
          <mesh key={i} material={panel} position={[-BAY.x + 8 + (i % 6) * 16, BAY.h + 0.4, -BAY.z + 7.5 + Math.floor(i / 6) * 15]}>
            <boxGeometry args={[15, 0.8, 14]} />
          </mesh>
        ))}
      </Inspectable>
      <Inspectable node="rah" fit={1.4}>
        {[-26, 0, 26].map((x) => (
          <mesh key={x} position={[x, BAY.h + 6, 0]}>
            <boxGeometry args={[16, 8, 18]} />
            <meshStandardNodeMaterial color="#8a949a" metalness={0.5} roughness={0.5} />
          </mesh>
        ))}
      </Inspectable>
      <Inspectable node="raised-floor" fit={1.2}>
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[2 * BAY.x, 0.4, 2 * BAY.z]} />
          <meshStandardNodeMaterial color="#b9bdb8" roughness={0.6} metalness={0.3} />
        </mesh>
      </Inspectable>
      <Inspectable node="service-chase" fit={1.3}>
        <mesh position={[58, 16, 0]}>
          <boxGeometry args={[10, 44, 2 * BAY.z]} />
          <meshStandardNodeMaterial color="#5c6368" roughness={0.8} transparent opacity={0.28} depthWrite={false} />
        </mesh>
      </Inspectable>
      <Inspectable node="process-bay" fit={2}>
        {/* the litho tool, with the wafer on its chuck */}
        <mesh position={[0, 5, -12]}>
          <boxGeometry args={[16, 10, 10]} />
          <meshStandardNodeMaterial color="#eae6dc" roughness={0.6} />
        </mesh>
        <mesh position={[0, 10.3, -12]}>
          <cylinderGeometry args={[1.5, 1.5, 0.3, 32]} />
          <meshStandardNodeMaterial color="#5d6a74" metalness={0.8} roughness={0.15} />
        </mesh>
      </Inspectable>
      <Inspectable node="operator" fit={2.5}>
        {ppl.map((g, i) => (
          <primitive key={i} object={g} />
        ))}
      </Inspectable>
      <mesh position={[12, 4.5, 14]} raycast={() => null}>
        <boxGeometry args={[14, 9, 7]} />
        <meshStandardNodeMaterial color="#b8bfc4" metalness={0.6} roughness={0.4} />
      </mesh>
      <Inspectable node="contam-book" fit={5} minDist={14}>
        <mesh position={[12, 9.4, 14]} rotation-y={0.3}>
          <boxGeometry args={[2.1, 0.5, 2.9]} />
          <meshStandardNodeMaterial color="#6d4a2f" roughness={0.9} />
        </mesh>
      </Inspectable>
      <mesh position={[-6, 4.5, -14]} raycast={() => null}>
        <boxGeometry args={[10, 9, 6]} />
        <meshStandardNodeMaterial color="#b8bfc4" metalness={0.6} roughness={0.4} />
      </mesh>
      <Inspectable node="contam-gloves" fit={5} minDist={14}>
        {[-0.8, 0.8].map((dx) => (
          <mesh key={dx} position={[-6 + dx, 9.3, -14]} scale={[0.6, 0.25, 1.1]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshStandardNodeMaterial color="#dfe6cf" roughness={0.7} />
          </mesh>
        ))}
      </Inspectable>
      {/* the 1 ft³ class box */}
      <group position={[34, 13, 20]}>
        <lineSegments raycast={() => null}>
          <edgesGeometry args={[new THREE.BoxGeometry(3.05, 3.05, 3.05)]} />
          <lineBasicNodeMaterial color="#f0b43c" />
        </lineSegments>
        <primitive object={cube} />
      </group>
      <primitive object={air} />
      <primitive object={dirt} />
      <pointLight position={[0, 26, 0]} intensity={4500} distance={160} color="#ffd27a" />
    </>
  )
}

const TANK_COL: Record<string, string> = { piranha: '#e8b07a', hf: '#c9e4d0', sc1: '#bcd6ef', sc2: '#e6c9e6', rinse1: '#d8ecf5', rinse2: '#d8ecf5', rinse3: '#d8ecf5' }
const TANK_NODE: Record<string, string> = { piranha: 'tank-piranha', hf: 'tank-hf', sc1: 'tank-sc1', sc2: 'tank-sc2', rinse1: 'tank-rinse', rinse2: 'tank-rinse', rinse3: 'tank-rinse' }

/** contaminants on the wafer close-up, in a fixed layout */
function contamination() {
  const r = rand(17)
  const ring = () => {
    const a = r() * Math.PI * 2
    const d = 9 * Math.sqrt(r())
    return [Math.cos(a) * d, Math.sin(a) * d] as const
  }
  return {
    organic: Array.from({ length: 7 }, () => ({ p: ring(), s: 1.2 + r() * 2.2 })),
    particle: Array.from({ length: 16 }, () => ({ p: ring(), s: 0.25 + r() * 0.5 })),
    metal: Array.from({ length: 26 }, () => ({ p: ring(), s: 0.16 })),
    alkali: Array.from({ length: 22 }, () => ({ p: ring(), s: 0.14 })),
  }
}

function Bench() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const rca = useAtlas((s) => s.clean.rca)
  const left = remaining(rca)
  const c = useMemo(() => contamination(), [])
  const carrier = useRef<THREE.Group>(null)
  const x0 = -36
  const dx = 10
  useFrame((_, dt) => {
    const st = useAtlas.getState()
    const target = x0 + Math.max(0, Math.min(RCA_STEPS.length - 1, st.clean.rca - 1)) * dx
    if (carrier.current) {
      const k = st.reducedMotion ? 1 : Math.min(1, dt * 4)
      carrier.current.position.x += (target - carrier.current.position.x) * k
      carrier.current.position.y = st.clean.rca === 0 ? 14 : 7.5
    }
    if (st.quiz) return publish([])
    const L = RCA_STEPS.map((s, i) => label(camera, size, 'b-' + s.id, s.name, s.temp, [x0 + i * dx, 1, 6], i % 2 ? 'bottom' : 'top'))
    L.push(label(camera, size, 'b-w', 'wafer surface (close-up)', [...left].join(' · ') || 'clean', [22, 16, -3], 'right'))
    publish(L)
  })
  return (
    <>
      <Inspectable node="wet-bench" fit={1.2}>
        <mesh position={[x0 + 3 * dx, -1, 0]}>
          <boxGeometry args={[dx * 7 + 6, 2, 14]} />
          <meshStandardNodeMaterial color="#e9e4d8" roughness={0.6} />
        </mesh>
        <mesh position={[x0 + 3 * dx, 9, -7.5]} raycast={() => null}>
          <boxGeometry args={[dx * 7 + 6, 22, 1]} />
          <meshStandardNodeMaterial color="#efeae0" roughness={0.6} />
        </mesh>
      </Inspectable>
      {RCA_STEPS.map((s, i) => (
        <Inspectable key={s.id} node={TANK_NODE[s.id]} fit={3}>
          <group position={[x0 + i * dx, 3, 0]}>
            <mesh>
              <boxGeometry args={[8, 6, 8]} />
              <meshPhysicalNodeMaterial color="#f4f6f7" roughness={0.1} transmission={0.5} transparent opacity={0.45} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, -0.6, 0]}>
              <boxGeometry args={[7.6, 4.4, 7.6]} />
              <meshStandardNodeMaterial color={TANK_COL[s.id]} transparent opacity={i < rca ? 0.55 : 0.85} roughness={0.15} emissive={i === rca - 1 ? '#f0b43c' : '#000000'} emissiveIntensity={0.25} />
            </mesh>
          </group>
        </Inspectable>
      ))}
      <group ref={carrier} position={[x0, 14, 0]}>
        <mesh raycast={() => null}>
          <boxGeometry args={[4, 4, 4]} />
          <meshStandardNodeMaterial color="#cfc8b8" transparent opacity={0.5} />
        </mesh>
      </group>
      {/* the wafer close-up */}
      <group position={[22, 15, -3]} rotation-x={-0.9}>
        <Inspectable node="bench-wafer" fit={1.4}>
          <mesh rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[10, 10, 0.5, 64]} />
            <meshStandardNodeMaterial color="#6a7884" metalness={0.6} roughness={0.2} />
          </mesh>
          {left.has('oxide') && (
            <mesh position={[0, 0, 0.3]}>
              <circleGeometry args={[10, 64]} />
              <meshStandardNodeMaterial color="#a8c4e0" transparent opacity={0.28} roughness={0.2} />
            </mesh>
          )}
          {left.has('organic') && c.organic.map((o, i) => (
            <mesh key={'o' + i} position={[o.p[0], o.p[1], 0.36]}>
              <circleGeometry args={[o.s, 24]} />
              <meshStandardNodeMaterial color="#8a5a2b" transparent opacity={0.75} />
            </mesh>
          ))}
          {left.has('particle') && c.particle.map((o, i) => (
            <mesh key={'p' + i} position={[o.p[0], o.p[1], 0.4 + o.s]}>
              <icosahedronGeometry args={[o.s, 1]} />
              <meshStandardNodeMaterial color="#f2f4f3" roughness={0.8} />
            </mesh>
          ))}
          {left.has('metal') && c.metal.map((o, i) => (
            <mesh key={'m' + i} position={[o.p[0], o.p[1], 0.45]}>
              <sphereGeometry args={[o.s, 8, 6]} />
              <meshStandardNodeMaterial color="#e0b84a" metalness={0.9} roughness={0.3} />
            </mesh>
          ))}
          {left.has('alkali') && c.alkali.map((o, i) => (
            <mesh key={'a' + i} position={[o.p[0], o.p[1], 0.45]}>
              <sphereGeometry args={[o.s, 8, 6]} />
              <meshBasicNodeMaterial color="#c58af0" />
            </mesh>
          ))}
        </Inspectable>
      </group>
    </>
  )
}

export default function CleanroomLayer() {
  const tab = useAtlas((s) => s.tab)
  useLabEnvironment(true, 0.9)
  useDive('wafers', 'wafer', { home: tab === 'room' || !tab ? [4, 12, 0] : [4, 6, 0] })
  return (
    <>
      <hemisphereLight args={['#fff1c8', '#2a2620', 0.8]} />
      <directionalLight position={[40, 80, 60]} intensity={1.6} color="#ffe6a8" />
      <directionalLight position={[-60, 40, -30]} intensity={0.5} color="#c8d4e0" />
      {tab === 'wetbench' || tab === 'redox' ? <Bench /> : <Room />}
      <mesh rotation-x={-Math.PI / 2} position={[0, -6, 0]}>
        <circleGeometry args={[600, 48]} />
        <meshStandardNodeMaterial color="#25292c" roughness={1} />
      </mesh>
      <InspectSync />
      <ClearOnMiss radius={3000} />
    </>
  )
}
