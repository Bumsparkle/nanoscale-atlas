import * as THREE from 'three/webgpu'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { StudioLights } from '../Lighting'
import { ClearOnMiss, Inspectable, InspectSync } from '../Inspectable'
import { A_SI, atomsMesh, bondsMesh, setBonds, type V3 } from '../atoms'
import { label, publish, rand, useDive } from './shared'
import { useApp, type CellKind } from '../../state/store'
import { bandsAt, cI, cV, distanceToPlane, FCC, planeInCube, reduceHkl, SI_ATOMS } from '../../chapters/growth/physics'
import { P } from '../../theme/scene'

/**
 * The Chapter 2 tabs of the lattice layer (1 unit = 1 Å).
 * Unit cells (Topic 3 slides 4–5): simple cubic, BCC, FCC, and diamond as
 * a second FCC cell slid in by a/4 along x, y and z.
 * Miller planes (slide 6): the (hkl) plane cutting the cell, its atoms lit.
 * Bands (slides 8–10): the same crystal pulled apart; the band chart
 * beside it follows the spacing.
 * Defects (slides 21–22): a vacancy and an interstitial; their equilibrium
 * concentrations follow the temperature.
 */
const A_COL = P.atom.si
const toWorld = (p: number[]): V3 => [(p[0] - 0.5) * A_SI, (p[2] - 0.5) * A_SI, (p[1] - 0.5) * A_SI]

/** lattice points of one FCC/BCC/SC cube including its boundary, in units of a */
function cubePoints(kind: 'sc' | 'bcc' | 'fcc'): number[][] {
  const out: number[][] = []
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) out.push([i, j, k])
  if (kind === 'bcc') out.push([0.5, 0.5, 0.5])
  if (kind === 'fcc')
    for (const ax of [0, 1, 2])
      for (const v of [0, 1]) {
        const p = [0.5, 0.5, 0.5]
        p[ax] = v
        out.push(p)
      }
  return out
}
/** the full diamond cell: FCC A with its boundary plus the 4 B atoms inside */
const DIAMOND_CUBE = [...cubePoints('fcc'), ...FCC.map(([x, y, z]) => [x + 0.25, y + 0.25, z + 0.25])]

function edges(offset: number[] = [0, 0, 0]) {
  const g = new THREE.EdgesGeometry(new THREE.BoxGeometry(A_SI, A_SI, A_SI))
  g.translate(offset[0] * A_SI, offset[2] * A_SI, offset[1] * A_SI)
  return g
}

