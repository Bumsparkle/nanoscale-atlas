import { useEffect, useRef, useState } from 'react'
import { useAtlas } from './store'
import { db } from '../sync/db'

/**
 * Fab animation speed. Only the fabrication replay (playback, the step
 * spring, and its effects: spin, exposure, etch, implant, deposition)
 * follows the speed control; everything else runs at its natural 1×.
 */
export const SPEED_MIN = 0.25
export const SPEED_MAX = 2
export const SPEED_SNAPS = [0.25, 0.5, 1, 2] as const

/** dt for fab animation this frame */
export const fabDt = (dt: number) => dt * useAtlas.getState().speed

/** clamp, and snap to 0.25× / 0.5× / 1× / 2× when close (on a log scale) */
export function snapSpeed(v: number) {
  const c = Math.min(SPEED_MAX, Math.max(SPEED_MIN, v))
  const near = SPEED_SNAPS.find((s) => Math.abs(Math.log2(c / s)) < 0.12)
  return near ?? Math.round(c * 20) / 20
}
/** [ and ]: move to the next snap point down or up */
export function nextSpeed(v: number, dir: -1 | 1) {
  if (dir > 0) return SPEED_SNAPS.find((s) => s > v + 1e-6) ?? SPEED_MAX
  return [...SPEED_SNAPS].reverse().find((s) => s < v - 1e-6) ?? SPEED_MIN
}
export function setSpeed(v: number) {
  const speed = snapSpeed(v)
  useAtlas.getState().set({ speed })
  // synced with the account (src/sync)
  db.put('settings', 'speed', speed)
}

/** A DOM tween at natural speed: eases from the previous value to `target` over `seconds`. */
export function useTween(target: number, seconds = 0.6) {
  const [v, setV] = useState(target)
  const cur = useRef(target)
  useEffect(() => {
    const from = cur.current
    if (from === target) return
    const reduced = useAtlas.getState().reducedMotion
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const e = reduced ? 1 : Math.min(1, (now - t0) / 1000 / seconds)
      const eased = e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2
      cur.current = from + (target - from) * eased
      setV(cur.current)
      if (e < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, seconds])
  return v
}
