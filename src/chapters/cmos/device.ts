/**
 * Switch-level device behaviour from the slides, plus a smooth ramp so the
 * channel can be drawn forming. Slide 12: nMOS gate high → channel inverts
 * to n-type, ON. Slide 13: pMOS reversed, ON when the gate is low.
 * Slide 14: nMOS ON at g = 1, pMOS ON at g = 0.
 *
 * The ramp between 30 % and 70 % of VDD is illustrative (beyond the
 * lecture: real thresholds are process-dependent, Sze ch. 6); the logic
 * functions below use only the slide 14 rule.
 */
export type Bit = 0 | 1

export function nmosOn(g: Bit) {
  return g === 1
}
export function pmosOn(g: Bit) {
  return g === 0
}

/** 0..1 inversion strength for a gate voltage given as a fraction of VDD */
export function channelStrength(device: 'nmos' | 'pmos', vg: number) {
  const v = device === 'nmos' ? vg : 1 - vg
  const t = Math.min(1, Math.max(0, (v - 0.3) / 0.4))
  return t * t * (3 - 2 * t)
}

/** switch-level evaluation of a pull-up / pull-down network */
export type Net = { kind: 'n' | 'p'; input: 'A' | 'B' } | { series: Net[] } | { parallel: Net[] }

export function conducts(net: Net, inputs: Record<'A' | 'B', Bit>): boolean {
  if ('kind' in net) return net.kind === 'n' ? nmosOn(inputs[net.input]) : pmosOn(inputs[net.input])
  if ('series' in net) return net.series.every((n) => conducts(n, inputs))
  return net.parallel.some((n) => conducts(n, inputs))
}

export interface Gate {
  name: 'INV' | 'NAND' | 'NOR'
  inputs: ('A' | 'B')[]
  pullUp: Net
  pullDown: Net
  slides: number[]
}

/** slides 15–17, 18–22, 23 */
export const GATES: Record<Gate['name'], Gate> = {
  INV: { name: 'INV', inputs: ['A'], pullUp: { kind: 'p', input: 'A' }, pullDown: { kind: 'n', input: 'A' }, slides: [15, 16, 17] },
  NAND: {
    name: 'NAND', inputs: ['A', 'B'],
    pullUp: { parallel: [{ kind: 'p', input: 'A' }, { kind: 'p', input: 'B' }] },
    pullDown: { series: [{ kind: 'n', input: 'A' }, { kind: 'n', input: 'B' }] },
    slides: [18, 19, 20, 21, 22],
  },
  NOR: {
    name: 'NOR', inputs: ['A', 'B'],
    pullUp: { series: [{ kind: 'p', input: 'A' }, { kind: 'p', input: 'B' }] },
    pullDown: { parallel: [{ kind: 'n', input: 'A' }, { kind: 'n', input: 'B' }] },
    slides: [23],
  },
}

export type Output = 0 | 1 | 'Z' | 'X'

/** Y = 1 if only the pull-up conducts, 0 if only the pull-down; Z floating, X contention */
export function evaluate(gate: Gate, inputs: Record<'A' | 'B', Bit>): Output {
  const up = conducts(gate.pullUp, inputs)
  const down = conducts(gate.pullDown, inputs)
  if (up && !down) return 1
  if (down && !up) return 0
  return up ? 'X' : 'Z'
}
