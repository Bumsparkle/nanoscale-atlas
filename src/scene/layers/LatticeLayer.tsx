import * as THREE from 'three/webgpu'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { StudioLights } from '../Lighting'
import { Inspectable, InspectSync, ClearOnMiss } from '../Inspectable'
import { rig } from '../rig'
import { transition } from '../transition'
import { atomsMesh, bondsMesh, diamond, neighbours, rng, setBonds, A_SI, BOND_SI, type V3 } from '../atoms'
import { overlay, type ScreenLabel } from '../cellRuntime'
import { Spring, SPRINGS } from '../spring'
import { useAtlas } from '../../state/store'

/**
 * Layer 6: the silicon lattice (1 unit = 1 Å). Diamond cubic, a = 5.43 Å.
 * Slide 4: group IV, four bonds to nearest neighbours.
 * Slide 3: the same atoms as single crystal, polysilicon (grains, broken
 * bonds at the boundary) or amorphous (no long-range order, dangling bonds).
 * Slide 5: a group V donor frees an electron; a group III acceptor leaves a hole.
 */
const CELLS = 2
const L = CELLS * A_SI

function build() {
  const p0 = diamond({ x: [0, L + 0.01], y: [0, L + 0.01], z: [0, L + 0.01] }).map((p) => [p[0] - L / 2, p[1] - L / 2, p[2] - L / 2] as V3)
  const pairs = neighbours(p0, BOND_SI + 0.1)
  const r = rng(3)
  const amorph = p0.map((p) => [p[0] + (r() - 0.5) * 1.6, p[1] + (r() - 0.5) * 1.6, p[2] + (r() - 0.5) * 1.6] as V3)
  // poly: the right half is a second grain, rotated 30° about z
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0.2, 0.3, 1).normalize(), 0.52)
  const poly = p0.map((p) => {
    if (p[0] < 0.4) return p
    const v = new THREE.Vector3(p[0] - 0.4, p[1], p[2]).applyQuaternion(q)
    return [v.x + 1.4, v.y, v.z] as V3
  })
  // the atom whose four bonds are highlighted: the most central one with 4 neighbours
  const deg = new Array(p0.length).fill(0)
  pairs.forEach(([a, b]) => (deg[a]++, deg[b]++))
  let centre = 0
  let best = Infinity
  p0.forEach((p, i) => {
    const d = Math.hypot(...p)
    if (deg[i] === 4 && d < best) (best = d), (centre = i)
  })
  return { p0, amorph, poly, pairs, centre }
}

