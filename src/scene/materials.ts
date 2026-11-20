import * as THREE from 'three/webgpu'
import {
  attribute, clamp, color, cos, dot, float, mix, mx_worley_noise_float, normalWorld, positionWorld,
  cameraPosition, sqrt, step, fract, vec3, uniform, smoothstep, abs, max,
} from 'three/tsl'

/**
 * Physical-looking materials that keep the slide legend's meaning.
 * Exterior faces are physical (silicon grey-blue, poly grainy, aluminium
 * bright, resist amber, oxide transparent with thin-film interference).
 * Cut faces (vertex attribute `cap` = 1) switch to the slide 25 legend
 * greys, with oxide and metal hatched like the hand-drawn sections.
 */

export const LEGEND: Record<string, string> = {
  'si:p': '#f2f2f2',
  'si:nwell': '#d9d9d9',
  'si:n+': '#acacac',
  'si:p+': '#646464',
  poly: '#cfcfcf',
  gox: '#e9e9e9',
  ox: '#e9e9e9',
  fox: '#e9e9e9',
  al: '#d6daff',
  'al:plug': '#d6daff',
  resist: '#e8b25a',
  'resist:exposed': '#f4dcae',
}

const PHYS: Record<string, string> = {
  'si:p': '#4b555e',
  'si:nwell': '#3f5a6c',
  'si:n+': '#5b88ad',
  'si:p+': '#a07a55',
}

/** shared uniforms the scene animates */
export const matUniforms = {
  time: uniform(0),
  /** 0..1: fade metal and field oxide so buried objects show */
  xray: uniform(0),
}

const cap = () => attribute('cap', 'float')
const hatch = (density: number, width: number) =>
  step(1 - width, fract(positionWorld.x.add(positionWorld.y).add(positionWorld.z).mul(density)))

/** cut-face shading: flat, legend coloured, lit enough to read as a drawing */
// TSL node typings are too narrow for generic helpers; nodes are passed loosely here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type N = any

function withCap(m: THREE.MeshStandardNodeMaterial, key: string, phys: N, hatched = false) {
  const leg = color(LEGEND[key] ?? '#cccccc')
  const edge = key.startsWith('al') ? color('#3a46d8') : color('#5a5a5a')
  const legendCol: N = hatched ? mix(leg as N, edge as N, hatch(2.6, 0.16).mul(0.75)) : leg
  m.colorNode = mix(phys as N, legendCol.mul(0.62), cap())
  m.emissiveNode = legendCol.mul(cap()).mul(0.2)
  return m
}

function silicon(key: string) {
  const m = new THREE.MeshStandardNodeMaterial({ roughness: 0.42, metalness: 0.32 })
  withCap(m, key, color(PHYS[key]))
  m.roughnessNode = mix(float(0.42), float(1), cap())
  m.metalnessNode = mix(float(0.32), float(0), cap())
  return m
}

/**
 * Thin-film interference for SiO₂ on Si: two-beam reflectance at three
 * wavelengths, phase δ = 4π n d cosθt / λ, n = 1.46. Colour follows the
 * physical thickness (attribute tnm, in nm) and the viewing angle.
 */
function thinFilm() {
  const d = attribute('tnm', 'float')
  const V = cameraPosition.sub(positionWorld).normalize()
  const cosI = clamp(abs(dot(normalWorld, V)), 0, 1)
  const sinT = sqrt(float(1).sub(cosI.mul(cosI))).div(1.46)
  const cosT = sqrt(float(1).sub(sinT.mul(sinT)))
  const opd = d.mul(1.46 * 4 * Math.PI).mul(cosT)
  const lam = vec3(650, 540, 450)
  const refl = vec3(1).sub(cos(vec3(opd, opd, opd).div(lam))).mul(0.5)
  return refl
}

function oxide(key: string) {
  const m = new THREE.MeshPhysicalNodeMaterial({ roughness: 0.08, metalness: 0, transparent: true, depthWrite: false })
  const film = thinFilm()
  const V = cameraPosition.sub(positionWorld).normalize()
  const fres = float(1).sub(clamp(abs(dot(normalWorld, V)), 0, 1)).pow(3)
  // desaturate: interference colours are real but should read as a sheen, not paint
  const lum = dot(film, vec3(0.3, 0.55, 0.15))
  const sheen = mix(film, vec3(lum, lum, lum), 0.35)
  const phys = mix(vec3(0.03, 0.035, 0.04), sheen, 0.55)
  withCap(m, key, phys as never, true)
  const base = float(key === 'gox' ? 0.75 : 0.16).add(fres.mul(0.45))
  const faded = key === 'fox' ? base.mul(float(1).sub(matUniforms.xray.mul(0.75))) : base
  m.opacityNode = mix(faded, float(1), cap())
  m.roughnessNode = mix(float(0.08), float(1), cap())
  m.side = THREE.FrontSide
  return m
}

