import * as THREE from 'three/webgpu'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import { StudioLights } from '../Lighting'
import { ClearOnMiss, Inspectable, InspectSync } from '../Inspectable'
import { label, publish, rand, useDive } from './shared'
import { useApp } from '../../state/store'
import { P } from '../../theme/scene'

/**
 * Chapter 2, layer 1: quartz sand, SiO₂ (1 unit = 0.1 mm). A heap of
 * grains of 0.2–1.5 mm, and beside it a fragment of metallurgical-grade
 * silicon, the product of step 1 of the refining (Topic 3 slide 15).
 */
function grains(n: number) {
  const r = rand(11)
  const geo = new THREE.IcosahedronGeometry(1, 2)
  // sub-rounded grains: a smooth bump field on the sphere (the same factor for
  // every copy of a vertex, so faces stay joined)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize()
    const f = 0.86 + 0.1 * Math.sin(3.1 * v.x + 1.3) * Math.cos(2.7 * v.y - 0.4) + 0.06 * Math.sin(4.3 * v.z + 2.1 * v.x)
    pos.setXYZ(i, v.x * f, v.y * f * 0.82, v.z * f)
  }
  geo.computeVertexNormals()
  const mat = new THREE.MeshPhysicalNodeMaterial({ color: P.sand.grain, roughness: 0.38, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.3 })
  const im = new THREE.InstancedMesh(geo, mat, n)
  const o = new THREE.Object3D()
  const tints = [P.sand.t0, P.sand.t1, P.sand.t2, P.sand.t3, P.sand.t4, P.sand.t5]
  const c = new THREE.Color()
  for (let i = 0; i < n; i++) {
    // a heap: a cone of radius 70 units (7 mm), height 32
    const rr = 70 * Math.sqrt(r())
    const th = r() * Math.PI * 2
    const h = Math.max(0, 32 * (1 - rr / 70)) * (0.55 + 0.45 * r())
    const s = 2 + Math.pow(r(), 1.8) * 11 // 0.2–1.3 mm
    o.position.set(rr * Math.cos(th), h + s * 0.5, rr * Math.sin(th))
    o.rotation.set(r() * 6.3, r() * 6.3, r() * 6.3)
    o.scale.set(s * (0.8 + r() * 0.4), s * (0.7 + r() * 0.3), s * (0.8 + r() * 0.4))
    o.updateMatrix()
    im.setMatrixAt(i, o.matrix)
    im.setColorAt(i, c.set(tints[Math.floor(r() * tints.length)]))
  }
  return im
}

function lump() {
  const geo = new THREE.DodecahedronGeometry(1, 0)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) pos.setXYZ(i, pos.getX(i) * 1.3, pos.getY(i) * 0.8, pos.getZ(i))
  geo.computeVertexNormals()
  return geo
}

export default function SandLayer() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const heap = useMemo(() => grains(900), [])
  const mgs = useMemo(() => lump(), [])
  useDive(null, 'polysilicon', { home: [10, 14, 0] })

  useFrame(() => {
    if (useApp.getState().quiz) return publish([])
    publish([
      label(camera, size, 's-sand', 'SiO₂ sand grains', '0.2–1.3 mm', [-30, 34, 10], 'top'),
      label(camera, size, 's-mgs', 'metallurgical-grade Si', 'SiO₂ + 2C → Si + 2CO', [92, 26, -6], 'top'),
    ])
  })

  return (
    <>
      <StudioLights scale={4} />
      <Inspectable node="quartz-sand" fit={1.3}>
        <primitive object={heap} />
      </Inspectable>
      <Inspectable node="mg-silicon" fit={2.2} minDist={20}>
        <mesh geometry={mgs} position={[92, 11, -6]} scale={[16, 14, 15]} rotation={[0.3, 0.8, 0.1]}>
          <meshStandardNodeMaterial color={P.sand.tray} metalness={0.75} roughness={0.38} />
        </mesh>
      </Inspectable>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.2, 0]}>
        <circleGeometry args={[400, 64]} />
        <meshStandardNodeMaterial color={P.stage.table} roughness={0.95} />
      </mesh>
      <InspectSync />
      <ClearOnMiss />
    </>
  )
}
