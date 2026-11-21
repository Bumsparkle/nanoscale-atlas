import { ContentSchema, type Content } from '../content-schema'
import type { MeshResult } from '../../sim/mesher'

/** Every content file of every chapter (chapters/<chapter>/content/*.ts), validated. One file per object. */
const modules = import.meta.glob('../*/content/*.ts', { eager: true }) as Record<string, { default: unknown }>

export const CONTENT: Content[] = Object.entries(modules)
  .map(([path, m]) => {
    const parsed = ContentSchema.safeParse(m.default)
    if (!parsed.success) throw new Error(`Invalid content ${path}: ${parsed.error.message}`)
    return parsed.data
  })
  .sort((a, b) => a.id.localeCompare(b.id))

export const CONTENT_BY_ID: Record<string, Content> = Object.fromEntries(CONTENT.map((c) => [c.id, c]))

/**
 * Map mesh components to content ids.
 * A content file with point anchors claims the component containing its
 * anchor, unless that component also contains a *different* object's anchor
 * of the same key (e.g. blanket aluminium before patterning contains the
 * GND, Y and VDD anchors): then the key-wide entry (anchor without a point)
 * is used instead.
 */
export function resolveComponents(res: MeshResult, layer: Content['layer'] = 'cell'): Map<number, string> {
  const out = new Map<number, string>()
  const items = CONTENT.filter((c) => c.layer === layer)
  const hits = new Map<number, Set<string>>()
  for (const c of items)
    for (const a of c.anchors) {
      if (a.x == null || a.y == null) continue
      for (const comp of res.components) {
        if (comp.key !== a.key) continue
        if (comp.boxes.some((b) => a.x! >= b.x0 && a.x! < b.x1 && a.y! >= b.y0 && a.y! < b.y1)) {
          const s = hits.get(comp.id) ?? new Set()
          s.add(c.id)
          hits.set(comp.id, s)
        }
      }
    }
  for (const [comp, ids] of hits) if (ids.size === 1) out.set(comp, [...ids][0])
  for (const comp of res.components) {
    if (out.has(comp.id)) continue
    const generic = items.find((c) => c.anchors.some((a) => a.key === comp.key && a.x == null))
    if (generic) out.set(comp.id, generic.id)
  }
  return out
}