function Cells() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const kind = useApp((s) => s.crystal.cell)
  const off = useApp((s) => s.crystal.offset)
  const aKind: Exclude<CellKind, 'diamond'> = kind === 'diamond' ? 'fcc' : kind
  const A = useMemo(() => atomsMesh(cubePoints(aKind).map(toWorld), 0.55, A_COL), [aKind])
  const bPts = useMemo(() => cubePoints('fcc'), [])
  const B = useMemo(() => atomsMesh(bPts.map(toWorld), 0.55, P.signal.amber), [bPts])
  const bonds = useMemo(() => bondsMesh([], 0.14, P.atom.bondHi, 32), [])
  const edgeA = useMemo(() => edges(), [])
  const edgeB = useMemo(() => edges(), [])
  const edgeBRef = useRef<THREE.LineSegments>(null)
  const o = useMemo(() => new THREE.Object3D(), [])
  const s = useRef(off)

  useFrame((_, dt) => {
    const st = useApp.getState()
    s.current += (off - s.current) * (st.reducedMotion ? 1 : Math.min(1, dt * 6))
    const d = s.current * 0.25
    const showB = kind === 'diamond'
    B.visible = showB
    if (edgeBRef.current) {
      edgeBRef.current.visible = showB && s.current < 0.98
      edgeBRef.current.position.set(d * A_SI, d * A_SI, d * A_SI)
    }
    if (showB) {
      bPts.forEach((p, i) => {
        o.position.set(...toWorld([p[0] + d, p[1] + d, p[2] + d]))
        // B atoms that leave the A cube fade to small ghosts once merged
        const inside = [p[0] + d, p[1] + d, p[2] + d].every((v) => v <= 1.001)
        o.scale.setScalar(inside ? 1 : 1 - 0.7 * s.current)
        o.updateMatrix()
        B.setMatrixAt(i, o.matrix)
      })
      B.instanceMatrix.needsUpdate = true
      // the four tetrahedral bonds of each inside B atom, once the cells have merged
      const pairs: [V3, V3][] = []
      if (s.current > 0.97) {
        const aPts = cubePoints('fcc')
        for (const p of bPts) {
          const q = [p[0] + 0.25, p[1] + 0.25, p[2] + 0.25]
          if (!q.every((v) => v <= 1.001)) continue
          for (const a of aPts) if (Math.hypot(a[0] - q[0], a[1] - q[1], a[2] - q[2]) < 0.45) pairs.push([toWorld(q), toWorld(a)])
        }
      }
      setBonds(bonds, pairs)
    } else setBonds(bonds, [])
    if (st.quiz) return publish([])
    const L: ReturnType<typeof label>[] = [label(camera, size, 'c-a', 'a = 5.43 Å', 'unit cell edge', [A_SI / 2, -A_SI / 2, A_SI / 2], 'right')]
    if (kind === 'bcc') L.push(label(camera, size, 'c-bcc', 'body centre', 'BCC', [0, 0, 0], 'right'))
    if (kind === 'fcc' || kind === 'diamond') L.push(label(camera, size, 'c-fcc', 'face centre', 'FCC', toWorld([0.5, 0, 0.5]), 'right'))
    if (kind === 'diamond')
      L.push(
        label(camera, size, 'c-b', s.current > 0.97 ? 'second FCC: 4 bonds each' : `second FCC, offset ${(s.current * 0.25).toFixed(2)}·a`, 'shifted along x, y and z', toWorld([0.25 + d, 0.25 + d, 0.25 + d]), 'top'),
      )
    publish(L)
  })

  return (
    <>
      <Inspectable node="fcc-a" fit={1.5}>
        <primitive object={A} />
        <lineSegments geometry={edgeA}>
          <lineBasicNodeMaterial color={A_COL} />
        </lineSegments>
      </Inspectable>
      <Inspectable node="fcc-b" fit={1.5}>
        <primitive object={B} />
        <primitive object={bonds} />
        <lineSegments ref={edgeBRef} geometry={edgeB}>
          <lineBasicNodeMaterial color={P.signal.amber} transparent opacity={0.7} />
        </lineSegments>
      </Inspectable>
    </>
  )
}

function Miller() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const hkl = useApp((s) => s.crystal.hkl)
  const [h, k, l] = hkl
  const valid = !(h === 0 && k === 0 && l === 0)
  const poly = useMemo(() => (valid ? planeInCube(h, k, l) : []), [h, k, l, valid])
  const planeGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    if (poly.length < 3) return g
    const pos: number[] = []
    const c = poly.reduce<number[]>((s, p) => s.map((v, i) => v + p[i] / poly.length), [0, 0, 0])
    for (let i = 0; i < poly.length; i++) pos.push(...toWorld(c), ...toWorld(poly[i]), ...toWorld(poly[(i + 1) % poly.length]))
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.computeVertexNormals()
    return g
  }, [poly])
  const onPlane = useMemo(() => DIAMOND_CUBE.map((p) => valid && Math.abs(distanceToPlane(h, k, l, p as V3)) < 1e-6), [h, k, l, valid])
  const lit = useMemo(() => atomsMesh(DIAMOND_CUBE.filter((_, i) => onPlane[i]).map(toWorld), 0.7, P.signal.amber), [onPlane])
  const dim = useMemo(() => atomsMesh(DIAMOND_CUBE.filter((_, i) => !onPlane[i]).map(toWorld), 0.42, P.atom.dim), [onPlane])
  useEffect(() => () => (planeGeo.dispose(), lit.dispose(), dim.dispose()), [planeGeo, lit, dim])
  const edge = useMemo(() => edges(), [])
  const arrow = useMemo(() => {
    if (!valid) return null
    const [rh, rk, rl] = reduceHkl(h, k, l)
    const dir = new THREE.Vector3(rh, rl, rk).normalize()
    return new THREE.ArrowHelper(dir, new THREE.Vector3(...toWorld([0.5, 0.5, 0.5])), A_SI * 0.9, P.signal.amber, 0.9, 0.5)
  }, [h, k, l, valid])

  useFrame(() => {
    if (useApp.getState().quiz) return publish([])
    publish([
      label(camera, size, 'm-x', 'x', undefined, toWorld([1.12, 0, 0]), 'right'),
      label(camera, size, 'm-y', 'y', undefined, toWorld([0, 1.12, 0]), 'right'),
      label(camera, size, 'm-z', 'z', undefined, toWorld([0, 0, 1.12]), 'right'),
      label(camera, size, 'm-n', `[${hkl.join('')}]`, 'normal to the plane', toWorld([0.5, 0.5, 0.5]).map((v, i) => v + [h, l, k][i] * 1.2) as V3, 'top'),
    ])
  })

  return (
    <>
      <lineSegments geometry={edge}>
        <lineBasicNodeMaterial color={P.signal.axisCool} />
      </lineSegments>
      <primitive object={dim} />
      <Inspectable node="miller-plane" fit={1.6}>
        <mesh geometry={planeGeo}>
          <meshStandardNodeMaterial color={P.signal.amber} transparent opacity={0.32 * P.k.sheet} side={THREE.DoubleSide} depthWrite={false} roughness={0.6} />
        </mesh>
        <primitive object={lit} />
      </Inspectable>
      {arrow && <primitive object={arrow} />}
    </>
  )
}

