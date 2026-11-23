import * as THREE from 'three/webgpu'
import { useEffect, useMemo } from 'react'
import { cameraPosition, color, cos, dot, mix, normalWorld, positionWorld, texture, uv, vec3, float, clamp, abs } from 'three/tsl'
import { useLabEnvironment } from '../Lighting'
import { Inspectable, InspectSync, ClearOnMiss } from '../Inspectable'
import { rig } from '../rig'
import { transition } from '../transition'
import { Gettering, SmartCut, YieldDies } from './WaferTabs'
import { useAtlas } from '../../state/store'

/**
 * Layer 1: a 300 mm wafer on the chuck under yellow light (1 unit = 1 mm).
 * Dies are 4 mm squares (illustrative); one is the inverter's die.
 */
const R = 150
const DIE = 4
export const TARGET_DIE: [number, number] = [6, -10] // die centre (mm) in wafer coords (x, z)

function dieTexture() {
  const N = 2048
  const c = document.createElement('canvas')
  c.width = c.height = N
  const g = c.getContext('2d')!
  const s = N / (2 * R) // px per mm
  g.fillStyle = '#000'
  g.fillRect(0, 0, N, N)
  for (let x = -R; x < R; x += DIE)
    for (let y = -R; y < R; y += DIE) {
      // only whole dies inside the 3 mm edge exclusion
      const corners = [[x, y], [x + DIE, y], [x, y + DIE], [x + DIE, y + DIE]]
      if (!corners.every(([a, b]) => Math.hypot(a, b) < R - 3)) continue
      const px = (x + R) * s
      const py = (y + R) * s
      const d = DIE * s
      g.fillStyle = '#d0d0d0'
      g.fillRect(px + 1.2, py + 1.2, d - 2.4, d - 2.4) // die (scribe lines stay dark)
      g.fillStyle = '#7a7a7a'
      g.fillRect(px + d * 0.18, py + d * 0.18, d * 0.38, d * 0.3) // memory block
      g.fillStyle = '#9c9c9c'
      g.fillRect(px + d * 0.18, py + d * 0.55, d * 0.64, d * 0.27) // logic
      g.fillStyle = '#b8b8b8'
      g.fillRect(px + d * 0.6, py + d * 0.18, d * 0.22, d * 0.3)
    }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.NoColorSpace
  t.anisotropy = 8
  return t
}

function waferMaterial() {
  const tex = dieTexture()
  const m = new THREE.MeshPhysicalNodeMaterial({ metalness: 0.85, roughness: 0.16 })
  const pattern = texture(tex, uv()).r
  // polished silicon is a dark mirror; the patterned dies diffract light into rainbow bands
  const V = cameraPosition.sub(positionWorld).normalize()
  const ref = V.reflect(normalWorld)
  const t = dot(ref, vec3(0.42, 0.18, 0.61)).mul(2.4).add(positionWorld.x.mul(0.004)).add(positionWorld.z.mul(0.003))
  const rainbow = vec3(0.5).add(cos(vec3(t, t, t).add(vec3(0, 2.1, 4.2)).mul(6.283)).mul(0.5))
  const grazing = clamp(float(1).sub(abs(dot(normalWorld, V))), 0, 1)
  const base = mix(color('#2b3238'), color('#5f6a73'), pattern)
  m.colorNode = mix(base, rainbow.mul(0.75), pattern.mul(0.35).add(grazing.mul(0.25)).mul(pattern))
  m.roughnessNode = mix(float(0.08), float(0.3), pattern)
  return m
}

function WaferScene() {
  useLabEnvironment(true, 1.2)
  const tab = useAtlas((s) => s.tab)
  const wafer = useMemo(() => waferMaterial(), [])
  const plain = useMemo(() => new THREE.MeshStandardNodeMaterial({ color: '#3a434a', metalness: 0.8, roughness: 0.2 }), [])
  const chuck = useMemo(() => new THREE.MeshStandardNodeMaterial({ color: '#16181a', roughness: 0.55, metalness: 0.4 }), [])
  const target = useMemo(() => {
    const m = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false })
    m.colorNode = color('#f0b43c')
    m.opacity = 0.55
    return m
  }, [])

  useEffect(() => {
    rig.setHome({ target: [0, 0, 0] })
    rig.goHome()
    rig.handlers = {
      onDiveIn: () => void transition.go('die', { via: [TARGET_DIE[0], 0.4, TARGET_DIE[1]] }),
      onSurface: () => void transition.go('cleanroom'),
    }
    return () => void (rig.handlers = {})
  }, [])

  // UV mapping of the top face: cylinder caps map uv to the unit disc
  return (
    <>
      <hemisphereLight args={['#ffd9a0', '#120c06', 0.5]} />
      <directionalLight position={[120, 260, 160]} intensity={2.4} color="#ffc76b" />
      <directionalLight position={[-200, 120, -80]} intensity={0.6} color="#ffae4a" />
      <Inspectable node="wafer" fit={1.05}>
        <mesh material={tab === 'yield' ? plain : wafer} position={[0, 0, 0]}>
          <cylinderGeometry args={[R, R, 0.775, 160, 1]} />
        </mesh>
      </Inspectable>
      <Inspectable node="wafer-notch" fit={6} minDist={70}>
        <mesh position={[0, 0.2, R - 0.6]} rotation-y={Math.PI / 4}>
          <boxGeometry args={[2.2, 0.9, 2.2]} />
          <meshStandardNodeMaterial color="#0b0c0d" roughness={0.9} />
        </mesh>
      </Inspectable>
      {tab === 'yield' && <YieldDies />}
      {tab !== 'yield' && <Inspectable node="die-site" fit={8} minDist={70}>
        <mesh material={target} position={[TARGET_DIE[0], 0.41, TARGET_DIE[1]]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[2.6, 3.1, 4, 1, Math.PI / 4]} />
        </mesh>
        <mesh position={[TARGET_DIE[0], 0.4, TARGET_DIE[1]]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[DIE - 0.3, DIE - 0.3]} />
          <meshBasicNodeMaterial transparent opacity={0.0} depthWrite={false} />
        </mesh>
      </Inspectable>}
      {/* vacuum chuck */}
      <mesh material={chuck} position={[0, -2.5, 0]}>
        <cylinderGeometry args={[158, 162, 4.2, 128]} />
      </mesh>
      <InspectSync />
      <ClearOnMiss />
    </>
  )
}

export default function WaferLayer() {
  const tab = useAtlas((s) => s.tab)
  useEffect(() => {
    if (tab !== 'gettering' && tab !== 'soi') return
    rig.setHome(tab === 'soi' ? { target: [0, 6, 0], polar: 1.2, azimuth: 0.5, dist: 300 } : { target: [40, 0, 0], polar: 1.38, azimuth: 0.25, dist: 620 })
    rig.goHome()
    rig.handlers = { onSurface: () => void transition.go('cleanroom') }
    return () => void (rig.handlers = {})
  }, [tab])
  if (tab === 'soi')
    return (
      <>
        <SmartCut />
        <InspectSync />
        <ClearOnMiss />
      </>
    )
  return tab === 'gettering' ? (
    <>
      <Gettering />
      <InspectSync />
      <ClearOnMiss />
    </>
  ) : (
    <WaferScene />
  )
}
