import { createWafer } from '../../sim/model'
import { anneal, deposit, develop, diffuse, epitaxy, etch, evaporate, expose, implant, oxidise, spinResist, strip, thermalOxide } from '../../sim/ops'
import { Process, type Step } from '../../sim/recipe'
import type { Doping, Grid, Mask } from '../../sim/types'
import type { ProcState } from '../../state/store'
import { T3, T7 } from '../../sources'
import { dealGrove, DIFFUSERS, diffusivity, driveIn, junctionDepth, MBE_NM_PER_HOUR, predep, projectedRange, SI_CONSUMED } from './physics'

/**
 * The process lab (Topic 3 slides 24–32): each step of the slide 24 flow
 * run as a short recipe on a 2D cross-section, with the upgraded simulator
 * ops. Every experiment is a Process, so the lab's scrubber plays it with
 * the same fractional ops as the inverter's fab timeline.
 */
export interface LabRun {
  process: Process
  /** nm per column */
  pitchNm: number
  readouts: { k: string; v: string }[]
  /** doping profile for the diffusion lab: depth (µm) → concentration (cm⁻³) */
  profile?: { pre: (x: number) => number; drive: (x: number) => number; background: number; xjPre: number; xjDrive: number }
  /** original silicon surface is drawn as a dashed line at z = 0 */
  showOrigin: boolean
}

const step = (id: string, title: string, slide: number, kind: Step['kind'], tool: string, chemistry: string, note: string, op: Step['op']): Step => ({
  id, title, source: T3(slide), group: 'lab', kind, tool, chemistry, note, op,
})
/** a Topic 7 (slide 16) resist-process step */
const t7 = (id: string, title: string, kind: Step['kind'], tool: string, chemistry: string, note: string, op: Step['op']): Step => ({ id, title, source: T7(16), group: 'lab', kind, tool, chemistry, note, op })
const start = (note: string) => step('start', 'Start', 24, 'start', 'Wafer', 'Si', note, (m) => m)
const grid = (nx: number): Grid => ({ x0: 0, y0: 0, nx, ny: 1, d: 1 })
const centre = (nx: number, w: number): Mask => ({ id: 'lab', name: 'lab mask', slide: 0, rects: [{ x0: Math.round((nx - w) / 2), y0: 0, x1: Math.round((nx + w) / 2), y1: 1 }] })
const sci = (v: number, d = 2) => {
  if (!Number.isFinite(v) || v === 0) return '0'
  const e = Math.floor(Math.log10(Math.abs(v)))
  return `${(v / Math.pow(10, e)).toFixed(d - 1)} × 10${sup(e)}`
}
const SUP: Record<string, string> = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }
export const sup = (n: number) => String(n).split('').map((c) => SUP[c] ?? c).join('')
export { sci }

