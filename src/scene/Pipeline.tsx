import * as THREE from 'three/webgpu'
import { pass, uniform, color, mix, vec4, float } from 'three/tsl'
import { outline } from 'three/addons/tsl/display/OutlineNode.js'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'

/**
 * Shared selection buffers. Layers push meshes here; the outline pass reads
 * them every frame (arrays are mutated in place, never replaced).
 */
export const selection = {
  hover: [] as THREE.Object3D[],
  focus: [] as THREE.Object3D[],
  set(kind: 'hover' | 'focus', objs: THREE.Object3D[]) {
    const arr = this[kind]
    arr.length = 0
    arr.push(...objs)
  },
}

/** Global post-processing uniforms that layers can animate. */
export const post = {
  /** 0..1 darkening used to mask layer swaps */
  veil: uniform(0),
  /** amber cast for lithography steps */
  amber: uniform(0),
}

export function Pipeline() {
  const gl = useThree((s) => s.gl) as unknown as THREE.WebGPURenderer
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)

  const pipeline = useMemo(() => {
    const p = new THREE.RenderPipeline(gl)
    const scenePass = pass(scene, camera)
    const hover = outline(scene, camera, { selectedObjects: selection.hover, edgeThickness: float(1.0), downSampleRatio: 1 })
    const focus = outline(scene, camera, { selectedObjects: selection.focus, edgeThickness: float(1.6), downSampleRatio: 1 })
    const amber = color(0xf0b43c)
    const hoverCol = hover.visibleEdge.mul(amber).mul(0.55).add(hover.hiddenEdge.mul(amber).mul(0.18))
    const focusCol = focus.visibleEdge.mul(amber).mul(1.4).add(focus.hiddenEdge.mul(amber).mul(0.35))
    let rgb = scenePass.rgb.add(hoverCol).add(focusCol)
    // lithography bay: shift toward sodium-amber, crush blues (yellow light filters < 500 nm)
    const litho = vec4(rgb.r.mul(1.05), rgb.g.mul(0.86), rgb.b.mul(0.32), 1)
    rgb = mix(rgb, litho.rgb, post.amber)
    rgb = rgb.mul(float(1).sub(post.veil))
    p.outputNode = vec4(rgb, 1)
    return p
  }, [gl, scene, camera])

  useEffect(() => () => pipeline.dispose(), [pipeline])

  useFrame(() => {
    pipeline.render()
  }, 1)
  return null
}
