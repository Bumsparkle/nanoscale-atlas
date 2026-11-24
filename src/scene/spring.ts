/**
 * Damped harmonic springs. All motion in the app goes through these so
 * that things have inertia, overshoot slightly and settle (brief: "motion
 * has physics"). Integrated with sub-stepped semi-implicit Euler so large
 * frame times stay stable.
 */
export interface SpringConfig {
  /** angular frequency, rad/s */
  omega: number
  /** damping ratio: <1 overshoots, 1 critical */
  zeta: number
}

export const SPRINGS = {
  camera: { omega: 7.5, zeta: 0.92 },
  snap: { omega: 26, zeta: 0.48 },
  part: { omega: 11, zeta: 0.62 },
  ui: { omega: 18, zeta: 0.8 },
  layerClick: { omega: 22, zeta: 0.42 },
  gentle: { omega: 4, zeta: 1 },
} satisfies Record<string, SpringConfig>

export class Spring {
  value: number
  velocity = 0
  target: number
  constructor(v = 0, public cfg: SpringConfig = SPRINGS.ui) {
    this.value = v
    this.target = v
  }
  step(dt: number, reduced = false) {
    if (reduced) {
      this.value = this.target
      this.velocity = 0
      return this.value
    }
    const { omega, zeta } = this.cfg
    let t = Math.min(dt, 0.1)
    const h = 1 / 240
    while (t > 1e-6) {
      const s = Math.min(h, t)
      const a = -omega * omega * (this.value - this.target) - 2 * zeta * omega * this.velocity
      this.velocity += a * s
      this.value += this.velocity * s
      t -= s
    }
    return this.value
  }
  snap(v: number) {
    this.value = v
    this.target = v
    this.velocity = 0
  }
  get settled() {
    return Math.abs(this.value - this.target) < 1e-4 && Math.abs(this.velocity) < 1e-3
  }
}

export class Spring3 {
  x: Spring
  y: Spring
  z: Spring
  constructor(v: [number, number, number], cfg: SpringConfig) {
    this.x = new Spring(v[0], cfg)
    this.y = new Spring(v[1], cfg)
    this.z = new Spring(v[2], cfg)
  }
  setTarget(v: [number, number, number]) {
    this.x.target = v[0]
    this.y.target = v[1]
    this.z.target = v[2]
  }
  snap(v: [number, number, number]) {
    this.x.snap(v[0])
    this.y.snap(v[1])
    this.z.snap(v[2])
  }
  step(dt: number, reduced = false): [number, number, number] {
    return [this.x.step(dt, reduced), this.y.step(dt, reduced), this.z.step(dt, reduced)]
  }
}

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

/**
 * A spring integrated in log space: equal times cover equal ratios, so a
 * camera dolly from 7000 to 100 units reads as a steady zoom on the log
 * scale bar instead of a lurch. Same API as Spring (linear units).
 */
export class LogSpring {
  private s: Spring
  constructor(v: number, cfg: SpringConfig) {
    this.s = new Spring(Math.log(v), cfg)
  }
  get value() {
    return Math.exp(this.s.value)
  }
  get target() {
    return Math.exp(this.s.target)
  }
  set target(v: number) {
    this.s.target = Math.log(Math.max(v, 1e-9))
  }
  get cfg() {
    return this.s.cfg
  }
  set cfg(c: SpringConfig) {
    this.s.cfg = c
  }
  step(dt: number, reduced = false) {
    this.s.step(dt, reduced)
    return this.value
  }
  snap(v: number) {
    this.s.snap(Math.log(Math.max(v, 1e-9)))
  }
  get settled() {
    return this.s.settled
  }
}
