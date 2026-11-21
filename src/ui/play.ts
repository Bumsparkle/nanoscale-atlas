import { useAtlas } from '../state/store'
import { cellRuntime as rt } from '../scene/cellRuntime'
import { inverterProcess } from '../chapters/cmos/recipe'
import { nextSpeed, setSpeed, STEP_BEAT, stepper } from '../state/timescale'

/**
 * Play / pause and step for whatever animation is in view. In the Fab view
 * "play" runs the process timeline; everywhere else it unfreezes the
 * ambient content animation (carriers, beacons, glows). One button, one key.
 */
const last = () => inverterProcess().length - 1
const fabView = (st = useAtlas.getState()) => st.view === 'fab' && st.layer === 'cell' && st.page === 'atlas'

export function isRunning(st = useAtlas.getState()) {
  return fabView(st) ? st.playing && !st.paused : !st.paused
}

export function fabGoTo(k: number) {
  const n = last()
  k = Math.max(0, Math.min(n, k))
  useAtlas.getState().set({ playing: false, step: k })
  rt.fab.target = k
}

export function playPause() {
  const st = useAtlas.getState()
  if (!fabView(st)) return st.set({ paused: !st.paused })
  if (isRunning(st)) {
    st.set({ playing: false })
    rt.fab.target = Math.round(rt.fab.value)
    return
  }
  const n = last()
  const from = Math.round(rt.fab.value) >= n ? 0 : Math.round(rt.fab.value)
  if (from === 0) rt.fab.snap(0)
  rt.play = { t: 0, from }
  st.set({ playing: true, paused: false, step: from })
}

/** step buttons: a fab step in the Fab view, otherwise a short beat of content time */
export function stepContent(dir: -1 | 1) {
  const st = useAtlas.getState()
  if (fabView(st)) return fabGoTo(Math.round(rt.fab.target) + dir)
  if (dir > 0) {
    if (!st.paused) st.set({ paused: true })
    stepper.pending += STEP_BEAT
  }
}

export const speedDown = () => setSpeed(nextSpeed(useAtlas.getState().speed, -1))
export const speedUp = () => setSpeed(nextSpeed(useAtlas.getState().speed, 1))
