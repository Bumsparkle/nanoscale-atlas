import * as THREE from 'three/webgpu'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import { StudioLights } from '../Lighting'
import { ClearOnMiss, Inspectable, InspectSync } from '../Inspectable'
import { label, publish, useDive, useTabHome, useUnits } from './shared'
import { useAtlas } from '../../state/store'
import { airy, depthOfFocus, fresnelRegime, fresnelSlit, gratingImage, resolution, ROADMAP, roadmapLambda, SOURCE_BY_ID, wMin } from '../../chapters/litho/optics'
import { simulate } from '../../chapters/litho/ebeam'
import { HeightField, LIGHT_COLOUR, Line, Seg } from './nanoShared'
import { clearedFraction, RESIST_STEPS, resistThickness } from '../../chapters/litho/resist'

/**
 * Chapter 6 (Topic 7): the lithography bay. Tabs:
 * - tool: a stepper from source to wafer (slides 3–5, 8–9), switchable
 *   between contact, proximity and projection printing;
 * - optics: two Airy images on the image plane (slides 6–8);
 * - mtf: the aerial image of a grating and the resist threshold (10–12);
 * - fresnel: proximity printing's near-field image under a slit (13–14);
 * - resist: the eight-step resist process (15–16);
 * - roadmap: lines at the year's node against the exposure wavelength (2);
 * - ngl: photons, electrons, X-rays and ions in resist (17–18).
 */
type L = ReturnType<typeof useAtlas.getState>['litho']

