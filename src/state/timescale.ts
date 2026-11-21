import { useEffect, useRef, useState } from 'react'
import { useAtlas } from './store'

/**
 * One time scale for all content animation: fab playback and its effects,
 * device physics, logic transitions, lattice morphs and lesson demos. UI
 * micro-interactions and camera moves triggered by clicks ignore it.
 * Every content animation advances by `scaleDt(dt)`, never by raw dt.
 */
export const SPEED_MIN = 0.25
export const SPEED_MAX = 2
export const SPEED_SNAPS = [0.25, 0.5, 1, 2] as const
const KEY = 'atlas.speed.v1'

export const contentScale = (st = useAtlas.getState()) => (st.paused ? 0 : st.speed)
export const scaleDt = (dt: number) => dt * contentScale()
/** the step-button beat: how much content time one press advances while paused */
export const STEP_BEAT = 0.5

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
export function readSpeed(): number {
  try {
    const v = Number(localStorage.getItem(KEY))
    return v >= SPEED_MIN && v <= SPEED_MAX ? v : 1
  } catch {
    return 1
  }
}
export function setSpeed(v: number) {
  const speed = snapSpeed(v)
  useAtlas.getState().set({ speed })
  try {
    localStorage.setItem(KEY, String(speed))
  } catch {
    /* not remembered */
  }
}
/** pending content time from step buttons, consumed by the next frames */
export const stepper = { pending: 0 }
/** content dt for this frame: scaled, or a step-button beat while paused */
export function frameDt(dt: number) {
  const st = useAtlas.getState()
  if (!st.paused) return dt * st.speed
  if (stepper.pending <= 0) return 0
  const d = Math.min(stepper.pending, dt * 2)
  return d
}
/** called once per frame after every consumer has read frameDt */
export function endFrame(dt: number) {
  if (useAtlas.getState().paused && stepper.pending > 0) stepper.pending = Math.max(0, stepper.pending - Math.min(stepper.pending, dt * 2))
}

/**
 * A DOM tween on content time: eases from the previous value to `target`
 * over `seconds` of content time (so it slows, speeds up and pauses with
 * the global control). Returns the current value.
 */
export function useContentTween(target: number, seconds = 0.6) {
  const [v, setV] = useState(target)
  const cur = useRef(target)
  useEffect(() => {
    const from = cur.current
    if (from === target) return
    let p = 0
    let last = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const st = useAtlas.getState()
      p += (st.reducedMotion && !st.paused ? 1 : st.paused ? Math.min(stepper.pending, dt) / seconds : (dt * st.speed) / seconds)
      const e = Math.min(1, p)
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
