import { LAYERS, LAYER_BY_ID, layerIndex, type Device, type LayerId } from '../chapters/cmos/layers'
import { useAtlas } from '../state/store'
import { post } from './Pipeline'
import { rig } from './rig'
import { sound } from '../ui/sound'

/**
 * Shared-element dive between scale layers.
 * Going down: the camera flies into the chosen object until it fills the
 * frame, the frame dips briefly, and the next layer mounts with its camera
 * at the distance that reproduces the same metres-per-pixel, then springs
 * to its rest pose. The scale bar therefore never jumps.
 */
interface Entry {
  dist: number
  target?: [number, number, number]
}

let pending: { layer: LayerId; entry: Entry } | null = null
let busy = false
let heightPx = 800
let fovDeg = 32

function tweenVeil(to: number, ms: number) {
  return new Promise<void>((res) => {
    const from = post.veil.value as number
    const t0 = performance.now()
    const tick = () => {
      const t = Math.min(1, (performance.now() - t0) / ms)
      // ease-in-out cubic for a short luminance dip; it masks a cut, not a motion
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      post.veil.value = from + (to - from) * e
      if (t < 1) requestAnimationFrame(tick)
      else res()
    }
    tick()
  })
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const transition = {
  setViewport(h: number, fov: number) {
    heightPx = h
    fovDeg = fov
  },
  get busy() {
    return busy
  },
  consumeEntry(layer: LayerId): Entry | null {
    if (pending && pending.layer === layer) {
      const e = pending.entry
      pending = null
      return e
    }
    return null
  },
  /**
   * Fly to another layer. `via` is the point (in current-layer units) the
   * camera dives into; defaults to the current orbit target.
   */
  async go(to: LayerId, opts: { via?: [number, number, number]; device?: Device; focus?: string | null } = {}) {
    const st = useAtlas.getState()
    if (busy || (to === st.layer && (!opts.device || opts.device === st.device))) return
    busy = true
    const from = LAYER_BY_ID[st.layer]
    const next = LAYER_BY_ID[to]
    const down = layerIndex(to) > layerIndex(st.layer)
    const reduced = st.reducedMotion
    rig.locked = true
    sound.whoosh(down)

    if (!reduced) {
      if (opts.via) rig.target.setTarget(opts.via)
      rig.dist.target = down ? from.minDist * 0.3 : from.maxDist * 2.4
      await wait(380)
      await tweenVeil(1, 170)
    } else {
      await tweenVeil(1, 120)
    }

    const visible = 2 * rig.dist.value * Math.tan((fovDeg * Math.PI) / 360)
    const mpp = (visible / heightPx) * from.metresPerUnit
    let dist = (mpp * heightPx) / next.metresPerUnit / (2 * Math.tan((fovDeg * Math.PI) / 360))
    // keep the entry inside a sane range for the new scene
    dist = Math.min(Math.max(dist, next.minDist * 0.4), next.maxDist * 3)
    pending = { layer: to, entry: { dist: reduced ? next.restDist : dist } }

    useAtlas.getState().set({
      layer: to,
      device: opts.device ?? st.device,
      focus: opts.focus ?? null,
      hover: null,
      view: 'explore',
      playing: false,
    })
    await wait(60)
    rig.locked = false
    await tweenVeil(0, reduced ? 120 : 260)
    busy = false
  },
  up() {
    const st = useAtlas.getState()
    const i = layerIndex(st.layer)
    if (i > 0) return this.go(LAYERS[i - 1].id)
  },
}