function Tool() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const L = useAtlas((s) => s.litho)
  const src = SOURCE_BY_ID[L.source]
  const col = LIGHT_COLOUR[L.source]
  const proj = L.system === 'projection'
  const maskY = proj ? 38 : L.system === 'proximity' ? -24 : -27.4
  const alpha = Math.asin(Math.min(0.95, L.NA))
  const waferY = -28
  const lensY = 6
  const coneH = lensY - waferY
  const coneR = Math.tan(alpha) * coneH * 0.8
  const light = useMemo(() => new THREE.MeshBasicNodeMaterial({ color: col, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }), [col])
  const R = resolution(L.k1, src.nm, L.NA)
  const dof = depthOfFocus(L.k2, src.nm, L.NA)
  useFrame(() => {
    const st = useAtlas.getState()
    if (st.quiz) return publish([])
    const tradeoff = L.system === 'contact' ? 'high resolution · unacceptable defects' : L.system === 'proximity' ? `gap ${L.gap} µm · ≥ a few µm only` : 'high resolution · low defects · dominates'
    publish([
      label(camera, size, 'l-src', `${src.name} · ${src.nm} nm`, src.lamp, [-12, 80, 0], 'side'),
      label(camera, size, 'l-sys', `${L.system} printing`, tradeoff, [-22, maskY, 0], 'side'),
      ...(proj ? [label(camera, size, 'l-res', `R = ${R.toFixed(0)} nm`, `DOF = ±${dof.toFixed(0)} nm · NA ${L.NA.toFixed(2)}`, [26, lensY, 0], 'right')] : []),
    ])
  })
  return (
    <group>
      <Inspectable node="litho-source" fit={2}>
        <mesh position={[0, 80, 0]}>
          <boxGeometry args={[18, 10, 18]} />
          <meshStandardNodeMaterial color="#3b4248" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 74.6, 0]}>
          <cylinderGeometry args={[4, 4, 1, 24]} />
          <meshStandardNodeMaterial color={col} emissive={col} emissiveIntensity={1.4} />
        </mesh>
      </Inspectable>
      <Inspectable node="litho-condenser" fit={2}>
        <mesh position={[0, 62, 0]} scale={[1, 0.18, 1]}>
          <sphereGeometry args={[16, 32, 16]} />
          <meshStandardNodeMaterial color="#cfe3ee" transparent opacity={0.45} roughness={0.05} metalness={0.1} />
        </mesh>
      </Inspectable>
      {/* source → condenser → mask: a plane-ish beam */}
      <mesh position={[0, (74 + maskY) / 2, 0]} material={light} raycast={() => null}>
        <cylinderGeometry args={[14, 4, 74 - maskY, 32, 1, true]} />
      </mesh>
      <Inspectable node="litho-mask" fit={2}>
        <group position={[0, maskY, 0]}>
          <mesh>
            <boxGeometry args={[30, 0.8, 30]} />
            <meshStandardNodeMaterial color="#dfeaf0" transparent opacity={0.5} roughness={0.05} />
          </mesh>
          {[-9, -3, 3, 9].map((x) => (
            <mesh key={x} position={[x, -0.5, 0]}>
              <boxGeometry args={[3, 0.2, 24]} />
              <meshStandardNodeMaterial color="#2a2d31" metalness={0.9} roughness={0.25} />
            </mesh>
          ))}
        </group>
      </Inspectable>
      {proj && (
        <>
          <mesh position={[0, (maskY + lensY) / 2, 0]} material={light} raycast={() => null}>
            <cylinderGeometry args={[16, 13, maskY - lensY, 32, 1, true]} />
          </mesh>
          <Inspectable node="litho-lens" fit={2}>
            <mesh position={[0, lensY, 0]} scale={[1, 0.22, 1]}>
              <sphereGeometry args={[18, 32, 16]} />
              <meshStandardNodeMaterial color="#d6ecf5" transparent opacity={0.5} roughness={0.05} />
            </mesh>
            <mesh position={[0, lensY, 0]} rotation-x={Math.PI / 2}>
              <torusGeometry args={[18.5, 1.4, 10, 40]} />
              <meshStandardNodeMaterial color="#59626a" metalness={0.8} roughness={0.3} />
            </mesh>
          </Inspectable>
          {/* converging cone, half-angle α = asin NA */}
          <mesh position={[0, (lensY + waferY) / 2, 0]} material={light} raycast={() => null}>
            <cylinderGeometry args={[coneR, 0.3, coneH, 32, 1, true]} />
          </mesh>
          {/* the depth of focus, exaggerated */}
          <mesh position={[0, waferY + 1.2, 0]} raycast={() => null}>
            <cylinderGeometry args={[3, 3, Math.max(0.3, dof / 120), 24]} />
            <meshBasicNodeMaterial color="#f0b43c" transparent opacity={0.35} depthWrite={false} />
          </mesh>
        </>
      )}
      {!proj && (
        <mesh position={[0, (maskY + waferY) / 2, 0]} material={light} raycast={() => null}>
          <cylinderGeometry args={[14, 14, Math.max(0.2, maskY - waferY - 1), 32, 1, true]} />
        </mesh>
      )}
      <Inspectable node="litho-wafer" fit={2}>
        <mesh position={[0, waferY - 1, 0]}>
          <cylinderGeometry args={[22, 22, 1.2, 48]} />
          <meshStandardNodeMaterial color="#5f7486" metalness={0.5} roughness={0.25} />
        </mesh>
        <mesh position={[0, waferY - 5, 0]}>
          <boxGeometry args={[52, 6, 52]} />
          <meshStandardNodeMaterial color="#30363b" metalness={0.5} roughness={0.5} />
        </mesh>
      </Inspectable>
      <Inspectable node="litho-resist" fit={3}>
        <mesh position={[0, waferY - 0.2, 0]}>
          <cylinderGeometry args={[21.6, 21.6, 0.5, 48]} />
          <meshStandardNodeMaterial color="#e0a238" roughness={0.35} transparent opacity={0.9} />
        </mesh>
      </Inspectable>
    </group>
  )
}

/** two point images on the image plane: Airy patterns, incoherently added */
function Optics() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const sep = useAtlas((s) => s.litho.sep)
  const span = 4 // Airy radii each side
  const I = (u: number, v: number) => {
    const x = (u - 0.5) * 2 * span
    const y = (v - 0.5) * 2 * span
    return airy(Math.hypot(x - sep / 2, y), 1) + (sep > 0 ? airy(Math.hypot(x + sep / 2, y), 1) : 0)
  }
  const peak = Math.max(I(0.5 + sep / 4 / span, 0.5), I(0.5, 0.5))
  const dip = sep > 0 ? I(0.5, 0.5) / peak : 1
  useFrame(() => {
    if (useAtlas.getState().quiz) return publish([])
    publish([
      label(camera, size, 'o-sep', sep > 0 ? `separation ${sep.toFixed(2)} Φ` : 'one point source', sep === 0 ? 'Φ = 1.22λf/d to the first dark ring' : sep >= 1 ? `resolved · dip to ${(dip * 100).toFixed(0)} %` : 'not resolved (Rayleigh)', [0, 34, 0], 'top'),
    ])
  })
  return (
    <Inspectable node="airy-image" fit={1.4}>
      <HeightField w={80} d={80} nx={161} nz={161} height={(u, v) => I(u, v) * 22} shade={(u, v) => Math.min(1, I(u, v))} deps={[sep]} />
      {/* the first dark ring of each point */}
      {(sep > 0 ? [-sep / 2, sep / 2] : [0]).map((x) => (
        <mesh key={x} position={[(x / span) * 40, 0.15, 0]} rotation-x={-Math.PI / 2} raycast={() => null}>
          <ringGeometry args={[(1 / span) * 40 - 0.25, (1 / span) * 40 + 0.25, 64]} />
          <meshBasicNodeMaterial color="#8ad0ff" />
        </mesh>
      ))}
    </Inspectable>
  )
}

