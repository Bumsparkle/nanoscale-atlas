import * as THREE from 'three/webgpu'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { StudioLights } from '../Lighting'
import { ClearOnMiss, Inspectable, InspectSync } from '../Inspectable'
import { label, publish, rand, useDive } from './shared'
import { useAtlas } from '../../state/store'
import { cvdRate, meanFreePath, stepCoverage } from '../../chapters/films/physics'

/**
 * Chapter 4 (Topic 5): the deposition bay, 1 unit = 1 cm.
 * CVD: a quartz tube (tilted susceptor at atmospheric pressure, a boat of
 * standing wafers at low pressure) with gas tracers whose crossing of the
 * boundary layer follows the hG/kS model. Plasma: a parallel-plate chamber
 * as PECVD, DC, RF or magnetron sputtering. Evaporation: a bell jar whose
 * vapour rays straighten as the mean free path outgrows the chamber.
 * Step coverage: a trench coated by each method. Si epitaxy (Chapter 5):
 * a lamp-heated barrel reactor and an epi wafer.
 */
const tracers = (n: number, seed: number) => {
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.5, 6, 4), new THREE.MeshBasicNodeMaterial({ color: '#a8d8f0', transparent: true, opacity: 0.7 }), n)
  im.raycast = () => null
  const r = rand(seed)
  return { im, lanes: Array.from({ length: n }, () => [r(), r(), r()]) }
}

function Cvd() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const f = useAtlas((s) => s.films)
  const lp = f.P < 50
  const rate = cvdRate(f.T, f.P, f.Y)
  const gas = useMemo(() => tracers(260, 3), [])
  const o = useMemo(() => new THREE.Object3D(), [])
  const t = useRef(0)
  const glow = useMemo(() => new THREE.MeshStandardNodeMaterial({ color: '#3b2f2a', emissive: '#ff6a1a', emissiveIntensity: 0.4, roughness: 0.8 }), [])
  useFrame((_, dt) => {
    const st = useAtlas.getState()
    t.current += st.reducedMotion ? 0 : dt
    glow.emissiveIntensity = 0.15 + 0.6 * Math.min(1, Math.max(0, (st.films.T - 400) / 800))
    // a tracer reaches the wafers (drops to the surface) with a probability set by how the
    // two steps compare: transport-limited → most arriving molecules react near the inlet
    const r = cvdRate(st.films.T, st.films.P, st.films.Y)
    const reach = r.ks / (r.ks + r.hg)
    gas.lanes.forEach(([u, w, ph], i) => {
      const p = (ph + t.current * (lp ? 0.35 : 0.18)) % 1
      const x = -75 + p * 150
      const lands = u < reach && p > 0.15 + w * 0.6
      const y = lands ? 3 + (1 - Math.min(1, (p - 0.15 - w * 0.6) * 8)) * 8 : 4 + u * 14
      o.position.set(x, y, (w - 0.5) * 20)
      o.scale.setScalar(lands && p > 0.25 + w * 0.6 ? 0.001 : 1)
      o.updateMatrix()
      gas.im.setMatrixAt(i, o.matrix)
    })
    gas.im.instanceMatrix.needsUpdate = true
    if (st.quiz) return publish([])
    publish([
      label(camera, size, 'c-reg', r.regime === 'reaction' ? 'reaction-rate limited' : r.regime === 'transport' ? 'mass-transport limited' : 'mixed control', `kS ${r.ks.toPrecision(2)} · hG ${r.hg.toPrecision(2)} cm/s`, [0, 26, 0], 'top'),
      label(camera, size, 'c-rate', `growth ${r.nmPerMin < 10 ? r.nmPerMin.toFixed(2) : r.nmPerMin.toFixed(0)} nm/min`, lp ? 'LPCVD · wafers standing' : 'APCVD · tilted susceptor', [60, 4, 12], 'right'),
      label(camera, size, 'c-in', 'gas in', `${f.P >= 100 ? f.P.toFixed(0) : f.P.toPrecision(2)} torr`, [-78, 10, 0], 'side'),
    ])
  })
  return (
    <>
      <Inspectable node="cvd-tube" fit={1.2}>
        <mesh rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[16, 16, 160, 48, 1, true, Math.PI * 0.15, Math.PI * 1.7]} />
          <meshPhysicalNodeMaterial color="#e9f0f3" roughness={0.05} transmission={0.7} transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      </Inspectable>
      <Inspectable node="cvd-heater" fit={1.3}>
        {Array.from({ length: 14 }, (_, i) => (
          <mesh key={i} position={[-65 + i * 10, 0, 0]} rotation-y={Math.PI / 2} material={glow}>
            <torusGeometry args={[19, 0.9, 8, 40, Math.PI * 1.6]} />
          </mesh>
        ))}
      </Inspectable>
      <Inspectable node="cvd-wafers" fit={1.6}>
        {lp
          ? Array.from({ length: 24 }, (_, i) => (
              <mesh key={i} position={[-46 + i * 4, 0, 0]} rotation-z={Math.PI / 2}>
                <cylinderGeometry args={[10, 10, 0.4, 40]} />
                <meshStandardNodeMaterial color="#6f7e8a" metalness={0.6} roughness={0.25} />
              </mesh>
            ))
          : (
            <group rotation-z={0.05}>
              <mesh position={[0, -8, 0]}>
                <boxGeometry args={[110, 3, 20]} />
                <meshStandardNodeMaterial color="#2c2f31" roughness={0.8} />
              </mesh>
              {[-40, -20, 0, 20, 40].map((x) => (
                <mesh key={x} position={[x, -6.3, 0]}>
                  <cylinderGeometry args={[8, 8, 0.4, 40]} />
                  <meshStandardNodeMaterial color="#6f7e8a" metalness={0.6} roughness={0.25} />
                </mesh>
              ))}
            </group>
          )}
      </Inspectable>
      <Inspectable node="cvd-flow" fit={1.4}>
        <primitive object={gas.im} />
        <mesh position={[0, 0, 0]} visible={false}>
          <boxGeometry args={[150, 20, 20]} />
          <meshBasicNodeMaterial />
        </mesh>
      </Inspectable>
      <pointLight position={[0, 0, 0]} intensity={2000 * (rate.v > 0 ? 1 : 0)} distance={90} color="#ff8a3a" />
    </>
  )
}

