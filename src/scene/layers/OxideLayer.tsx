import * as THREE from 'three/webgpu'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { StudioLights } from '../Lighting'
import { Inspectable, InspectSync, ClearOnMiss } from '../Inspectable'
import { rig } from '../rig'
import { transition } from '../transition'
import { amorphousSiO2, atomsMesh, bondsMesh, diamond, neighbours, rng, BOND_SI, type V3 } from '../atoms'
import { overlay, type ScreenLabel } from '../cellRuntime'

/**
 * Layer 5: the gate stack at atomic scale (1 unit = 1 Å).
 * Single-crystal Si below, < 20 Å of amorphous SiO₂ (6–7 atomic layers,
 * slide 37), polysilicon grains above (slides 3, 37).
 */
const X: [number, number] = [-34, 34]
const Z: [number, number] = [-12, 12]
const OX_TOP = 17 // Å: < 20 Å

function build() {
  const crystal = diamond({ x: X, y: [-22, 0.01], z: Z })
  const crystalBonds = neighbours(crystal, BOND_SI + 0.15).map(([a, b]) => [crystal[a], crystal[b]] as [V3, V3])
  const ox = amorphousSiO2({ x: X, y: [1.6, OX_TOP - 1.2], z: Z })
  // poly: three grains with random orientations (Voronoi in x)
  const r = rng(11)
  const seeds: V3[] = [[-22, 30, 0], [4, 30, 0], [26, 30, 0]]
  const poly: V3[] = []
  seeds.forEach((s, gi) => {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 3, r() * 3, r() * 3))
    const pts = diamond({ x: X, y: [OX_TOP + 1.2, 42], z: Z }, q, s)
    for (const p of pts) {
      let best = 0
      let bd = Infinity
      seeds.forEach((t, k) => {
        const d = Math.hypot(p[0] - t[0], (p[1] - t[1]) * 0.4)
        if (d < bd) (bd = d), (best = k)
      })
      if (best === gi) poly.push(p)
    }
  })
  const polyBonds = neighbours(poly, BOND_SI + 0.15).map(([a, b]) => [poly[a], poly[b]] as [V3, V3])
  return { crystal, crystalBonds, ox, poly, polyBonds }
}

export default function OxideLayer() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const g = useMemo(() => {
    const b = build()
    return {
      crystal: atomsMesh(b.crystal, 0.62, '#8ea2b2'),
      crystalBonds: bondsMesh(b.crystalBonds, 0.16, '#5f6f7b'),
      oxSi: atomsMesh(b.ox.si, 0.6, '#c8b48a'),
      oxO: atomsMesh(b.ox.o, 0.5, '#c8553f'),
      oxBonds: bondsMesh(b.ox.bonds, 0.14, '#7a6a58'),
      poly: atomsMesh(b.poly, 0.62, '#a59686'),
      polyBonds: bondsMesh(b.polyBonds, 0.16, '#6e645a'),
    }
  }, [])

  useFrame(() => {
    const lab = (id: string, text: string, sub: string, p: V3): ScreenLabel => {
      const v = new THREE.Vector3(...p).project(camera)
      return { id, text, sub, x: ((v.x + 1) / 2) * size.width, y: ((1 - v.y) / 2) * size.height, group: 'right', visible: v.z < 1 }
    }
    overlay.labels = [
      lab('o-poly', 'polysilicon', 'many small crystals (slide 37)', [X[1], 30, Z[1]]),
      lab('o-ox', 'gate oxide SiO₂', '< 20 Å · 6–7 atomic layers (slide 37)', [X[1] + 3, OX_TOP / 2, Z[1]]),
      lab('o-si', 'single-crystal Si', 'p-type body (slides 3, 11)', [X[1], -11, Z[1]]),
    ]
    overlay.version = 2000
  })

  useEffect(() => {
    rig.setHome({ target: [0, 9, 0] })
    rig.goHome()
    rig.handlers = {
      onDiveIn: () => void transition.go('lattice', { via: [0, -6, 0] }),
      onSurface: () => void transition.go('transistor'),
    }
    return () => {
      rig.handlers = {}
      overlay.labels = []
      overlay.version++
    }
  }, [])

  return (
    <>
      <StudioLights scale={0.5} />
      <Inspectable node="oxide-poly" fit={1.3}>
        <primitive object={g.poly} />
        <primitive object={g.polyBonds} />
      </Inspectable>
      <Inspectable node="oxide-film" fit={1.4}>
        <primitive object={g.oxSi} />
        <primitive object={g.oxO} />
        <primitive object={g.oxBonds} />
      </Inspectable>
      <Inspectable node="oxide-substrate" fit={1.3}>
        <primitive object={g.crystal} />
        <primitive object={g.crystalBonds} />
      </Inspectable>
      {/* thickness gauge: < 20 Å */}
      <group position={[X[1] + 3, 0, Z[1]]} name="gauge">
        <mesh position={[0, OX_TOP / 2, 0]}>
          <boxGeometry args={[0.15, OX_TOP, 0.15]} />
          <meshBasicNodeMaterial color="#f0b43c" />
        </mesh>
        {[0, OX_TOP].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <boxGeometry args={[1.6, 0.15, 0.15]} />
            <meshBasicNodeMaterial color="#f0b43c" />
          </mesh>
        ))}
      </group>
      <InspectSync />
      <ClearOnMiss />
    </>
  )
}