/** the aerial image of equal lines and spaces, with the resist threshold */
function Mtf() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const L = useAtlas((s) => s.litho)
  const lam = SOURCE_BY_ID[L.source].nm
  const img = useMemo(() => gratingImage(L.feature, lam, L.NA, L.S, 96), [L.feature, lam, L.NA, L.S])
  const periods = 3
  const at = (u: number) => {
    const x = u * periods
    const f = x - Math.floor(x)
    return img.I[Math.min(img.I.length - 1, Math.floor(f * img.I.length))]
  }
  const prints = img.mtf >= 0.5
  useFrame(() => {
    if (useAtlas.getState().quiz) return publish([])
    publish([
      label(camera, size, 'm-mtf', `MTF ${img.mtf.toFixed(2)}`, prints ? 'the resist can recognise it (> 0.5)' : 'too little contrast (< 0.5)', [0, 30, 0], 'top'),
      label(camera, size, 'm-thr', 'resist threshold', 'half the open-field intensity', [-44, 11, 0], 'side'),
    ])
  })
  // mask bars: dark spaces between clear lines, 3 periods across 84 units
  const pw = 84 / periods
  return (
    <group>
      <Inspectable node="litho-mask" fit={2}>
        {Array.from({ length: periods }, (_, i) => (
          <mesh key={i} position={[-42 + pw * (i + 0.75), 41.2, 0]}>
            <boxGeometry args={[pw / 2, 1.2, 40]} />
            <meshStandardNodeMaterial color="#2a2d31" metalness={0.9} roughness={0.25} />
          </mesh>
        ))}
        <mesh position={[0, 40.3, 0]}>
          <boxGeometry args={[86, 0.4, 42]} />
          <meshStandardNodeMaterial color="#dfeaf0" transparent opacity={0.15} depthWrite={false} />
        </mesh>
      </Inspectable>
      <Inspectable node="mtf-image" fit={1.5}>
        <HeightField w={84} d={40} nx={241} nz={4} height={(u) => at(u) * 22} shade={(u) => at(u)} deps={[img]} />
      </Inspectable>
      <Inspectable node="litho-resist" fit={2}>
        <mesh position={[0, 11, 0]}>
          <boxGeometry args={[86, 0.15, 42]} />
          <meshBasicNodeMaterial color={prints ? '#f0b43c' : '#e0453c'} transparent opacity={0.28} depthWrite={false} />
        </mesh>
        <mesh position={[0, -2, 0]}>
          <boxGeometry args={[86, 3, 42]} />
          <meshStandardNodeMaterial color="#e0a238" roughness={0.4} />
        </mesh>
      </Inspectable>
    </group>
  )
}

/** proximity printing: a slit held a gap g above the resist (1 unit = 0.25 µm across) */
function Fresnel() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const L = useAtlas((s) => s.litho)
  const lam = SOURCE_BY_ID[L.source].nm / 1000
  const xs = useMemo(() => Array.from({ length: 241 }, (_, i) => -12 + (24 * i) / 240), [])
  const I = useMemo(() => fresnelSlit(L.W, Math.max(L.gap, 0.05), lam, xs, L.S * 0.04), [L.W, L.gap, lam, xs, L.S])
  const u2x = 4 // units per µm
  const gapU = Math.min(40, 2 + L.gap * 1.2)
  const regime = fresnelRegime(lam, L.gap, L.W)
  useFrame(() => {
    if (useAtlas.getState().quiz) return publish([])
    publish([
      label(camera, size, 'f-w', `W = ${L.W} µm · g = ${L.gap} µm`, `W_min ≈ √(λg) = ${wMin(lam, L.gap).toFixed(2)} µm`, [0, gapU + 8, 0], 'top'),
      label(camera, size, 'f-reg', regime === 'fresnel' ? 'Fresnel: λ < g < W²/λ' : regime === 'contact' ? 'contact: g ≤ λ' : 'far field: g > W²/λ', L.W < wMin(lam, L.gap) ? 'the opening is below W_min: it blurs away' : 'edges ring', [48, 6, 0], 'right'),
    ])
  })
  return (
    <group>
      <Inspectable node="fresnel-gap" fit={1.6}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * ((L.W * u2x) / 2 + 25), gapU, 0]}>
            <boxGeometry args={[50, 1, 30]} />
            <meshStandardNodeMaterial color="#2a2d31" metalness={0.9} roughness={0.25} />
          </mesh>
        ))}
        <Seg a={[-50, gapU / 2 + 0.5, 16]} b={[-50, gapU - 0.5, 16]} r={0.25} color="#8ad0ff" />
      </Inspectable>
      <HeightField w={96} d={30} nx={241} nz={3} position={[0, 0.6, 0]} height={(u) => I[Math.round(u * 240)] * 10} shade={(u) => Math.min(1, I[Math.round(u * 240)] * 0.8)} deps={[I]} />
      <Inspectable node="litho-resist" fit={2}>
        <mesh position={[0, -1.5, 0]}>
          <boxGeometry args={[100, 3, 32]} />
          <meshStandardNodeMaterial color="#e0a238" roughness={0.4} />
        </mesh>
      </Inspectable>
    </group>
  )
}

