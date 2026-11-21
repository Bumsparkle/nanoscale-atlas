import { useEffect, useState } from 'react'
import { IS_APP, SLIDES_AVAILABLE } from '../platform'
import { live, useAtlas } from '../state/store'
import { LAYERS } from '../chapters/cmos/layers'
import { navigate } from '../state/url'

/** /debug: renderer backend, frame rate and quick links to every layer. */
export function DebugPanel() {
  const renderer = useAtlas((s) => s.renderer)
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 500)
    return () => clearInterval(id)
  }, [])
  return (
    <aside className="debug" data-testid="debug" aria-label="Renderer diagnostics">
      <p className="eyebrow">debug</p>
      <dl>
        <dt>renderer</dt>
        <dd data-testid="backend" data-backend={renderer.backend}>
          {renderer.backend === 'webgpu' ? 'WebGPU' : renderer.backend === 'webgl2' ? 'WebGL 2 (fallback)' : renderer.backend}
        </dd>
        <dt>detail</dt>
        <dd>{renderer.detail ?? '—'}</dd>
        <dt>shell</dt>
        <dd data-testid="shell">{IS_APP ? 'desktop app (Tauri)' : 'web browser'}</dd>
        <dt>slides</dt>
        <dd>{SLIDES_AVAILABLE ? 'bundled' : 'not bundled'}</dd>
        <dt>navigator.gpu</dt>
        <dd>{'gpu' in navigator ? 'present' : 'absent'}</dd>
        <dt>fps</dt>
        <dd>{live.fps.toFixed(0)}</dd>
        <dt>dpr</dt>
        <dd>{live.dpr.toFixed(2)}</dd>
        <dt>force</dt>
        <dd>
          <a href="/debug?gl=webgl">?gl=webgl</a>
        </dd>
      </dl>
      <p className="eyebrow">layers</p>
      <ul>
        {LAYERS.map((l) => (
          <li key={l.id}>
            <button className="tool" onClick={() => navigate('/cmos/' + l.path.join('/'))}>
              {l.id}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
