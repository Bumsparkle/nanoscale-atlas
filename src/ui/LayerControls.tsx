import { useApp } from '../state/store'
import { channelStrength } from '../chapters/cmos/device'
import { transition } from '../scene/transition'
import './layercontrols.css'
import { SourceButton } from './source/Source'
import { T2 } from '../sources'
import { BandsPanel, CellsPanel, DefectsPanel, IngotPanel, MillerPanel, PolyPanel, PullerPanel, SandPanel, WafersPanel } from './growth/GrowthPanels'
import { ProcessLab } from './growth/ProcessLab'
import { CleanroomPanels, CleanWaferPanels } from './clean/CleanPanels'
import { DepositionPanels, MbePanels, SoiPanels, SurfacePanels } from './films/FilmPanels'
import { EbeamPanels, LithoPanels } from './litho/LithoPanels'
import { HeteroPanels, NanofabPanels, QbandsPanels, QmbePanels, QsamplePanels, QwavePanels } from './nano/NanoPanels'

/** gate voltage for the transistor layer (slides 12–14) */
function TransistorControls() {
  const device = useApp((s) => s.device)
  const vg = useApp((s) => s.vg)
  const set = useApp((s) => s.set)
  const s = channelStrength(device, vg)
  const on = s > 0.5
  const VDD = 1.0
  const state =
    device === 'nmos'
      ? on
        ? 'Gate high: the channel inverts to n-type; electrons flow source → drain. ON.'
        : 'Gate low: source–body and drain–body diodes OFF; no current. OFF.'
      : on
        ? 'Gate low: the channel inverts to p-type; holes flow source → drain. ON.'
        : 'Gate high: no channel. OFF.'
  return (
    <section className="lc" aria-label="Gate voltage">
      <div className="lc-row">
        <div className="seg" role="group" aria-label="Device">
          {(['nmos', 'pmos'] as const).map((d) => (
            <button key={d} aria-pressed={device === d} onClick={() => void transition.go('transistor', { device: d })}>
              {d === 'nmos' ? 'nMOS' : 'pMOS'}
            </button>
          ))}
        </div>
        <span className={'lc-state ' + (on ? 'on' : 'off')}>{on ? 'ON' : 'OFF'}</span>
      </div>
      <label className="lc-slider">
        <span className="eyebrow">gate voltage V<sub>G</sub></span>
        <input type="range" min={0} max={1} step={0.01} value={vg} onChange={(e) => set({ vg: +e.target.value })} />
        <span className="mono">{(vg * VDD).toFixed(2)} V</span>
      </label>
      <div className="lc-quick">
        <button className="chip" onClick={() => set({ vg: 0 })}>g = 0</button>
        <button className="chip" onClick={() => set({ vg: 1 })}>g = 1</button>
      </div>
      <p className="lc-note">
        {state} <SourceButton refs={device === 'nmos' ? [T2(11), T2(12)] : [T2(13)]} />
      </p>
      <p className="lc-fine mono">VDD = 1.0 V: modern processes use 1.0 V and below; 5 V in the 1980s.</p>
    </section>
  )
}

function LatticeControls() {
  const lattice = useApp((s) => s.lattice)
  const set = useApp((s) => s.set)
  const L = (p: Partial<typeof lattice>) => set({ lattice: { ...lattice, ...p } })
  return (
    <section className="lc" aria-label="Lattice">
      <span className="eyebrow lc-head">structure <SourceButton refs={[T2(3), T2(4)]} /></span>
      <div className="seg" role="group">
        {(['crystal', 'poly', 'amorphous'] as const).map((s) => (
          <button key={s} aria-pressed={lattice.structure === s} onClick={() => L({ structure: s })}>
            {s === 'crystal' ? 'single crystal' : s === 'poly' ? 'poly' : 'amorphous'}
          </button>
        ))}
      </div>
      <span className="eyebrow lc-head">dopant <SourceButton refs={[T2(5)]} /></span>
      <div className="seg" role="group">
        {(['none', 'P', 'B'] as const).map((d) => (
          <button key={d} aria-pressed={lattice.dopant === d} onClick={() => L({ dopant: d, structure: d === 'none' ? lattice.structure : 'crystal' })}>
            {d === 'none' ? 'pure Si' : d === 'P' ? 'P · group V' : 'B · group III'}
          </button>
        ))}
      </div>
    </section>
  )
}

export function LayerControls() {
  const layer = useApp((s) => s.layer)
  const tab = useApp((s) => s.tab)
  const focus = useApp((s) => s.focus)
  if (focus) return null
  switch (layer) {
    case 'transistor':
      return <TransistorControls />
    case 'lattice':
      if (tab === 'cells') return <CellsPanel />
      if (tab === 'miller') return <MillerPanel />
      if (tab === 'bands') return <BandsPanel />
      if (tab === 'defects') return <DefectsPanel />
      return <LatticeControls />
    case 'sand':
      return <SandPanel />
    case 'polysilicon':
      return <PolyPanel />
    case 'puller':
      return <PullerPanel />
    case 'ingot':
      return <IngotPanel />
    case 'wafers':
      return <WafersPanel />
    case 'wafer':
      return tab === 'process' ? <ProcessLab /> : tab === 'soi' ? <SoiPanels /> : <CleanWaferPanels />
    case 'deposition':
      return <DepositionPanels />
    case 'mbe':
      return <MbePanels />
    case 'surface':
      return <SurfacePanels />
    case 'litho':
      return <LithoPanels />
    case 'ebeam':
      return <EbeamPanels />
    case 'qmbe':
      return <QmbePanels />
    case 'qsample':
      return <QsamplePanels />
    case 'hetero':
      return <HeteroPanels />
    case 'qbands':
      return <QbandsPanels />
    case 'qwave':
      return <QwavePanels />
    case 'nanofab':
      return <NanofabPanels />
    case 'cleanroom':
      return <CleanroomPanels />
  }
  return null
}
