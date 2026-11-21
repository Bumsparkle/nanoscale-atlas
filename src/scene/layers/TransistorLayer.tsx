import * as THREE from 'three/webgpu'
import { frameDt } from '../../state/timescale'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { color, positionWorld, sin, uniform } from 'three/tsl'
import { inverterProcess } from '../../chapters/cmos/recipe'
import { MESH_OPTS } from '../../chapters/cmos/display'
import { resolveComponents } from '../../chapters/cmos/content'
import { mesh } from '../../sim/mesher'
import { useAtlas } from '../../state/store'
import { CellModel } from '../CellModel'
import { StudioLights } from '../Lighting'
import { matUniforms } from '../materials'
import { Inspectable, InspectSync, ClearOnMiss } from '../Inspectable'
import { rig } from '../rig'
import { transition } from '../transition'
import { overlay, type ScreenLabel } from '../cellRuntime'
import { Spring, SPRINGS } from '../spring'
import { channelStrength } from '../../chapters/cmos/device'

/**
 * Layer 4: one transistor, cut along the slide 27 line (1 unit = λ).
 * The gate-voltage control inverts the channel (slide 12 for nMOS, 13 for
 * pMOS) and carriers stream from source to drain.
 */
const DEV = {
  nmos: { gate: 10, window: { x0: 2.5, x1: 17.5, y0: -3.5, y1: 8.5 }, src: 6, drn: 14, carrier: '#8fd0ff' },
  pmos: { gate: 34, window: { x0: 26.5, x1: 41.5, y0: -3.5, y1: 8.5 }, src: 38, drn: 30, carrier: '#ffb56b' },
}

