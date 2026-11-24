import { useAtlas, type Mode } from '../state/store'
import { useTheme } from '../theme/theme'
import { enterMode, MODES } from '../learn/ui/LearnHost'
import './top-icons.css'

/**
 * Two floating icons at the right of the top bar: the theme (sun / moon) and
 * the mode (Explore → Lesson → Revise). No button chrome; each is one click.
 */

const svg = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

const Sun = () => (
  <svg {...svg}>
    <circle cx="12" cy="12" r="4.2" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
      <line key={a} x1="12" y1="2.6" x2="12" y2="5" transform={`rotate(${a} 12 12)`} />
    ))}
  </svg>
)
const Moon = () => (
  <svg {...svg}>
    <path d="M20 14.6A8.3 8.3 0 1 1 9.4 4a6.6 6.6 0 0 0 10.6 10.6Z" />
  </svg>
)

/**
 * Sun on the light theme, moon on the dark one; a click switches to the
 * other. The theme follows the system until you click, and whenever your
 * choice matches the system it goes back to following it (stored as System).
 */
export function ThemeIcon() {
  const theme = useTheme((s) => s.theme)
  const pref = useTheme((s) => s.pref)
  const setPref = useTheme((s) => s.setPref)
  const next = theme === 'light' ? 'dark' : 'light'
  const sys = typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  const label = `${theme === 'light' ? 'Light' : 'Dark'} theme${pref === 'system' ? ' (following the system)' : ''}. Switch to ${next}`
  return (
    <button className="top-icon" data-testid="theme-icon" aria-label={label} title={label} onClick={() => setPref(next === sys ? 'system' : next)}>
      {theme === 'light' ? <Sun /> : <Moon />}
    </button>
  )
}

const MODE_ICON: Record<Mode, () => React.JSX.Element> = {
  // a compass: free exploring
  explore: () => (
    <svg {...svg}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="m15.6 8.4-2.1 5.1-5.1 2.1 2.1-5.1Z" />
    </svg>
  ),
  // an open book: the lesson
  lesson: () => (
    <svg {...svg}>
      <path d="M12 6.4C10.2 5 7.6 4.6 4 4.8v13.3c3.6-.2 6.2.2 8 1.6 1.8-1.4 4.4-1.8 8-1.6V4.8c-3.6-.2-6.2.2-8 1.6Z" />
      <path d="M12 6.4v13.3" />
    </svg>
  ),
  // stacked cards with a return arrow: spaced repetition
  revise: () => (
    <svg {...svg}>
      <rect x="4" y="7" width="12" height="13" rx="1.6" />
      <path d="M8 4h10.4A1.6 1.6 0 0 1 20 5.6V16" />
      <path d="M7.6 15.4a3 3 0 1 0 .6-3.4M7.6 10.6v1.8h1.8" />
    </svg>
  ),
}

/** one icon for the three modes: it shows the current mode, a click moves to the next */
export function ModeIcon() {
  const mode = useAtlas((s) => s.mode)
  const i = MODES.findIndex((m) => m.id === mode)
  const cur = MODES[i]
  const next = MODES[(i + 1) % MODES.length]
  const Icon = MODE_ICON[mode]
  const label = `Mode: ${cur.label}. ${cur.hint}. Click for ${next.label}`
  return (
    <button className="top-icon top-icon-mode" data-testid="mode-icon" data-mode={mode} aria-label={label} title={label} onClick={() => enterMode(next.id)}>
      <Icon />
    </button>
  )
}

export function TopIcons({ modes = true }: { modes?: boolean }) {
  return (
    <div className="top-icons">
      <ThemeIcon />
      {modes && <ModeIcon />}
    </div>
  )
}
