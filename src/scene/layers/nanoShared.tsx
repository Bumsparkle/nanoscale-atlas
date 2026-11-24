import * as THREE from 'three/webgpu'
import { useEffect, useMemo } from 'react'
import { P } from '../../theme/scene'

/**
 * Small geometry helpers shared by the Chapter 6 and 7 scenes: a height
 * field driven by a function (aerial images, Airy patterns, DoS surfaces)
 * and a polyline tube (wavefunctions, band edges, trajectories).
 */

const INTENSITY = [new THREE.Color(P.ramp.intensity0), new THREE.Color(P.ramp.intensity1), new THREE.Color(P.ramp.intensity2), new THREE.Color(P.ramp.intensity3)]
export function intensityColour(v: number, out = new THREE.Color()) {
  const x = Math.min(1, Math.max(0, v)) * (INTENSITY.length - 1)
  const i = Math.min(INTENSITY.length - 2, Math.floor(x))
  return out.copy(INTENSITY[i]).lerp(INTENSITY[i + 1], x - i)
}

/**
 * A w × d plane in x–z, nx × nz vertices, raised by `height(u, v)` with
 * u, v ∈ [0, 1]; coloured by `shade(u, v)` (0–1) when given.
 */
export function HeightField({ w, d, nx, nz, height, shade, deps, position, opacity = 1 }: {
  w: number; d: number; nx: number; nz: number
  height: (u: number, v: number) => number
  shade?: (u: number, v: number) => number
  deps: unknown[]
  position?: [number, number, number]
  opacity?: number
}) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(w, d, nx - 1, nz - 1)
    g.rotateX(-Math.PI / 2)
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(nx * nz * 3), 3))
    return g
  }, [w, d, nx, nz])
  useEffect(() => {
    const pos = geo.attributes.position as THREE.BufferAttribute
    const col = geo.attributes.color as THREE.BufferAttribute
    const c = new THREE.Color()
    for (let j = 0; j < nz; j++)
      for (let i = 0; i < nx; i++) {
        const k = j * nx + i
        const u = i / (nx - 1)
        const v = j / (nz - 1)
        pos.setY(k, height(u, v))
        intensityColour(shade ? shade(u, v) : height(u, v), c)
        col.setXYZ(k, c.r, c.g, c.b)
      }
    pos.needsUpdate = true
    col.needsUpdate = true
    geo.computeVertexNormals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo, ...deps])
  useEffect(() => () => geo.dispose(), [geo])
  return (
    <mesh geometry={geo} position={position}>
      <meshStandardNodeMaterial vertexColors roughness={0.55} metalness={0.05} side={THREE.DoubleSide} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  )
}

/** a thin tube through points (world units) */
export function Line({ pts, r = 0.25, color = P.signal.amber, emissive, segs }: { pts: [number, number, number][]; r?: number; color?: string; emissive?: string; segs?: number }) {
  const geo = useMemo(() => {
    if (pts.length < 2) return null
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.1)
    return new THREE.TubeGeometry(curve, segs ?? Math.min(400, pts.length * 2), r, 6, false)
  }, [pts, r, segs])
  useEffect(() => () => geo?.dispose(), [geo])
  if (!geo) return null
  return (
    <mesh geometry={geo} raycast={() => null}>
      <meshStandardNodeMaterial color={color} emissive={emissive ?? color} emissiveIntensity={emissive ? 0.6 : 0.15} roughness={0.4} />
    </mesh>
  )
}

/** a straight segment as a cylinder */
export function Seg({ a, b, r = 0.2, color = P.signal.axis, opacity = 1 }: { a: [number, number, number]; b: [number, number, number]; r?: number; color?: string; opacity?: number }) {
  const { pos, quat, len } = useMemo(() => {
    const A = new THREE.Vector3(...a)
    const B = new THREE.Vector3(...b)
    const dir = B.clone().sub(A)
    return { pos: A.clone().add(B).multiplyScalar(0.5).toArray() as [number, number, number], quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()), len: dir.length() }
  }, [a, b])
  return (
    <mesh position={pos} quaternion={quat} raycast={() => null}>
      <cylinderGeometry args={[r, r, len, 6]} />
      <meshStandardNodeMaterial color={color} transparent={opacity < 1} opacity={opacity} emissive={color} emissiveIntensity={0.2} />
    </mesh>
  )
}

/** colour of a light source, drawn visible even in the UV */
/** exposure light per source, read at build time (the light theme deepens it) */
export const lightColour = (source: string): string =>
  ({ g: P.litho.gLine, i: P.litho.iLine, krf: P.litho.krf, arf: P.litho.arf, f2: P.litho.f2 })[source] ?? P.litho.iLine