function Plasma() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const mode = useAtlas((s) => s.films.plasma)
  const sputter = mode !== 'pecvd'
  const glowMat = useMemo(() => new THREE.MeshBasicNodeMaterial({ color: '#d98af0', transparent: true, opacity: 0.45, depthWrite: false }), [])
  const ions = useMemo(() => tracers(160, 7), [])
  const o = useMemo(() => new THREE.Object3D(), [])
  const t = useRef(0)
  useFrame((_, dt) => {
    const st = useAtlas.getState()
    t.current += st.reducedMotion ? 0 : dt
    glowMat.opacity = 0.35 + 0.08 * Math.sin(t.current * 13) + (st.films.plasma === 'magnetron' ? 0.1 : 0)
    ions.lanes.forEach(([u, w, ph], i) => {
      const p = (ph + t.current * 0.6) % 1
      const r = 26 * Math.sqrt(u)
      const a = w * Math.PI * 2
      // sputter: ions rise to the target, atoms fall to the wafers; PECVD: radicals drift down
      const up = sputter && i % 2 === 0
      const y = up ? 2 + p * 26 : 28 - p * 26
      const rr = st.films.plasma === 'magnetron' && up ? 10 + 8 * Math.sin(a * 2) : r
      o.position.set(rr * Math.cos(a), y, rr * Math.sin(a))
      o.updateMatrix()
      ions.im.setMatrixAt(i, o.matrix)
    })
    ions.im.instanceMatrix.needsUpdate = true
    if (st.quiz) return publish([])
    const name = { pecvd: 'PECVD · 13.56 MHz', dc: 'DC sputtering · −(100–300) V', rf: 'RF sputtering', magnetron: 'magnetron sputtering · ~10⁻³ Torr' }[st.films.plasma]
    publish([
      label(camera, size, 'p-mode', name, sputter ? 'Ar⁺ ions hit the target; atoms coat the wafers' : 'radicals deposit at 200–400 °C', [0, 40, 0], 'top'),
      label(camera, size, 'p-sheath', 'sheath (dark space)', 'ions accelerate across it', [32, 2.5, 0], 'right'),
    ])
  })
  return (
    <>
      <mesh position={[0, 15, 0]} raycast={() => null}>
        <cylinderGeometry args={[40, 40, 44, 48, 1, true, Math.PI * 0.2, Math.PI * 1.5]} />
        <meshStandardNodeMaterial color="#8a949a" metalness={0.6} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      <Inspectable node="rf-electrode" fit={1.4}>
        <mesh position={[0, -1, 0]}>
          <cylinderGeometry args={[30, 30, 2, 48]} />
          <meshStandardNodeMaterial color="#3a3f43" metalness={0.7} roughness={0.3} />
        </mesh>
        {!sputter && (
          <mesh position={[0, 31, 0]}>
            <cylinderGeometry args={[30, 30, 2, 48]} />
            <meshStandardNodeMaterial color="#3a3f43" metalness={0.7} roughness={0.3} />
          </mesh>
        )}
      </Inspectable>
      {sputter && (
        <Inspectable node="sputter-target" fit={2}>
          <mesh position={[0, 31, 0]}>
            <cylinderGeometry args={[26, 26, 3, 48]} />
            <meshStandardNodeMaterial color="#b9c0c6" metalness={0.9} roughness={0.25} />
          </mesh>
        </Inspectable>
      )}
      {mode === 'magnetron' && (
        <Inspectable node="magnetron" fit={2}>
          {[10, 20].map((r) => (
            <mesh key={r} position={[0, 34, 0]} rotation-x={Math.PI / 2}>
              <torusGeometry args={[r, 1.4, 8, 48]} />
              <meshStandardNodeMaterial color="#b0503c" metalness={0.5} roughness={0.4} />
            </mesh>
          ))}
        </Inspectable>
      )}
      {[-16, 0, 16].map((x) => (
        <mesh key={x} position={[x, 0.3, 0]} raycast={() => null}>
          <cylinderGeometry args={[6, 6, 0.6, 32]} />
          <meshStandardNodeMaterial color="#6f7e8a" metalness={0.6} roughness={0.25} />
        </mesh>
      ))}
      <Inspectable node="plasma-glow" fit={1.5}>
        <mesh position={[0, 15, 0]} material={glowMat}>
          <cylinderGeometry args={[27, 27, 20, 48]} />
        </mesh>
        <primitive object={ions.im} />
      </Inspectable>
      <pointLight position={[0, 15, 0]} intensity={2500} distance={80} color="#d98af0" />
    </>
  )
}

