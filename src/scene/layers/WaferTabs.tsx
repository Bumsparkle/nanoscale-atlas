import * as THREE from 'three/webgpu'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { StudioLights } from '../Lighting'
import { Inspectable } from '../Inspectable'
import { label, publish, rand } from './shared'
import { useAtlas } from '../../state/store'
import { scatter } from '../../chapters/clean/physics'

/**
 * Chapter 3 tabs of the wafer layer.
 * Gettering (Topic 4 slides 12–14, 20): a wafer cross-section, drawn
 * magnified ×200 (1 unit = 5 µm), with the PSG, the devices, the denuded
 * zone, the intrinsic-gettering bulk and the backside region. The
 * temperature cycle grows SiO₂ precipitates; then metal atoms are kicked
 * out to interstitial sites, diffuse and get trapped.
 * Yield (slides 15–17): the die grid becomes a live yield model.
 */
const UM = 0.2 // units per µm
const THICK = 725 * UM
const WIDTH = 300
const DEPTH = 60
const DZ = 15 * UM * 3 // the 15 µm denuded zone, drawn ×3 deeper again so it reads
const TOP = THICK / 2

export function Gettering() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const r = useMemo(() => rand(8), [])
  const precs = useMemo(() => Array.from({ length: 60 }, () => new THREE.Vector3((r() - 0.5) * (WIDTH - 20), TOP - DZ - 14 - r() * (THICK - DZ - 40), (r() - 0.5) * (DEPTH - 10))), [r])
  const metals = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const start = new THREE.Vector3((r() - 0.5) * (WIDTH - 30), TOP - 3, (r() - 0.5) * (DEPTH - 14))
        // trapped either at the nearest precipitate or at the backside
        const toBack = i % 3 === 0
        const near = precs.reduce((b, p) => (p.distanceTo(start) < b.distanceTo(start) ? p : b), precs[0])
        const end = toBack ? new THREE.Vector3(start.x + (r() - 0.5) * 30, -TOP + 5, start.z) : near.clone().add(new THREE.Vector3(2.5, 0, 0))
        const mid = new THREE.Vector3((start.x + end.x) / 2 + (r() - 0.5) * 40, (start.y + end.y) / 2, (start.z + end.z) / 2)
        return { start, mid, end }
      }),
    [r, precs],
  )
  const alkali = useMemo(() => Array.from({ length: 10 }, () => new THREE.Vector3((r() - 0.5) * (WIDTH - 30), TOP - 4, (r() - 0.5) * (DEPTH - 14))), [r])
  const pRef = useRef<THREE.InstancedMesh>(null)
  const mRef = useRef<THREE.InstancedMesh>(null)
  const aRef = useRef<THREE.InstancedMesh>(null)
  const prog = useRef({ cycle: 0, getter: 0 })
  const o = useMemo(() => new THREE.Object3D(), [])
  const v = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, dt) => {
    const st = useAtlas.getState()
    const k = st.reducedMotion ? 1 : Math.min(1, dt * 2.5)
    prog.current.cycle += (st.clean.cycle - prog.current.cycle) * k
    prog.current.getter += (st.clean.getter - prog.current.getter) * k
    const cyc = prog.current.cycle
    const g = prog.current.getter
    // precipitates: nuclei at stage 2, grown at stage 3
    const ps = cyc < 1.5 ? 0 : cyc < 2.5 ? (cyc - 1.5) * 0.6 : 0.6 + (cyc - 2.5) * 0.8
    precs.forEach((p, i) => {
      o.position.copy(p)
      o.scale.setScalar(Math.max(0.001, Math.min(1.4, ps)))
      o.updateMatrix()
      pRef.current?.setMatrixAt(i, o.matrix)
    })
    if (pRef.current) pRef.current.instanceMatrix.needsUpdate = true
    // metals: substitutional → kicked out → diffusing → trapped (only once traps exist)
    const trapsReady = st.clean.cycle >= 3
    metals.forEach((m, i) => {
      let t = trapsReady ? Math.max(0, Math.min(1, (g - 1) / 2)) : Math.min(0.35, Math.max(0, (g - 1) / 2))
      if (g < 1) v.copy(m.start)
      else {
        // quadratic Bézier start → mid → end
        const a = m.start.clone().lerp(m.mid, t)
        const b = m.mid.clone().lerp(m.end, t)
        v.copy(a.lerp(b, t))
        if (g > 0.5 && g < 1.5) v.x += Math.sin(i * 3) * 1.2 * (g - 0.5)
      }
      if (t > 0 && t < 1 && !st.reducedMotion) v.add(new THREE.Vector3(Math.sin(i + performance.now() / 180) * 0.8, 0, Math.cos(i * 2 + performance.now() / 210) * 0.8))
      o.position.copy(v)
      o.scale.setScalar(1)
      o.updateMatrix()
      mRef.current?.setMatrixAt(i, o.matrix)
    })
    if (mRef.current) mRef.current.instanceMatrix.needsUpdate = true
    alkali.forEach((p, i) => {
      o.position.set(p.x, p.y + Math.min(1, Math.max(0, g - 2)) * 9, p.z)
      o.updateMatrix()
      aRef.current?.setMatrixAt(i, o.matrix)
    })
    if (aRef.current) aRef.current.instanceMatrix.needsUpdate = true
    if (st.quiz) return publish([])
    publish([
      label(camera, size, 'g-psg', 'PSG', 'getters Na⁺, K⁺', [-WIDTH / 2, TOP + 6, 0], 'side'),
      label(camera, size, 'g-dz', 'denuded zone', '10–20 µm', [-WIDTH / 2, TOP - DZ / 2, 0], 'side'),
      label(camera, size, 'g-ig', 'intrinsic gettering region', '500+ µm · SiO₂ precipitates', [-WIDTH / 2, 0, 0], 'side'),
      label(camera, size, 'g-bs', 'backside gettering region', 'extrinsic: damage', [-WIDTH / 2, -TOP + 4, 0], 'side'),
      label(camera, size, 'g-x', 'cross-section drawn ×200', 'denuded zone ×3 again', [0, -TOP - 10, 0], 'bottom'),
    ])
  })

  return (
    <>
      <StudioLights scale={10} />
      <Inspectable node="psg-layer" fit={1.6}>
        <mesh position={[0, TOP + 3, 0]}>
          <boxGeometry args={[WIDTH, 6, DEPTH]} />
          <meshStandardNodeMaterial color="#e6a9c8" roughness={0.6} transparent opacity={0.85} />
        </mesh>
      </Inspectable>
      <Inspectable node="device-layer" fit={2}>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} position={[-WIDTH / 2 + 30 + i * 48, TOP - 1, 0]}>
            <boxGeometry args={[18, 2, DEPTH - 6]} />
            <meshStandardNodeMaterial color="#1d2124" roughness={0.5} />
          </mesh>
        ))}
      </Inspectable>
      <Inspectable node="denuded-zone" fit={2}>
        <mesh position={[0, TOP - DZ / 2, 0]}>
          <boxGeometry args={[WIDTH, DZ, DEPTH]} />
          <meshStandardNodeMaterial color="#e9eef2" roughness={0.6} />
        </mesh>
      </Inspectable>
      <Inspectable node="ig-region" fit={1.1}>
        <mesh position={[0, (TOP - DZ - (-TOP + 8)) / 2 + (-TOP + 8), 0]}>
          <boxGeometry args={[WIDTH, THICK - DZ - 8, DEPTH]} />
          <meshStandardNodeMaterial color="#5f8fc7" roughness={0.6} transparent opacity={0.55} depthWrite={false} />
        </mesh>
      </Inspectable>
      <Inspectable node="backside-region" fit={2}>
        <mesh position={[0, -TOP + 4, 0]}>
          <boxGeometry args={[WIDTH, 8, DEPTH]} />
          <meshStandardNodeMaterial color="#8a3b3b" roughness={0.95} />
        </mesh>
      </Inspectable>
      <Inspectable node="oxide-precipitate" fit={4}>
        <instancedMesh ref={pRef} args={[undefined, undefined, precs.length]}>
          <icosahedronGeometry args={[2.4, 1]} />
          <meshStandardNodeMaterial color="#f2f4f3" roughness={0.4} />
        </instancedMesh>
      </Inspectable>
      <Inspectable node="metal-atom" fit={6}>
        <instancedMesh ref={mRef} args={[undefined, undefined, metals.length]}>
          <sphereGeometry args={[1.8, 12, 8]} />
          <meshStandardNodeMaterial color="#f0b43c" emissive="#7a5a10" emissiveIntensity={0.6} metalness={0.6} roughness={0.3} />
        </instancedMesh>
      </Inspectable>
      <instancedMesh ref={aRef} args={[undefined, undefined, alkali.length]} raycast={() => null}>
        <sphereGeometry args={[1.4, 10, 6]} />
        <meshBasicNodeMaterial color="#c58af0" />
      </instancedMesh>
    </>
  )
}

