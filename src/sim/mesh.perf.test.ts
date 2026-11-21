import { describe, expect, it } from 'vitest'
import { mesh } from './mesher'
import { inverterProcess } from '../chapters/cmos/recipe'
import { MESH_OPTS } from '../chapters/cmos/display'

/**
 * Timing budget for re-meshing during fab playback. Runs on its own after the
 * main suite (npm test), because parallel test workers on a busy machine
 * distort wall-clock timings.
 */
describe('performance budget for live re-meshing', () => {
  it('fractional step + mesh averages under 8 ms', () => {
    const P = inverterProcess()
    // warm-up pass (JIT), then best of three so a busy machine doesn't fail it
    const run = () => {
      const t0 = performance.now()
      for (let k = 0; k < P.length - 1; k++) mesh(P.at(k + 0.5), MESH_OPTS)
      return (performance.now() - t0) / (P.length - 1)
    }
    run()
    const avg = Math.min(run(), run(), run())
    expect(avg).toBeLessThan(8)
  })
})
