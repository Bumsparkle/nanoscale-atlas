import { useEffect, useState } from 'react'

/**
 * Phones: the learning panel is a bottom sheet that can collapse to a strip,
 * freeing the model and its controls for "do" questions. The state is mirrored
 * on <html> so the other panels can step aside while the sheet is open.
 */
export function useCollapsed() {
  const [c, setC] = useState(false)
  useEffect(() => {
    document.documentElement.dataset.learnOpen = c ? '0' : '1'
    return () => void delete document.documentElement.dataset.learnOpen
  }, [c])
  return [c, setC] as const
}

export function CollapseToggle({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <button className="lp-collapse mono" onClick={onToggle} aria-expanded={!collapsed}>
      {collapsed ? 'question ▴' : 'model ▾'}
    </button>
  )
}
