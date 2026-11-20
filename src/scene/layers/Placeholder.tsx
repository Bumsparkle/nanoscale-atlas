/** Milestone-1 stand-in for a layer: a wire box sized to the layer's rest view. */
export function Placeholder({ label }: { label: string }) {
  return (
    <group name={label}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 2]} intensity={2} />
      <mesh>
        <boxGeometry args={[20, 4, 12]} />
        <meshStandardNodeMaterial color="#5a6672" roughness={0.5} metalness={0.2} />
      </mesh>
      <gridHelper args={[80, 40, '#2b3032', '#1a1d1e']} position={[0, -2, 0]} />
    </group>
  )
}