function poly() {
  const m = new THREE.MeshStandardNodeMaterial({ roughness: 0.55, metalness: 0.25 })
  // grains: polysilicon is many small crystals (slides 3, 37)
  // F2 − F1 of a Worley field: cells are grains, small values are grain boundaries
  const f1 = mx_worley_noise_float(positionWorld.mul(1.7), 1, 0)
  const f2 = mx_worley_noise_float(positionWorld.mul(1.7), 1, 1)
  const edge = f2.sub(f1)
  const facet = mx_worley_noise_float(positionWorld.mul(1.7).add(31.7))
  const base = mix(color('#7a6d61'), color('#a29483'), facet)
  const boundary = smoothstep(0.12, 0.02, edge)
  withCap(m, 'poly', mix(base, color('#4a423b'), boundary.mul(0.55)) as never)
  m.roughnessNode = mix(mix(float(0.35), float(0.7), facet), float(1), cap())
  return m
}

function aluminium(key: string) {
  const m = new THREE.MeshStandardNodeMaterial({ roughness: 0.3, metalness: 1 })
  const grain = mx_worley_noise_float(positionWorld.mul(1.3)).mul(0.05)
  const base = key === 'al:plug' ? color('#b9bfc5') : color('#e4e7ea')
  withCap(m, key, base.sub(grain) as never, true)
  m.roughnessNode = mix(float(0.34).add(grain), float(1), cap())
  m.metalnessNode = mix(float(1), float(0), cap())
  // x-ray: wiring turns to a faint ghost when a buried object is inspected
  m.transparent = true
  m.opacityNode = mix(float(1).sub(matUniforms.xray.mul(0.84)), float(1), cap())
  m.depthWrite = true
  return m
}

function resist(key: string) {
  const m = new THREE.MeshPhysicalNodeMaterial({ roughness: 0.35, metalness: 0, transparent: true, depthWrite: false })
  const dose = attribute('dose', 'float')
  const phys = mix(color('#c97f1e'), color('#f0d39a'), dose)
  withCap(m, key, phys as never)
  m.emissiveNode = mix(color('#2b1500'), color('#3a2a10'), dose).add(color(LEGEND[key]).mul(cap()).mul(0.2))
  m.opacityNode = mix(float(0.86), float(1), cap())
  return m
}

const cache = new Map<string, THREE.Material>()

export function materialFor(key: string): THREE.Material {
  let m = cache.get(key)
  if (m) return m
  if (key.startsWith('si:')) m = silicon(key)
  else if (key === 'ox' || key === 'gox' || key === 'fox') m = oxide(key)
  else if (key === 'poly') m = poly()
  else if (key.startsWith('al')) m = aluminium(key)
  else if (key.startsWith('resist')) m = resist(key)
  else m = new THREE.MeshStandardNodeMaterial({ color: '#888' })
  m.name = key
  cache.set(key, m)
  return m
}

/** draw order: opaque first, then translucent films from the bottom up */
export function renderOrderFor(key: string) {
  if (key === 'gox') return 2
  if (key === 'ox') return 3
  if (key === 'fox') return 4
  if (key.startsWith('resist')) return 5
  return 0
}

/** drafting grid under the cell: 1λ fine, 10λ coarse, fading out */
export function gridMaterial() {
  const m = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false })
  const p = positionWorld.xz
  const line = (s: number, w: number) => {
    const f = abs(fract(p.div(s).add(0.5)).sub(0.5)).mul(s)
    return max(step(f.x, float(w)), step(f.y, float(w)))
  }
  const fade = smoothstep(90, 25, p.length())
  const a = max(line(1, 0.025).mul(0.035), line(10, 0.05).mul(0.09)).mul(fade)
  m.colorNode = color('#8a9399')
  m.opacityNode = a
  return m
}
