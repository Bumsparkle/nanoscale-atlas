import * as THREE from 'three/webgpu'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useRef, type ReactNode } from 'react'
import { CONTENT, CONTENT_BY_ID } from '../chapters/cmos/content'
import { useAtlas } from '../state/store'
import { selection } from './Pipeline'
import { rig } from './rig'

/**
 * Click-to-inspect for hand-built layers. Wrap any part of a scene:
 * hover outlines it, click glides the camera to fit it and opens its panel.
 * Content is looked up by `node` id.
 */
const registry = new Map<string, THREE.Object3D>()

export function Inspectable({ node, children, fit = 1.5, minDist }: { node: string; children: ReactNode; fit?: number; minDist?: number }) {
  const ref = useRef<THREE.Group>(null)
  const contentId = CONTENT.find((c) => c.node === node)?.id ?? node
  useEffect(() => {
    const g = ref.current!
    g.userData = { content: contentId, fit, minDist }
    registry.set(contentId, g)
    return () => void registry.delete(contentId)
  }, [contentId, fit, minDist])
  const over = (e: ThreeEvent<PointerEvent>) => {
    if (rig.owner) return
    e.stopPropagation()
    if (useAtlas.getState().hover !== contentId) useAtlas.getState().set({ hover: contentId })
  }
  return (
    <group
      ref={ref}
      name={node}
      onPointerMove={over}
      onPointerOut={() => useAtlas.getState().hover === contentId && useAtlas.getState().set({ hover: null })}
      onClick={(e) => {
        if (e.delta > 5 || rig.owner) return
        e.stopPropagation()
        useAtlas.getState().set({ focus: contentId })
      }}
    >
      {children}
    </group>
  )
}

function meshesOf(id: string | null) {
  if (!id) return []
  const g = registry.get(id)
  if (!g) return []
  const out: THREE.Object3D[] = []
  g.traverse((o) => (o as THREE.Mesh).isMesh && !(o as THREE.InstancedMesh).isInstancedMesh && out.push(o))
  if (!out.length) g.traverse((o) => (o as THREE.Mesh).isMesh && out.push(o))
  return out
}

/** keeps the outline selection and camera focus in sync for a hand-built layer */
export function InspectSync() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  useEffect(() => {
    const refresh = () => {
      const st = useAtlas.getState()
      const hov = st.hover && st.hover !== st.focus ? meshesOf(st.hover) : []
      selection.set('hover', st.hint ? [...hov, ...meshesOf(st.hint)] : hov)
      selection.set('focus', meshesOf(st.focus))
    }
    const focus = (id: string) => {
      const g = registry.get(id)
      if (!g) return
      const box = new THREE.Box3().setFromObject(g)
      if (box.isEmpty()) return
      rig.focusBox(box, camera.fov, size.width / size.height, { padding: g.userData.fit ?? 1.5, minDist: g.userData.minDist })
    }
    const unsub = useAtlas.subscribe((s, p) => {
      if (s.hover !== p.hover || s.focus !== p.focus || s.hint !== p.hint) refresh()
      if (s.look !== p.look && s.look && registry.has(s.look)) focus(s.look)
      if (s.focus !== p.focus) {
        if (s.quiz || p.quiz) {
          /* answering a question: keep the framing */
        } else if (s.focus && CONTENT_BY_ID[s.focus] && registry.has(s.focus)) focus(s.focus)
        else if (!s.focus && p.focus) rig.goHome()
      }
    })
    const f = useAtlas.getState().focus
    const t = setTimeout(() => {
      if (f) focus(f)
      refresh()
    }, 80)
    return () => {
      unsub()
      clearTimeout(t)
      selection.set('hover', [])
      selection.set('focus', [])
    }
  }, [camera, size])
  useFrame(() => {})
  return null
}

/** clicking empty space clears the focus (shared by all layers) */
export function ClearOnMiss({ radius = 4000 }: { radius?: number }) {
  return (
    <mesh
      onClick={(e) => {
        if (e.delta > 5 || rig.owner) return
        if (useAtlas.getState().focus) useAtlas.getState().set({ focus: null })
      }}
    >
      <sphereGeometry args={[radius, 8, 8]} />
      <meshBasicNodeMaterial side={THREE.BackSide} colorWrite={false} depthWrite={false} />
    </mesh>
  )
}
