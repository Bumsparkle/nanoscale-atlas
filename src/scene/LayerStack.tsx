import { lazy, Suspense, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { useSceneTheme } from '../theme/scene'
import { useAtlas } from '../state/store'
import { LAYER_BY_ID, type LayerId } from '../chapters/cmos/layers'
import { rig } from './rig'
import { transition } from './transition'

/**
 * One persistent canvas, one active layer. Each layer is a lazy chunk with
 * its own scene graph in its own units; only the active one is mounted.
 */
const IMPORTS: Record<LayerId, () => Promise<{ default: () => React.JSX.Element }>> = {
  sand: () => import('./layers/SandLayer'),
  polysilicon: () => import('./layers/PolysiliconLayer'),
  puller: () => import('./layers/PullerLayer'),
  ingot: () => import('./layers/IngotLayer'),
  wafers: () => import('./layers/WafersLayer'),
  cleanroom: () => import('./layers/CleanroomLayer'),
  deposition: () => import('./layers/DepositionLayer'),
  mbe: () => import('./layers/MbeLayer'),
  surface: () => import('./layers/SurfaceLayer'),
  litho: () => import('./layers/LithoLayer'),
  ebeam: () => import('./layers/EbeamLayer'),
  qmbe: () => import('./layers/QmbeLayer'),
  qsample: () => import('./layers/QsampleLayer'),
  hetero: () => import('./layers/HeteroLayer'),
  qbands: () => import('./layers/QbandsLayer'),
  qwave: () => import('./layers/QwaveLayer'),
  nanofab: () => import('./layers/NanofabLayer'),
  wafer: () => import('./layers/WaferLayer'),
  die: () => import('./layers/DieLayer'),
  cell: () => import('./layers/CellLayer'),
  transistor: () => import('./layers/TransistorLayer'),
  oxide: () => import('./layers/OxideLayer'),
  lattice: () => import('./layers/LatticeLayer'),
}
const LAYER_COMPONENTS = Object.fromEntries(Object.entries(IMPORTS).map(([k, f]) => [k, lazy(f)])) as Record<LayerId, React.LazyExoticComponent<() => React.JSX.Element>>

/** Warm the chunks of neighbouring layers so dives never stall. */
export function prefetchLayers(ids: LayerId[]) {
  return Promise.all(ids.map((id) => IMPORTS[id]()))
}

export function LayerStack() {
  const layer = useAtlas((s) => s.layer)
  const scene = useThree((s) => s.scene)
  const Comp = LAYER_COMPONENTS[layer]
  // a theme change rebuilds the layer: its materials, lights and labels read the palette as they build
  const theme = useSceneTheme()

  useEffect(() => {
    // warm every layer chunk in the background so no dive ever waits on the network
    const ids = Object.keys(IMPORTS) as LayerId[]
    ids.forEach((id) => prefetchLayers([id]).then(() => useAtlas.setState((s) => ({ boot: { ...s.boot, layers: s.boot.layers + 1 } }))))
  }, [scene])

  useEffect(() => {
    const def = LAYER_BY_ID[layer]
    const entry = transition.consumeEntry(layer)
    rig.setLayer(def, entry ?? undefined)
  }, [layer])

  return (
    <Suspense fallback={null}>
      <Comp key={layer + ':' + theme} />
    </Suspense>
  )
}