/** 2×2×2 diamond block in Å, centred */
function block() {
  const pts: V3[] = []
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++)
      for (let k = 0; k < 2; k++)
        for (const b of [...FCC, ...FCC.map(([x, y, z]) => [x + 0.25, y + 0.25, z + 0.25])]) pts.push([(i + b[0] - 1) * A_SI, (k + b[2] - 1) * A_SI, (j + b[1] - 1) * A_SI])
  return pts
}

function Bands() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const base = useMemo(() => block(), [])
  const atoms = useMemo(() => atomsMesh(base, 0.55, A_COL), [base])
  const clouds = useMemo(() => atomsMesh(base, 1.55, P.atom.cloud, new THREE.MeshStandardNodeMaterial({ color: P.atom.cloud, transparent: true, opacity: 0.14, depthWrite: false, roughness: 1 })), [base])
  const bonds = useMemo(() => bondsMesh([], 0.14, P.atom.siBond, 400), [])
  const pairs = useMemo(() => {
    const out: [number, number][] = []
    base.forEach((p, i) => base.forEach((q, j) => j > i && Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) < 2.5 && out.push([i, j])))
    return out
  }, [base])
  const o = useMemo(() => new THREE.Object3D(), [])
  const cur = useRef(1)
  useFrame((_, dt) => {
    const st = useApp.getState()
    const r = st.crystal.r
    cur.current += (r - cur.current) * (st.reducedMotion ? 1 : Math.min(1, dt * 8))
    const s = cur.current
    base.forEach((p, i) => {
      o.position.set(p[0] * s, p[1] * s, p[2] * s)
      o.updateMatrix()
      atoms.setMatrixAt(i, o.matrix)
      clouds.setMatrixAt(i, o.matrix)
    })
    atoms.instanceMatrix.needsUpdate = true
    clouds.instanceMatrix.needsUpdate = true
    setBonds(bonds, s < 1.25 ? pairs.map(([i, j]) => [base[i].map((v) => v * s) as V3, base[j].map((v) => v * s) as V3]) : [])
    if (st.quiz) return publish([])
    const b = bandsAt(s)
    const name = { isolated: 'isolated atoms: no interaction', splitting: '3s, 3p levels broaden into bands', merged: 'bands merge: 8N continuous states', gap: s < 1.05 ? 'crystal spacing: 4N full · gap · 4N empty' : 'gap opening' }[b.regime]
    publish([label(camera, size, 'b-r', `r = ${s.toFixed(2)} a`, name, [A_SI * s, A_SI * s, 0], 'top')])
  })
  return (
    <Inspectable node="lattice-cell" fit={1.2}>
      <primitive object={atoms} />
      <primitive object={clouds} />
      <primitive object={bonds} />
    </Inspectable>
  )
}

