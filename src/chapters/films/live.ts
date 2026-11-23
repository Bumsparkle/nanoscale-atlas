/** per-frame MBE state shared by the scene and the RHEED panel (no React renders) */
export const mbeLive = {
  /** monolayers grown since the last reset */
  ml: 0,
  /** recent (time, intensity) samples for the RHEED trace */
  trace: [] as { t: number; I: number }[],
  t: 0,
}
