import { beforeEach, describe, expect, it } from 'vitest'
import { useAtlas } from './store'
import { fabDt, nextSpeed, snapSpeed } from './timescale'
import { advancePlayback, PLAY } from '../scene/playback'

const FRAME = 1 / 60
/** real seconds for fab playback to ease into the next step at the current speed */
function secondsForOneStep() {
  const play = { t: 0, from: 7 }
  let real = 0
  for (;;) {
    const { target } = advancePlayback(play, fabDt(FRAME), 44)
    real += FRAME
    if (target >= 8 - 1e-9) return real
    if (real > 60) throw new Error('never arrived')
  }
}

beforeEach(() => useAtlas.setState({ speed: 1 }))

describe('fab replay speed', () => {
  it('a fab step at 0.5× takes about twice as long as at 1×', () => {
    const t1 = secondsForOneStep()
    useAtlas.setState({ speed: 0.5 })
    const t05 = secondsForOneStep()
    expect(t1).toBeCloseTo(PLAY.MOVE, 1)
    expect(t05 / t1).toBeGreaterThan(1.95)
    expect(t05 / t1).toBeLessThan(2.05)
  })
  it('2× halves it, 0.25× quadruples it', () => {
    const t1 = secondsForOneStep()
    useAtlas.setState({ speed: 2 })
    expect(secondsForOneStep() / t1).toBeCloseTo(0.5, 1)
    useAtlas.setState({ speed: 0.25 })
    expect(secondsForOneStep() / t1).toBeCloseTo(4, 0)
  })
  it('snaps to ¼, ½, 1 and 2× and steps between them', () => {
    expect(snapSpeed(0.97)).toBe(1)
    expect(snapSpeed(0.53)).toBe(0.5)
    expect(snapSpeed(5)).toBe(2)
    expect(snapSpeed(0.1)).toBe(0.25)
    expect(snapSpeed(1.4)).toBe(1.4)
    expect(nextSpeed(1, 1)).toBe(2)
    expect(nextSpeed(1, -1)).toBe(0.5)
    expect(nextSpeed(1.4, -1)).toBe(1)
    expect(nextSpeed(0.25, -1)).toBe(0.25)
    expect(nextSpeed(2, 1)).toBe(2)
  })
})
