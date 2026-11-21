import { SCENE } from './sceneTheme'
import * as THREE from 'three/webgpu'
import { Canvas, extend, useFrame, useThree, type ThreeToJSXElements } from '@react-three/fiber'
import { Suspense, useEffect, useRef } from 'react'
import { live, useAtlas } from '../state/store'
import { rig } from './rig'
import { Spring, SPRINGS } from './spring'
import { transition } from './transition'
import { LayerStack } from './LayerStack'
import { Pipeline } from './Pipeline'
import { LAYER_BY_ID } from '../chapters/cmos/layers'
import { BOOT } from '../state/url'

declare module '@react-three/fiber' {
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}
extend(THREE as never)


/** Drives the camera rig and publishes live scale + fps. */
function RigDriver() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const gl = useThree((s) => s.gl)
  const setDpr = useThree((s) => s.setDpr)
  const reduced = useAtlas((s) => s.reducedMotion)
  const frames = useRef({ t: 0, n: 0, slow: 0 })
  const film = useRef(new Spring(0, SPRINGS.camera))
  useEffect(() => {
    rig.reduced = reduced
  }, [reduced])

  useFrame((_, dt) => {
    if (!useAtlas.getState().boot.frame && frames.current.n > 8) useAtlas.setState((s) => ({ boot: { ...s.boot, frame: true } }))
    // keep the focused object centred in the space left of the inspect panel
    const st = useAtlas.getState()
    const layoutView = st.view === 'layout' && st.layer === 'cell'
    const desktop = size.width > 720
    const panelOpen = ((!!st.focus && st.mode === 'explore') || layoutView) && desktop
    // lesson / revise panel on the left pushes the subject right
    const learnPanel = st.mode !== 'explore' && desktop && !layoutView
    // the spring runs on the shift as a fraction of the screen width; three.js applies
    // filmOffset at the near plane independent of the field of view, so convert it
    // with tan(fov/2), or the narrow Layout-view lens would throw the cell off-screen
    film.current.target = ((panelOpen ? (layoutView ? 220 : 210) : 0) - (learnPanel ? 215 : 0)) / size.width
    const frac = film.current.step(dt, st.reducedMotion)
    const aspect = size.width / size.height
    // left edge shift = frac × frustum width; filmOffset acts as near·offset / (35·min(aspect, 1))
    camera.filmOffset = 35 * Math.min(aspect, 1) * frac * 2 * Math.tan((camera.fov * Math.PI) / 360) * aspect
    rig.setAspect(size.width / size.height)
    rig.update(dt, camera)
    transition.setViewport(size.height, camera.fov)
    live.metresPerPixel = rig.metresPerPixel(camera, size.height)
    // fps + adaptive resolution: reduce quality, never content
    const f = frames.current
    f.t += dt
    f.n++
    if (f.t > 1) {
      live.fps = f.n / f.t
      const dpr = gl.getPixelRatio()
      if (live.fps < 45 && dpr > 1) {
        f.slow++
        if (f.slow >= 2) setDpr(Math.max(1, dpr - 0.5))
      } else f.slow = 0
      live.dpr = gl.getPixelRatio()
      f.t = 0
      f.n = 0
    }
  })
  return null
}

/** Orbit / pan / zoom from raw pointer + wheel on the canvas element. */
function Input() {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  useEffect(() => {
    const el = gl.domElement
    let down: { x: number; y: number; id: number; button: number; moved: boolean } | null = null
    const pointers = new Map<number, { x: number; y: number }>()
    let pinch = 0
    const onDown = (e: PointerEvent) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()]
        pinch = Math.hypot(a.x - b.x, a.y - b.y)
      }
      down = { x: e.clientX, y: e.clientY, id: e.pointerId, button: e.button, moved: false }
    }
    const onMove = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId)
      if (!prev) return
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()]
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        if (pinch > 0) rig.zoom(pinch / d)
        pinch = d
        return
      }
      if (!down) return
      const dx = e.clientX - prev.x
      const dy = e.clientY - prev.y
      if (!down.moved && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) {
        down.moved = true
        if (!rig.owner) rig.owner = 'orbit'
      }
      if (!down.moved || rig.owner !== 'orbit') return
      if (down.button === 2 || e.shiftKey) rig.pan(dx, dy, camera)
      else rig.orbit(dx, dy)
    }
    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId)
      if (pointers.size < 2) pinch = 0
      if (pointers.size === 0) {
        down = null
        // release on next tick so click handlers can still read owner
        setTimeout(() => (rig.owner = null), 0)
      }
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const k = e.deltaMode === 1 ? 0.05 : 0.0015
      rig.zoom(Math.exp(e.deltaY * k))
    }
    const onContext = (e: Event) => e.preventDefault()
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('contextmenu', onContext)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('contextmenu', onContext)
    }
  }, [gl, camera])
  return null
}

export function Stage() {
  const setRenderer = (backend: 'webgpu' | 'webgl2' | 'failed', detail?: string) =>
    useAtlas.getState().set({ renderer: { backend, detail } })

  return (
    <Canvas
      className="stage"
      dpr={[1, 2]}
      camera={{ fov: 32, position: [0, 40, 80], near: 0.1, far: 2000 }}
      flat={false}
      gl={async (props) => {
        const renderer = new THREE.WebGPURenderer({
          ...(props as object),
          antialias: true,
          alpha: false,
          forceWebGL: BOOT.forceWebGL,
        } as never)
        try {
          await renderer.init()
        } catch (err) {
          setRenderer('failed', String(err))
          throw err
        }
        const isGPU = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend === true
        setRenderer(isGPU ? 'webgpu' : 'webgl2', isGPU ? 'WebGPU backend' : 'WebGL 2 fallback backend')
        useAtlas.setState((s) => ({ boot: { ...s.boot, gpu: true } }))
        renderer.toneMapping = THREE.AgXToneMapping
        renderer.toneMappingExposure = SCENE.exposure
        renderer.shadowMap.enabled = false
        return renderer as never
      }}
      onCreated={(state) => {
        ;(window as unknown as { __three: unknown }).__three = state
        rig.setLayer(LAYER_BY_ID[useAtlas.getState().layer])
      }}
    >
      <RigDriver />
      <Input />
      <Suspense fallback={null}>
        <LayerStack />
      </Suspense>
      <Pipeline />
    </Canvas>
  )
}
