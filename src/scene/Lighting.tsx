import * as THREE from 'three/webgpu'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { SCENE } from './sceneTheme'

/**
 * A custom environment instead of a stock HDRI: a grey room with long strip
 * lights overhead, like cleanroom ceiling fixtures, and a lit floor so the
 * undersides of parts never go black. Metals reflect the strips as clean
 * bands.
 */
function buildEnvScene(warm: boolean) {
  const s = new THREE.Scene()
  s.background = new THREE.Color(SCENE.envBackdrop)
  const strip = new THREE.MeshBasicMaterial({ color: warm ? 0xffe2a8 : SCENE.envStrip })
  const soft = new THREE.MeshBasicMaterial({ color: warm ? 0x8a7350 : SCENE.envPanel })
  const wallMat = new THREE.MeshBasicMaterial({ color: SCENE.envWall })
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
  for (const [x, z, sx, sz] of [[0, -6, 14, 0.1], [0, 6, 14, 0.1], [-6, 0, 0.1, 14], [6, 0, 0.1, 14]]) {
    const wall = new THREE.Mesh(g, wallMat)
    wall.scale.set(sx, 4, sz)
    wall.position.set(x, 0.5, z)
    s.add(wall)
  }
  const floor = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: SCENE.envFloor }))
  floor.scale.set(20, 0.1, 20)
  floor.position.set(0, -3, 0)
  s.add(floor)
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

/**
 * Key / fill / rim, plus a soft hemisphere and the lab environment. The key
 * is warm and high front-right, the fill cool from the left at about half
 * the key, the rim from behind to separate edges from the backdrop, and a
 * weak bounce from below so no face is crushed to black.
 */
export function StudioLights({ scale = 1 }: { scale?: number }) {
  useLabEnvironment(false, 1.0)
  return (
    <>
      <hemisphereLight args={[SCENE.hemiSky, SCENE.hemiGround, 0.9]} />
      <directionalLight position={[30 * scale, 60 * scale, 45 * scale]} intensity={2.6} color="#fff1dc" />
      <directionalLight position={[-55 * scale, 22 * scale, 20 * scale]} intensity={1.25} color="#b9cde0" />
      <directionalLight position={[-10 * scale, 40 * scale, -70 * scale]} intensity={1.6} color="#ffffff" />
      <directionalLight position={[0, -40 * scale, 30 * scale]} intensity={0.45} color="#dfe6ea" />
    </>
  )
}
