import * as THREE from 'three/webgpu'
import { SCENE } from '../sceneTheme'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { overlay } from '../cellRuntime'
import { color, mix, texture, uv, float, uniform } from 'three/tsl'
import { MASKS } from '../../chapters/cmos/masks'
import { StudioLights } from '../Lighting'
import { Inspectable, InspectSync, ClearOnMiss } from '../Inspectable'
import { rig } from '../rig'
import { transition } from '../transition'

/**
 * Layer 2: one die (1 unit = 10 µm), 4 mm square, illustrative floorplan.
 * Near the target the surface switches to rows of standard cells drawn
 * from the inverter's own six masks, so the cell you dive into is the
 * same layout the simulator builds.
 */
const SIZE = 400
const THICK = 77.5 // 775 µm
export const CELL_AT: [number, number] = [38, 26] // target inverter (die units, x/z)
const CELL_W = 1.86 // 62λ × 0.3 µm = 18.6 µm
const CELL_H = 0.84 // 28λ

function floorplan() {
  const N = 2048
  const c = document.createElement('canvas')
  c.width = c.height = N
  const g = c.getContext('2d')!
  const s = N / SIZE
  g.fillStyle = '#1f2427'
  g.fillRect(0, 0, N, N)
  // pad ring: aluminium bond pads, 100 µm
  g.fillStyle = '#c9ced2'
  for (let i = 20; i < SIZE - 20; i += 18) {
    for (const [x, y] of [[i, 6], [i, SIZE - 16], [6, i], [SIZE - 16, i]]) g.fillRect(x * s, y * s, 10 * s, 10 * s)
  }
  // blocks
  const block = (x: number, y: number, w: number, h: number, fill: string, pitch: number, line: string) => {
    g.fillStyle = fill
    g.fillRect(x * s, y * s, w * s, h * s)
    g.strokeStyle = line
    g.lineWidth = 1
    for (let yy = y; yy < y + h; yy += pitch) {
      g.beginPath()
      g.moveTo(x * s, yy * s)
      g.lineTo((x + w) * s, yy * s)
      g.stroke()
    }
  }
  block(40, 40, 150, 120, '#2e353a', 2.2, '#3d464c') // SRAM-like array
  block(210, 40, 150, 120, '#2a3136', 1.68, '#384147') // logic rows
  block(40, 180, 320, 70, '#2b3237', 1.68, '#3a4349')
  block(40, 270, 140, 90, '#33393e', 3, '#454d53')
  block(200, 270, 160, 90, '#283035', 1.68, '#374046')
  // routing channels
  g.fillStyle = '#59636a'
  for (const y of [168, 262]) g.fillRect(40 * s, y * s, 320 * s, 2 * s)
  const t = new THREE.CanvasTexture(c)
  t.anisotropy = 8
  return t
}

/** rows of inverter cells drawn from the slide 28 masks */
function cellRows(cols: number, rows: number) {
  const lam = 3 // px per λ: 22 cells × 62λ × 3 ≈ 4 K, inside every GPU's texture limit
  const W = cols * 62 * lam
  const H = rows * 28 * lam
  const c = document.createElement('canvas')
  c.width = Math.ceil(W)
  c.height = Math.ceil(H)
  const g = c.getContext('2d')!
  g.fillStyle = '#3e464c'
  g.fillRect(0, 0, W, H)
  const colours: Record<string, string> = {
    nwell: '#4d6273', nplus: '#6f97b8', pplus: '#b08a62', poly: '#a2553f', contact: '#111', metal: 'rgba(205,212,222,0.78)',
  }
  for (let r = 0; r < rows; r++)
    for (let k = 0; k < cols; k++) {
      const ox = k * 62 * lam
      const oy = r * 28 * lam
      const flip = r % 2 === 1
      for (const m of MASKS) {
        g.fillStyle = colours[m.id]
        for (const q of m.rects) {
          const x0 = (q.x0 + 6) * lam
          const x1 = (q.x1 + 6) * lam
          let y0 = (q.y0 + 12) * lam
          let y1 = (q.y1 + 12) * lam
          if (flip) [y0, y1] = [28 * lam - y1, 28 * lam - y0]
          // clip rails to the cell height
          y0 = Math.max(0, y0)
          y1 = Math.min(28 * lam, y1)
          g.fillRect(ox + x0, oy + y0, x1 - x0, y1 - y0)
        }
      }
    }
  const t = new THREE.CanvasTexture(c)
  t.anisotropy = 8
  return t
}

function rectFrame(w: number, h: number, t: number) {
  const s = new THREE.Shape()
  s.moveTo(-w / 2, -h / 2).lineTo(w / 2, -h / 2).lineTo(w / 2, h / 2).lineTo(-w / 2, h / 2).lineTo(-w / 2, -h / 2)
  const hole = new THREE.Path()
  hole.moveTo(-w / 2 + t, -h / 2 + t).lineTo(-w / 2 + t, h / 2 - t).lineTo(w / 2 - t, h / 2 - t).lineTo(w / 2 - t, -h / 2 + t).lineTo(-w / 2 + t, -h / 2 + t)
  s.holes.push(hole)
  return new THREE.ShapeGeometry(s)
}

