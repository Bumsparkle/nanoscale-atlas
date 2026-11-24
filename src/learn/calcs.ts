import type { Question } from './schema'
import { cI, cV, csOverC0, diffusivity, kT, millerFromIntercepts, SI_CONSUMED } from '../chapters/growth/physics'
import { nbYield, poissonYield } from '../chapters/clean/physics'
import { HB } from '../chapters/nano/quantum'

/**
 * Parameterised calculation questions. A calc question with `answer.gen`
 * names a generator here and lists the values each {var} in its prompt may
 * take. `realise` picks values from a seed, fills in the prompt and
 * computes the answer and a full worked solution, so the numbers change
 * every time the question comes round. The first value of each list gives
 * the stored answer (checked by the tests).
 */
type V = Record<string, number>
interface Gen {
  unit: string
  /** relative tolerance */
  rel: number
  value: (v: V) => number
  solution: (v: V, ans: number) => string
  /** how a variable is printed in the prompt */
  fmt?: Partial<Record<string, (n: number) => string>>
}

const SUPS: Record<string, string> = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }
/** 3.2 × 10¹⁶ */
export function sci(n: number, d = 3): string {
  if (n === 0) return '0'
  const e = Math.floor(Math.log10(Math.abs(n)))
  if (e >= -2 && e <= 3) return String(+n.toPrecision(d))
  return `${+(n / 10 ** e).toPrecision(d)} × 10${String(e).split('').map((c) => SUPS[c]).join('')}`
}
const g3 = (n: number) => String(+n.toPrecision(3))

