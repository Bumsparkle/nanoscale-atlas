import * as THREE from 'three/webgpu'
import { useEffect } from 'react'
import { overlay, type ScreenLabel } from '../cellRuntime'
import { rig } from '../rig'
import { transition } from '../transition'
import type { LayerId } from '../../chapters/cmos/layers'

/**
 * Helpers shared by the hand-built layers of Chapters 2 and 3: dive
 * handlers, the screen-label publisher and a doping colour map.
 */

/** scroll past min distance dives to `next`, past max surfaces to `prev` */
export function useDive(prev: LayerId | null, next: LayerId | null, opts: { via?: [number, number, number]; home?: [number, number, number] } = {}) {
  const key = `${prev}|${next}|${opts.via?.join()}|${opts.home?.join()}`
  useEffect(() => {
    rig.setHome({ target: opts.home ?? [0, 0, 0] })
    rig.goHome()
    rig.handlers = {
      onDiveIn: next ? () => void transition.go(next, { via: opts.via }) : undefined,
      onSurface: prev ? () => void transition.go(prev) : undefined,
    }
    return () => {
      rig.handlers = {}
      overlay.labels = []
      overlay.version++
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}

/** project a world point to a screen label */
export function label(camera: THREE.Camera, size: { width: number; height: number }, id: string, text: string, sub: string | undefined, p: THREE.Vector3 | [number, number, number], group: ScreenLabel['group'] = 'right'): ScreenLabel {
  const v = (Array.isArray(p) ? new THREE.Vector3(...p) : p.clone()).project(camera)
  return { id, text, sub, x: ((v.x + 1) / 2) * size.width, y: ((1 - v.y) / 2) * size.height, group, visible: v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1 }
}

/** publish labels; the version only bumps when the set of texts changes */
export function publish(labels: ScreenLabel[]) {
  overlay.labels = labels
  let h = labels.length
  for (const l of labels) for (let i = 0; i < l.text.length; i += 3) h = (h * 31 + l.text.charCodeAt(i)) | 0
  for (const l of labels) if (l.sub) for (let i = 0; i < l.sub.length; i += 2) h = (h * 17 + l.sub.charCodeAt(i)) | 0
  if (overlay.version !== h) overlay.version = h
}

/**
 * Dopant concentration → colour, on a log scale of Cs/C0 from 0.01 to 10:
 * pale silicon grey for lightly doped, through amber, to red for heavily doped.
 */
const STOPS: [number, THREE.Color][] = [
  [-2, new THREE.Color('#3d4a57')],
  [-1, new THREE.Color('#5a6d80')],
  [-0.4, new THREE.Color('#8ea2b2')],
  [0, new THREE.Color('#d9b45a')],
  [0.5, new THREE.Color('#f08a3c')],
  [1, new THREE.Color('#e0453c')],
]
export function dopingColour(ratio: number, out = new THREE.Color()) {
  const x = Math.log10(Math.max(1e-3, ratio))
  if (x <= STOPS[0][0]) return out.copy(STOPS[0][1])
  for (let i = 1; i < STOPS.length; i++) {
    if (x <= STOPS[i][0]) {
      const [a, ca] = STOPS[i - 1]
      const [b, cb] = STOPS[i]
      return out.copy(ca).lerp(cb, (x - a) / (b - a))
    }
  }
  return out.copy(STOPS[STOPS.length - 1][1])
}
export const DOPING_STOPS = STOPS.map(([x, c]) => ({ x, css: '#' + c.getHexString() }))

/** deterministic random numbers */
export function rand(seed: number) {
  let s = seed >>> 0 || 1
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

/** a tab drawn at its own scale: metres per scene unit for the scale bar (cleared on unmount) */
export function useUnits(metresPerUnit: number | null) {
  useEffect(() => {
    rig.unitOverride = metresPerUnit
    return () => void (rig.unitOverride = null)
  }, [metresPerUnit])
}

/**
 * The resting camera of a hand-built layer, per tab. Registered with the rig
 * so it survives the rig being reset to the layer's defaults (which happens
 * after the scene mounts when the renderer finishes starting up).
 */
export function useTabHome(layer: LayerId, home: Partial<{ target: [number, number, number]; polar: number; azimuth: number; dist: number }>, key: string) {
  useEffect(() => {
    rig.homeProvider = { layer, fn: () => home }
    rig.setHome(home)
    rig.goHome()
    return () => {
      if (rig.homeProvider?.layer === layer) rig.homeProvider = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer, key])
}
