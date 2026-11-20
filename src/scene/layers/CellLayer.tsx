import * as THREE from 'three/webgpu'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { inverterProcess } from '../../chapters/cmos/recipe'
import { MESH_OPTS } from '../../chapters/cmos/display'
import { resolveComponents, CONTENT_BY_ID } from '../../chapters/cmos/content'
import { mesh } from '../../sim/mesher'
import { useAtlas } from '../../state/store'
import { CellModel, type CellView } from '../CellModel'
import { gridMaterial, matUniforms } from '../materials'
import { Spring, SPRINGS } from '../spring'
import { StudioLights } from '../Lighting'
import { selection } from '../Pipeline'
import { rig } from '../rig'
import { transition } from '../transition'
import { cellRuntime } from '../cellRuntime'

/**
 * Layer 3: the inverter cell, generated from the six masks and the recipe.
 * The model shown is the finished cell, or the fab snapshot at the current
 * timeline position. Each connected component is a pickable object.
 */
/** objects that sit under the field oxide and the metal */
const BURIED = new Set(['substrate', 'nwell', 'nmos-source', 'nmos-drain', 'pmos-source', 'pmos-drain', 'substrate-tap', 'well-tap', 'poly-gate', 'gate-oxide', 'contact'])

export default function CellLayer() {
  const process = useMemo(() => inverterProcess(), [])
  const model = useMemo(() => new CellModel(), [])
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const grid = useMemo(() => gridMaterial(), [])
  const lastKey = useRef('')

  // rebuild the cell whenever what we show changes (polled per frame so fab
  // playback and section dragging never round-trip through React)
  const xray = useRef(new Spring(0, SPRINGS.ui))
  useFrame((_, dt) => {
    const st = useAtlas.getState()
    // buried objects: fade the wiring and field oxide that hide them
    xray.current.target = st.focus && BURIED.has(st.focus) ? 1 : st.hover && BURIED.has(st.hover) ? 0.45 : 0
    matUniforms.xray.value = xray.current.step(dt, st.reducedMotion)
    const rt = cellRuntime
    const s = st.view === 'fab' ? rt.fabPos : process.length - 1
    const view: CellView = {
      clip: st.view === 'section' ? { axis: st.section.axis, offset: rt.sectionOffset } : null,
      gap: st.view === 'section' ? rt.gap : 0,
      explode: rt.explode,
      xray: false,
    }
    const key = `${s.toFixed(4)}|${view.clip ? view.clip.axis + view.clip.offset.toFixed(3) : '-'}|${view.gap.toFixed(3)}|${view.explode.toFixed(3)}`
    if (key === lastKey.current) return
    lastKey.current = key
    const m = process.at(s)
    const res = mesh(m, MESH_OPTS)
    const names = resolveComponents(res)
    model.update(res, names, view)
    rt.res = res
    rt.model = model
    refreshSelection()
  })

  const refreshSelection = () => {
    const st = useAtlas.getState()
    selection.set('hover', st.hover && st.hover !== st.focus ? model.meshesFor(st.hover) : [])
    selection.set('focus', model.meshesFor(st.focus))
  }

  useEffect(() => {
    const unsub = useAtlas.subscribe((s, p) => {
      if (s.hover !== p.hover || s.focus !== p.focus) refreshSelection()
      if (s.focus !== p.focus) {
        if (s.focus && CONTENT_BY_ID[s.focus]?.layer === 'cell') {
          const b = model.boundsFor(s.focus)
          if (b) rig.focusBox(b, camera.fov, size.width / size.height, { padding: 1.6, minDist: 34 })
        } else if (!s.focus && p.focus) rig.goHome()
      }
    })
    // initial focus from a deep link
    const f = useAtlas.getState().focus
    if (f) setTimeout(() => {
      const b = model.boundsFor(f)
      if (b) rig.focusBox(b, camera.fov, size.width / size.height, { padding: 1.6, minDist: 34 })
      refreshSelection()
    }, 50)
    rig.setHome({ target: [0, -2, 0] })
    rig.goHome()
    rig.handlers = {
      onDiveIn: () => {
        const st = useAtlas.getState()
        const c = st.focus ? CONTENT_BY_ID[st.focus] : null
        const device = c?.dive?.device ?? (rig.target.x.value < -3 ? 'nmos' : 'pmos')
        const via: [number, number, number] = device === 'nmos' ? [-15, 0.5, 0] : [9, 0.5, 0]
        void transition.go('transistor', { device, via })
      },
      onSurface: () => void transition.go('die'),
    }
    return () => {
      unsub()
      rig.setHome({ target: [0, -2, 0] })
    rig.goHome()
    rig.handlers = {}
      selection.set('hover', [])
      selection.set('focus', [])
      model.dispose()
    }
  }, [model, camera, size])

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (rig.owner) return
    e.stopPropagation()
    const id = (e.object.userData.content as string | null) ?? null
    if (useAtlas.getState().hover !== id) useAtlas.getState().set({ hover: id })
  }
  const onOut = () => {
    if (useAtlas.getState().hover) useAtlas.getState().set({ hover: null })
  }
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 5 || rig.owner === 'orbit' || rig.owner === 'section') return
    e.stopPropagation()
    const id = (e.object.userData.content as string | null) ?? null
    if (id) useAtlas.getState().set({ focus: id })
  }

  return (
    <>
      <StudioLights />
      <primitive object={model.group} onPointerMove={onMove} onPointerOut={onOut} onClick={onClick} />
      <mesh rotation-x={-Math.PI / 2} position={[0, -8.05, 0]} material={grid} raycast={() => null}>
        <planeGeometry args={[220, 220]} />
      </mesh>
      <BackgroundClick />
    </>
  )
}

/** clicking empty space clears the focus */
function BackgroundClick() {
  return (
    <mesh
      position={[0, 0, -200]}
      onClick={(e) => {
        if (e.delta > 5 || rig.owner) return
        if (useAtlas.getState().focus) useAtlas.getState().set({ focus: null })
      }}
    >
      <sphereGeometry args={[400, 8, 8]} />
      <meshBasicNodeMaterial side={THREE.BackSide} colorWrite={false} depthWrite={false} />
    </mesh>
  )
}