function Resist() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const L = useAtlas((s) => s.litho)
  const s = L.rstep
  const t = resistThickness(L.rpm) * 30 // units, ×3 exaggeration of 0.1 µm units
  const exposedXs = [-12, 12]
  const openW = 10
  const clear = clearedFraction(L.dose)
  const developed = s >= 7
  const hot = s === 1 || s === 4 || s === 6 || s === 8
  const waves = s >= 5 && s < 6 // standing waves until the PEB smooths them
  useFrame(() => {
    if (useAtlas.getState().quiz) return publish([])
    const cur = RESIST_STEPS[Math.max(0, s - 1)]
    publish([
      label(camera, size, 'r-step', s === 0 ? 'bare wafer' : `${s}. ${cur.t}`, s === 0 ? 'press next' : cur.p, [0, 28, 0], 'top'),
      ...(s >= 3 ? [label(camera, size, 'r-t', `${resistThickness(L.rpm).toFixed(2)} µm`, `${L.rpm} rpm`, [44, t / 2 + 1, 0], 'right')] : []),
      ...(developed && clear < 1 ? [label(camera, size, 'r-under', 'under-exposed', `${L.dose} mJ cm⁻² < sensitivity`, [12, t + 4, 10], 'right')] : []),
    ])
  })
  return (
    <group>
      <Inspectable node="litho-wafer" fit={2}>
        <mesh position={[0, -8, 0]}>
          <boxGeometry args={[80, 16, 30]} />
          <meshStandardNodeMaterial color="#5f7486" metalness={0.4} roughness={0.35} emissive="#7a2a10" emissiveIntensity={hot ? 0.35 : 0} />
        </mesh>
      </Inspectable>
      {s >= 2 && (
        <Inspectable node="hmds-layer" fit={3}>
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[80, 0.6, 30]} />
            <meshStandardNodeMaterial color="#56b5a8" roughness={0.3} />
          </mesh>
        </Inspectable>
      )}
      {s >= 3 && (
        <Inspectable node="litho-resist" fit={2}>
          {/* resist, with openings once developed (positive resist) */}
          {(developed ? [[-40, -17], [-7, 7], [17, 40]] : [[-40, 40]]).map(([a, b]) => (
            <mesh key={a} position={[(a + b) / 2, 0.6 + t / 2, 0]}>
              <boxGeometry args={[b - a, t, 30]} />
              <meshStandardNodeMaterial color={s >= 8 ? '#b9782a' : '#e0a238'} roughness={0.35} emissive="#7a3a10" emissiveIntensity={hot ? 0.25 : 0} />
            </mesh>
          ))}
          {/* scum left in an under-exposed opening */}
          {developed && clear < 1 && exposedXs.map((x) => (
            <mesh key={x} position={[x, 0.6 + (t * (1 - clear)) / 2, 0]}>
              <boxGeometry args={[openW, Math.max(0.05, t * (1 - clear)), 30]} />
              <meshStandardNodeMaterial color="#e0a238" roughness={0.35} />
            </mesh>
          ))}
        </Inspectable>
      )}
      {s >= 5 && !developed && (
        <Inspectable node="standing-waves" fit={3}>
          {exposedXs.map((x) => (
            <group key={x}>
              {Array.from({ length: waves ? 6 : 1 }, (_, i) => (
                <mesh key={i} position={[x, 0.6 + (waves ? ((i + 0.5) / 6) * t : t / 2), 15.1]}>
                  <planeGeometry args={[openW, waves ? t / 12 : t]} />
                  <meshBasicNodeMaterial color="#8f6bd8" transparent opacity={waves ? 0.9 : 0.45} />
                </mesh>
              ))}
            </group>
          ))}
        </Inspectable>
      )}
      {s === 5 && (
        <Inspectable node="litho-mask" fit={2}>
          {[[-40, -17], [-7, 7], [17, 40]].map(([a, b]) => (
            <mesh key={a} position={[(a + b) / 2, t + 12, 0]}>
              <boxGeometry args={[b - a, 0.8, 30]} />
              <meshStandardNodeMaterial color="#2a2d31" metalness={0.9} roughness={0.25} />
            </mesh>
          ))}
          {exposedXs.map((x) => (
            <mesh key={x} position={[x, t / 2 + 6.5, 0]} raycast={() => null}>
              <boxGeometry args={[openW, 11, 28]} />
              <meshBasicNodeMaterial color="#a58cff" transparent opacity={0.22} depthWrite={false} />
            </mesh>
          ))}
        </Inspectable>
      )}
    </group>
  )
}

