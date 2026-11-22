import { applySceneNow, stepIndex } from './engine'
import type { Scene } from './schema'
import { useAtlas, type AtlasState } from '../state/store'
import { transition } from '../scene/transition'
import { cellRuntime } from '../scene/cellRuntime'
import { layoutState } from '../chapters/cmos/layout'

const store = { getState: () => useAtlas.getState(), setState: (p: Partial<AtlasState>) => useAtlas.setState(p) }
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Put the app into a scene: dive to its layer with the usual transition,
 * then apply everything else. `animate` lets a predict reveal play (the
 * timeline springs to the step instead of jumping).
 */
export async function driveScene(sc: Scene, opts: { animate?: boolean } = {}) {
  const st = useAtlas.getState()
  if ((sc.layer && sc.layer !== st.layer) || (sc.device && sc.device !== st.device && (sc.layer ?? st.layer) === 'transistor')) {
    await transition.go(sc.layer ?? st.layer, { device: sc.device, tab: sc.tab })
    // let the new layer mount and subscribe before changing its view
    await wait(80)
  }
  const fromStep = useAtlas.getState().step
  applySceneNow({ ...sc, layer: undefined, device: undefined }, store)
  if (sc.step != null) {
    const k = Math.max(0, stepIndex(sc.step))
    if (opts.animate) {
      cellRuntime.fab.snap(Math.min(fromStep, k))
      cellRuntime.fab.target = k
    } else cellRuntime.fab.snap(k)
  }
  if (sc.resetLayout || sc.edits) useAtlas.getState().set({ layoutVersion: layoutState.version() })
}