function Defects() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const base = useMemo(() => block(), [])
  // the vacancy: the atom nearest the centre; the interstitial: a tetrahedral site in the next cell
  const vac = useMemo(() => base.reduce((b, p, i) => (Math.hypot(...p) < Math.hypot(...base[b]) ? i : b), 0), [base])
  const inter: V3 = useMemo(() => [-A_SI / 2, A_SI / 2, A_SI / 2 - A_SI], [])
  const kept = useMemo(() => base.filter((_, i) => i !== vac), [base, vac])
  const atoms = useMemo(() => atomsMesh(kept, 0.55, A_COL), [kept])
  const bonds = useMemo(() => {
    const pairs: [V3, V3][] = []
    kept.forEach((p, i) => kept.forEach((q, j) => j > i && Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) < 2.5 && pairs.push([p, q])))
    return bondsMesh(pairs, 0.13, P.atom.siBond)
  }, [kept])
  const o = useMemo(() => new THREE.Object3D(), [])
  const r = useMemo(() => rand(3), [])
  const iRef = useRef<THREE.Mesh>(null)
  useFrame(() => {
    const st = useApp.getState()
    const T = st.crystal.T
    // thermal vibration grows with temperature (illustrative amplitude)
    const amp = st.reducedMotion ? 0 : 0.03 + 0.14 * (T / 1400)
    kept.forEach((p, i) => {
      o.position.set(p[0] + (r() - 0.5) * amp, p[1] + (r() - 0.5) * amp, p[2] + (r() - 0.5) * amp)
      o.updateMatrix()
      atoms.setMatrixAt(i, o.matrix)
    })
    atoms.instanceMatrix.needsUpdate = true
    if (iRef.current) iRef.current.position.set(inter[0] + (r() - 0.5) * amp * 1.5, inter[1] + (r() - 0.5) * amp * 1.5, inter[2] + (r() - 0.5) * amp * 1.5)
    if (st.quiz) return publish([])
    const fmt = (c: number) => (c < 1 ? '≈ 0' : c.toExponential(1).replace('e+', ' × 10^'))
    publish([
      label(camera, size, 'd-v', 'vacancy', `C_V* ${fmt(cV(T))} cm⁻³`, base[vac], 'top'),
      label(camera, size, 'd-i', 'interstitial', `C_I* ${fmt(cI(T))} cm⁻³`, inter, 'bottom'),
      label(camera, size, 'd-n', `T = ${T} °C`, `1 vacancy per ${cV(T) > 0 ? (SI_ATOMS / cV(T)).toExponential(0) : '∞'} atoms`, [A_SI, -A_SI, A_SI], 'right'),
    ])
  })
  return (
    <>
      <Inspectable node="lattice-cell" fit={1.2}>
        <primitive object={atoms} />
        <primitive object={bonds} />
      </Inspectable>
      <Inspectable node="vacancy" fit={4} minDist={14}>
        <mesh position={base[vac]}>
          <icosahedronGeometry args={[0.6, 1]} />
          <meshBasicNodeMaterial color={P.signal.mark} wireframe />
        </mesh>
      </Inspectable>
      <Inspectable node="interstitial" fit={4} minDist={14}>
        <mesh ref={iRef} position={inter}>
          <icosahedronGeometry args={[0.62, 2]} />
          <meshStandardNodeMaterial color={P.atom.defect} roughness={0.35} emissive={P.atom.defectGlow} emissiveIntensity={0.4} />
        </mesh>
      </Inspectable>
    </>
  )
}

export function CrystalTabs({ tab }: { tab: string }) {
  useDive('oxide', null, { home: [0, 0, 0] })
  return (
    <>
      <StudioLights scale={0.2} />
      {tab === 'cells' && <Cells />}
      {tab === 'miller' && <Miller />}
      {tab === 'bands' && <Bands />}
      {tab === 'defects' && <Defects />}
      <InspectSync />
      <ClearOnMiss radius={400} />
    </>
  )
}

