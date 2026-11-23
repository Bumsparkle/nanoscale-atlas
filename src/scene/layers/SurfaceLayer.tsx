import * as THREE from 'three/webgpu'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { StudioLights } from '../Lighting'
import { ClearOnMiss, Inspectable, InspectSync } from '../Inspectable'
import { label, publish, rand, useDive } from './shared'
import { useAtlas } from '../../state/store'
import { rig } from '../rig'
import { SEMI_BY_ID, strainState } from '../../chapters/films/physics'

/**
 * Chapter 5 (Topic 6): the growing surface, 1 unit = 1 Å, atoms on a simple
 * cubic grid for clarity (the real crystals are zinc-blende or diamond).
 * Growth modes (slide 9): the same number of deposited atoms arranged layer
 * by layer, as islands, or as a wetting layer then islands.
 * Lattice mismatch (slides 4–6): a film strained to the substrate
 * (pseudomorphic) until its thickness passes the critical thickness, then
 * relaxed with misfit dislocations (metamorphic).
 */
const N = 14
const A = 3
const PER_ML = N * N
const HEIGHT_COLOURS = ['#f0b43c', '#e8902c', '#d8682a', '#c04a2a', '#a8352a'].map((c) => new THREE.Color(c))

function order(mode: 'fvdm' | 'sk' | 'vw') {
  const r = rand(mode === 'vw' ? 5 : mode === 'sk' ? 7 : 9)
  const centres = [[3.5, 4], [10, 9.5], [4, 11]]
  const sites: { x: number; z: number; h: number; key: number }[] = []
  for (let h = 0; h < 6; h++)
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++) {
        const d = Math.min(...centres.map(([cx, cz]) => Math.hypot(i - cx, j - cz)))
        let key: number
        if (mode === 'fvdm') key = h * 10 + r()
        else if (mode === 'vw') key = d * 1.1 + h * 1.6 + r() * 0.3
        else key = h === 0 ? -1 + r() * 0.01 : d * 1.1 + h * 1.6 + r() * 0.3
        sites.push({ x: i, z: j, h, key })
      }
  // islands must sit on something: drop sites whose support is not yet filled
  sites.sort((a, b) => a.key - b.key)
  const filled = new Set<string>()
  const out: typeof sites = []
  const pending = [...sites]
  while (pending.length && out.length < PER_ML * 5) {
    const k = pending.findIndex((s) => s.h === 0 || filled.has(`${s.x},${s.z},${s.h - 1}`))
    if (k < 0) break
    const [s] = pending.splice(k, 1)
    filled.add(`${s.x},${s.z},${s.h}`)
    out.push(s)
  }
  return out
}

function Modes() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const mode = useAtlas((s) => s.epi.mode)
  const coverage = useAtlas((s) => s.epi.coverage)
  const seq = useMemo(() => order(mode), [mode])
  const film = useMemo(() => new THREE.InstancedMesh(new THREE.SphereGeometry(1.25, 12, 8), new THREE.MeshStandardNodeMaterial({ color: '#ffffff', roughness: 0.4 }), PER_ML * 5), [])
  const subst = useMemo(() => {
    const im = new THREE.InstancedMesh(new THREE.SphereGeometry(1.25, 12, 8), new THREE.MeshStandardNodeMaterial({ color: '#6f8aa0', roughness: 0.4 }), PER_ML * 2)
    const o = new THREE.Object3D()
    let k = 0
    for (let h = 0; h < 2; h++)
      for (let i = 0; i < N; i++)
        for (let j = 0; j < N; j++) {
          o.position.set((i - N / 2) * A, -(h + 1) * A, (j - N / 2) * A)
          o.updateMatrix()
          im.setMatrixAt(k++, o.matrix)
        }
    return im
  }, [])
  useEffect(() => {
    const o = new THREE.Object3D()
    const n = Math.min(seq.length, Math.round(coverage * PER_ML))
    for (let k = 0; k < n; k++) {
      const s = seq[k]
      o.position.set((s.x - N / 2) * A, s.h * A, (s.z - N / 2) * A)
      o.updateMatrix()
      film.setMatrixAt(k, o.matrix)
      // shade by height so islands stand out from the layer beneath
      film.setColorAt(k, HEIGHT_COLOURS[Math.min(s.h, HEIGHT_COLOURS.length - 1)])
    }
    film.count = n
    film.instanceMatrix.needsUpdate = true
    if (film.instanceColor) film.instanceColor.needsUpdate = true
    film.computeBoundingSphere()
  }, [seq, coverage, film])
  const ad = useRef<THREE.Mesh>(null)
  const t = useRef(0)
  useFrame((_, dt) => {
    const st = useAtlas.getState()
    t.current += st.reducedMotion ? 0 : dt
    if (ad.current) ad.current.position.set(Math.sin(t.current * 0.9) * 12, 0.5 + 4 * A, Math.cos(t.current * 0.6) * 9)
    if (st.quiz) return publish([])
    const name = { fvdm: 'Frank–van der Merwe: layer by layer', sk: 'Stranski–Krastanov: wetting layer, then islands', vw: 'Volmer–Weber: islands' }[st.epi.mode]
    publish([label(camera, size, 's-mode', name, `${st.epi.coverage.toFixed(1)} monolayers deposited`, [0, 6 * A, 0], 'top')])
  })
  return (
    <>
      <primitive object={subst} />
      <Inspectable node="surface-film" fit={1.2}>
        <primitive object={film} />
      </Inspectable>
      <Inspectable node="adatom" fit={4}>
        <mesh ref={ad}>
          <sphereGeometry args={[1.3, 14, 10]} />
          <meshStandardNodeMaterial color="#9fd8ff" emissive="#2a6a9a" emissiveIntensity={0.6} />
        </mesh>
      </Inspectable>
    </>
  )
}

