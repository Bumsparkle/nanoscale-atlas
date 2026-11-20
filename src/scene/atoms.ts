import * as THREE from 'three/webgpu'

/**
 * Atomic geometry (1 unit = 1 Å).
 * Diamond cubic silicon: a = 5.43 Å, nearest-neighbour distance a√3/4 ≈
 * 2.35 Å, four bonds per atom (slide 4; the numbers are beyond the lecture,
 * Kittel, Introduction to Solid State Physics, ch. 1).
 */
export const A_SI = 5.43
export const BOND_SI = (A_SI * Math.sqrt(3)) / 4

const BASIS: [number, number, number][] = [
  [0, 0, 0], [0, 0.5, 0.5], [0.5, 0, 0.5], [0.5, 0.5, 0],
  [0.25, 0.25, 0.25], [0.25, 0.75, 0.75], [0.75, 0.25, 0.75], [0.75, 0.75, 0.25],
]

export type V3 = [number, number, number]

/** diamond-cubic sites in [x0,x1)×[y0,y1)×[z0,z1) (Å), optional rotation about the box centre */
export function diamond(box: { x: [number, number]; y: [number, number]; z: [number, number] }, rot?: THREE.Quaternion, origin: V3 = [0, 0, 0]): V3[] {
  const out: V3[] = []
  const pad = rot ? 2 : 0
  const span = (r: [number, number]) => [Math.floor(r[0] / A_SI) - pad - 1, Math.ceil(r[1] / A_SI) + pad + 1]
  const [i0, i1] = span(box.x)
  const [j0, j1] = span(box.y)
  const [k0, k1] = span(box.z)
  const v = new THREE.Vector3()
  for (let i = i0; i < i1; i++)
    for (let j = j0; j < j1; j++)
      for (let k = k0; k < k1; k++)
        for (const b of BASIS) {
          v.set((i + b[0]) * A_SI, (j + b[1]) * A_SI, (k + b[2]) * A_SI)
          if (rot) v.sub(new THREE.Vector3(...origin)).applyQuaternion(rot).add(new THREE.Vector3(...origin))
          if (v.x >= box.x[0] && v.x < box.x[1] && v.y >= box.y[0] && v.y < box.y[1] && v.z >= box.z[0] && v.z < box.z[1]) out.push([v.x, v.y, v.z])
        }
  return out
}

/** index pairs closer than `max` (spatial hash) */
export function neighbours(pts: V3[], max: number, min = 0.1): [number, number][] {
  const cell = max
  const grid = new Map<string, number[]>()
  const key = (p: V3) => `${Math.floor(p[0] / cell)},${Math.floor(p[1] / cell)},${Math.floor(p[2] / cell)}`
  pts.forEach((p, i) => {
    const k = key(p)
    const a = grid.get(k)
    if (a) a.push(i)
    else grid.set(k, [i])
  })
  const out: [number, number][] = []
  pts.forEach((p, i) => {
    const cx = Math.floor(p[0] / cell)
    const cy = Math.floor(p[1] / cell)
    const cz = Math.floor(p[2] / cell)
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (let dz = -1; dz <= 1; dz++) {
          const a = grid.get(`${cx + dx},${cy + dy},${cz + dz}`)
          if (!a) continue
          for (const j of a) {
            if (j <= i) continue
            const q = pts[j]
            const d = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])
            if (d < max && d > min) out.push([i, j])
          }
        }
  })
  return out
}

/** seeded PRNG so the amorphous network is the same on every visit */
export function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/**
 * Amorphous SiO₂ as a continuous random network (beyond the lecture:
 * Zachariasen's model). Si placed by dart throwing at ≥ 3.0 Å, then each
 * Si bridges to up to four neighbours through an O atom.
 */
export function amorphousSiO2(box: { x: [number, number]; y: [number, number]; z: [number, number] }, seed = 7) {
  const r = rng(seed)
  const si: V3[] = []
  const vol = (box.x[1] - box.x[0]) * (box.y[1] - box.y[0]) * (box.z[1] - box.z[0])
  const target = Math.round(vol * 0.022) // SiO₂ ≈ 0.022 Si/Å³ (ρ = 2.2 g/cm³)
  for (let tries = 0; tries < target * 60 && si.length < target; tries++) {
    const p: V3 = [box.x[0] + r() * (box.x[1] - box.x[0]), box.y[0] + r() * (box.y[1] - box.y[0]), box.z[0] + r() * (box.z[1] - box.z[0])]
    if (si.every((q) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2 > 9)) si.push(p)
  }
  const pairs = neighbours(si, 3.9).sort((a, b) => dist(si[a[0]], si[a[1]]) - dist(si[b[0]], si[b[1]]))
  const deg = new Array(si.length).fill(0)
  const o: V3[] = []
  const bonds: [V3, V3][] = []
  for (const [a, b] of pairs) {
    if (deg[a] >= 4 || deg[b] >= 4) continue
    deg[a]++
    deg[b]++
    const m: V3 = [(si[a][0] + si[b][0]) / 2 + (r() - 0.5) * 0.9, (si[a][1] + si[b][1]) / 2 + (r() - 0.5) * 0.9, (si[a][2] + si[b][2]) / 2 + (r() - 0.5) * 0.9]
    o.push(m)
    bonds.push([si[a], m], [m, si[b]])
  }
  return { si, o, bonds }
}

export const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

/** instanced spheres */
export function atomsMesh(pts: V3[], radius: number, colour: string, mat?: THREE.Material) {
  const geo = new THREE.IcosahedronGeometry(radius, 2)
  const m = mat ?? new THREE.MeshStandardNodeMaterial({ color: colour, roughness: 0.38, metalness: 0.1 })
  const im = new THREE.InstancedMesh(geo, m, Math.max(1, pts.length))
  const o = new THREE.Object3D()
  pts.forEach((p, i) => {
    o.position.set(...p)
    o.updateMatrix()
    im.setMatrixAt(i, o.matrix)
  })
  im.count = pts.length
  im.instanceMatrix.needsUpdate = true
  im.computeBoundingSphere()
  return im
}

/** instanced cylinders between point pairs */
export function bondsMesh(pairs: [V3, V3][], radius: number, colour: string, capacity = pairs.length) {
  const geo = new THREE.CylinderGeometry(radius, radius, 1, 8, 1, true)
  geo.translate(0, 0.5, 0)
  const m = new THREE.MeshStandardNodeMaterial({ color: colour, roughness: 0.5, metalness: 0.05 })
  const im = new THREE.InstancedMesh(geo, m, Math.max(1, capacity, pairs.length))
  setBonds(im, pairs)
  return im
}

const UP = new THREE.Vector3(0, 1, 0)
export function setBonds(im: THREE.InstancedMesh, pairs: [V3, V3][]) {
  const o = new THREE.Object3D()
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const cap = (im.instanceMatrix.array.length / 16) | 0
  if (pairs.length > cap) pairs = pairs.slice(0, cap)
  pairs.forEach(([p, q], i) => {
    a.set(...p)
    b.set(...q)
    const d = b.clone().sub(a)
    o.position.copy(a)
    o.quaternion.setFromUnitVectors(UP, d.clone().normalize())
    o.scale.set(1, d.length(), 1)
    o.updateMatrix()
    im.setMatrixAt(i, o.matrix)
  })
  im.count = pairs.length
  im.instanceMatrix.needsUpdate = true
  im.computeBoundingSphere()
}