export default function LatticeLayer() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const b = useMemo(() => build(), [])
  const atoms = useMemo(() => atomsMesh(b.p0, 0.62, '#8ea2b2'), [b])
  const bonds = useMemo(() => bondsMesh(b.pairs.map(([i, j]) => [b.p0[i], b.p0[j]]), 0.17, '#5f6f7b'), [b])
  const hiBonds = useMemo(() => bondsMesh([], 0.24, '#f0b43c', 8), [])
  const dopant = useRef<THREE.Mesh>(null)
  const carrier = useRef<THREE.Mesh>(null)
  const hole = useRef<THREE.Mesh>(null)
  const edges = useRef<THREE.LineSegments>(null)
  const w = useRef({ amorph: new Spring(0, SPRINGS.gentle), poly: new Spring(0, SPRINGS.gentle) })
  const walk = useRef({ t: 0, pos: new THREE.Vector3(), vel: new THREE.Vector3(), r: rng(5) })
  const cur = useMemo(() => b.p0.map((p) => [...p] as V3), [b])
  const o = useMemo(() => new THREE.Object3D(), [])

  useFrame((_, dt) => {
    const st = useAtlas.getState()
    const { structure, dopant: dop } = st.lattice
    w.current.amorph.target = structure === 'amorphous' ? 1 : 0
    w.current.poly.target = structure === 'poly' ? 1 : 0
    const wa = w.current.amorph.step(dt, st.reducedMotion)
    const wp = w.current.poly.step(dt, st.reducedMotion)
    for (let i = 0; i < b.p0.length; i++)
      for (let k = 0; k < 3; k++) cur[i][k] = b.p0[i][k] + (b.amorph[i][k] - b.p0[i][k]) * wa + (b.poly[i][k] - b.p0[i][k]) * wp
    for (let i = 0; i < cur.length; i++) {
      o.position.set(...cur[i])
      o.scale.setScalar(i === b.centre && dop !== 'none' ? 0 : 1)
      o.updateMatrix()
      atoms.setMatrixAt(i, o.matrix)
    }
    atoms.instanceMatrix.needsUpdate = true
    // bonds survive only while near their crystal length: stretched ones break (dangling bonds, slide 3)
    const kept = b.pairs.filter(([i, j]) => Math.hypot(cur[i][0] - cur[j][0], cur[i][1] - cur[j][1], cur[i][2] - cur[j][2]) < 2.85)
    setBonds(bonds, kept.map(([i, j]) => [cur[i], cur[j]]))
    const mine = kept.filter(([i, j]) => i === b.centre || j === b.centre)
    setBonds(hiBonds, structure === 'crystal' ? mine.map(([i, j]) => [cur[i], cur[j]]) : [])
    if (edges.current) (edges.current.material as THREE.LineBasicNodeMaterial).opacity = 0.5 * (1 - Math.max(wa, wp))

    // dopant and its free carrier
    const c = new THREE.Vector3(...cur[b.centre])
    if (dopant.current) {
      dopant.current.visible = dop !== 'none'
      dopant.current.position.copy(c)
      ;(dopant.current.material as THREE.MeshStandardNodeMaterial).color.set(dop === 'P' ? '#d9822b' : '#e79bb0')
    }
    const wk = walk.current
    if (dop === 'none') wk.t = 0
    else {
      wk.t += dt
      if (wk.t < dt * 1.5) {
        wk.pos.copy(c).add(new THREE.Vector3(1.4, 0.6, 0))
        wk.vel.set(0, 0, 0)
      }
      // a thermal random walk with a gentle drift: the carrier is free (n ≈ ND, p ≈ NA)
      const r = wk.r
      wk.vel.add(new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(30 * dt)).multiplyScalar(0.96)
      if (wk.t < 1.2) wk.pos.copy(c).add(new THREE.Vector3(Math.cos(wk.t * 8) * 1.5, Math.sin(wk.t * 8) * 1.5, 0.4))
      else wk.pos.addScaledVector(wk.vel, dt).add(new THREE.Vector3(0.9 * dt, 0.3 * dt, 0))
      if (wk.pos.length() > L * 0.9) wk.pos.multiplyScalar(0.98)
    }
    if (carrier.current) {
      carrier.current.visible = dop === 'P'
      carrier.current.position.copy(wk.pos)
    }
    if (hole.current) {
      hole.current.visible = dop === 'B'
      hole.current.position.copy(wk.pos)
      hole.current.lookAt(camera.position)
    }

    const lab = (id: string, text: string, sub: string, p: THREE.Vector3, group: ScreenLabel['group'] = 'top'): ScreenLabel => {
      const v = p.clone().project(camera)
      return { id, text, sub, x: ((v.x + 1) / 2) * size.width, y: ((1 - v.y) / 2) * size.height, group, visible: v.z < 1 }
    }
    const labels: ScreenLabel[] = []
    if (dop === 'none' && structure === 'crystal') labels.push(lab('l-si', 'Si, group IV', '4 bonds to nearest neighbours', c))
    if (dop === 'P') labels.push(lab('l-p', 'P⁺ donor (group V)', 'spare electron → n-type', c), lab('l-e', 'free electron', 'n ≈ ND', wk.pos.clone(), 'bottom'))
    if (dop === 'B') labels.push(lab('l-b', 'B⁻ acceptor (group III)', 'missing electron → p-type', c), lab('l-h', 'mobile hole', 'p ≈ NA', wk.pos.clone(), 'bottom'))
    if (structure !== 'crystal')
      labels.push(lab('l-s', structure === 'poly' ? 'grain boundary' : 'no long-range order', structure === 'poly' ? 'traps & broken bonds' : 'dangling bonds', new THREE.Vector3(structure === 'poly' ? 0.8 : -2, L / 2, 0), 'top'))
    overlay.labels = labels
    overlay.version = 3000 + labels.length * 7 + (dop === 'P' ? 1 : dop === 'B' ? 2 : 0) + (structure === 'poly' ? 20 : structure === 'amorphous' ? 40 : 0)
  })

  useEffect(() => {
    rig.setHome({ target: [0, 0, 0] })
    rig.goHome()
    rig.handlers = { onSurface: () => void transition.go('oxide') }
    return () => {
      rig.handlers = {}
      overlay.labels = []
      overlay.version++
    }
  }, [])

  const edgeGeo = useMemo(() => {
    const g = new THREE.EdgesGeometry(new THREE.BoxGeometry(A_SI, A_SI, A_SI))
    g.translate(-L / 2 + A_SI / 2, -L / 2 + A_SI / 2, -L / 2 + A_SI / 2)
    return g
  }, [])

  return (
    <>
      <StudioLights scale={0.2} />
      <Inspectable node="lattice-cell" fit={1.2}>
        <primitive object={atoms} />
        <primitive object={bonds} />
        <primitive object={hiBonds} />
      </Inspectable>
      <lineSegments ref={edges} geometry={edgeGeo} raycast={() => null}>
        <lineBasicNodeMaterial color="#f0b43c" transparent opacity={0.5} />
      </lineSegments>
      <Inspectable node="lattice-dopant" fit={3} minDist={10}>
        <mesh ref={dopant} visible={false}>
          <icosahedronGeometry args={[0.85, 2]} />
          <meshStandardNodeMaterial color="#d9822b" roughness={0.35} />
        </mesh>
      </Inspectable>
      <mesh ref={carrier} visible={false} raycast={() => null}>
        <sphereGeometry args={[0.32, 12, 8]} />
        <meshBasicNodeMaterial color="#9fd8ff" />
      </mesh>
      <mesh ref={hole} visible={false} raycast={() => null}>
        <torusGeometry args={[0.36, 0.08, 8, 24]} />
        <meshBasicNodeMaterial color="#ffc58a" />
      </mesh>
      <InspectSync />
      <ClearOnMiss radius={400} />
    </>
  )
}