export const GENS: Record<string, Gen> = {
  /** Topic 3 slide 19 */
  segregation: {
    unit: 'cm⁻³', rel: 0.02,
    value: ({ k0, f, C0 }) => C0 * csOverC0(k0, f),
    solution: ({ k0, f, C0 }, a) =>
      `Cs = k0·C0·(1 − M/M0)^(k0−1) = ${k0} × ${sci(C0)} × (1 − ${f})^(${k0} − 1) = ${k0} × ${sci(C0)} × ${g3(Math.pow(1 - f, k0 - 1))} = ${sci(a)} cm⁻³. ${k0 < 1 ? 'k0 < 1, so the crystal is richer in dopant than at the seed end (k0·C0 = ' + sci(k0 * C0) + ').' : ''}`,
    fmt: { C0: sci },
  },
  /** Topic 3 slide 22 */
  vacancies: {
    unit: 'cm⁻³', rel: 0.03,
    value: ({ T }) => cV(T),
    solution: ({ T }, a) => `T = ${T} + 273 = ${T + 273} K, so kT = 8.617 × 10⁻⁵ × ${T + 273} = ${(kT(T)).toFixed(4)} eV. CV* = 9 × 10²³ × exp(−2.6/${kT(T).toFixed(4)}) = 9 × 10²³ × ${sci(Math.exp(-2.6 / kT(T)))} = ${sci(a)} cm⁻³.`,
  },
  interstitials: {
    unit: 'cm⁻³', rel: 0.03,
    value: ({ T }) => cI(T),
    solution: ({ T }, a) => `T = ${T} + 273 = ${T + 273} K, so kT = ${(kT(T)).toFixed(4)} eV. CI* = 1 × 10²⁷ × exp(−3.8/${kT(T).toFixed(4)}) = 1 × 10²⁷ × ${sci(Math.exp(-3.8 / kT(T)))} = ${sci(a)} cm⁻³.`,
  },
  /** Topic 3 slide 27 */
  'si-consumed': {
    unit: 'nm', rel: 0.01,
    value: ({ x }) => SI_CONSUMED * x,
    solution: ({ x }, a) => `Every 1 µm of SiO₂ consumes 0.44 µm of Si, so ${x} nm of oxide uses 0.44 × ${x} = ${g3(a)} nm of silicon. The interface moves down ${g3(a)} nm and the top surface rises ${g3(x - a)} nm.`,
  },
  'oxide-from-si': {
    unit: 'nm', rel: 0.01,
    value: ({ s }) => s / SI_CONSUMED,
    solution: ({ s }, a) => `Oxide thickness = Si consumed / 0.44 = ${s} / 0.44 = ${g3(a)} nm.`,
  },
  /** Topic 3 slide 30 */
  diffusivity: {
    unit: 'cm²/s', rel: 0.03,
    value: ({ D0, Q, T }) => diffusivity(D0, Q, T),
    solution: ({ D0, Q, T }, a) => `D = D0·exp(−Q/kT). T = ${T + 273} K, kT = ${kT(T).toFixed(4)} eV, Q/kT = ${(Q / kT(T)).toFixed(2)}. D = ${D0} × exp(−${(Q / kT(T)).toFixed(2)}) = ${D0} × ${sci(Math.exp(-Q / kT(T)))} = ${sci(a)} cm²/s.`,
  },
  /** Topic 4 slides 15–16, yield in % */
  poisson: {
    unit: '%', rel: 0.01,
    value: ({ A, D0 }) => 100 * poissonYield(A, D0),
    solution: ({ A, D0 }, a) => `Y = exp(−Ac·D0) = exp(−${A} × ${D0}) = exp(−${g3(A * D0)}) = ${g3(a / 100)}, i.e. ${g3(a)} %.`,
  },
  negbin: {
    unit: '%', rel: 0.01,
    value: ({ A, D0, C }) => 100 * nbYield(A, D0, C),
    solution: ({ A, D0, C }, a) => `Y = 1/(1 + Ac·D0/C)^C = 1/(1 + ${A} × ${D0}/${C})^${C} = 1/${g3(1 + (A * D0) / C)}^${C} = ${g3(a / 100)}, i.e. ${g3(a)} %. Poisson would give ${g3(100 * poissonYield(A, D0))} %: clustering raises the yield.`,
  },
  /** Topic 5 slide 15/19: how many times faster the surface reaction runs at T2 than T1 */
  arrhenius: {
    unit: '×', rel: 0.03,
    value: ({ Ea, T1, T2 }) => Math.exp((Ea / 8.617e-5) * (1 / (T1 + 273) - 1 / (T2 + 273))),
    solution: ({ Ea, T1, T2 }, a) => `kS(T2)/kS(T1) = exp[(Ea/k)(1/T1 − 1/T2)] with T in kelvin: Ea/k = ${Ea}/8.617 × 10⁻⁵ = ${g3(Ea / 8.617e-5)} K; 1/${T1 + 273} − 1/${T2 + 273} = ${sci(1 / (T1 + 273) - 1 / (T2 + 273))} K⁻¹; so the ratio is exp(${g3((Ea / 8.617e-5) * (1 / (T1 + 273) - 1 / (T2 + 273)))}) = ${g3(a)}.`,
  },
  /** Topic 5 slide 17 */
  'cs-ratio': {
    unit: 'CS/CG', rel: 0.01,
    value: ({ ks, hg }) => 1 / (1 + ks / hg),
    solution: ({ ks, hg }, a) => `In steady state F1 = F2: hG(CG − CS) = kS·CS, so CS/CG = 1/(1 + kS/hG) = 1/(1 + ${ks}/${hg}) = ${g3(a)}.${ks > hg ? ' kS > hG: the surface is starved, mass transfer limits.' : ' kS < hG: the gas keeps up, the surface reaction limits.'}`,
  },
  /** Topic 5 slide 18, in nm/min */
  'cvd-v': {
    unit: 'nm/min', rel: 0.02,
    value: ({ ks, hg, Y }) => ((ks * hg) / (ks + hg)) * (2.5e19 / 5e22) * Y * 1e7 * 60,
    solution: ({ ks, hg, Y }, a) => `v = [kS·hG/(kS + hG)]·(CT/N1)·Y. kS·hG/(kS + hG) = ${ks} × ${hg}/${g3(ks + hg)} = ${g3((ks * hg) / (ks + hg))} cm/s; CT/N1 = 2.5 × 10¹⁹/5.0 × 10²² = 5 × 10⁻⁴; × Y = ${Y}: v = ${sci(((ks * hg) / (ks + hg)) * 5e-4 * Y)} cm/s = ${g3(a)} nm/min (× 10⁷ nm/cm × 60 s/min).`,
  },
  /** Topic 5 slide 40: λ ≈ 5 × 10⁻⁵ m at 1 Torr, ∝ 1/P */
  mfp: {
    unit: 'm', rel: 0.02,
    value: ({ p }) => 5e-5 / 10 ** p,
    solution: ({ p }, a) => `The mean free path scales as 1/P: λ = 5 × 10⁻⁵ m × (1 Torr / 10^${p} Torr) = ${sci(a)} m.`,
    fmt: { p: (n) => `10^${n}` },
  },
  'ml-time': {
    unit: 's', rel: 0.02,
    value: ({ p }) => 1e-6 / 10 ** p,
    solution: ({ p }, a) => `The time to collect a monolayer scales as 1/P: 1 s at 10⁻⁶ Torr, so at 10^${p} Torr it is 10⁻⁶/10^${p} = ${sci(a)} s.`,
    fmt: { p: (n) => `10^${n}` },
  },
  /** Topic 6 slide 23 */
  flux: {
    unit: 'cm⁻² s⁻¹', rel: 0.02,
    value: ({ P, M, T }) => (2.64e20 * P) / Math.sqrt(M * T),
    solution: ({ P, M, T }, a) => `φ = 2.64 × 10²⁰ · P/√(MT) = 2.64 × 10²⁰ × ${sci(P)}/√(${M} × ${T}) = 2.64 × 10²⁰ × ${sci(P)}/${g3(Math.sqrt(M * T))} = ${sci(a)} cm⁻² s⁻¹.`,
    fmt: { P: sci },
  },
  /** Topic 6 slide 25: one RHEED period per monolayer (a/2 for a zinc-blende (001) surface) */
  rheed: {
    unit: 'µm/h', rel: 0.02,
    value: ({ per, a }) => (a / 2 / 10 / per) * 3.6,
    solution: ({ per, a }, a2) => `One oscillation is one monolayer, a/2 = ${a}/2 = ${g3(a / 2)} Å = ${g3(a / 20)} nm thick, grown in ${per} s: ${g3(a / 20 / per)} nm/s × 3600 s/h = ${g3(a2)} µm/h.`,
  },
  /** Topic 6 slides 5–6, in % */
  mismatch: {
    unit: '%', rel: 0.02,
    value: ({ af, as }) => (100 * (af - as)) / as,
    solution: ({ af, as }, a) => `f = (a_film − a_sub)/a_sub = (${af} − ${as})/${as} = ${g3(a / 100)}, i.e. ${g3(a)} %. ${a > 0 ? 'Positive: the film is compressed in the plane to fit.' : 'Negative: the film is stretched in the plane to fit.'}`,
  },
  /* ── Topic 7: lithography ─────────────────────────────────────────── */
  /** slide 8: R = k₁λ/NA */
  'litho-r': {
    unit: 'nm', rel: 0.02,
    value: ({ lam, NA, k1 }) => (k1 * lam) / NA,
    solution: ({ lam, NA, k1 }, a) => `R = k₁λ/NA = ${k1} × ${lam} nm / ${NA} = ${g3(a)} nm. Smaller k₁, shorter λ or larger NA all shrink R.`,
  },
  /** slide 9: DOF = ±k₂λ/NA² */
  'litho-dof': {
    unit: 'nm', rel: 0.02,
    value: ({ lam, NA, k2 }) => (k2 * lam) / (NA * NA),
    solution: ({ lam, NA, k2 }, a) => `DOF = ±k₂λ/NA² = ${k2} × ${lam} nm / ${NA}² = ${k2} × ${lam} / ${g3(NA * NA)} = ±${g3(a)} nm. It falls as 1/NA², so a high-NA lens needs a flat wafer.`,
  },
  /** slide 8: the NA a target resolution needs */
  'litho-na': {
    unit: '', rel: 0.02,
    value: ({ lam, R, k1 }) => (k1 * lam) / R,
    solution: ({ lam, R, k1 }, a) => `NA = k₁λ/R = ${k1} × ${lam} nm / ${R} nm = ${g3(a)}.${a > 1 ? ' Above 1: only possible with an immersion fluid (NA = n sin α, n > 1).' : ''}`,
  },
  /** slides 8 and 17: NA = n sin α */
  'na-n': {
    unit: '', rel: 0.02,
    value: ({ n, s }) => n * s,
    solution: ({ n, s }, a) => `NA = n sin α = ${n} × ${s} = ${g3(a)}.${n > 1 ? ' The fluid’s index lifts NA above the dry limit of 1.' : ' In air (n = 1) NA can never exceed 1.'}`,
  },
  /** slide 7: Φ = 1.22λf/d (λ in nm, f and d in mm) → µm */
  airy: {
    unit: 'µm', rel: 0.02,
    value: ({ lam, f, d }) => (1.22 * lam * 1e-3 * f) / d,
    solution: ({ lam, f, d }, a) => `Φ = 1.22λf/d = 1.22 × ${lam} nm × ${f} mm / ${d} mm = 1.22 × ${lam / 1000} µm × ${g3(f / d)} = ${g3(a)} µm, the radius of the first dark ring.`,
  },
  /** slide 10: MTF */
  mtf: {
    unit: '', rel: 0.02,
    value: ({ imax, imin }) => (imax - imin) / (imax + imin),
    solution: ({ imax, imin }, a) => `MTF = (I_max − I_min)/(I_max + I_min) = (${imax} − ${imin})/(${imax} + ${imin}) = ${g3(imax - imin)}/${g3(imax + imin)} = ${g3(a)}. ${a >= 0.5 ? 'Above ≈ 0.5: the resist can recognise the feature.' : 'Below ≈ 0.5: the resist cannot recognise it.'}`,
  },
  /** slide 11: S = s/d or NA_c/NA_p */
  coherence: {
    unit: '', rel: 0.02,
    value: ({ nac, nap }) => nac / nap,
    solution: ({ nac, nap }, a) => `S = NA_condenser / NA_projection = ${nac} / ${nap} = ${g3(a)}. ${a < 0.5 ? 'More coherent than the usual 0.5–0.7.' : a > 0.7 ? 'Less coherent than the usual 0.5–0.7.' : 'Inside the usual 0.5–0.7.'}`,
  },
  /** slide 14: W_min ≈ √(λg) (λ nm, g µm) → µm */
  wmin: {
    unit: 'µm', rel: 0.02,
    value: ({ lam, g }) => Math.sqrt((lam / 1000) * g),
    solution: ({ lam, g }, a) => `W_min ≈ √(λg) = √(${lam / 1000} µm × ${g} µm) = √${g3((lam / 1000) * g)} µm² = ${g3(a)} µm.`,
  },
  /** slide 14: the Fresnel range ends at g = W²/λ (W µm, λ nm) → µm */
  'fresnel-gmax': {
    unit: 'µm', rel: 0.02,
    value: ({ W, lam }) => (W * W) / (lam / 1000),
    solution: ({ W, lam }, a) => `Fresnel diffraction applies for λ < g < W²/λ. W²/λ = ${W}² µm² / ${lam / 1000} µm = ${g3(a)} µm.`,
  },
  /** slide 2: 0.7× in linear dimension every 3 years */
  roadmap: {
    unit: 'nm', rel: 0.03,
    value: ({ start, years }) => start * Math.pow(0.7, years / 3),
    solution: ({ start, years }, a) => `${years} years is ${g3(years / 3)} three-year steps: ${start} nm × 0.7^${g3(years / 3)} = ${start} × ${g3(Math.pow(0.7, years / 3))} = ${g3(a)} nm.`,
  },
  /** slide 18: photon energy E = hc/λ, hc = 1240 eV·nm */
  'photon-e': {
    unit: 'eV', rel: 0.02,
    value: ({ lam }) => 1239.84 / lam,
    solution: ({ lam }, a) => `E = hc/λ = 1240 eV·nm / ${lam} nm = ${g3(a)} eV.`,
  },
  /** slide 18 (corrected): electron de Broglie wavelength, λ = h/√(2meE) = 1.226/√E nm (E in eV, non-relativistic) → Å */
  'debroglie-e': {
    unit: 'Å', rel: 0.03,
    value: ({ keV }) => (12.264 / Math.sqrt(keV * 1000)),
    solution: ({ keV }, a) => `λ = h/p = h/√(2m_eE) = 12.26 Å/√(E in eV) = 12.26/√${keV * 1000} = ${g3(a)} Å (relativity shortens it by ~${g3((keV / 1022) * 100)} %). Not hc/E = ${g3(12398 / (keV * 1000))} Å, the photon relation.`,
  },
  /* ── Topic 8: quantum structures ──────────────────────────────────── */
  /** slide 5: E = ħ²k²/2m (k nm⁻¹, m in m₀) → meV */
  'free-e': {
    unit: 'meV', rel: 0.02,
    value: ({ k, m }) => (1000 * HB * k * k) / m,
    solution: ({ k, m }, a) => `E = ħ²k²/2m = (ħ²/2m₀)·k²/(m*/m₀) = 38.1 meV·nm² × ${k}² nm⁻² / ${m} = ${g3(a)} meV.`,
  },
  /** slides 7–8: Eₙ = n²π²ħ²/(2mL²) → meV */
  'well-e': {
    unit: 'meV', rel: 0.02,
    value: ({ n, L, m }) => (1000 * n * n * Math.PI * Math.PI * HB) / (m * L * L),
    solution: ({ n, L, m }, a) => `Eₙ = n²π²ħ²/(2m*L²) = n² × π² × (ħ²/2m₀) / ((m*/m₀)·L²) = ${n}² × 9.87 × 38.1 meV·nm² / (${m} × ${L}² nm²) = ${n * n} × ${g3((1000 * Math.PI * Math.PI * HB) / (m * L * L))} meV = ${g3(a)} meV.`,
  },
  /** slide 8: the spacing between two levels → meV */
  'well-de': {
    unit: 'meV', rel: 0.02,
    value: ({ n1, n2, L, m }) => (1000 * (n2 * n2 - n1 * n1) * Math.PI * Math.PI * HB) / (m * L * L),
    solution: ({ n1, n2, L, m }, a) => `E₁ = π²ħ²/(2m*L²) = ${g3((1000 * Math.PI * Math.PI * HB) / (m * L * L))} meV for L = ${L} nm, m* = ${m}m₀. E${n2} − E${n1} = (${n2}² − ${n1}²)E₁ = ${n2 * n2 - n1 * n1} × E₁ = ${g3(a)} meV.`,
  },
  /** slides 9, 11: the e1 → hh1 transition of a well → eV */
  'well-photon': {
    unit: 'eV', rel: 0.01,
    value: ({ Eg, L, me, mh }) => Eg + (Math.PI * Math.PI * HB) / (L * L) * (1 / me + 1 / mh),
    solution: ({ Eg, L, me, mh }, a) => {
      const e = (Math.PI * Math.PI * HB) / (me * L * L)
      const h = (Math.PI * Math.PI * HB) / (mh * L * L)
      return `Treat both bands as infinite wells. e1 = π²ħ²/(2m_eL²) = 0.376 eV·nm² / (${me} × ${L}²) = ${g3(e * 1000)} meV; hh1 = 0.376 / (${mh} × ${L}²) = ${g3(h * 1000)} meV. Photon = Eg + e1 + hh1 = ${Eg} + ${g3(e)} + ${g3(h)} = ${g3(a)} eV (${g3(1239.84 / a)} nm). Confinement blue-shifts it above the band gap.`
    },
  },
  /** slide 7: the normalisation constant A = √(2/L) → nm^(−1/2) */
  norm: {
    unit: 'nm^-½', rel: 0.02,
    value: ({ L }) => Math.sqrt(2 / L),
    solution: ({ L }, a) => `Require ∫₀ᴸ |ψ|² dx = 1 with ψ = A sin(nπx/L). sin² = ½(1 − cos(2nπx/L)); the cosine integrates to zero over whole periods, so ∫₀ᴸ sin² dx = L/2. Then A²·L/2 = 1, A = √(2/L) = √(2/${L} nm) = ${g3(a)} nm^-½.`,
  },
  /** slide 12: wire levels → meV */
  'wire-e': {
    unit: 'meV', rel: 0.02,
    value: ({ a, b, n, l, m }) => (1000 * HB * Math.PI * Math.PI * ((n * n) / (a * a) + (l * l) / (b * b))) / m,
    solution: ({ a, b, n, l, m }, v) => `At k_x = 0: E = (ħ²π²/2m*)(n²/a² + l²/b²) = (0.376 eV·nm² / ${m}) × (${n}²/${a}² + ${l}²/${b}²) = ${g3(0.376 / m)} eV·nm² × ${g3((n * n) / (a * a) + (l * l) / (b * b))} nm⁻² = ${g3(v)} meV.`,
  },
  /** slide 13: dot levels → meV */
  'dot-e': {
    unit: 'meV', rel: 0.02,
    value: ({ a, n, l, j, m }) => (1000 * HB * Math.PI * Math.PI * (n * n + l * l + j * j)) / (m * a * a),
    solution: ({ a, n, l, j, m }, v) => `A cube of side a: E = (ħ²π²/2m*a²)(n² + l² + j²) = (0.376 eV·nm² / (${m} × ${a}²)) × (${n * n} + ${l * l} + ${j * j}) = ${g3((376 / (m * a * a)))} meV × ${n * n + l * l + j * j} = ${g3(v)} meV.`,
  },
  /** slide 25: 3D DoS → eV⁻¹ cm⁻³ */
  dos3: {
    unit: 'eV⁻¹ cm⁻³', rel: 0.03,
    value: ({ m, E }) => (1 / (2 * Math.PI * Math.PI)) * Math.pow(m / HB, 1.5) * Math.sqrt(E / 1000) * 1e21,
    solution: ({ m, E }, a) => `ρ = (1/2π²)(2m/ħ²)^(3/2) √E. 2m/ħ² = m*/(ħ²/2m₀) = ${m}/0.0381 = ${g3(m / HB)} eV⁻¹nm⁻²; to the 3/2: ${g3(Math.pow(m / HB, 1.5))}; ÷ 2π² (19.74) × √(${E / 1000} eV) = ${g3(a / 1e21)} eV⁻¹ nm⁻³ = ${sci(a)} eV⁻¹ cm⁻³.`,
  },
  /** slide 27: 2D DoS m/(πħ²) → eV⁻¹ cm⁻² */
  dos2: {
    unit: 'eV⁻¹ cm⁻²', rel: 0.03,
    value: ({ m }) => ((m / HB) / (2 * Math.PI)) * 1e14,
    solution: ({ m }, a) => `ρ = m*/(πħ²) = (1/2π)(2m*/ħ²) = (${m}/0.0381 eV⁻¹nm⁻²)/(2π) = ${g3(a / 1e14)} eV⁻¹ nm⁻² = ${sci(a)} eV⁻¹ cm⁻², the same at every energy above the subband edge.`,
  },
  /** slide 29 (corrected): 1D DoS (1/π)√(2m/ħ²)E^(−1/2) → eV⁻¹ cm⁻¹ */
  dos1: {
    unit: 'eV⁻¹ cm⁻¹', rel: 0.03,
    value: ({ m, E }) => (1 / Math.PI) * Math.sqrt(m / HB) / Math.sqrt(E / 1000) * 1e7,
    solution: ({ m, E }, a) => `ρ = (1/π)√(2m*/ħ²)·E^(−½) = (1/π) × √(${g3(m / HB)} eV⁻¹nm⁻²) / √(${E / 1000} eV) = ${g3(a / 1e7)} eV⁻¹ nm⁻¹ = ${sci(a)} eV⁻¹ cm⁻¹. (The slide’s 1/2π gives half this; counting −k to +k gives N = 2kL/π.)`,
  },
  /** slide 25: N = k³V/3π² states below k → count */
  nstates3: {
    unit: 'states', rel: 0.02,
    value: ({ k, L }) => (k ** 3 * L ** 3) / (3 * Math.PI * Math.PI),
    solution: ({ k, L }, a) => `N = (4πk³/3)/(π³/L³) × 2 × ⅛ = k³L³/(3π²) = (${k} nm⁻¹ × ${L} nm)³ / 29.6 = ${g3((k * L) ** 3)} / 29.6 = ${g3(a)} states.`,
  },
  /** Topic 3 slide 6: the answer is the three indices written as one number, e.g. 632 for (632) */
  miller: {
    unit: '(hkl)', rel: 1e-9,
    value: ({ x, y, z }) => {
      const [h, k, l] = millerFromIntercepts(x, y, z === 0 ? Infinity : z)
      return h * 100 + k * 10 + l
    },
    solution: ({ x, y, z }) => {
      const zz = z === 0 ? Infinity : z
      const [h, k, l] = millerFromIntercepts(x, y, zz)
      const rec = [x, y, zz].map((v) => (Number.isFinite(v) ? `1/${v}` : '0'))
      return `Reciprocals of the intercepts: (${rec.join(', ')}). Clear the fractions by multiplying through by the smallest common factor and reduce: (${h} ${k} ${l}).`
    },
    fmt: { z: (n) => (n === 0 ? '∞ (parallel to z)' : String(n)) },
  },
}

