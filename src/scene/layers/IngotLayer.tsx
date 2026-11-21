import * as THREE from 'three/webgpu'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { StudioLights } from '../Lighting'
import { ClearOnMiss, Inspectable, InspectSync } from '../Inspectable'
import { dopingColour, label, publish, useDive } from './shared'
import { useAtlas } from '../../state/store'
import { csOverC0 } from '../../chapters/growth/physics'

/**
 * Chapter 2, layer 4: the ingot (1 unit = 1 cm), Topic 3 slide 23.
 * The as-grown crystal (seed, crown, body, tail) coloured by its doping
 * for the current k0, then the same body ground to diameter, then with an
 * orientation flat ground along it.
 */
const BODY = 150
const R = 15
const F_END = 0.92

function asGrown(k0: number) {
  const pts: THREE.Vector2[] = []
  const f: number[] = []
  // from the seed end (y = 0) to the tail (y = BODY + 50)
  pts.push(new THREE.Vector2(0.01, 0), new THREE.Vector2(1.5, 0), new THREE.Vector2(1.5, 12))
  f.push(0, 0, 0)
  for (let i = 1; i <= 10; i++) {
    const t = i / 10
    pts.push(new THREE.Vector2(1.5 + (R + 0.8 - 1.5) * Math.sin((t * Math.PI) / 2), 12 + t * 14))
    f.push(0)
  }
  const N = 50
  for (let i = 1; i <= N; i++) {
    const y = 26 + (i / N) * BODY
    // growth ripples on the unground surface
    pts.push(new THREE.Vector2(R + 0.8 + 0.25 * Math.sin(i * 1.7), y))
    f.push((i / N) * F_END)
  }
  for (let i = 1; i <= 10; i++) {
    const t = i / 10
    pts.push(new THREE.Vector2((R + 0.8) * (1 - t * 0.92), 26 + BODY + t * 22))
    f.push(F_END + t * 0.06)
  }
  pts.push(new THREE.Vector2(0.01, 26 + BODY + 22))
  f.push(0.98)
  const segs = 64
  const geo = new THREE.LatheGeometry(pts, segs)
  const col = new Float32Array(geo.attributes.position.count * 3)
  const c = new THREE.Color()
  for (let s = 0; s <= segs; s++)
    for (let j = 0; j < pts.length; j++) {
      dopingColour(csOverC0(k0, f[j]), c)
      col.set([c.r, c.g, c.b], (s * pts.length + j) * 3)
    }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  geo.translate(0, -(26 + BODY / 2), 0)
  return geo
}

function ground(flat: boolean) {
  const geo = new THREE.CylinderGeometry(R, R, BODY, 96, 1)
  if (flat) {
    const pos = geo.attributes.position
    const x0 = R * 0.86
    for (let i = 0; i < pos.count; i++) if (pos.getX(i) > x0) pos.setX(i, x0)
    geo.computeVertexNormals()
  }
  return geo
}

export default function IngotLayer() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const k0 = useAtlas((s) => s.growth.k0)
  const grown = useMemo(() => asGrown(k0), [k0])
  useEffect(() => () => grown.dispose(), [grown])
  const round = useMemo(() => ground(false), [])
  const flat = useMemo(() => ground(true), [])
  useDive('puller', 'wafers', { home: [0, 0, 10] })

  useFrame(() => {
    if (useAtlas.getState().quiz) return publish([])
    publish([
      label(camera, size, 'i-seed', 'seed end', `Cs = ${csOverC0(k0, 0).toFixed(2)} C0`, [-BODY / 2 - 30, 4, -45], 'top'),
      label(camera, size, 'i-tail', 'tail end', `Cs = ${csOverC0(k0, F_END).toFixed(2)} C0`, [BODY / 2 + 22, 4, -45], 'top'),
      label(camera, size, 'i-d', 'diameter grind', '300 mm', [0, R + 2, 0], 'right'),
      label(camera, size, 'i-f', 'flat grind', 'marks the orientation', [0, R + 2, 45], 'right'),
    ])
  })

  return (
    <>
      <StudioLights scale={8} />
      <Inspectable node="ingot-body" fit={1.15}>
        <mesh geometry={grown} rotation-z={-Math.PI / 2} position={[0, 0, -45]}>
          <meshStandardNodeMaterial vertexColors metalness={0.6} roughness={0.3} />
        </mesh>
      </Inspectable>
      <Inspectable node="ingot-ground" fit={1.2}>
        <mesh geometry={round} rotation-z={-Math.PI / 2} position={[0, 0, 0]}>
          <meshStandardNodeMaterial color="#8ea2b2" metalness={0.75} roughness={0.18} />
        </mesh>
        <mesh geometry={flat} rotation-z={Math.PI / 2} position={[0, 0, 45]}>
          <meshStandardNodeMaterial color="#8ea2b2" metalness={0.75} roughness={0.18} />
        </mesh>
      </Inspectable>
      <mesh position={[0, -R - 2, 0]}>
        <boxGeometry args={[280, 2, 150]} />
        <meshStandardNodeMaterial color="#3a4045" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -R - 3.1, 0]}>
        <circleGeometry args={[1200, 48]} />
        <meshStandardNodeMaterial color="#25292c" roughness={1} />
      </mesh>
      <InspectSync />
      <ClearOnMiss radius={6000} />
    </>
  )
}
