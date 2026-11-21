import * as THREE from 'three/webgpu'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { StudioLights } from '../Lighting'
import { ClearOnMiss, Inspectable, InspectSync } from '../Inspectable'
import { dopingColour, label, publish, useDive } from './shared'
import { useAtlas } from '../../state/store'
import { clOverC0, csOverC0, zoneRefine } from '../../chapters/growth/physics'

/**
 * Chapter 2, layer 3: the crystal puller (1 unit = 1 cm).
 * Czochralski (Topic 3 slides 16–19): a cut-away puller with its water
 * jacket, heat shield, carbon heater, quartz crucible and melt near
 * 1415 °C; the seed turns one way and the crucible the other while the
 * crystal is pulled. The ingot is coloured by its dopant concentration
 * Cs/C0 = k0·(1 − M/M0)^(k0 − 1), so dragging k0 and the pulled fraction
 * shows the segregation equation on the crystal itself.
 * Float zone (slide 20): a polysilicon rod, a travelling RF coil and its
 * molten zone, the refined single crystal growing above a seed.
 */
const MELT_R = 39
const MELT_H0 = 30
const CRYSTAL_R = 15
/** body length when all the melt has frozen: volume conservation */
const L_MAX = (MELT_H0 * MELT_R * MELT_R) / (CRYSTAL_R * CRYSTAL_R)
const MELT_Y0 = 41
const NECK = 12
const SHOULDER = 12

// the cut-away faces the rest camera (azimuth 0.6 rad)
const cut = { thetaStart: Math.PI * 0.46, thetaLength: Math.PI * 1.46 }

/** the Czochralski crystal as a lathe, with vertex colours from Cs/C0 */
function crystalGeometry(k0: number, frac: number) {
  const body = Math.max(0.5, frac * L_MAX)
  const pts: THREE.Vector2[] = []
  const fAt: number[] = []
  // from the growing interface (y = 0) upwards
  const N = 70
  pts.push(new THREE.Vector2(0.01, 0))
  fAt.push(frac)
  for (let i = 0; i <= N; i++) {
    const y = (i / N) * body
    pts.push(new THREE.Vector2(CRYSTAL_R, y))
    fAt.push(Math.max(0, frac - y / L_MAX))
  }
  for (let i = 1; i <= 8; i++) {
    const t = i / 8
    pts.push(new THREE.Vector2(CRYSTAL_R + (1.6 - CRYSTAL_R) * Math.sin((t * Math.PI) / 2), body + t * SHOULDER))
    fAt.push(0)
  }
  pts.push(new THREE.Vector2(1.6, body + SHOULDER + NECK))
  fAt.push(0)
  pts.push(new THREE.Vector2(0.01, body + SHOULDER + NECK))
  fAt.push(0)
  const segs = 56
  const geo = new THREE.LatheGeometry(pts, segs)
  const col = new Float32Array(geo.attributes.position.count * 3)
  const c = new THREE.Color()
  // LatheGeometry orders vertices segment by segment, each with every profile point
  for (let s = 0; s <= segs; s++)
    for (let j = 0; j < pts.length; j++) {
      dopingColour(csOverC0(k0, fAt[j]), c)
      const k = s * pts.length + j
      col[k * 3] = c.r
      col[k * 3 + 1] = c.g
      col[k * 3 + 2] = c.b
    }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return { geo, body }
}

