import { lazy, Suspense, useEffect } from 'react'
import { IS_APP } from '../platform'
import { useThree } from '@react-three/fiber'
import { SCENE } from './sceneTheme'
import * as THREE from 'three/webgpu'
import { useAtlas } from '../state/store'
import { LAYER_BY_ID, type LayerId } from '../chapters/cmos/layers'
import { rig } from './rig'
import { transition } from './transition'

/**
 * One persistent canvas, one active layer. Each layer is a lazy chunk with
 * its own scene graph in its own units; only the active one is mounted.
 */
const LAYER_COMPONENTS: Record<LayerId, React.LazyExoticComponent<() => React.JSX.Element>> = {
  wafer: lazy(() => import('./layers/WaferLayer')),
  die: lazy(() => import('./layers/DieLayer')),
  cell: lazy(() => import('./layers/CellLayer')),
  transistor: lazy(() => import('./layers/TransistorLayer')),
  oxide: lazy(() => import('./layers/OxideLayer')),
  lattice: lazy(() => import('./layers/LatticeLayer')),
}

/** Warm the chunks of neighbouring layers so dives never stall. */
export function prefetchLayers(ids: LayerId[]) {
  const map: Record<LayerId, () => Promise<unknown>> = {
    wafer: () => import('./layers/WaferLayer'),
    die: () => import('./layers/DieLayer'),
    cell: () => import('./layers/CellLayer'),
    transistor: () => import('./layers/TransistorLayer'),
    oxide: () => import('./layers/OxideLayer'),
    lattice: () => import('./layers/LatticeLayer'),
  }
  return Promise.all(ids.map((id) => map[id]()))
}

export function LayerStack() {
  const layer = useAtlas((s) => s.layer)
  const scene = useThree((s) => s.scene)
  const Comp = LAYER_COMPONENTS[layer]

  useEffect(() => {
    scene.background = IS_APP ? null : new THREE.Color(SCENE.background)
    // warm every layer chunk in the background so no dive ever waits on the network
    const ids: LayerId[] = ['wafer', 'die', 'cell', 'transistor', 'oxide', 'lattice']
    ids.forEach((id) => prefetchLayers([id]).then(() => useAtlas.setState((s) => ({ boot: { ...s.boot, layers: s.boot.layers + 1 } }))))
  }, [scene])

  useEffect(() => {
    const def = LAYER_BY_ID[layer]
    const entry = transition.consumeEntry(layer)
    rig.setLayer(def, entry ?? undefined)
  }, [layer])

  return (
    <Suspense fallback={null}>
      <Comp key={layer} />
    </Suspense>
  )
}
