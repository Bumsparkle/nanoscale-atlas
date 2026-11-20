import { useAtlas } from '../state/store'
import { navigate } from '../state/url'

/** Placeholder home (replaced by the cleanroom door in milestone 8). */
export function Home() {
  const set = useAtlas((s) => s.set)
  return (
    <main className="home">
      <h1>Nanoscale Atlas</h1>
      <button className="tool" onClick={() => { set({ page: 'atlas' }); navigate('/cmos/wafer') }}>
        Enter the cleanroom
      </button>
    </main>
  )
}
