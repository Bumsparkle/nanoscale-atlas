import { useAtlas } from '../state/store'

/**
 * Synthesised sound (no audio files): a soft mechanical click for snaps,
 * a low tool hum during fab steps, a faint air movement for dives.
 * Off by default; every call is a no-op until the user enables sound.
 */
let ctx: AudioContext | null = null
let master: GainNode | null = null
let hum: { osc: OscillatorNode[]; gain: GainNode } | null = null

function ac() {
  if (!useAtlas.getState().sound) return null
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function noiseBuffer(c: AudioContext, seconds: number) {
  const b = c.createBuffer(1, Math.ceil(c.sampleRate * seconds), c.sampleRate)
  const d = b.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return b
}

export const sound = {
  /** detent click: a short filtered noise burst plus a damped body resonance */
  click(strength = 1) {
    const c = ac()
    if (!c || !master) return
    const t = c.currentTime
    const n = c.createBufferSource()
    n.buffer = noiseBuffer(c, 0.03)
    const bp = c.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 3200
    bp.Q.value = 1.2
    const g = c.createGain()
    g.gain.setValueAtTime(0.35 * strength, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.03)
    n.connect(bp).connect(g).connect(master)
    n.start(t)
    const o = c.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(210, t)
    o.frequency.exponentialRampToValueAtTime(140, t + 0.08)
    const og = c.createGain()
    og.gain.setValueAtTime(0.18 * strength, t)
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.09)
    o.connect(og).connect(master)
    o.start(t)
    o.stop(t + 0.1)
  },
  whoosh(down: boolean) {
    const c = ac()
    if (!c || !master) return
    const t = c.currentTime
    const n = c.createBufferSource()
    n.buffer = noiseBuffer(c, 0.6)
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(down ? 300 : 1400, t)
    lp.frequency.exponentialRampToValueAtTime(down ? 1400 : 300, t + 0.5)
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.08, t + 0.25)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6)
    n.connect(lp).connect(g).connect(master)
    n.start(t)
  },
  /** fab tool hum; pitch hints at the tool (furnace low, implanter high) */
  humStart(kind: 'furnace' | 'implanter' | 'spinner' | 'sputter' | 'litho' | 'wet') {
    const c = ac()
    if (!c || !master) return
    this.humStop()
    const base = { furnace: 50, implanter: 120, spinner: 90, sputter: 70, litho: 60, wet: 40 }[kind]
    const gain = c.createGain()
    gain.gain.setValueAtTime(0.0001, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.05, c.currentTime + 0.4)
    const osc = [base, base * 2.01, base * 3.02].map((f, i) => {
      const o = c.createOscillator()
      o.type = i === 0 ? 'sine' : 'triangle'
      o.frequency.value = f
      const g = c.createGain()
      g.gain.value = [1, 0.3, 0.12][i]
      o.connect(g).connect(gain)
      o.start()
      return o
    })
    gain.connect(master)
    hum = { osc, gain }
  },
  humStop() {
    if (!hum || !ctx) return
    const h = hum
    hum = null
    h.gain.gain.cancelScheduledValues(ctx.currentTime)
    h.gain.gain.setValueAtTime(Math.max(0.0001, h.gain.gain.value), ctx.currentTime)
    h.gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3)
    h.osc.forEach((o) => o.stop(ctx!.currentTime + 0.35))
  },
}