/** a seeded pick of variable values */
function pick(vars: Record<string, number[]>, seed: number): V {
  // scramble the seed (consecutive seeds would otherwise start the LCG in the same place)
  let s = Math.imul((seed >>> 0) ^ 0x9e3779b9, 0x85ebca6b) >>> 0 || 1
  s = Math.imul(s ^ (s >>> 13), 0xc2b2ae35) >>> 0 || 1
  const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296)
  rnd()
  return Object.fromEntries(Object.entries(vars).map(([k, list]) => [k, seed === 0 ? list[0] : list[Math.floor(rnd() * list.length)]]))
}

/** the question with its numbers filled in (seed 0: the stored values) */
export function realise(q: Question, seed: number): Question {
  if (q.type !== 'calc' || !q.answer.gen) return q
  const g = GENS[q.answer.gen.fn]
  const v = pick(q.answer.gen.vars, seed)
  const value = g.value(v)
  const fill = (t: string) => t.replace(/\{(\w+)\}/g, (_, k) => (g.fmt?.[k] ?? String)(v[k]))
  return { ...q, prompt: fill(q.prompt), answer: { ...q.answer, value, tol: Math.max(Math.abs(value) * g.rel, 1e-30), unit: g.unit }, workedSolution: g.solution(v, value) }
}
