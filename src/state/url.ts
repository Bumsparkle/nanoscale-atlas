import { defaultTab, LAYER_BY_ID, LAYERS, type LayerId } from '../chapters/cmos/layers'
import { FROM_URL_LAYER, MASK_IDS, URL_LAYER } from '../chapters/cmos/layout'
import { K0_TABLE } from '../chapters/growth/physics'
import { SNAP_TARGETS, useAtlas, type AtlasState, type CutTarget, type View } from './store'

/**
 * URL ⇄ store. The URL is the deep-link format:
 *   /cmos/inverter/nmos?view=section&cut=slide27&step=12&focus=poly&a=1
 * Layer changes push history entries (so Back goes up a level); everything
 * else replaces. Free camera orbiting never touches the URL.
 */

type UrlState = Pick<AtlasState, 'page' | 'layer' | 'device' | 'view' | 'focus' | 'step' | 'inputs' | 'vg' | 'layoutLayers' | 'mode' | 'lessonAt' | 'tab'> & {
  hkl: [number, number, number]
  k0: number
  frac: number
  rv: 'drill' | 'coverage' | 'exam'
  cut: CutTarget | number | null
  cutAxis: 'x' | 'y'
}

const VIEWS: View[] = ['explore', 'section', 'masks', 'fab', 'logic', 'layout']

export function parseUrl(loc: { pathname: string; search: string }): Partial<UrlState> {
  const segs = loc.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean)
  const q = new URLSearchParams(loc.search)
  const out: Partial<UrlState> = {}

  if (segs[0] === 'style') return { page: 'style' }
  if (segs[0] === 'debug') return { page: 'debug' }
  // the door opens onto the cleanroom, which renders behind it
  if (segs.length === 0) return { page: 'home', layer: 'cleanroom' }
  if (!['cmos', 'growth', 'clean', 'films', 'epi'].includes(segs[0])) return { page: 'home' }

  out.page = 'atlas'
  // device variant lives in the path at the transistor level
  const device = segs[0] === 'cmos' && segs[2] === 'pmos' ? 'pmos' : 'nmos'
  const norm = segs.map((s, i) => (i === 2 && segs[0] === 'cmos' && (s === 'pmos' || s === 'nmos') ? 'nmos' : s))
  const match = LAYERS.find((l) => l.path.join('/') === norm.join('/'))
  const fallback: Record<string, LayerId> = { cmos: 'cell', growth: 'sand', clean: 'cleanroom', films: 'deposition', epi: 'mbe' }
  out.layer = (match?.id ?? fallback[segs[0]]) as LayerId
  out.device = device
  const tab = q.get('tab')
  out.tab = tab && LAYER_BY_ID[out.layer].tabs?.some((t) => t.id === tab) ? tab : defaultTab(out.layer)
  const hkl = q.get('hkl')?.match(/^(-?\d)[, ]?(-?\d)[, ]?(-?\d)$/)
  if (hkl) out.hkl = [+hkl[1], +hkl[2], +hkl[3]]
  const k0 = q.get('k0')
  if (k0 != null && +k0 > 0 && +k0 <= 2) out.k0 = +k0
  const frac = q.get('f')
  if (frac != null && +frac >= 0 && +frac <= 0.95) out.frac = +frac

  const v = q.get('view') as View | null
  out.view = v && VIEWS.includes(v) ? v : 'explore'
  out.focus = q.get('focus')
  const step = q.get('step')
  out.step = step != null && !Number.isNaN(+step) ? Math.max(0, Math.round(+step)) : undefined
  const cut = q.get('cut')
  if (cut && cut in SNAP_TARGETS) out.cut = cut as CutTarget
  else if (cut && !Number.isNaN(+cut)) {
    out.cut = +cut
    out.cutAxis = q.get('axis') === 'x' ? 'x' : 'y'
  }
  const a = q.get('a')
  const b = q.get('b')
  out.inputs = { a: a === '1' ? 1 : 0, b: b === '1' ? 1 : 0 }
  const mode = q.get('mode')
  out.mode = mode === 'lesson' || mode === 'revise' ? mode : 'explore'
  out.lessonAt = q.get('at')
  const rv = q.get('rv')
  if (rv === 'coverage' || rv === 'exam' || rv === 'drill') out.rv = rv
  const layers = q.get('layers')
  if (layers != null) out.layoutLayers = layers.split(',').map((l) => FROM_URL_LAYER[l.trim()]).filter(Boolean)
  const vg = q.get('vg')
  if (vg != null && !Number.isNaN(+vg)) out.vg = Math.min(1, Math.max(0, +vg))
  return out
}

