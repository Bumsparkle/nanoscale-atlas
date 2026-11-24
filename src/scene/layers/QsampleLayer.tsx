import * as THREE from 'three/webgpu'
import { useFrame, useThree } from '@react-three/fiber'
import { StudioLights } from '../Lighting'
import { ClearOnMiss, Inspectable, InspectSync } from '../Inspectable'
import { label, publish, useDive, useTabHome } from './shared'
import { useApp } from '../../state/store'
import { MAT, SAMPLE, spans } from '../../chapters/nano/hetero'
import { regime, SCALE_OBJECTS } from '../../chapters/nano/scale'
import { P } from '../../theme/scene'

/**
 * Chapter 7 (Topic 8 slides 2–3): the grown sample.
 * - scale: from a tennis ball to a water molecule on one log axis
 *   (slide 2), with the 1–100 nm band where properties change and slide 3's
 *   four regimes (bulk, wavelength of light, de Broglie wavelength, atom);
 * - sample: a 10 mm piece of the wafer, its epitaxial layers drawn at the
 *   cleaved edge. Scroll in to the layers.
 */
const X = (nm: number) => Math.log10(nm) * 14 - 42

function Scale() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const logSize = useApp((s) => s.nano.logSize)
  const nm = Math.pow(10, logSize + 9)
  const r = regime(nm)
  useFrame(() => {
    if (useApp.getState().quiz) return publish([])
    publish([
      ...SCALE_OBJECTS.map((o) => label(camera, size, `s-${o.id}`, o.name, o.nm >= 1e6 ? `${o.nm / 1e6} mm` : o.nm >= 1e3 ? `${o.nm / 1e3} µm` : `${o.nm} nm`, [X(o.nm), 10, 0], 'top')),
      label(camera, size, 's-you', nm >= 1e6 ? `${(nm / 1e6).toPrecision(2)} mm` : nm >= 1e3 ? `${(nm / 1e3).toPrecision(2)} µm` : `${nm.toPrecision(2)} nm`, `${r.name}: ${r.note}`, [X(nm), -8, 6], 'bottom'),
    ])
  })
  const shape = (id: string) => {
    switch (id) {
      case 'water': return <mesh><sphereGeometry args={[1.6, 16, 12]} /><meshStandardNodeMaterial color={P.sample.water} roughness={0.2} /></mesh>
      case 'glucose': return <group>{[[0, 0], [2, 1], [-1.6, 1.4], [1, -1.8]].map(([x, y], i) => <mesh key={i} position={[x, y, 0]}><sphereGeometry args={[1, 12, 8]} /><meshStandardNodeMaterial color={i % 2 ? P.signal.bad : P.sample.glucose} /></mesh>)}</group>
      case 'antibody': return <group>{[[0, -1.5, 0, 0], [-1.3, 1.2, 0, 0.7], [1.3, 1.2, 0, -0.7]].map(([x, y, z, rz], i) => <mesh key={i} position={[x, y, z]} rotation-z={rz}><capsuleGeometry args={[0.6, 2.6, 4, 8]} /><meshStandardNodeMaterial color={P.sample.antibody} /></mesh>)}</group>
      case 'virus': return <mesh><icosahedronGeometry args={[2.4, 1]} /><meshStandardNodeMaterial color={P.sample.virus} flatShading /></mesh>
      case 'bacteria': return <mesh rotation-z={0.6}><capsuleGeometry args={[1.2, 3.6, 6, 12]} /><meshStandardNodeMaterial color={P.sample.bacteria} /></mesh>
      case 'cell': return <mesh><sphereGeometry args={[2.6, 20, 14]} /><meshStandardNodeMaterial color={P.sample.cell} roughness={0.6} /></mesh>
      case 'stop': return <mesh rotation-x={Math.PI / 2}><cylinderGeometry args={[1.2, 1.2, 0.3, 20]} /><meshStandardNodeMaterial color={P.obj.black} /></mesh>
      default: return <mesh><sphereGeometry args={[3, 24, 16]} /><meshStandardNodeMaterial color={P.sample.ball} roughness={0.9} /></mesh>
    }
  }
  return (
    <group>
      <Inspectable node="qs-scale" fit={1.2}>
        {/* the axis, ten orders of magnitude */}
        <mesh position={[X(1e3), 0, 0]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.3, 0.3, X(1e9) - X(0.05), 8]} />
          <meshStandardNodeMaterial color={P.obj.steel} />
        </mesh>
        {Array.from({ length: 11 }, (_, i) => (
          <mesh key={i} position={[X(Math.pow(10, i - 1)), 0, 0]}>
            <boxGeometry args={[0.3, 2.4, 0.3]} />
            <meshStandardNodeMaterial color={P.obj.ruler} />
          </mesh>
        ))}
        {SCALE_OBJECTS.map((o) => <group key={o.id} position={[X(o.nm), 5, 0]}>{shape(o.id)}</group>)}
      </Inspectable>
      <Inspectable node="qs-nanoband" fit={1.6}>
        <mesh position={[(X(1) + X(100)) / 2, 0, 0]}>
          <boxGeometry args={[X(100) - X(1), 1.6, 8]} />
          <meshStandardNodeMaterial color={P.signal.amber} transparent opacity={0.55} emissive={P.signal.amber} emissiveIntensity={0.3} />
        </mesh>
      </Inspectable>
      <mesh position={[X(nm), -3, 0]} raycast={() => null}>
        <coneGeometry args={[1.2, 2.6, 16]} />
        <meshBasicNodeMaterial color={P.signal.beam} />
      </mesh>
    </group>
  )
}

