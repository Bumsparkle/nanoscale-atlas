import * as THREE from 'three/webgpu'
import type { MeshResult } from '../sim/mesher'
import { boxesGeometry, toScene, type Clip } from './cellGeometry'
import { materialFor, renderOrderFor } from './materials'

/**
 * Imperative renderer for a meshed process model: one THREE.Mesh per
 * connected component (so each object can be picked and outlined on its
 * own). Rebuilt whenever the model, the section or the explode state
 * changes; cheap enough to run every frame during fab playback.
 */
export interface CellView {
  /** section plane, or null for the whole cell */
  clip: { axis: 'x' | 'y'; offset: number } | null
  /** 0..1 how far the near half slides away */
  gap: number
  /** per-tier 0..1 explode amounts (the six masks, bottom to top) */
  explode: number[]
  /** hide translucent films (field oxide) to see the devices */
  xray?: boolean
}

/** vertical explode order: the six masks of slide 28, bottom to top */
export const EXPLODE_TIER: Record<string, number> = {
  'si:p': 0, 'si:nwell': 1, gox: 2, poly: 2, 'si:n+': 3, 'si:p+': 4,
  ox: 5, fox: 5, 'al:plug': 5, al: 6, resist: 6, 'resist:exposed': 6,
}
/** what each tier shows, named after the slide 28 masks */
export const TIER_NAMES = ['p substrate', 'n-well mask', 'polysilicon mask', 'n+ diffusion mask', 'p+ diffusion mask', 'contact mask', 'metal mask']
export const TIER_SPACING = 3.4

export class CellModel {
  readonly group = new THREE.Group()
  /** component meshes: id → mesh */
  meshes = new Map<number, THREE.Mesh>()
  private res: MeshResult | null = null
  private names = new Map<number, string>()

  constructor() {
    this.group.name = 'cell'
  }

  update(res: MeshResult, names: Map<number, string>, view: CellView) {
    this.res = res
    this.names = names
    for (const m of this.meshes.values()) {
      m.geometry.dispose()
      m.parent?.remove(m)
    }
    this.meshes.clear()
    const GAP = 10 // λ the near half slides when fully parted
    const halves: { clip?: Clip; shift: [number, number, number]; tag: string }[] = view.clip
      ? [
          { clip: { axis: view.clip.axis, offset: view.clip.offset, keep: 'hi' }, shift: [0, 0, 0], tag: 'far' },
          {
            clip: { axis: view.clip.axis, offset: view.clip.offset, keep: 'lo' },
            // near half moves away along the plane normal, toward the viewer
            shift: view.clip.axis === 'y' ? [0, 0, GAP * view.gap] : [-GAP * view.gap, 0, 0],
            tag: 'near',
          },
        ]
      : [{ shift: [0, 0, 0], tag: 'whole' }]

    for (const comp of res.components) {
      for (const h of halves) {
        if (view.xray && (comp.key === 'fox' || comp.key === 'ox') && h.tag !== 'far') continue
        const geo = boxesGeometry(comp.boxes, h.clip)
        if (!geo) continue
        const mesh = new THREE.Mesh(geo, materialFor(comp.key, h.tag === 'near'))
        const tier = EXPLODE_TIER[comp.key] ?? 0
        mesh.position.set(h.shift[0], h.shift[1] + tier * (view.explode[tier] ?? 0) * TIER_SPACING, h.shift[2])
        mesh.renderOrder = renderOrderFor(comp.key)
        mesh.userData = { comp: comp.id, key: comp.key, content: names.get(comp.id) ?? null, half: h.tag }
        mesh.name = (names.get(comp.id) ?? comp.key) + ':' + h.tag
        this.group.add(mesh)
        // near half is stored under a negative id so both halves highlight together
        this.meshes.set(h.tag === 'near' ? -1 - comp.id : comp.id, mesh)
      }
    }
  }

  /** move tiers without rebuilding geometry */
  applyExplode(explode: number[], gap: number, clipAxis: 'x' | 'y' | null) {
    const GAP = 10
    for (const m of this.meshes.values()) {
      const tier = EXPLODE_TIER[m.userData.key as string] ?? 0
      const near = m.userData.half === 'near'
      const sx = near && clipAxis === 'x' ? -GAP * gap : 0
      const sz = near && clipAxis === 'y' ? GAP * gap : 0
      m.position.set(sx, tier * (explode[tier] ?? 0) * TIER_SPACING, sz)
    }
  }

  /** all meshes belonging to a content id (e.g. both halves, or all six contacts) */
  meshesFor(contentId: string | null): THREE.Mesh[] {
    if (!contentId) return []
    return [...this.meshes.values()].filter((m) => m.userData.content === contentId)
  }

  /** scene-space bounding box of a content object */
  boundsFor(contentId: string): THREE.Box3 | null {
    if (!this.res) return null
    const box = new THREE.Box3()
    let any = false
    for (const c of this.res.components) {
      if (this.names.get(c.id) !== contentId) continue
      const a = toScene(c.min[0], c.min[1], c.min[2])
      const b = toScene(c.max[0], c.max[1], c.max[2])
      box.expandByPoint(new THREE.Vector3(...a))
      box.expandByPoint(new THREE.Vector3(...b))
      any = true
    }
    return any ? box : null
  }

  dispose() {
    for (const m of this.meshes.values()) m.geometry.dispose()
    this.meshes.clear()
  }
}