export function buildUrl(s: AtlasState): string {
  if (s.page === 'home') return '/' + (BOOT.forceWebGL ? '?gl=webgl' : '')
  if (s.page === 'style') return '/style'
  if (s.page === 'debug') return '/debug' + (BOOT.forceWebGL ? '?gl=webgl' : '')
  const layer = LAYERS.find((l) => l.id === s.layer)!
  const path = layer.path.map((seg, i) => (i === 2 && seg === 'nmos' ? s.device : seg))
  const q = new URLSearchParams()
  if (s.tab && s.tab !== defaultTab(s.layer)) q.set('tab', s.tab)
  if (s.layer === 'lattice' && s.tab === 'miller') q.set('hkl', s.crystal.hkl.join(','))
  if (s.view !== 'explore' && (s.layer === 'cell')) q.set('view', s.view)
  if (s.view === 'section' && s.layer === 'cell') {
    if (s.section.locked) q.set('cut', s.section.locked)
    else {
      q.set('cut', s.section.offset.toFixed(1))
      q.set('axis', s.section.axis)
    }
  }
  if (s.view === 'fab' && s.layer === 'cell') q.set('step', String(Math.round(s.step)))
  if (s.view === 'logic' || s.layer === 'transistor') {
    if (s.inputs.a) q.set('a', '1')
    if (s.inputs.b) q.set('b', '1')
  }
  if (s.layer === 'transistor' && s.vg > 0) q.set('vg', s.vg.toFixed(2))
  if (s.view === 'layout' && s.layer === 'cell' && s.layoutLayers.length !== MASK_IDS.length)
    q.set('layers', MASK_IDS.filter((m) => s.layoutLayers.includes(m)).map((m) => URL_LAYER[m]).join(','))
  if (s.focus) q.set('focus', s.focus)
  if (s.mode !== 'explore') q.set('mode', s.mode)
  if (s.mode === 'lesson' && s.lessonAt) q.set('at', s.lessonAt)
  if (s.mode === 'revise' && s.revise.tab !== 'drill') q.set('rv', s.revise.tab)
  if (BOOT.forceWebGL) q.set('gl', 'webgl')
  if (BOOT.shots) q.set('shots', '1')
  const qs = q.toString()
  return '/' + path.join('/') + (qs ? '?' + qs : '')
}

export function applyUrl(loc: { pathname: string; search: string }) {
  const p = parseUrl(loc)
  const st = useAtlas.getState()
  const patch: Partial<AtlasState> = {}
  if (p.page) patch.page = p.page
  if (p.layer) patch.layer = p.layer
  if (p.device) patch.device = p.device
  if (p.tab != null) patch.tab = p.tab
  if (p.hkl) patch.crystal = { ...st.crystal, hkl: p.hkl }
  if (p.k0 != null || p.frac != null) patch.growth = { ...st.growth, k0: p.k0 ?? st.growth.k0, frac: p.frac ?? st.growth.frac, dopant: p.k0 != null ? (K0_TABLE.find((d) => d.k0 === p.k0)?.el ?? '') : st.growth.dopant }
  if (p.view) patch.view = p.view
  if (p.page === 'atlas') patch.focus = p.focus ?? null
  if (p.step != null) patch.step = p.step
  if (p.inputs) patch.inputs = p.inputs
  if (p.vg != null) patch.vg = p.vg
  if (p.mode) patch.mode = p.mode
  if (p.lessonAt !== undefined && p.page === 'atlas') patch.lessonAt = p.lessonAt
  if (p.rv) patch.revise = { ...st.revise, tab: p.rv }
  if (p.layoutLayers) patch.layoutLayers = p.layoutLayers
  else if (p.page === 'atlas') patch.layoutLayers = [...MASK_IDS]
  st.set(patch)
  if (p.cut != null) {
    if (typeof p.cut === 'string') {
      const t = SNAP_TARGETS[p.cut]
      st.setSection({ axis: t.axis, offset: t.offset, locked: p.cut, gap: 1 })
    } else {
      st.setSection({ axis: p.cutAxis ?? 'y', offset: p.cut, locked: null, gap: 0 })
    }
  }
}

/** Flags read once at boot and preserved across URL rewrites. */
export const BOOT = (() => {
  const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams()
  return { forceWebGL: q.get('gl') === 'webgl', shots: q.get('shots') === '1' }
})()

let started = false
export function startUrlSync() {
  if (started) return
  started = true
  applyUrl(window.location)
  window.addEventListener('popstate', () => applyUrl(window.location))
  let last = buildUrl(useAtlas.getState())
  let lastLayer = useAtlas.getState().layer + useAtlas.getState().page
  history.replaceState(null, '', last)
  useAtlas.subscribe((s) => {
    const next = buildUrl(s)
    if (next === last) return
    const layerKey = s.layer + s.page
    if (layerKey !== lastLayer) history.pushState(null, '', next)
    else history.replaceState(null, '', next)
    last = next
    lastLayer = layerKey
  })
}

/** Navigate in-app (used by links). */
export function navigate(path: string) {
  history.pushState(null, '', path)
  applyUrl(window.location)
}