function Evaporator() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const ebeam = useAtlas((s) => s.films.ebeam)
  const logP = useAtlas((s) => s.films.logP)
  const mfp = meanFreePath(Math.pow(10, logP)) * 100 // cm
  const ballistic = mfp > 60
  // vapour rays: straight when ballistic, scattered (zig-zag) otherwise
  const rays = useMemo(() => {
    const r = rand(9)
    const pts: number[] = []
    for (let i = 0; i < 40; i++) {
      const th = (r() - 0.5) * 1.2
      const ph = r() * Math.PI * 2
      let p = new THREE.Vector3(0, 4, 0)
      const dir = new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph))
      const steps = ballistic ? 1 : Math.max(2, Math.min(30, Math.round(50 / Math.max(mfp, 1.5))))
      for (let k = 0; k < steps; k++) {
        const len = ballistic ? 48 : Math.min(48 / steps * 2, mfp)
        const q = p.clone().addScaledVector(dir, len)
        pts.push(p.x, p.y, p.z, q.x, q.y, q.z)
        p = q
        if (!ballistic) dir.set(r() - 0.5, r() - 0.2, r() - 0.5).normalize()
        if (p.y > 50) break
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return g
  }, [ballistic, mfp])
  useFrame(() => {
    if (useAtlas.getState().quiz) return publish([])
    publish([
      label(camera, size, 'e-p', `P = 10^${logP} Torr`, `mean free path ${mfp >= 100 ? (mfp / 100).toPrecision(2) + ' m' : mfp.toPrecision(2) + ' cm'}`, [30, 40, 0], 'right'),
      label(camera, size, 'e-s', ebeam ? 'e-beam hearth' : 'hot W boat', ballistic ? 'atoms fly straight: a point source' : 'atoms scatter off the gas', [0, 4, 0], 'bottom'),
    ])
  })
  return (
    <>
      <Inspectable node="bell-jar" fit={1.2}>
        <mesh position={[0, 30, 0]}>
          <sphereGeometry args={[42, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalNodeMaterial color="#e9f0f3" roughness={0.05} transmission={0.7} transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 15, 0]}>
          <cylinderGeometry args={[42, 42, 30, 40, 1, true]} />
          <meshPhysicalNodeMaterial color="#e9f0f3" roughness={0.05} transmission={0.7} transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 52, 0]}>
          <sphereGeometry args={[30, 32, 8, 0, Math.PI * 2, 0, 0.7]} />
          <meshStandardNodeMaterial color="#8a949a" metalness={0.7} roughness={0.3} side={THREE.DoubleSide} />
        </mesh>
      </Inspectable>
      <Inspectable node="evap-source" fit={4}>
        <mesh position={[0, 2, 0]}>
          <boxGeometry args={[8, 1.5, 3]} />
          <meshStandardNodeMaterial color="#ffd27a" emissive="#ff8a1a" emissiveIntensity={1.2} />
        </mesh>
        {ebeam && (
          <mesh position={[6, 2, 0]} rotation-z={Math.PI / 2}>
            <torusGeometry args={[6, 0.4, 8, 32, Math.PI * 1.3]} />
            <meshBasicNodeMaterial color="#9fd8ff" />
          </mesh>
        )}
      </Inspectable>
      <lineSegments geometry={rays} raycast={() => null}>
        <lineBasicNodeMaterial color="#f39477" transparent opacity={0.7} />
      </lineSegments>
      <mesh position={[0, -1, 0]} raycast={() => null}>
        <cylinderGeometry args={[46, 46, 2, 48]} />
        <meshStandardNodeMaterial color="#4b5258" metalness={0.7} roughness={0.35} />
      </mesh>
    </>
  )
}

