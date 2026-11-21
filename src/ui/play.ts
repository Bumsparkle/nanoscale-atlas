import { useAtlas } from '../state/store'
import { cellRuntime as rt } from '../scene/cellRuntime'
import { inverterProcess } from '../chapters/cmos/recipe'
import { nextSpeed, setSpeed } from '../state/timescale'

/** Fab replay controls: play / pause, step, speed. */
const last = () => inverterProcess().length - 1

export const isPlaying = () => useAtlas.getState().playing

export function fabGoTo(k: number) {
  k = Math.max(0, Math.min(last(), k))
  useAtlas.getState().set({ playing: false, step: k })
  rt.fab.target = k
}

export function playPause() {
  const st = useAtlas.getState()
  if (st.playing) {
    st.set({ playing: false })
    rt.fab.target = Math.round(rt.fab.value)
    return
  }
  const n = last()
  const from = Math.round(rt.fab.value) >= n ? 0 : Math.round(rt.fab.value)
  if (from === 0) rt.fab.snap(0)
  rt.play = { t: 0, from }
  st.set({ playing: true, step: from })
}

export const stepFab = (dir: -1 | 1) => fabGoTo(Math.round(rt.fab.target) + dir)
export const speedDown = () => setSpeed(nextSpeed(useAtlas.getState().speed, -1))
export const speedUp = () => setSpeed(nextSpeed(useAtlas.getState().speed, 1))