export function labRun(p: ProcState): LabRun {
  switch (p.op) {
    case 'wafer':
    case 'packaging': {
      const g = grid(80)
      const w = createWafer(g, 1500)
      return { process: new Process(w, [start(p.op === 'wafer' ? 'An epi-ready wafer from the wafer manufacturer.' : 'The finished die is diced, bonded and packaged.')]), pitchNm: 50, readouts: [], showOrigin: false }
    }
    case 'epitaxy': {
      const g = grid(80)
      const rate = p.epi === 'mbe' ? MBE_NM_PER_HOUR / 60 : 1000 // nm per minute (CVD ~1 µm/min: beyond the lecture, Plummer ch. 9)
      const t = rate * p.epiMin
      const w = createWafer(g, 3000, 'p+')
      const steps = [
        start('A heavily doped p+ substrate.'),
        step('epi', p.epi === 'mbe' ? 'MBE growth' : 'CVD epitaxy', p.epi === 'mbe' ? 26 : 25, 'epitaxy', p.epi === 'mbe' ? 'MBE chamber, 10⁻¹¹ Torr' : 'Epi reactor, 950–1150 °C',
          p.epi === 'mbe' ? 'Si effusion cell' : 'SiH₄ + carrier gas', 'A lightly doped layer continues the substrate crystal.', epitaxy(t, 'p')),
      ]
      return {
        process: new Process(w, steps), pitchNm: 60, showOrigin: true,
        readouts: [
          { k: 'method', v: p.epi === 'mbe' ? 'MBE · 10⁻¹¹ Torr · RHEED' : 'CVD · SiH₄ · 950–1150 °C' },
          { k: 'rate', v: p.epi === 'mbe' ? '≈ 1000 nm/h' : '≈ 1 µm/min (typical)' },
          { k: 'thickness', v: `${(t / 1000).toFixed(t < 1000 ? 2 : 1)} µm in ${p.epiMin} min` },
        ],
      }
    }
    case 'oxidation': {
      const g = grid(80)
      const dg = dealGrove(p.oxT, p.oxHours, p.ambient)
      const xNm = dg.x * 1000
      const w = createWafer(g, Math.max(1500, xNm * 1.2))
      const steps = [
        start('Bare silicon.'),
        step('ox', p.ambient === 'dry' ? 'Dry oxidation' : 'Wet oxidation', 27, 'oxidise', 'Oxidation furnace', p.ambient === 'dry' ? 'Si + O₂ → SiO₂' : 'Si + 2H₂O → SiO₂ + 2H₂',
          'The oxidant diffuses through the oxide and reacts at the Si interface.', thermalOxide(xNm)),
      ]
      return {
        process: new Process(w, steps), pitchNm: Math.max(20, xNm / 12), showOrigin: true,
        readouts: [
          { k: 'oxide', v: `${xNm < 1000 ? xNm.toFixed(0) + ' nm' : dg.x.toFixed(2) + ' µm'}` },
          { k: 'Si consumed', v: `${(SI_CONSUMED * xNm).toFixed(0)} nm (0.44 × ${xNm.toFixed(0)})` },
          { k: 'regime', v: dg.linear ? 'linear: x ∝ t' : 'parabolic: x ∝ √t' },
          { k: 'Deal–Grove', v: `B = ${sci(dg.B)} µm²/h · B/A = ${sci(dg.BA)} µm/h` },
        ],
      }
    }
    case 'litho': {
      const nx = 120
      const w = createWafer(grid(nx), 1200)
      const mask = centre(nx, 40)
      const steps = [
        start('Silicon.'),
        step('ox', 'Grow oxide', 27, 'oxidise', 'Oxidation furnace', 'O₂', 'A film to pattern.', oxidise('ox', 250)),
        ...(p.fullResist
          ? [
              t7('dehydrate', 'Surface clean / dehydration bake', 'anneal', 'Hot plate', '—', 'Prepares the surface for resist.', (m) => m),
              t7('hmds', 'HMDS adhesion promoter', 'spin', 'Spinner', 'HMDS', 'Typically spun on; helps the resist stick.', (m) => m),
              t7('spin', 'Spin resist', 'spin', 'Spinner, 3000–6000 rpm', p.tone === 'positive' ? 'positive resist' : 'negative resist', 'Forms a ≈ 0.5 µm layer.', spinResist(600)),
              t7('prebake', 'Pre-bake', 'anneal', 'Hot plate', '—', 'Typically 10–30 min at 90–100 °C.', (m) => m),
              t7('expose', 'Align and expose', 'expose', 'Aligner, UV', 'UV light', 'Aligned at each exposure site; typically 150 mJ cm⁻².', expose(mask, { keep: true })),
              t7('peb', 'Post-exposure bake', 'anneal', 'Hot plate', '—', 'Sometimes used to minimise standing waves; typically 10 min at 100 °C.', (m) => m),
              t7('develop', 'Develop', 'develop', 'Spray or immersion', 'alkaline developer', 'Typically 30–60 s at room temperature.', develop({ tone: p.tone })),
              t7('postbake', 'Post-bake', 'anneal', 'Hot plate', '—', 'Typically 10–30 min at 100–140 °C: hardens the resist for etching.', (m) => m),
            ]
          : [
              step('spin', 'Spin resist', 28, 'spin', 'Spinner', p.tone === 'positive' ? 'positive resist' : 'negative resist', 'Polymer resin with a photoactive compound.', spinResist(600)),
              step('expose', 'Expose through the mask', 28, 'expose', 'Aligner, UV', 'UV light', 'The opaque square in the middle of the mask blocks the light.', expose(mask, { keep: true })),
              step('develop', 'Develop', 28, 'develop', 'Developer', 'alkaline developer', p.tone === 'positive' ? 'Light softened the resist: the exposed resist dissolves.' : 'Light hardened the resist: the unexposed resist dissolves.', develop({ tone: p.tone })),
            ]),
        step('etch', 'Etch the oxide', 29, 'etch', 'HF bath', 'HF', 'HF attacks SiO₂ but not Si or resist.', etch('ox')),
        step('strip', 'Strip the resist', 29, 'strip', 'Stripper', 'piranha / O₂ plasma', 'The pattern is now in the oxide.', strip('resist')),
      ]
      return { process: new Process(w, steps), pitchNm: 40, showOrigin: false, readouts: [{ k: 'resist', v: p.tone === 'positive' ? 'positive: softened by light' : 'negative: hardened by light' }, { k: 'result', v: p.tone === 'positive' ? 'oxide island (copy of the opaque mask)' : 'oxide window (inverse of the mask)' }] }
    }
    case 'etch': {
      const nx = 240
      const pitch = 25
      const T = 500
      const lineCols = Math.max(4, Math.round((p.lineUm * 1000) / pitch))
      const w = createWafer(grid(nx), 900)
      const steps = [
        start('Silicon.'),
        step('ox', 'Oxide film', 29, 'deposit', 'Furnace', 'SiO₂', '500 nm of oxide to pattern.', deposit('ox', T)),
        step('spin', 'Resist line', 28, 'spin', 'Spinner', 'resist', 'A resist line protects the oxide underneath.', spinResist(500)),
        step('expose', 'Expose', 28, 'expose', 'Aligner', 'UV', 'Everything but the line is exposed.', expose(centre(nx, lineCols), { keep: true })),
        step('develop', 'Develop', 28, 'develop', 'Developer', 'developer', 'The resist line remains.', develop()),
        step('etch', p.iso ? 'Wet etch (isotropic)' : 'Dry etch (anisotropic)', 29, 'etch', p.iso ? 'HF bath' : 'RIE plasma etcher', p.iso ? 'HF solution' : 'CF₄ / CHF₃ plasma',
          p.iso ? 'Etches sideways as fast as down: the mask is undercut.' : 'Ions etch straight down: vertical walls.', etch('ox', { isotropic: p.iso, pitchNm: pitch, over: 0.1 })),
      ]
      const undercut = p.iso ? 1.1 * T : 0
      const left = Math.max(0, p.lineUm * 1000 - 2 * undercut)
      return {
        process: new Process(w, steps), pitchNm: pitch, showOrigin: false,
        readouts: [
          { k: 'etch', v: p.iso ? 'isotropic (wet, chemical)' : 'anisotropic (dry, physical: RIE)' },
          { k: 'undercut', v: p.iso ? `≈ ${undercut.toFixed(0)} nm per side` : '≈ 0' },
          { k: 'line width', v: `${p.lineUm.toFixed(1)} µm drawn → ${(left / 1000).toFixed(2)} µm at the foot` },
        ],
      }
    }
    case 'diffusion': {
      const nx = 120
      const pitch = 50
      const d = DIFFUSERS[p.dopant]
      const Dpre = diffusivity(d.D0, d.Q, p.preT)
      const Ddrive = diffusivity(d.D0, d.Q, p.driveT)
      const Cs = p.dopant === 'B' ? 3e20 : 5e20 // solid solubility near 1000 °C (beyond the lecture: Plummer Fig. 7-4)
      const pre = predep(Cs, Dpre, p.preMin * 60)
      const drv = driveIn(pre.dose, Ddrive, p.driveMin * 60)
      const background = 1e15
      const xjPre = junctionDepth(pre.at, background)
      const xjDrive = junctionDepth(drv.at, background)
      const sub: Doping = d.type === 'n' ? 'p' : 'nwell'
      const dop: Doping = d.type === 'n' ? 'n+' : 'p+'
      const w = createWafer(grid(nx), Math.max(2500, xjDrive * 1000 * 1.6), sub)
      const steps = [
        start(`${sub === 'p' ? 'p' : 'n'}-type silicon, 10¹⁵ cm⁻³.`),
        step('ox', 'Masking oxide', 30, 'oxidise', 'Oxidation furnace', 'O₂ / H₂O', 'The oxide will block the dopant.', oxidise('ox', 300)),
        step('spin', 'Open a window', 28, 'spin', 'Spinner + aligner', 'resist', 'Lithography opens a window in the oxide.', spinResist(500)),
        step('expose', 'Expose', 28, 'expose', 'Aligner', 'UV', 'The window is exposed.', expose(centre(nx, 40))),
        step('develop', 'Develop', 28, 'develop', 'Developer', 'developer', 'Positive resist: the window opens.', develop()),
        step('etch', 'Etch the window', 29, 'etch', 'HF bath', 'HF', 'Bare silicon in the window.', etch('ox')),
        step('strip', 'Strip resist', 29, 'strip', 'Stripper', 'piranha', 'Resist would not survive the furnace.', strip('resist')),
        step('predep', 'Predeposition', 30, 'diffuse', 'Quartz-tube furnace', p.dopant === 'B' ? '2B₂O₃ + 3Si → 3SiO₂ + 4B' : '2P₂O₅ + 5Si → 5SiO₂ + 4P',
          `${p.preT} °C, ${p.preMin} min: a shallow, heavily doped layer.`, diffuse(dop, xjPre * 1000, { pitchNm: pitch })),
        step('drive', 'Drive-in', 30, 'diffuse', 'Furnace, no dopant source', 'N₂ / O₂', `${p.driveT} °C, ${p.driveMin} min: the profile spreads out.`, diffuse(dop, xjDrive * 1000, { pitchNm: pitch })),
      ]
      return {
        process: new Process(w, steps), pitchNm: pitch, showOrigin: false,
        profile: { pre: pre.at, drive: drv.at, background, xjPre, xjDrive },
        readouts: [
          { k: 'D (predep)', v: `${sci(Dpre)} cm²/s at ${p.preT} °C` },
          { k: 'D (drive-in)', v: `${sci(Ddrive)} cm²/s at ${p.driveT} °C` },
          { k: 'dose', v: `${sci(pre.dose)} cm⁻²` },
          { k: 'junction', v: `${xjPre.toFixed(2)} µm → ${xjDrive.toFixed(2)} µm` },
        ],
      }
    }
    case 'implant': {
      const nx = 160
      const pitch = 25
      const { Rp, dRp } = projectedRange(p.species, p.keV)
      const depth = Rp + 2 * dRp
      const dop: Doping = p.species === 'B' ? 'p+' : 'n+'
      const w = createWafer(grid(nx), Math.max(1200, depth * 1.8), p.species === 'B' ? 'nwell' : 'p')
      const steps = [
        start('Silicon with a patterned oxide mask.'),
        step('ox', 'Masking oxide', 31, 'oxidise', 'Furnace', 'O₂', 'Thick enough to stop the ions.', oxidise('ox', Math.max(300, depth * 1.3))),
        step('spin', 'Pattern', 28, 'spin', 'Spinner', 'resist', 'Lithography opens a window.', spinResist(500)),
        step('expose', 'Expose', 28, 'expose', 'Aligner', 'UV', 'Window exposed.', expose(centre(nx, 50))),
        step('develop', 'Develop', 28, 'develop', 'Developer', 'developer', 'Window open.', develop()),
        step('etch', 'Etch', 29, 'etch', 'HF', 'HF', 'Bare Si in the window.', etch('ox')),
        step('strip', 'Strip', 29, 'strip', 'Stripper', 'piranha', 'Resist off.', strip('resist')),
        step('implant', `Implant ${p.species}⁺ at ${p.keV} keV`, 31, 'implant', 'Ion implanter', `${p.species}⁺ beam`, 'Room temperature. The ions damage the crystal they stop in.', implant(dop, depth, { damage: true })),
        ...(p.annealed ? [step('anneal', 'Anneal', 31, 'anneal', 'Furnace / RTA', 'N₂', '900–1000 °C: dopants activated, crystal restored.', anneal())] : []),
      ]
      return {
        process: new Process(w, steps), pitchNm: pitch, showOrigin: false,
        readouts: [
          { k: 'energy', v: `${p.keV} keV (1–200 keV range)` },
          { k: 'range', v: `Rp ≈ ${Rp.toFixed(0)} nm, ΔRp ≈ ${dRp.toFixed(0)} nm` },
          { k: 'wafer', v: 'room temperature during the implant' },
          { k: 'crystal', v: p.annealed ? 'annealed at 900–1000 °C: restored, dopants active' : 'damaged: needs a 900–1000 °C anneal' },
        ],
      }
    }
    case 'metal': {
      const nx = 120
      const w = createWafer(grid(nx), 1000, 'n+')
      const steps = [
        start('A doped region under its oxide.'),
        step('ox', 'Field oxide', 32, 'oxidise', 'Furnace', 'O₂', 'Insulates the metal from the silicon.', oxidise('fox', 400)),
        step('spin', 'Contact window', 28, 'spin', 'Spinner', 'resist', 'Lithography opens a contact.', spinResist(500)),
        step('expose', 'Expose', 28, 'expose', 'Aligner', 'UV', 'Contact exposed.', expose(centre(nx, 30))),
        step('develop', 'Develop', 28, 'develop', 'Developer', 'developer', 'Contact open.', develop()),
        step('etch', 'Etch', 29, 'etch', 'HF', 'HF', 'Contact cut to the silicon.', etch('fox')),
        step('strip', 'Strip', 29, 'strip', 'Stripper', 'piranha', 'Resist off.', strip('resist')),
        step('evap', 'Thermal evaporation of Al', 32, 'evaporate', 'Evaporator (vacuum chamber)', 'Al from a heated W boat',
          'Metal vapour condenses on the cooler wafer above the source.', evaporate('al', p.metalNm)),
      ]
      return { process: new Process(w, steps), pitchNm: 25, showOrigin: false, readouts: [{ k: 'method', v: 'thermal evaporation: resistive filament (basket, boat or crucible)' }, { k: 'film', v: `${p.metalNm} nm Al` }] }
    }
  }
}

/** where each flow step appears in the Chapter 1 inverter fab (recipe step ids) */
export const FAB_LINK: Partial<Record<ProcState['op'], { step: string; label: string }>> = {
  oxidation: { step: 'nwell-ox', label: 'oxide grown for the n-well mask' },
  litho: { step: 'n-well-expose', label: 'exposing the n-well resist' },
  etch: { step: 'n-well-etch', label: 'HF etch of the n-well window' },
  diffusion: { step: 'nwell-implant', label: 'n-well by diffusion or implant' },
  implant: { step: 'n-implant', label: 'self-aligned n+ implant' },
  metal: { step: 'al', label: 'aluminium over the wafer' },
}
