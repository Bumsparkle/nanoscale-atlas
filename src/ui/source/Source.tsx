import { useEffect, useRef, useState } from 'react'
import { useAtlas } from '../../state/store'
import { slideUrl, sourceLabel, uniqueRefs, type SourceRef } from '../../sources'
import './source.css'
import { SLIDES_AVAILABLE } from '../../platform'

/**
 * One small "Source" button per panel, step or question. It opens the
 * original lecture slide in a modal. Slide images are not in the repository:
 * they are served from /slides/ behind the site password (see DECISIONS.md).
 */
export function SourceButton({ refs, className = '' }: { refs: SourceRef[]; className?: string }) {
  const set = useAtlas((s) => s.set)
  const list = uniqueRefs(refs)
  // an app built without the slides has nothing to show: no button at all
  if (!list.length || !SLIDES_AVAILABLE) return null
  const label = list.length === 1 ? sourceLabel(list[0]) : `${sourceLabel(list[0])} +${list.length - 1}`
  return (
    <button className={'source-btn ' + className} onClick={() => set({ source: { refs: list, index: 0 } })} aria-label={`Source: ${list.map(sourceLabel).join(', ')}`} title={label}>
      <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden>
        <rect x="0.5" y="1.5" width="10" height="8" rx="0.5" fill="none" stroke="currentColor" />
        <path d="M2.5 4h6M2.5 6h4" stroke="currentColor" />
      </svg>
      source
    </button>
  )
}

export function SourceModal() {
  const src = useAtlas((s) => s.source)
  const set = useAtlas((s) => s.set)
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>('loading')
  const close = useRef<HTMLButtonElement>(null)
  const ref = src ? src.refs[src.index] : null

  useEffect(() => {
    if (!src) return
    setState('loading')
    close.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation()
        set({ source: null })
      }
      if (e.key === 'ArrowRight' && src.index < src.refs.length - 1) set({ source: { ...src, index: src.index + 1 } })
      if (e.key === 'ArrowLeft' && src.index > 0) set({ source: { ...src, index: src.index - 1 } })
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [src, set])

  if (!src || !ref) return null
  return (
    <div className="source-scrim" onClick={() => set({ source: null })}>
      <figure className="source-modal" role="dialog" aria-modal="true" aria-label={sourceLabel(ref)} onClick={(e) => e.stopPropagation()}>
        <header>
          <figcaption className="mono">{sourceLabel(ref)}</figcaption>
          {src.refs.length > 1 && (
            <nav className="source-pager mono" aria-label="Slides">
              <button disabled={src.index === 0} onClick={() => set({ source: { ...src, index: src.index - 1 } })} aria-label="Previous slide">
                ←
              </button>
              <span>
                {src.index + 1} / {src.refs.length}
              </span>
              <button disabled={src.index === src.refs.length - 1} onClick={() => set({ source: { ...src, index: src.index + 1 } })} aria-label="Next slide">
                →
              </button>
            </nav>
          )}
          <button ref={close} className="tool" onClick={() => set({ source: null })}>
            close <kbd>Esc</kbd>
          </button>
        </header>
        <div className="source-frame">
          {state !== 'missing' && (
            <img key={slideUrl(ref)} src={slideUrl(ref)} alt={`Lecture slide: ${sourceLabel(ref)}`} onLoad={() => setState('ok')} onError={() => setState('missing')} className={state === 'ok' ? 'in' : ''} />
          )}
          {state === 'loading' && <p className="source-note mono">loading the slide…</p>}
          {state === 'missing' && (
            <p className="source-note">
              The slide image isn't available on this copy of the site. Lecture slides are only served by the password-protected deployment, never from the public repository.
            </p>
          )}
        </div>
      </figure>
    </div>
  )
}
