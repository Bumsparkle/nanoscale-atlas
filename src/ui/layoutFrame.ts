/**
 * Where the flat layout sits on screen. Shared by the SVG drawing and the
 * camera, so the 3D cell seen from above and the drawn masks line up during
 * the crossfade. Layout point (x, y) λ → screen (cx + (x − 25)s, cy − (y − 2)s).
 */
export const LAYOUT_CENTRE = { x: 25, y: 2 }
export const LAYOUT_EXTENT = { w: 66, h: 32 } // cell 62λ × 28λ plus a margin for callouts

export interface LayoutFrame {
  /** px per λ */
  s: number
  cx: number
  cy: number
  /** width of the side panel on the right (0 on mobile) */
  panelW: number
}

export function layoutFrame(W: number, H: number, leftPanelW = 0): LayoutFrame {
  const mobile = W <= 720
  // the rules panel narrows while the lesson / revise panel is open on the left
  const panelW = mobile ? 0 : leftPanelW ? 352 : 440
  const left = 32 + (mobile ? 0 : leftPanelW)
  const right = W - panelW - 32
  const top = mobile ? 120 : 92
  const bottom = mobile ? H * 0.5 : H - 104
  const s = Math.max(4, Math.min((right - left) / LAYOUT_EXTENT.w, (bottom - top) / LAYOUT_EXTENT.h))
  return { s, cx: (left + right) / 2, cy: (top + bottom) / 2, panelW }
}

export const toScreen = (f: LayoutFrame, x: number, y: number): [number, number] => [f.cx + (x - LAYOUT_CENTRE.x) * f.s, f.cy - (y - LAYOUT_CENTRE.y) * f.s]
export const toLayout = (f: LayoutFrame, px: number, py: number): [number, number] => [LAYOUT_CENTRE.x + (px - f.cx) / f.s, LAYOUT_CENTRE.y - (py - f.cy) / f.s]

/** near-orthographic camera: a 2.5° field of view from far away */
export const ORTHO_FOV = 2.5

/** width of the lesson / revise panel on the left (desktop) */
export const LEARN_PANEL_W = 400
