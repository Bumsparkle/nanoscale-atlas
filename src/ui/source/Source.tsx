import { useEffect, useRef, useState } from 'react'
import { useAtlas } from '../../state/store'
import { slidePath, sourceLabel, uniqueRefs, type SourceRef } from '../../sources'
import { slideUrls } from '../../account/slides'
import './source.css'

/**
 * One small "Source" button per panel, step or question. It opens the
 * original lecture slide in a modal. Slide images are not in the repository
 * or any build: they come from the private Storage bucket through short-lived
 * signed URLs, for signed-in users only (see DECISIONS.md).
 */
export function SourceButton({ refs, className = '' }: { refs: SourceRef[]; className?: string }) {
  const set = useAtlas((s) => s.set)
  const list = uniqueRefs(refs)
  if (!list.length) return null
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
  const [url, setUrl] = useState<string | null>(null)
  const close = useRef<HTMLButtonElement>(null)
  const ref = src ? src.refs[src.index] : null
  const path = ref ? slidePath(ref) : null

  // a signed URL for the slide shown (and the rest of this set, ahead of time)
  useEffect(() => {
    if (!path || !src) return
    let live = true
    setUrl(null)
    setState('loading')
    slideUrls(src.refs.map(slidePath)).then((urls) => {
      if (!live) return
      if (urls[path]) setUrl(urls[path])
      else setState('missing')
    })
    return () => {
      live = false
    }
  }, [path, src])

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
          {state !== 'missing' && url && (
            <img key={url} src={url} alt={`Lecture slide: ${sourceLabel(ref)}`} onLoad={() => setState('ok')} onError={() => setState('missing')} className={state === 'ok' ? 'in' : ''} />
          )}
          {state === 'loading' && <p className="source-note mono">loading the slide…</p>}
          {state === 'missing' && (
            <p className="source-note">
              The slide image couldn't be loaded. Lecture slides are only shown to signed-in users while online, never from the public repository or the app download.
            </p>
          )}
        </div>
      </figure>
    </div>
  )
}
