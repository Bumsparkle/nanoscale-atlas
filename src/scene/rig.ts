import * as THREE from 'three/webgpu'
import { LAYER_BY_ID, type LayerDef } from '../chapters/cmos/layers'
import { clamp, LogSpring, Spring, Spring3, SPRINGS } from './spring'

/**
 * Spring orbit camera. App state sets goals (layer rest pose, focused
 * object); pointer input nudges goals; springs carry the camera there.
 * Kept imperative and framework-free so the scene core can move to vanilla
 * three without touching it (brief: escape hatch).
 */
export interface DiveHandlers {
  /** called when the user zooms past the layer's min distance */
  onDiveIn?: () => void
  /** called when the user zooms past the layer's max distance */
  onSurface?: () => void
}

class CameraRig {
  target = new Spring3([0, 0, 0], SPRINGS.camera)
  polar = new Spring(1, SPRINGS.camera)
  azimuth = new Spring(0, SPRINGS.camera)
  dist = new LogSpring(50, SPRINGS.camera)
  /** field of view (degrees): the Layout view dolly-zooms to near-orthographic */
  fov = new LogSpring(32, SPRINGS.camera)
  layer: LayerDef = LAYER_BY_ID.cell
  handlers: DiveHandlers = {}
  reduced = false
  /** who owns the current pointer drag: 'orbit' | 'section' | null */
  owner: string | null = null
  /** suppress dive triggers for a moment after a layer change */
  private cooldown = 0
  private home: { target: [number, number, number]; polar: number; azimuth: number; dist: number } = {
    target: [0, 0, 0], polar: 1, azimuth: 0, dist: 50,
  }
  /** freeze user input (during scripted transitions) */
  locked = false
  polarLimits: [number, number] = [0.08, 1.5]
  /** portrait screens need more distance to fit the same width */
  aspectBoost = 1
  setAspect(aspect: number) {
    this.aspectBoost = aspect < 1.2 ? Math.min(2.6, 1.25 / aspect) : 1
  }

  setLayer(layer: LayerDef, entry?: { dist?: number; target?: [number, number, number] }) {
    this.layer = layer
    this.home = { target: [0, 0, 0], polar: layer.restPolar, azimuth: layer.restAzimuth, dist: layer.restDist }
    this.cooldown = 0.9
    const startDist = entry?.dist ?? layer.restDist
    this.target.snap(entry?.target ?? [0, 0, 0])
    this.polar.snap(layer.restPolar)
    this.azimuth.snap(layer.restAzimuth)
    this.dist.snap(startDist)
    this.goHome()
  }

  setHome(h: Partial<CameraRig['home']>) {
    this.home = { ...this.home, ...h }
  }

  goHome() {
    this.target.setTarget(this.home.target)
    this.polar.target = this.home.polar
    this.azimuth.target = this.home.azimuth
    this.dist.target = this.home.dist
  }

  /** glide to fit a bounding box */
  focusBox(box: THREE.Box3, fov: number, aspect: number, opts: { padding?: number; polar?: number; minDist?: number } = {}) {
    const c = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const radius = Math.max(0.5, size.length() / 2)
    const vfov = (fov * Math.PI) / 180
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect)
    const fit = radius / Math.sin(Math.min(vfov, hfov) / 2)
    this.target.setTarget([c.x, c.y, c.z])
    this.dist.target = clamp(fit * (opts.padding ?? 1.1), Math.max(this.layer.minDist * 1.05, opts.minDist ?? 0), this.layer.maxDist)
    if (opts.polar != null) this.polar.target = opts.polar
  }

  orbit(dx: number, dy: number) {
    if (this.locked) return
    this.azimuth.target -= dx * 0.0055
    this.polar.target = clamp(this.polar.target - dy * 0.0045, this.polarLimits[0], this.polarLimits[1])
  }

  pan(dx: number, dy: number, cam: THREE.PerspectiveCamera) {
    if (this.locked) return
    const scale = (this.dist.value * Math.tan((cam.fov * Math.PI) / 360) * 2) / window.innerHeight
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrix, 0)
    const up = new THREE.Vector3().setFromMatrixColumn(cam.matrix, 1)
    const t = this.target
    const off = right.multiplyScalar(-dx * scale).add(up.multiplyScalar(dy * scale))
    t.setTarget([t.x.target + off.x, t.y.target + off.y, t.z.target + off.z])
  }

  zoom(factor: number) {
    if (this.locked) return
    const next = this.dist.target * factor
    if (this.cooldown <= 0) {
      if (next < this.layer.minDist && this.handlers.onDiveIn) {
        this.dist.target = this.layer.minDist
        this.handlers.onDiveIn()
        return
      }
      if (next > this.layer.maxDist && this.handlers.onSurface) {
        this.dist.target = this.layer.maxDist
        this.handlers.onSurface()
        return
      }
    }
    this.dist.target = clamp(next, this.layer.minDist, this.layer.maxDist)
  }

  update(dt: number, cam: THREE.PerspectiveCamera) {
    this.cooldown = Math.max(0, this.cooldown - dt)
    const [tx, ty, tz] = this.target.step(dt, this.reduced)
    const p = this.polar.step(dt, this.reduced)
    const a = this.azimuth.step(dt, this.reduced)
    cam.fov = this.fov.step(dt, this.reduced)
    const d = this.dist.step(dt, this.reduced) * this.aspectBoost
    cam.position.set(tx + d * Math.sin(p) * Math.sin(a), ty + d * Math.cos(p), tz + d * Math.sin(p) * Math.cos(a))
    cam.lookAt(tx, ty, tz)
    cam.near = Math.max(this.layer.near, d * 0.002)
    cam.far = Math.max(this.layer.far, d * 6)
    cam.updateProjectionMatrix()
  }

  metresPerPixel(cam: THREE.PerspectiveCamera, heightPx: number) {
    const visible = 2 * this.dist.value * this.aspectBoost * Math.tan((cam.fov * Math.PI) / 360)
    return (visible / heightPx) * this.layer.metresPerUnit
  }

  /** the camera distance in `layer` that shows the same metres-per-pixel */
  distanceForScale(layer: LayerDef, mpp: number, cam: THREE.PerspectiveCamera, heightPx: number) {
    return (mpp * heightPx) / layer.metresPerUnit / (2 * Math.tan((cam.fov * Math.PI) / 360))
  }
}

export const rig = new CameraRig()
