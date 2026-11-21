/**
 * Fab timeline playback: each step eases in over MOVE seconds of content
 * time, then dwells until SEG. Pure, so the time scale can be tested.
 */
export const PLAY = { SEG: 1.75, MOVE: 1.3 }

export function advancePlayback(play: { t: number; from: number }, contentDt: number, last: number) {
  play.t += contentDt
  const seg = Math.floor(play.t / PLAY.SEG)
  const local = play.t - seg * PLAY.SEG
  const e = Math.min(1, local / PLAY.MOVE)
  const eased = e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2
  const target = play.from + seg + eased
  return target >= last ? { target: last, done: true } : { target, done: false }
}
