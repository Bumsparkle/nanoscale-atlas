import * as THREE from 'three/webgpu'
import { useFrame, useThree } from '@react-three/fiber'
import { StudioLights } from '../Lighting'
import { ClearOnMiss, Inspectable, InspectSync } from '../Inspectable'
import { label, publish, useDive, useTabHome } from './shared'
import { useAtlas } from '../../state/store'
import { MAT, SAMPLE, spans } from '../../chapters/nano/hetero'

/**
 * Chapter 7 (Topic 8 slides 9, 14): the heterostructure, 1 unit = 1 nm.
 * - stack: every layer a slab of its material, thickness to scale;
 * - tem: the same cross-section in TEM contrast, heavier (In-rich) layers
 *   darker, with a 50 nm scale bar (slide 14's images).
 * Scroll in to the band diagram.
 */
/** TEM-like grey: layers with heavier atoms scatter more and look darker (illustrative) */
export const TEM_GREY: Record<string, string> = {
  GaAs: '#8e8e8e', AlGaAs: '#b8b8b8', InGaAs: '#4a4a4a', InGaAs40: '#3a3a3a', InAs: '#2a2a2a', GaSb: '#5a5a5a', InP: '#7a7a7a', InGaAsP: '#4f4f4f', InAlAs: '#9a9a9a',
}
const NODE_OF: Record<string, string> = { substrate: 'hs-substrate', buffer: 'hs-substrate', barrier: 'hs-barrier', cladding: 'hs-barrier', spacer: 'hs-barrier', well: 'hs-well', dots: 'hs-well', cap: 'hs-cap' }

export default function HeteroLayer() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const tab = useAtlas((s) => s.tab) || 'stack'
  const sampleId = useAtlas((s) => s.nano.sample)
  const h = SAMPLE[sampleId] ?? SAMPLE.qw
  const sp = spans(h)
  const total = sp[sp.length - 1].z1
  const tem = tab === 'tem'
  useDive('qsample', 'qbands', { home: [0, total / 2, 0] })
  useTabHome('hetero', tem ? { target: [30, total / 2, 0], polar: Math.PI / 2 - 0.02, azimuth: 0, dist: total * 2.4 + 90 } : { target: [30, total / 2, 0], polar: 1.3, azimuth: 0.5, dist: total * 2.6 + 90 }, `${tab}|${total}`)
  useFrame(() => {
    if (useAtlas.getState().quiz) return publish([])
    publish(sp.filter((l) => l.role !== 'substrate').map((l, i) =>
      label(camera, size, `h-${i}`, `${MAT[l.mat].name} · ${l.nm} nm`, `${l.role} · Eg ${MAT[l.mat].Eg.toFixed(2)} eV`, [62, (l.z0 + l.z1) / 2, tem ? 1 : 30], 'right'),
    ).concat(tem ? [label(camera, size, 'h-bar', '50 nm', 'scale bar', [-25, -6, 1], 'bottom')] : []))
  })
  // group layers by inspectable role so each role is one clickable object
  const roles = [...new Set(sp.map((l) => NODE_OF[l.role]))]
  return (
    <>
      <StudioLights scale={3} />
      {roles.map((node) => (
        <Inspectable key={node} node={node} fit={2}>
          {sp.filter((l) => NODE_OF[l.role] === node).map((l, i) => (
            <mesh key={i} position={[0, (l.z0 + l.z1) / 2, 0]}>
              <boxGeometry args={[120, l.nm, tem ? 1 : 60]} />
              {tem ? <meshBasicNodeMaterial color={TEM_GREY[l.mat] ?? '#888'} /> : <meshStandardNodeMaterial color={MAT[l.mat].col} roughness={0.45} />}
            </mesh>
          ))}
        </Inspectable>
      ))}
      {tem && (
        <group position={[-50, -6, 1]} userData={{ scaleBar: '50 nm' }}>
          <mesh position={[25, 0, 0]}>
            <boxGeometry args={[50, 1.2, 0.2]} />
            <meshBasicNodeMaterial color="#111" />
          </mesh>
        </group>
      )}
      {tem && <mesh position={[0, total / 2, -1]}><planeGeometry args={[150, total + 30]} /><meshBasicNodeMaterial color="#cfcfcf" side={THREE.DoubleSide} /></mesh>}
      <InspectSync />
      <ClearOnMiss radius={4000} />
    </>
  )
}