/** the year's node as gate lines (1 unit = 5 nm), under one exposure wavelength */
function Roadmap() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const year = useAtlas((s) => s.litho.year)
  const row = [...ROADMAP].reverse().find((r) => r.year <= year) ?? ROADMAP[0]
  const lam = roadmapLambda(row.year)
  const u = 5 // nm per unit
  const hp = row.node / u
  const n = 6
  const wave = useMemo(() => Array.from({ length: 200 }, (_, i) => {
    const x = -60 + (120 * i) / 199
    return [x, 34 + 4 * Math.sin((2 * Math.PI * x * u) / lam), 0] as [number, number, number]
  }), [lam])
  useFrame(() => {
    if (useAtlas.getState().quiz) return publish([])
    publish([
      label(camera, size, 'rm-node', `${row.year}: ${row.node} nm half pitch`, row.gate ? `gate ${row.gate} nm · ${row.tech}` : row.tech, [0, 16, 0], 'top'),
      label(camera, size, 'rm-lam', `λ = ${lam} nm`, 'the exposure wavelength, to the same scale', [-60, 34, 0], 'side'),
    ])
  })
  return (
    <group>
      <Inspectable node="roadmap-line" fit={1.6}>
        {Array.from({ length: n }, (_, i) => (
          <mesh key={i} position={[(i - (n - 1) / 2) * 2 * hp, 4, 0]}>
            <boxGeometry args={[hp, 8, 30]} />
            <meshStandardNodeMaterial color="#d9d9d9" roughness={0.6} />
          </mesh>
        ))}
        <mesh position={[0, -1, 0]}>
          <boxGeometry args={[Math.max(130, 2 * hp * n + 10), 2, 34]} />
          <meshStandardNodeMaterial color="#5f7486" roughness={0.4} />
        </mesh>
      </Inspectable>
      <Line pts={wave} r={0.45} color="#a58cff" emissive="#a58cff" />
    </group>
  )
}

