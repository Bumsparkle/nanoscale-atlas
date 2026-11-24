import * as THREE from 'three/webgpu'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { StudioLights } from '../Lighting'
import { ClearOnMiss, Inspectable, InspectSync } from '../Inspectable'
import { label, publish, useDive } from './shared'
import { useAtlas } from '../../state/store'
import { P } from '../../theme/scene'

/**
 * Chapter 2, layer 5: ingot to wafers (1 unit = 1 mm), Topic 3 slide 23.
 * The ground ingot passes through an internal-diameter saw, whose diamond
 * inner rim slices off wafers; the slices stand in a carrier, and one lies
 * face-up to show its notch and scribed identification number.
 */
const R = 150

function blade() {
  const s = new THREE.Shape()
  s.absarc(0, 0, 430, 0, Math.PI * 2, false)
  const hole = new THREE.Path()
  hole.absarc(0, 0, 175, 0, Math.PI * 2, true)
  s.holes.push(hole)
  const g = new THREE.ExtrudeGeometry(s, { depth: 1.5, bevelEnabled: false, curveSegments: 96 })
  g.translate(0, 0, -0.75)
  return g
}

function idTexture() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 128
  const g = c.getContext('2d')!
  g.fillStyle = P.tex.black
  g.fillRect(0, 0, 512, 128)
  g.fillStyle = P.tex.white
  g.font = '600 64px "IBM Plex Mono", monospace'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('N4T3-0417', 256, 64)
  const t = new THREE.CanvasTexture(c)
  return t
}

/** a wafer disc with a notch at −z */
function waferGeo() {
  const s = new THREE.Shape()
  const notch = 0.04
  s.absarc(0, 0, R, -Math.PI / 2 + notch, -Math.PI / 2 - notch + Math.PI * 2, false)
  s.lineTo(0, -R + 3.5)
  s.closePath()
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.775, bevelEnabled: false, curveSegments: 120 })
  g.rotateX(-Math.PI / 2)
  return g
}

export default function WafersLayer() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const saw = useRef<THREE.Mesh>(null)
  const bladeGeo = useMemo(() => blade(), [])
  const wafer = useMemo(() => waferGeo(), [])
  const idTex = useMemo(() => idTexture(), [])
  const waferMat = useMemo(() => new THREE.MeshStandardNodeMaterial({ color: P.wafers.wafer, metalness: 0.55, roughness: 0.22 }), [])
  useDive('ingot', 'cleanroom', { home: [180, 160, 220] })

  useFrame((_, dt) => {
    const st = useAtlas.getState()
    if (saw.current && !st.reducedMotion) saw.current.rotation.z += dt * 2.4
    if (st.quiz) return publish([])
    publish([
      label(camera, size, 'w-saw', 'internal-diameter saw', 'diamond-coated inner rim', [0, 440, 0], 'top'),
      label(camera, size, 'w-ingot', 'ground ingot', '300 mm', [-500, R + 10, 0], 'top'),
      label(camera, size, 'w-id', 'notch + scribed ID', undefined, [320, 4, 640 - R + 10], 'right'),
      label(camera, size, 'w-carrier', 'wafers in a carrier', 'for batch wet processing', [560, 330, 0], 'right'),
    ])
  })

  return (
    <>
      <StudioLights scale={60} />
      {/* the ingot runs along x and ends in the blade's hole */}
      <mesh position={[-450, R + 20, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[R, R, 900, 96]} />
        <meshStandardNodeMaterial color={P.obj.siliconBright} metalness={0.75} roughness={0.2} />
      </mesh>
      <Inspectable node="id-saw" fit={1.2}>
        <mesh ref={saw} geometry={bladeGeo} position={[0, R + 20, 0]} rotation-y={Math.PI / 2}>
          <meshStandardNodeMaterial color={P.wafers.saw} metalness={0.5} roughness={0.32} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, R + 20, 0]} rotation-y={Math.PI / 2} raycast={() => null}>
          <ringGeometry args={[175, 182, 96]} />
          <meshStandardNodeMaterial color={P.wafers.slurry} metalness={0.5} roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[60, R + 20, 0]}>
          <boxGeometry args={[100, 980, 980]} />
          <meshStandardNodeMaterial color={P.wafers.ghost} metalness={0.5} roughness={0.5} transparent opacity={0.0} depthWrite={false} />
        </mesh>
      </Inspectable>
      <mesh position={[-60, R + 20, -520]} raycast={() => null}>
        <boxGeometry args={[140, 1000, 60]} />
        <meshStandardNodeMaterial color={P.wafers.base} metalness={0.5} roughness={0.5} />
      </mesh>
      {/* the carrier with a batch of slices */}
      <group position={[560, 0, 0]}>
        <Inspectable node="wafer-cassette" fit={1.3}>
          {Array.from({ length: 13 }, (_, i) => (
            <mesh key={i} geometry={wafer} material={waferMat} position={[(i - 6) * 9, R + 8, 0]} rotation-z={Math.PI / 2} />
          ))}
          <mesh position={[0, 60, 0]}>
            <boxGeometry args={[140, 120, 300]} />
            <meshStandardNodeMaterial color={P.wafers.cassette} roughness={0.6} transparent opacity={0.55} />
          </mesh>
        </Inspectable>
      </group>
      {/* one wafer face up: notch and scribed number */}
      <group position={[320, 0, 640]}>
        <Inspectable node="wafer-slice" fit={1.15}>
          <mesh geometry={wafer} material={waferMat} />
        </Inspectable>
        <Inspectable node="wafer-id" fit={6} minDist={140}>
          <mesh position={[0, 0.8, -R + 16]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[46, 11.5]} />
            <meshBasicNodeMaterial map={idTex} transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </Inspectable>
      </group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -1, 0]}>
        <circleGeometry args={[9000, 48]} />
        <meshStandardNodeMaterial color={P.stage.floor} roughness={1} />
      </mesh>
      <InspectSync />
      <ClearOnMiss radius={40000} />
    </>
  )
}