function Strain() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const e = useAtlas((s) => s.epi)
  const sub = SEMI_BY_ID[e.substrate]
  const fl = SEMI_BY_ID[e.film]
  const s = strainState(fl.a, sub.a, e.thick)
  // exaggerate the mismatch ×4 so a few % reads on screen; the label gives the true value
  const fx = s.f * 4
  const ml = Math.max(1, Math.min(12, Math.round(e.thick / (sub.a / 20))))
  const geom = useMemo(() => {
    const subAtoms: number[][] = []
    const filmAtoms: number[][] = []
    const disl: number[] = []
    const W = 26
    for (let h = 0; h < 5; h++) for (let i = 0; i < W; i++) for (const z of [-1.5, 1.5]) subAtoms.push([(i - W / 2) * A, -(h + 1) * A, z])
    const relaxed = s.mode === 'metamorphic'
    const ax = relaxed ? A * (1 + fx) : A
    const ay = relaxed ? A * (1 + fx) : A * (1 + 2 * fx) // pseudomorphic: elongated vertically (Poisson effect, ≈2f)
    const cols = Math.round((W * A) / ax)
    for (let h = 0; h < ml; h++) for (let i = 0; i < cols; i++) for (const z of [-1.5, 1.5]) filmAtoms.push([(i - cols / 2) * ax, h * ay, z])
    if (relaxed && Math.abs(fx) > 1e-4) {
      const spacing = A / Math.abs(fx)
      for (let x = -W * A / 2 + spacing / 2; x < (W * A) / 2; x += spacing) disl.push(x)
    }
    return { subAtoms, filmAtoms, disl }
  }, [fx, ml, s.mode])
  const mk = (pts: number[][], col: string) => {
    const im = new THREE.InstancedMesh(new THREE.SphereGeometry(1.15, 12, 8), new THREE.MeshStandardNodeMaterial({ color: col, roughness: 0.4 }), Math.max(1, pts.length))
    const o = new THREE.Object3D()
    pts.forEach((p, i) => {
      o.position.set(p[0], p[1], p[2])
      o.updateMatrix()
      im.setMatrixAt(i, o.matrix)
    })
    im.count = pts.length
    im.computeBoundingSphere()
    return im
  }
  const subIm = useMemo(() => mk(geom.subAtoms, '#6f8aa0'), [geom])
  const filmIm = useMemo(() => mk(geom.filmAtoms, '#f0b43c'), [geom])
  useFrame(() => {
    if (useAtlas.getState().quiz) return publish([])
    publish([
      label(camera, size, 'st-f', `${fl.id} on ${sub.id}: f = ${(s.f * 100).toFixed(2)} %`, s.mode === 'matched' ? 'lattice-matched' : s.mode === 'pseudomorphic' ? 'pseudomorphic: strained, bonds unbroken' : 'metamorphic: relaxed by misfit dislocations', [0, ml * A + 6, 0], 'top'),
      label(camera, size, 'st-x', 'mismatch drawn ×4', `${ml} monolayers shown`, [-40, -14, 0], 'bottom'),
    ])
  })
  return (
    <>
      <primitive object={subIm} />
      <Inspectable node="surface-film" fit={1.3}>
        <primitive object={filmIm} />
      </Inspectable>
      <Inspectable node="misfit" fit={2}>
        {geom.disl.map((x) => (
          <mesh key={x} position={[x, -A / 2, 0]}>
            <boxGeometry args={[0.6, 2.4, 6]} />
            <meshStandardNodeMaterial color="#e0453c" emissive="#7a1a10" emissiveIntensity={0.6} />
          </mesh>
        ))}
        {!geom.disl.length && (
          <mesh position={[0, -A / 2, 0]} visible={false}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicNodeMaterial />
          </mesh>
        )}
      </Inspectable>
    </>
  )
}

export default function SurfaceLayer() {
  const tab = useAtlas((s) => s.tab)
  useDive('mbe', null, { home: [0, tab === 'strain' ? 6 : 2, 0] })
  // the strain view is a side-on cross-section; the modes view looks down on the terrace
  useEffect(() => {
    rig.setHome(tab === 'strain' ? { target: [0, 12, 0], polar: 1.42, azimuth: 0.12, dist: 200 } : { target: [0, 2, 0], polar: 0.95, azimuth: 0.6, dist: 105 })
    rig.goHome()
  }, [tab])
  return (
    <>
      <StudioLights scale={1} />
      {tab === 'strain' ? <Strain /> : <Modes />}
      <InspectSync />
      <ClearOnMiss radius={600} />
    </>
  )
}
