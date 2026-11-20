import * as THREE from 'three/webgpu'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

/**
 * A custom environment instead of a stock HDRI: a dark room with long
 * strip lights overhead, like cleanroom ceiling fixtures. Metals reflect
 * these strips as clean bands.
 */
function buildEnvScene(warm: boolean) {
  const s = new THREE.Scene()
  s.background = new THREE.Color(0x1a1d1f)
  const strip = new THREE.MeshBasicMaterial({ color: warm ? 0xffe2a8 : 0xf2f5f7 })
  const soft = new THREE.MeshBasicMaterial({ color: warm ? 0x5a4a30 : 0x50565b })
  const dim = new THREE.MeshBasicMaterial({ color: 0x2c3034 })
  const g = new THREE.BoxGeometry(1, 1, 1)
  // ceiling: a broad soft panel with bright strip fixtures, as in a cleanroom
  const ceiling = new THREE.Mesh(g, soft)
  ceiling.scale.set(18, 0.05, 18)
  ceiling.position.set(0, 5, 0)
  s.add(ceiling)
  for (let i = -3; i <= 3; i++) {
    const m = new THREE.Mesh(g, strip)
    m.scale.set(0.45, 0.05, 14)
    m.position.set(i * 1.6, 4.9, 0)
    s.add(m)
  }
  const wall = new THREE.Mesh(g, dim)
  wall.scale.set(14, 3, 0.1)
  wall.position.set(0, 0.5, -6)
  s.add(wall)
  const floorGlow = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x15181a }))
  floorGlow.scale.set(20, 0.1, 20)
  floorGlow.position.set(0, -3, 0)
  s.add(floorGlow)
  return s
}

const envCache = new Map<string, THREE.Texture>()

export function useLabEnvironment(warm = false, intensity = 0.9) {
  const gl = useThree((s) => s.gl) as unknown as THREE.WebGPURenderer
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const k = warm ? 'warm' : 'cool'
    let tex = envCache.get(k)
    if (!tex) {
      const pm = new THREE.PMREMGenerator(gl)
      tex = pm.fromScene(buildEnvScene(warm), 0.03).texture
      envCache.set(k, tex)
    }
    scene.environment = tex
    scene.environmentIntensity = intensity
    return () => {
      scene.environment = null
    }
  }, [gl, scene, warm, intensity])
}

export function StudioLights({ scale = 1 }: { scale?: number }) {
  useLabEnvironment(false, 1.25)
  return (
    <>
      <hemisphereLight args={['#cfd6dc', '#0b0c0d', 0.35]} />
      <directionalLight position={[30 * scale, 60 * scale, 45 * scale]} intensity={2.1} color="#fff3e2" />
      <directionalLight position={[-45 * scale, 25 * scale, -40 * scale]} intensity={0.9} color="#a9bed0" />
      <directionalLight position={[0, -30 * scale, 50 * scale]} intensity={0.25} color="#ffffff" />
    </>
  )
}