/** pulsing ring + callout so the target can be found from the rest view */
function Beacon() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const pulse = useMemo(() => uniform(0), [])
  const mat = useMemo(() => {
    const m = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false })
    m.colorNode = color('#f0b43c')
    m.opacityNode = float(0.9).sub(pulse.mul(0.9))
    return m
  }, [pulse])
  const ref = useRef<THREE.Mesh>(null)
  const clock = useRef(0)
  useFrame((_, dt) => {
    clock.current += dt
    const t = (clock.current * 0.6) % 1
    pulse.value = t
    const far = Math.min(1, Math.max(0, (rig.dist.value - 40) / 160))
    if (ref.current) {
      ref.current.scale.setScalar((4 + t * 18) * far + 0.001)
      ref.current.visible = far > 0.02
    }
    const v = new THREE.Vector3(CELL_AT[0], 0, CELL_AT[1]).project(camera)
    overlay.labels = far > 0.2 ? [{ id: 'die-target', text: 'this inverter', sub: '18.6 µm × 8.4 µm · zoom in', x: ((v.x + 1) / 2) * size.width, y: ((1 - v.y) / 2) * size.height, group: 'top', visible: v.z < 1 }] : []
    overlay.version = 4000 + (far > 0.2 ? 1 : 0)
  })
  useEffect(() => () => void ((overlay.labels = []), overlay.version++), [])
  return (
    <mesh ref={ref} material={mat} position={[CELL_AT[0], 0.1, CELL_AT[1]]} rotation-x={-Math.PI / 2} raycast={() => null} renderOrder={4}>
      <ringGeometry args={[0.92, 1, 48]} />
    </mesh>
  )
}

export default function DieLayer() {
  const top = useMemo(() => {
    const m = new THREE.MeshStandardNodeMaterial({ roughness: 0.4, metalness: 0.5 })
    m.colorNode = texture(floorplan(), uv())
    return m
  }, [])
  const side = useMemo(() => new THREE.MeshStandardNodeMaterial({ color: '#2a2f33', roughness: 0.7, metalness: 0.3 }), [])
  const near = useMemo(() => uniform(0), [])
  const detail = useMemo(() => {
    const m = new THREE.MeshStandardNodeMaterial({ roughness: 0.45, metalness: 0.45, transparent: true, depthWrite: false })
    m.colorNode = texture(cellRows(22, 48), uv())
    m.opacityNode = near
    return m
  }, [near])
  const frame = useMemo(() => {
    const m = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false })
    m.colorNode = color('#f0b43c')
    m.opacityNode = mix(float(0.9), float(0.6), near)
    return m
  }, [near])

  useFrame(() => {
    const d = rig.dist.value
    near.value = Math.min(1, Math.max(0, (180 - d) / 120))
  })

  useEffect(() => {
    rig.setHome({ target: [0, 0, 0] })
    rig.goHome()
    rig.handlers = {
      onDiveIn: () => void transition.go('cell', { via: [CELL_AT[0], 0.1, CELL_AT[1]] }),
      onSurface: () => void transition.go('wafer'),
    }
    return () => void (rig.handlers = {})
  }, [])

  const patchW = 22 * CELL_W
  const patchH = 48 * CELL_H
  // the target sits in one of the rows: column 11, row 24 of the patch
  const px = CELL_AT[0] - (11 + 0.5) * CELL_W + patchW / 2
  const pz = CELL_AT[1] - (24 + 0.5) * CELL_H + patchH / 2
  return (
    <>
      <StudioLights scale={6} />
      <Beacon />
      <Inspectable node="die" fit={1.1}>
        <mesh position={[0, -THICK / 2, 0]} material={[side, side, top, side, side, side]}>
          <boxGeometry args={[SIZE, THICK, SIZE]} />
        </mesh>
      </Inspectable>
      <Inspectable node="bond-pads" fit={1.15}>
        <mesh position={[0, 0.05, SIZE / 2 - 11]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[SIZE - 40, 10]} />
          <meshBasicNodeMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </Inspectable>
      <Inspectable node="cell-rows" fit={1.3} minDist={20}>
        <mesh material={detail} position={[px, 0.06, pz]} rotation-x={-Math.PI / 2} renderOrder={2}>
          <planeGeometry args={[patchW, patchH]} />
        </mesh>
      </Inspectable>
      <Inspectable node="inverter-instance" fit={3} minDist={7}>
        <mesh material={frame} geometry={rectFrame(CELL_W + 0.3, CELL_H + 0.3, 0.1)} position={[CELL_AT[0], 0.08, CELL_AT[1]]} rotation-x={-Math.PI / 2} renderOrder={3} />
      </Inspectable>
      <mesh position={[0, -THICK - 2, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[4000, 4000]} />
        <meshStandardNodeMaterial color={SCENE.floor} roughness={1} />
      </mesh>
      <InspectSync />
      <ClearOnMiss />
    </>
  )
}