/** slide 18's figure: four beams into resist, side by side */
function Ngl() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const keV = useAtlas((s) => s.litho.keV)
  const e = useMemo(() => simulate(Math.min(keV, 10), 24, 400, 11), [keV])
  const xs = [-48, -16, 16, 48]
  useFrame(() => {
    if (useAtlas.getState().quiz) return publish([])
    publish([
      label(camera, size, 'n-ph', 'photons', 'spread ~½ µm', [xs[0], 24, 0], 'top'),
      label(camera, size, 'n-e', 'electrons (10 keV)', 'scatter and backscatter', [xs[1], 24, 0], 'top'),
      label(camera, size, 'n-x', 'X-rays', 'through a 1:1 mask', [xs[2], 24, 0], 'top'),
      label(camera, size, 'n-i', 'ions', 'nearly straight', [xs[3], 24, 0], 'top'),
    ])
  })
  // 1 unit = 50 nm in the resist
  return (
    <group>
      <Inspectable node="ngl-beam" fit={1.4}>
        {/* photons: a diffraction-spread cone */}
        <mesh position={[xs[0], 5, 0]} raycast={() => null}>
          <cylinderGeometry args={[1, 5, 10, 24, 1, true]} />
          <meshBasicNodeMaterial color="#a58cff" transparent opacity={0.35} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <Seg a={[xs[0], 10, 0]} b={[xs[0], 22, 0]} r={1} color="#a58cff" opacity={0.6} />
        {/* electrons: Monte Carlo paths in 400 nm of resist on Si */}
        {e.trajs.map((tr, i) => (
          <Line key={i} pts={tr.pts.filter((_, k) => k % 2 === 0).map(([x, z]) => [xs[1] + x / 100, 10 - z / 100, (i % 5) - 2] as [number, number, number])} r={0.12} color={tr.backscattered ? '#7dd3fc' : '#e7f3ff'} />
        ))}
        <Seg a={[xs[1], 10, 0]} b={[xs[1], 22, 0]} r={0.3} color="#e7f3ff" />
        {/* X-rays: straight through a mask opening */}
        <mesh position={[xs[2] - 6, 13, 0]}>
          <boxGeometry args={[8, 0.8, 10]} />
          <meshStandardNodeMaterial color="#c9a227" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[xs[2] + 6, 13, 0]}>
          <boxGeometry args={[8, 0.8, 10]} />
          <meshStandardNodeMaterial color="#c9a227" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[xs[2], 11, 0]} raycast={() => null}>
          <boxGeometry args={[4, 22, 4]} />
          <meshBasicNodeMaterial color="#f5f0d0" transparent opacity={0.4} depthWrite={false} />
        </mesh>
        {/* ions: a thin straight track */}
        <Seg a={[xs[3], 2, 0]} b={[xs[3], 22, 0]} r={0.35} color="#f0b43c" />
      </Inspectable>
      <Inspectable node="litho-resist" fit={2}>
        <mesh position={[0, 6, 0]}>
          <boxGeometry args={[130, 8, 12]} />
          <meshStandardNodeMaterial color="#e0a238" roughness={0.4} transparent opacity={0.55} depthWrite={false} />
        </mesh>
      </Inspectable>
      <mesh position={[0, -10, 0]}>
        <boxGeometry args={[130, 24, 12]} />
        <meshStandardNodeMaterial color="#5f7486" roughness={0.4} transparent opacity={0.6} depthWrite={false} />
      </mesh>
    </group>
  )
}

const HOMES: Record<string, { target: [number, number, number]; polar: number; azimuth: number; dist: number }> = {
  tool: { target: [14, 22, 0], polar: 1.35, azimuth: 0.6, dist: 330 },
  optics: { target: [12, 4, 0], polar: 0.95, azimuth: 0.5, dist: 175 },
  mtf: { target: [18, 16, 0], polar: 1.25, azimuth: 0.45, dist: 200 },
  fresnel: { target: [16, 8, 0], polar: 1.3, azimuth: 0.35, dist: 185 },
  resist: { target: [18, 4, 0], polar: 1.25, azimuth: 0.45, dist: 190 },
  roadmap: { target: [16, 14, 0], polar: 1.3, azimuth: 0.35, dist: 200 },
  ngl: { target: [16, 4, 0], polar: 1.42, azimuth: 0.12, dist: 190 },
}
/** metres per unit on each tab (the stepper itself is the layer's 1 cm) */
const UNITS: Record<string, number | null> = { tool: null, optics: 0.3e-6 / 10, mtf: null, fresnel: 0.25e-6, resist: 5e-8, roadmap: 5e-9, ngl: 5e-8 }

export default function LithoLayer() {
  const tab = useAtlas((s) => s.tab) || 'tool'
  useDive('cleanroom', null)
  const feature = useAtlas((s) => s.litho.feature)
  useUnits(tab === 'mtf' ? (6 * feature * 1e-9) / 84 : UNITS[tab] ?? null)
  useTabHome('litho', HOMES[tab] ?? HOMES.tool, tab)
  return (
    <>
      <StudioLights scale={6} />
      {tab === 'optics' ? <Optics /> : tab === 'mtf' ? <Mtf /> : tab === 'fresnel' ? <Fresnel /> : tab === 'resist' ? <Resist /> : tab === 'roadmap' ? <Roadmap /> : tab === 'ngl' ? <Ngl /> : <Tool />}
      <mesh rotation-x={-Math.PI / 2} position={[0, -40, 0]}>
        <circleGeometry args={[800, 48]} />
        <meshStandardNodeMaterial color="#2b2a24" roughness={1} />
      </mesh>
      <InspectSync />
      <ClearOnMiss radius={6000} />
    </>
  )
}

export type { L as LithoState }