/** a float-zone rod (y from 20 to 220) coloured by impurity C/C0 after refining */
function fzGeometry(profile: number[], from: number, to: number, seedCone: boolean) {
  const n = profile.length
  const y = (i: number) => 20 + (i / (n - 1)) * 200
  const pts: THREE.Vector2[] = []
  const cAt: number[] = []
  const i0 = Math.max(0, Math.floor(((from - 20) / 200) * (n - 1)))
  const i1 = Math.min(n - 1, Math.ceil(((to - 20) / 200) * (n - 1)))
  pts.push(new THREE.Vector2(0.01, Math.max(20, from)))
  cAt.push(profile[i0])
  for (let i = i0; i <= i1; i++) {
    const yy = Math.min(Math.max(y(i), from), to)
    const r = seedCone && yy < 36 ? 2 + ((yy - 20) / 16) * 8 : 10
    pts.push(new THREE.Vector2(r, yy))
    cAt.push(profile[i])
  }
  pts.push(new THREE.Vector2(0.01, to))
  cAt.push(profile[i1])
  const segs = 40
  const geo = new THREE.LatheGeometry(pts, segs)
  const col = new Float32Array(geo.attributes.position.count * 3)
  const c = new THREE.Color()
  for (let s = 0; s <= segs; s++)
    for (let j = 0; j < pts.length; j++) {
      // impurity C/C0: the feed (1) in silicon grey, refined darker, swept-up impurity amber to red
      dopingColour(cAt[j] * 0.4, c)
      const k = s * pts.length + j
      col.set([c.r, c.g, c.b], k * 3)
    }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return geo
}