/** a trench (width 10, depth = 10·aspect) and its film, extruded into 3D */
function Coverage() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const f = useAtlas((s) => s.films)
  const cov = stepCoverage(f.method, f.aspect, f.Sc)
  const W = 10
  const D = W * f.aspect
  const T0 = 2.4
  const shapes = useMemo(() => {
    const sub = new THREE.Shape()
    sub.moveTo(-30, -D - 8)
    sub.lineTo(30, -D - 8)
    sub.lineTo(30, 0)
    sub.lineTo(W / 2, 0)
    sub.lineTo(W / 2, -D)
    sub.lineTo(-W / 2, -D)
    sub.lineTo(-W / 2, 0)
    sub.lineTo(-30, 0)
    sub.closePath()
    const film = new THREE.Shape()
    const ts = T0 * cov.side
    const tb = T0 * cov.bottom
    const oh = T0 * cov.overhang
    film.moveTo(-30, 0)
    film.lineTo(-W / 2, 0)
    film.lineTo(-W / 2, -D)
    film.lineTo(W / 2, -D)
    film.lineTo(W / 2, 0)
    film.lineTo(30, 0)
    film.lineTo(30, T0)
    film.lineTo(W / 2 - oh, T0)
    film.lineTo(W / 2 - Math.max(ts, oh * 0.6), -D * 0.25)
    film.lineTo(W / 2 - ts, -D + tb)
    film.lineTo(-W / 2 + ts, -D + tb)
    film.lineTo(-W / 2 + Math.max(ts, oh * 0.6), -D * 0.25)
    film.lineTo(-W / 2 + oh, T0)
    film.lineTo(-30, T0)
    film.closePath()
    const opts = { depth: 20, bevelEnabled: false }
    return { sub: new THREE.ExtrudeGeometry(sub, opts), film: new THREE.ExtrudeGeometry(film, opts) }
  }, [D, cov.side, cov.bottom, cov.overhang])
  useFrame(() => {
    if (useAtlas.getState().quiz) return publish([])
    publish([
      label(camera, size, 'v-side', `sidewall ${Math.round(cov.side * 100)} %`, 'of the top thickness', [W / 2, -D / 2, 20], 'right'),
      label(camera, size, 'v-bot', `bottom ${Math.round(cov.bottom * 100)} %`, cov.overhang > 0.4 ? 'overhang may seal a void' : undefined, [0, -D, 20], 'bottom'),
    ])
  })
  return (
    <group position={[0, D / 2, -10]}>
      <mesh geometry={shapes.sub} raycast={() => null}>
        <meshStandardNodeMaterial color="#9fb3c4" roughness={0.6} />
      </mesh>
      <Inspectable node="trench-film" fit={1.3}>
        <mesh geometry={shapes.film}>
          <meshStandardNodeMaterial color={f.method === 'cvd' ? '#e8b65a' : f.method === 'sputter' ? '#c9ced2' : '#d88a4a'} roughness={0.35} metalness={0.4} />
        </mesh>
      </Inspectable>
    </group>
  )
}