function Sample() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const sampleId = useApp((s) => s.nano.sample)
  const h = SAMPLE[sampleId] ?? SAMPLE.qw
  const sp = spans(h).filter((l) => l.role !== 'substrate')
  const top = sp.length ? sp[sp.length - 1].z1 - sp[0].z0 : 1
  const exag = 2 / top // the epi stack drawn 2 units (2 mm) tall at the edge: ×~2·10⁴
  useFrame(() => {
    if (useApp.getState().quiz) return publish([])
    publish([
      label(camera, size, 'p-piece', '10 mm piece of the wafer', 'GaAs substrate ~0.5 mm thick', [-6, 1, 6], 'side'),
      label(camera, size, 'p-edge', `${h.name}`, `${top} nm of epitaxial layers · drawn ×${(exag * 1e6).toPrecision(2)}`, [5, 4, 5.4], 'right'),
    ])
  })
  return (
    <group>
      <Inspectable node="qs-sample" fit={1.4}>
        <mesh position={[0, -0.25, 0]}>
          <boxGeometry args={[10, 0.5, 10]} />
          <meshStandardNodeMaterial color={P.obj.substrate} metalness={0.5} roughness={0.25} />
        </mesh>
      </Inspectable>
      <Inspectable node="qs-edge" fit={2}>
        {sp.map((l, i) => (
          <mesh key={i} position={[0, (l.z0 - sp[0].z0 + l.nm / 2) * exag, 5.05]}>
            <boxGeometry args={[10, Math.max(0.02, l.nm * exag), 0.1]} />
            <meshStandardNodeMaterial color={MAT[l.mat].col} roughness={0.4} />
          </mesh>
        ))}
      </Inspectable>
    </group>
  )
}

export default function QsampleLayer() {
  const tab = useApp((s) => s.tab) || 'scale'
  useDive('qmbe', 'hetero', { home: [0, 1, 0] })
  useTabHome('qsample', tab === 'scale' ? { target: [X(1e3) + 18, 2, 0], polar: 1.4, azimuth: 0.05, dist: 200 } : { target: [1.5, 1, 3], polar: 1.15, azimuth: 0.5, dist: 30 }, tab)
  return (
    <>
      <StudioLights scale={tab === 'scale' ? 5 : 1} />
      {tab === 'sample' ? <Sample /> : <Scale />}
      <mesh rotation-x={-Math.PI / 2} position={[0, -12, 0]}>
        <circleGeometry args={[600, 48]} />
        <meshStandardNodeMaterial color={P.stage.floor} roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <InspectSync />
      <ClearOnMiss radius={4000} />
    </>
  )
}