function Czochralski() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const k0 = useAtlas((s) => s.growth.k0)
  const frac = useAtlas((s) => s.growth.frac)
  const { geo, body } = useMemo(() => crystalGeometry(k0, frac), [k0, frac])
  useEffect(() => () => geo.dispose(), [geo])
  const crystal = useRef<THREE.Group>(null)
  const crucible = useRef<THREE.Group>(null)
  const meltMat = useMemo(() => new THREE.MeshStandardNodeMaterial({ color: '#ffb347', emissive: '#ff7a1a', emissiveIntensity: 1.1, roughness: 0.25, metalness: 0.1 }), [])
  const heaterMat = useMemo(() => new THREE.MeshStandardNodeMaterial({ color: '#2a2624', emissive: '#ff5a10', emissiveIntensity: 0.35, roughness: 0.9, side: THREE.DoubleSide }), [])
  const hm = MELT_H0 * (1 - frac)
  const surface = MELT_Y0 + hm
  // the melt gets richer in dopant as the crystal grows (k0 < 1)
  useEffect(() => {
    const c = dopingColour(clOverC0(k0, frac))
    meltMat.color.copy(new THREE.Color('#ffb347').lerp(c, 0.35))
  }, [k0, frac, meltMat])

  useFrame((_, dt) => {
    const st = useAtlas.getState()
    const w = st.reducedMotion ? 0 : dt
    if (crystal.current) crystal.current.rotation.y += w * 0.5 // seed: counter-clockwise seen from above
    if (crucible.current) crucible.current.rotation.y -= w * 0.25 // crucible: the other way
    if (st.quiz) return publish([])
    const seedEnd = csOverC0(k0, 0)
    const now = csOverC0(k0, frac)
    publish([
      label(camera, size, 'cz-seed-end', `seed end: Cs = k0·C0 = ${fmt(seedEnd)} C0`, 'first crystal to freeze', [CRYSTAL_R + 2, surface + body - 2, 0]),
      label(camera, size, 'cz-now', `growing end: Cs = ${fmt(now)} C0`, `M/M0 = ${frac.toFixed(2)}`, [CRYSTAL_R + 2, surface + 4, 0]),
      label(camera, size, 'cz-melt', `melt ≈ 1415 °C · CL = ${fmt(now / k0)} C0`, k0 < 1 ? 'dopant stays in the liquid' : 'k0 > 1: the melt is depleted', [-MELT_R, surface, 10], 'side'),
      label(camera, size, 'cz-pull', 'pull ↑ · rotate ↺', 'pull rate, temperature, rotation', [0, surface + body + SHOULDER + NECK + 26, 0], 'top'),
    ])
  })

  return (
    <>
      {/* water jacket, lid and pull chamber */}
      <Inspectable node="cz-jacket" fit={1.1}>
        <mesh position={[0, 62, 0]}>
          <cylinderGeometry args={[78, 78, 124, 72, 1, true, cut.thetaStart, cut.thetaLength]} />
          <meshStandardNodeMaterial color="#5d566b" metalness={0.55} roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 62, 0]}>
          <cylinderGeometry args={[60, 60, 92, 64, 1, true, cut.thetaStart, cut.thetaLength]} />
          <meshStandardNodeMaterial color="#9aa3aa" metalness={0.7} roughness={0.35} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 230, 0]}>
          <cylinderGeometry args={[23, 23, 212, 40, 1, true, cut.thetaStart, cut.thetaLength]} />
          <meshStandardNodeMaterial color="#5d566b" metalness={0.55} roughness={0.4} side={THREE.DoubleSide} transparent opacity={0.45} />
        </mesh>
      </Inspectable>
      <Inspectable node="cz-heater" fit={1.6}>
        <mesh position={[0, 58, 0]} material={heaterMat}>
          <cylinderGeometry args={[49, 49, 46, 64, 1, true, cut.thetaStart, cut.thetaLength]} />
        </mesh>
      </Inspectable>
      <group ref={crucible}>
        <Inspectable node="cz-crucible" fit={1.6}>
          <mesh position={[0, 58, 0]}>
            <cylinderGeometry args={[42, 41, 40, 64, 1, true]} />
            <meshPhysicalNodeMaterial color="#f1f3f4" roughness={0.15} transmission={0.4} thickness={2} transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 37.5, 0]}>
            <cylinderGeometry args={[45, 45, 5, 64]} />
            <meshStandardNodeMaterial color="#3b3f42" roughness={0.8} />
          </mesh>
        </Inspectable>
        <Inspectable node="cz-melt" fit={2}>
          <mesh position={[0, MELT_Y0 + hm / 2, 0]} material={meltMat}>
            <cylinderGeometry args={[MELT_R, MELT_R * 0.97, Math.max(0.3, hm), 64]} />
          </mesh>
        </Inspectable>
      </group>
      <group ref={crystal} position={[0, surface, 0]}>
        <Inspectable node="cz-ingot" fit={1.3}>
          <mesh geometry={geo}>
            <meshStandardNodeMaterial vertexColors metalness={0.55} roughness={0.28} />
          </mesh>
        </Inspectable>
        <Inspectable node="cz-seed" fit={4} minDist={45}>
          <mesh position={[0, body + SHOULDER + NECK + 4, 0]}>
            <cylinderGeometry args={[1.3, 1.3, 8, 12]} />
            <meshStandardNodeMaterial color="#9fb0bf" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, body + SHOULDER + NECK + 11, 0]}>
            <cylinderGeometry args={[3.2, 3.2, 6, 16]} />
            <meshStandardNodeMaterial color="#5b6168" metalness={0.8} roughness={0.35} />
          </mesh>
        </Inspectable>
        {/* pull shaft */}
        <mesh position={[0, body + SHOULDER + NECK + 14 + 80, 0]} raycast={() => null}>
          <cylinderGeometry args={[0.6, 0.6, 160, 8]} />
          <meshStandardNodeMaterial color="#8d969c" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>
      <pointLight position={[0, surface + 6, 0]} intensity={9000} distance={180} color="#ff8a32" />
    </>
  )
}