/** the live yield model over the wafer (1 unit = 1 mm) */
export function YieldDies() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const A = useAtlas((s) => s.clean.A)
  const D0 = useAtlas((s) => s.clean.D0)
  const C = useAtlas((s) => s.clean.C)
  const seed = useAtlas((s) => s.clean.seed)
  const R = 147
  const { dies, hits, side } = useMemo(() => {
    const side = Math.sqrt(A) * 10
    const dies: [number, number][] = []
    for (let x = -R; x < R; x += side)
      for (let z = -R; z < R; z += side) {
        const cs = [[x, z], [x + side, z], [x, z + side], [x + side, z + side]]
        if (cs.every(([a, b]) => Math.hypot(a, b) < R)) dies.push([x + side / 2, z + side / 2])
      }
    // neighbouring dies share a cluster (a 3×3 block), so failures bunch together
    const block = side * 3
    const hits = scatter(dies.length, A, D0, C, seed, (i) => Math.floor((dies[i][0] + R) / block) * 1000 + Math.floor((dies[i][1] + R) / block))
    return { dies, hits, side }
  }, [A, D0, C, seed])
  const good = useMemo(() => new THREE.MeshStandardNodeMaterial({ color: '#7f9a86', roughness: 0.4, metalness: 0.3 }), [])
  const bad = useMemo(() => new THREE.MeshStandardNodeMaterial({ color: '#c0503c', roughness: 0.5, emissive: '#5a1a10', emissiveIntensity: 0.5 }), [])
  const goodIm = useMemo(() => new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.3, 1), good, 4000), [good])
  const badIm = useMemo(() => new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.3, 1), bad, 4000), [bad])
  const dots = useMemo(() => new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicNodeMaterial({ color: '#f2f4f3' }), 4000), [])
  useMemo(() => {
    const o = new THREE.Object3D()
    const r = rand(seed * 31 + 7)
    let ng = 0
    let nb = 0
    let nd = 0
    dies.forEach(([x, z], i) => {
      o.position.set(x, 0.6, z)
      o.scale.set(side * 0.9, 1, side * 0.9)
      o.rotation.set(0, 0, 0)
      o.updateMatrix()
      if (hits[i]) badIm.setMatrixAt(nb++, o.matrix)
      else goodIm.setMatrixAt(ng++, o.matrix)
      for (let k = 0; k < Math.min(hits[i], 4) && nd < 4000; k++) {
        o.position.set(x + (r() - 0.5) * side * 0.8, 1.1, z + (r() - 0.5) * side * 0.8)
        o.scale.setScalar(Math.max(0.6, side * 0.06))
        o.updateMatrix()
        dots.setMatrixAt(nd++, o.matrix)
      }
    })
    goodIm.count = ng
    badIm.count = nb
    dots.count = nd
    ;[goodIm, badIm, dots].forEach((m) => ((m.instanceMatrix.needsUpdate = true), m.computeBoundingSphere()))
  }, [dies, hits, side, goodIm, badIm, dots, seed])
  useFrame(() => {
    if (useAtlas.getState().quiz) return publish([])
    const okN = hits.filter((h) => !h).length
    publish([label(camera, size, 'y-n', `${okN} of ${dies.length} die good`, `simulated yield ${((okN / Math.max(1, dies.length)) * 100).toFixed(0)} %`, [R * 0.7, 2, -R * 0.75], 'top')])
  })
  return (
    <>
      <Inspectable node="die-grid" fit={1.05}>
        <primitive object={goodIm} />
        <primitive object={badIm} />
      </Inspectable>
      <Inspectable node="killer-particle" fit={1.05}>
        <primitive object={dots} />
      </Inspectable>
    </>
  )
}