export default function TransistorLayer() {
  const device = useAtlas((s) => s.device)
  const d = DEV[device]
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const model = useMemo(() => {
    const m = new CellModel()
    const res = mesh(inverterProcess().final(), { ...MESH_OPTS, window: d.window })
    m.update(res, resolveComponents(res), { clip: { axis: 'y', offset: 2 }, gap: 0, explode: [] })
    // keep only the far half: the cut face is the front of the device
    // device physics only: drop the near half, the wiring and the field oxide
    const drop = new Set(['al', 'al:plug', 'fox'])
    for (const [k, mm] of m.meshes) if (mm.userData.half === 'near' || drop.has(mm.userData.key)) (mm.parent?.remove(mm), m.meshes.delete(k))
    return m
  }, [d])
  const on = useMemo(() => uniform(0), [])
  const tint = useMemo(() => uniform(new THREE.Color(d.carrier)), [d])
  const sheet = useMemo(() => {
    const m = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
    const flow = sin(positionWorld.x.mul(device === 'nmos' ? -5 : 5).add(matUniforms.time.mul(9))).mul(0.25).add(0.75)
    m.colorNode = tint
    m.opacityNode = on.mul(flow).mul(0.9)
    return m
  }, [on, tint, device])
  const depletion = useMemo(() => {
    const m = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false })
    m.colorNode = color('#e8eef2')
    m.opacityNode = on.mul(0.16)
    return m
  }, [on])
  const strength = useRef(new Spring(0, SPRINGS.ui))
  const carriers = useRef<THREE.InstancedMesh>(null)
  const gateRef = useRef<THREE.Mesh>(null)
  const N = 90
  const seeds = useMemo(() => Array.from({ length: N }, () => ({ p: Math.random(), y: 2.2 + Math.random() * 1.7, z: Math.random(), v: 0.7 + Math.random() * 0.6 })), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const clock = useRef(0)
  const offsetX = -(d.gate - 25)

  useFrame((_, dt) => {
    const st = useAtlas.getState()
    strength.current.target = channelStrength(device, st.vg)
    const cdt = frameDt(dt)
    const s = strength.current.step(cdt, st.reducedMotion)
    on.value = s
    matUniforms.xray.value = 0.55
    clock.current += cdt * (0.25 + 1.6 * s)
    const im = carriers.current
    if (im) {
      for (let i = 0; i < N; i++) {
        const q = seeds[i]
        const t = (clock.current * 0.35 * q.v + q.p) % 1
        // carriers drift source → drain through the inverted channel
        const x = d.src + (d.drn - d.src) * t
        const inChannel = Math.abs(x - d.gate) < 1.2
        const depth = inChannel ? 0.06 + q.z * 0.1 : 0.1 + q.z * 0.55
        // carriers are drawn on the cut face so they stay visible
        dummy.position.set(x - 25, -depth, 0.08 + q.z * 0.05)
        dummy.scale.setScalar(s > 0.05 ? 1 : 0)
        dummy.updateMatrix()
        im.setMatrixAt(i, dummy.matrix)
      }
      im.instanceMatrix.needsUpdate = true
    }
    if (gateRef.current) (gateRef.current.material as THREE.MeshBasicNodeMaterial).opacity = 0.15 + 0.5 * st.vg
    // terminal labels (slide 11: gate, source, drain, body)
    const lab = (id: string, text: string, sub: string, p: [number, number, number], group: ScreenLabel['group']): ScreenLabel => {
      const v = new THREE.Vector3(p[0] + offsetX, p[1], p[2]).project(camera)
      return { id, text, sub, x: ((v.x + 1) / 2) * size.width, y: ((1 - v.y) / 2) * size.height, group, visible: v.z < 1 }
    }
    const vdd = device === 'pmos'
    overlay.labels = [
      lab('t-g', 'gate', `A · VG = ${(st.vg * 1.0).toFixed(2)} V`, [d.gate - 25, 2.2, 0], 'top'),
      lab('t-s', 'source', vdd ? 'VDD' : 'GND', [d.src - 25, -0.4, 0], 'bottom'),
      lab('t-d', 'drain', 'Y', [d.drn - 25, -0.4, 0], 'bottom'),
      lab('t-b', 'body', vdd ? 'n-well → VDD' : 'p substrate → GND', [d.gate - 25, -4.5, 0], 'bottom'),
    ]
    overlay.version = 1000 + (device === 'pmos' ? 1 : 0)
  })

  useEffect(() => {
    rig.setHome({ target: [0, -1.2, -1] })
    rig.goHome()
    rig.handlers = {
      onDiveIn: () => void transition.go('oxide', { via: [0, 0.3, 0] }),
      onSurface: () => void transition.go('cell'),
    }
    return () => {
      rig.handlers = {}
      matUniforms.xray.value = 0
      overlay.labels = []
      overlay.version++
      model.dispose()
    }
  }, [model])

  const cx = d.gate - 25
  return (
    <>
      <StudioLights />
      <group position={[offsetX, 0, 0]}>
        <primitive object={model.group} />
        <Inspectable node="channel" fit={2.2} minDist={12}>
          {/* inversion layer: drawn 0.15λ thick (real: a few nm) */}
          <mesh material={sheet} position={[cx, -0.075, 0.03]} renderOrder={6}>
            <boxGeometry args={[2, 0.15, 0.06]} />
          </mesh>
        </Inspectable>
        <mesh material={depletion} position={[cx, -0.75, 0.02]} renderOrder={5} raycast={() => null}>
          <boxGeometry args={[5.4, 1.2, 0.04]} />
        </mesh>
        <mesh ref={gateRef} position={[cx, 1.55, -1]} raycast={() => null} renderOrder={7}>
          <boxGeometry args={[2.02, 0.04, 2.02]} />
          <meshBasicNodeMaterial color="#f0b43c" transparent opacity={0.2} depthWrite={false} />
        </mesh>
        <instancedMesh ref={carriers} args={[new THREE.SphereGeometry(0.09, 8, 6), undefined, N]} frustumCulled={false} raycast={() => null}>
          <meshBasicNodeMaterial color={d.carrier} />
        </instancedMesh>
      </group>
      <InspectSync />
      <ClearOnMiss />
    </>
  )
}
