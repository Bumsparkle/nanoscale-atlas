import * as THREE from 'three/webgpu'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { StudioLights } from '../Lighting'
import { ClearOnMiss, Inspectable, InspectSync } from '../Inspectable'
import { label, publish, rand, useDive } from './shared'
import { useApp } from '../../state/store'
import { P } from '../../theme/scene'

/**
 * Chapter 2, layer 2: refined polysilicon (1 unit = 1 mm). A cut-away
 * Siemens reactor, where SiHCl₃ + H₂ deposit pure polysilicon on hot
 * U-shaped rods (Topic 3 slide 15, step 3), and the broken rods as chunks
 * in a quartz crucible, ready to melt (slide 16).
 */
function uRod(x: number, z: number, h: number, span: number, r: number) {
  const g = new THREE.Group()
  const leg = new THREE.CylinderGeometry(r, r * 1.04, h, 28, 6)
  // a slightly lumpy surface: polysilicon grows as a cauliflower of grains
  const rr = rand(Math.round(x * 7 + z))
  const pos = leg.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const f = 1 + (rr() - 0.5) * 0.05
    pos.setX(i, pos.getX(i) * f)
    pos.setZ(i, pos.getZ(i) * f)
  }
  leg.computeVertexNormals()
  const a = new THREE.Mesh(leg)
  a.position.set(x - span / 2, h / 2, z)
  const b = new THREE.Mesh(leg)
  b.position.set(x + span / 2, h / 2, z)
  const bridge = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.95, r * 0.95, span + r * 1.6, 24))
  bridge.rotation.z = Math.PI / 2
  bridge.position.set(x, h + r * 0.4, z)
  g.add(a, b, bridge)
  return g
}

function chunks(n: number) {
  const r = rand(21)
  const geo = new THREE.DodecahedronGeometry(1, 0)
  const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardNodeMaterial({ color: P.poly.chunk, metalness: 0.7, roughness: 0.32 }), n)
  const o = new THREE.Object3D()
  for (let i = 0; i < n; i++) {
    const rr = 270 * Math.sqrt(r())
    const th = r() * Math.PI * 2
    const s = 28 + r() * 55
    o.position.set(rr * Math.cos(th), 20 + r() * 300 * (1 - (rr / 300) * 0.3), rr * Math.sin(th))
    o.rotation.set(r() * 6, r() * 6, r() * 6)
    o.scale.set(s * (0.7 + r() * 0.6), s * (0.5 + r() * 0.5), s * (0.7 + r() * 0.6))
    o.updateMatrix()
    im.setMatrixAt(i, o.matrix)
  }
  return im
}

export default function PolysiliconLayer() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const rods = useMemo(() => [uRod(-260, 0, 1650, 300, 75), uRod(260, 0, 1650, 300, 75)], [])
  const glow = useMemo(() => new THREE.MeshStandardNodeMaterial({ color: P.poly.rod, emissive: P.heat.rodGlow, emissiveIntensity: 0.55, roughness: 0.6, metalness: 0.3 }), [])
  rods.forEach((g) => g.traverse((o) => ((o as THREE.Mesh).isMesh ? ((o as THREE.Mesh).material = glow) : null)))
  const pile = useMemo(() => chunks(170), [])
  const t = useRef(0)
  useDive('sand', 'puller', { home: [500, 800, 0] })

  useFrame((_, dt) => {
    t.current += dt
    glow.emissiveIntensity = 0.5 + 0.05 * Math.sin(t.current * 2.2)
    if (useApp.getState().quiz) return publish([])
    publish([
      label(camera, size, 'p-in', 'SiHCl₃ + H₂ in', 'Siemens process', [-700, 120, 300], 'side'),
      label(camera, size, 'p-out', '2SiHCl₃ + 2H₂ → 2Si + 6HCl', 'Si deposits on the hot rods', [0, 1900, 0], 'top'),
      label(camera, size, 'p-c', 'polysilicon chunks', '< 1 ppb impurities (O, C aside)', [1350, 420, 0], 'top'),
    ])
  })

  return (
    <>
      <StudioLights scale={40} />
      <pointLight position={[0, 900, 300]} intensity={2.5e5} distance={3000} color={P.heat.reactorLight} />
      {/* reactor base and cut-away bell jar */}
      <mesh position={[0, -30, 0]}>
        <cylinderGeometry args={[760, 800, 60, 64]} />
        <meshStandardNodeMaterial color={P.obj.steelDark} metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, 0]} raycast={() => null}>
        <cylinderGeometry args={[720, 720, 2000, 64, 1, true, Math.PI * 0.15, Math.PI * 1.3]} />
        <meshStandardNodeMaterial color={P.obj.bellJar} metalness={0.9} roughness={0.25} side={THREE.DoubleSide} transparent opacity={0.35} />
      </mesh>
      <mesh position={[0, 1000, 0]} raycast={() => null}>
        <sphereGeometry args={[720, 48, 16, Math.PI * 0.15, Math.PI * 1.3, 0, Math.PI / 2]} />
        <meshStandardNodeMaterial color={P.obj.bellJar} metalness={0.9} roughness={0.25} side={THREE.DoubleSide} transparent opacity={0.35} />
      </mesh>
      <Inspectable node="siemens-rod" fit={1.2}>
        {rods.map((g, i) => (
          <primitive key={i} object={g} />
        ))}
      </Inspectable>
      {/* the crucible charge */}
      <group position={[1350, 0, 0]}>
        <Inspectable node="poly-charge" fit={1.6}>
          <primitive object={pile} />
          <mesh position={[0, 190, 0]}>
            <cylinderGeometry args={[320, 300, 380, 64, 1, true]} />
            <meshPhysicalNodeMaterial color={P.obj.glass} roughness={0.18} transmission={0.6} thickness={20} side={THREE.DoubleSide} transparent opacity={0.55} />
          </mesh>
          <mesh position={[0, 4, 0]} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[300, 48]} />
            <meshStandardNodeMaterial color={P.obj.ceramic} roughness={0.3} />
          </mesh>
        </Inspectable>
      </group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -61, 0]}>
        <circleGeometry args={[5000, 64]} />
        <meshStandardNodeMaterial color={P.stage.floor} roughness={1} />
      </mesh>
      <InspectSync />
      <ClearOnMiss radius={20000} />
    </>
  )
}