/**
 * Smart cut (Topic 6 slide 29), drawn as a block cross-section (thicknesses
 * exaggerated): oxidise a donor wafer, implant H, bond it face down to a
 * handle wafer, split along the H layer, and the SOI wafer is the handle
 * with the oxide and a thin Si layer on top.
 */
export function SmartCut() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const step = useAtlas((s) => s.epi.soi)
  const cur = useRef({ flip: 0, lift: 0, handle: 0 })
  useFrame((_, dt) => {
    const st = useAtlas.getState()
    const k = st.reducedMotion ? 1 : Math.min(1, dt * 3)
    // targets: the donor flips face down at bonding (3); after the cut (4) its bulk lifts away; at 5 the pair flips back
    const flipT = step >= 3 && step < 5 ? 1 : 0
    const liftT = step >= 4 ? 1 : 0
    const handleT = step >= 3 ? 1 : 0
    cur.current.flip += (flipT - cur.current.flip) * k
    cur.current.lift += (liftT - cur.current.lift) * k
    cur.current.handle += (handleT - cur.current.handle) * k
    if (st.quiz) return publish([])
    const names = ['Si donor wafer', 'thermal oxidation', 'H implantation', 'wafer bonding', 'smart cut: split along the H layer', 'flip, H out-diffusion, polish: SOI']
    publish([label(camera, size, 'soi-step', `${step + 1} · ${names[step]}`, step === 5 ? '205 nm Si on 400 nm SiO₂ (Soitec TEM)' : undefined, [0, 46, 0], 'top')])
  })
  const W = 120
  const D = 50
  const c = cur.current
  // positions (units: mm-scale drawing; the layers are exaggerated)
  const oxideOn = step >= 1
  const hOn = step >= 2 && step < 5
  return (
    <>
      <StudioLights scale={10} />
      {/* donor wafer (Si substrate) with its oxide and H plane; at bonding it flips onto the handle */}
      <group position={[0, step >= 5 ? -14 : 0, 0]} rotation-x={Math.PI * (step >= 5 ? 0 : c.flip)}>
        <group position={[0, -c.lift * 24, 0]}>
          <mesh position={[0, -12, 0]}>
            <boxGeometry args={[W, 20, D]} />
            <meshStandardNodeMaterial color="#9fc0d8" roughness={0.6} transparent opacity={step >= 5 ? 0 : 1} />
          </mesh>
        </group>
        <Inspectable node="soi-si" fit={1.4}>
          <mesh position={[0, -1.5, 0]}>
            <boxGeometry args={[W, 3, D]} />
            <meshStandardNodeMaterial color="#7fb0d0" roughness={0.5} />
          </mesh>
        </Inspectable>
        <Inspectable node="soi-box" fit={1.4}>
          <mesh position={[0, 2, 0]} visible={oxideOn}>
            <boxGeometry args={[W, 4, D]} />
            <meshStandardNodeMaterial color="#e6e8ea" roughness={0.5} />
          </mesh>
        </Inspectable>
        <Inspectable node="soi-split" fit={1.4}>
          <mesh position={[0, -3.2, 0]} visible={hOn}>
            <boxGeometry args={[W + 0.2, 0.6, D + 0.2]} />
            <meshStandardNodeMaterial color="#e070b0" emissive="#801860" emissiveIntensity={0.5} />
          </mesh>
        </Inspectable>
      </group>
      <Inspectable node="soi-handle" fit={1.4}>
        <mesh position={[0, step >= 5 ? -26 : 4 + 12 + (1 - c.handle) * 30, 0]} visible={step >= 3}>
          <boxGeometry args={[W, 20, D]} />
          <meshStandardNodeMaterial color="#e6a9c8" roughness={0.6} />
        </mesh>
      </Inspectable>
    </>
  )
}