function FloatZone() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const k0 = useAtlas((s) => s.growth.k0)
  const frac = useAtlas((s) => s.growth.frac)
  const passes = useAtlas((s) => s.growth.passes)
  const zoneY = 30 + frac * 180
  const now = useMemo(() => zoneRefine(Math.min(k0, 0.99), passes), [k0, passes])
  const before = useMemo(() => zoneRefine(Math.min(k0, 0.99), passes - 1), [k0, passes])
  const crystalGeo = useMemo(() => fzGeometry(now, 20, zoneY - 5, true), [now, zoneY])
  const rodGeo = useMemo(() => fzGeometry(before, zoneY + 5, 220, false), [before, zoneY])
  useEffect(() => () => (crystalGeo.dispose(), rodGeo.dispose()), [crystalGeo, rodGeo])
  const coil = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    const st = useAtlas.getState()
    if (coil.current && !st.reducedMotion) coil.current.rotation.y += dt * 0.2
    if (st.quiz) return publish([])
    const i = Math.round(((zoneY - 20) / 200) * 119)
    publish([
      label(camera, size, 'fz-rod', 'polycrystalline rod', passes > 1 ? `pass ${passes}` : 'feed', [12, Math.min(215, zoneY + 40), 0]),
      label(camera, size, 'fz-zone', 'molten zone', `impurities ride along · k = ${k0 < 0.01 ? k0.toExponential(1) : k0.toFixed(2)}`, [16, zoneY, 0]),
      label(camera, size, 'fz-x', `refined crystal: C = ${fmt(now[Math.max(0, i - 15)])} C0`, `after ${passes} pass${passes > 1 ? 'es' : ''}`, [12, Math.max(40, zoneY - 40), 0]),
      label(camera, size, 'fz-seed', 'single-crystal seed', undefined, [6, 24, 0]),
    ])
  })
  return (
    <>
      <Inspectable node="fz-crystal" fit={1.4}>
        <mesh geometry={crystalGeo}>
          <meshStandardNodeMaterial vertexColors metalness={0.6} roughness={0.22} />
        </mesh>
      </Inspectable>
      <Inspectable node="fz-rod" fit={1.4}>
        <mesh geometry={rodGeo}>
          <meshStandardNodeMaterial vertexColors metalness={0.35} roughness={0.75} />
        </mesh>
      </Inspectable>
      <Inspectable node="fz-zone" fit={3}>
        <mesh position={[0, zoneY, 0]}>
          <cylinderGeometry args={[9.2, 9.2, 10, 40]} />
          <meshStandardNodeMaterial color="#ffc061" emissive="#ff7a1a" emissiveIntensity={1.2} roughness={0.2} />
        </mesh>
      </Inspectable>
      <group ref={coil} position={[0, zoneY, 0]}>
        <Inspectable node="fz-coil" fit={2.5}>
          {[-3, 0, 3].map((dy) => (
            <mesh key={dy} position={[0, dy, 0]} rotation-x={Math.PI / 2}>
              <torusGeometry args={[17, 1.2, 10, 48]} />
              <meshStandardNodeMaterial color="#c58a4a" metalness={0.9} roughness={0.25} />
            </mesh>
          ))}
        </Inspectable>
      </group>
      {/* chucks */}
      {[14, 226].map((y) => (
        <mesh key={y} position={[0, y, 0]} raycast={() => null}>
          <cylinderGeometry args={[6, 6, 12, 20]} />
          <meshStandardNodeMaterial color="#596066" metalness={0.8} roughness={0.35} />
        </mesh>
      ))}
      <pointLight position={[0, zoneY, 24]} intensity={3500} distance={120} color="#ff9a3a" />
    </>
  )
}

const fmt = (v: number) => (v >= 10 ? v.toFixed(0) : v >= 0.1 ? v.toFixed(2) : v.toPrecision(2))

export default function PullerLayer() {
  const tab = useAtlas((s) => s.tab)
  useDive('polysilicon', 'ingot', { home: tab === 'fz' ? [0, 120, 0] : [0, 140, 0] })
  return (
    <>
      <StudioLights scale={6} />
      {tab === 'fz' ? <FloatZone /> : <Czochralski />}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.1, 0]}>
        <circleGeometry args={[900, 64]} />
        <meshStandardNodeMaterial color="#25292c" roughness={1} />
      </mesh>
      <InspectSync />
      <ClearOnMiss radius={8000} />
    </>
  )
}