function Barrel() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const susc = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    const st = useAtlas.getState()
    if (susc.current && !st.reducedMotion) susc.current.rotation.y += dt * 0.3
    if (st.quiz) return publish([])
    publish([
      label(camera, size, 'b-gas', 'HSiCl₃ + H₂ → Si + 3HCl', `${st.epi.T} °C · ${st.epi.rp ? 'reduced pressure' : '100 Torr to 1 atm'}`, [0, 62, 0], 'top'),
      label(camera, size, 'b-epi', 'lightly doped epi', `on an ${st.epi.sub === 'B' ? 'p⁺' : 'n⁺'} substrate`, [62, 6, 0], 'right'),
    ])
  })
  return (
    <>
      <Inspectable node="barrel" fit={1.2}>
        <group ref={susc}>
          <mesh position={[0, 25, 0]}>
            <cylinderGeometry args={[16, 20, 44, 6]} />
            <meshStandardNodeMaterial color="#2c2f31" roughness={0.7} />
          </mesh>
          {Array.from({ length: 6 }, (_, i) =>
            [12, 25, 38].map((y) => {
              const a = (i / 6) * Math.PI * 2 + Math.PI / 6
              return (
                <mesh key={`${i}-${y}`} position={[Math.cos(a) * 17.8, y, Math.sin(a) * 17.8]} rotation-y={-a + Math.PI / 2} rotation-x={-0.08}>
                  <cylinderGeometry args={[5, 5, 0.4, 32]} />
                  <meshStandardNodeMaterial color="#6f7e8a" metalness={0.6} roughness={0.25} />
                </mesh>
              )
            }),
          )}
        </group>
        <mesh position={[0, 26, 0]}>
          <cylinderGeometry args={[27, 27, 56, 40, 1, true, 0.4, Math.PI * 1.6]} />
          <meshPhysicalNodeMaterial color="#e9f0f3" roughness={0.05} transmission={0.7} transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
        {Array.from({ length: 10 }, (_, i) => (
          <mesh key={i} position={[Math.cos(0.4 + i * 0.5) * 31, 26, Math.sin(0.4 + i * 0.5) * 31]}>
            <cylinderGeometry args={[0.8, 0.8, 50, 8]} />
            <meshStandardNodeMaterial color="#fff2d0" emissive="#ffb04a" emissiveIntensity={1.4} />
          </mesh>
        ))}
      </Inspectable>
      <Inspectable node="epi-layer" fit={2}>
        <mesh position={[62, 0, 0]}>
          <boxGeometry args={[20, 6, 12]} />
          <meshStandardNodeMaterial color="#c98a5a" roughness={0.6} />
        </mesh>
        <mesh position={[62, 4.5, 0]}>
          <boxGeometry args={[20, 3, 12]} />
          <meshStandardNodeMaterial color="#8ea2b2" roughness={0.6} />
        </mesh>
      </Inspectable>
      <pointLight position={[0, 25, 30]} intensity={4000} distance={120} color="#ffb04a" />
    </>
  )
}

export default function DepositionLayer() {
  const tab = useAtlas((s) => s.tab)
  useDive('cleanroom', null, { home: tab === 'coverage' ? [0, 0, 0] : tab === 'siepi' ? [25, 25, 0] : [0, tab === 'cvd' ? 2 : 18, 0] })
  return (
    <>
      <StudioLights scale={6} />
      {tab === 'plasma' ? <Plasma /> : tab === 'pvd' ? <Evaporator /> : tab === 'coverage' ? <Coverage /> : tab === 'siepi' ? <Barrel /> : <Cvd />}
      <mesh rotation-x={-Math.PI / 2} position={[0, -30, 0]}>
        <circleGeometry args={[800, 48]} />
        <meshStandardNodeMaterial color="#25292c" roughness={1} />
      </mesh>
      <InspectSync />
      <ClearOnMiss radius={6000} />
    </>
  )
}
