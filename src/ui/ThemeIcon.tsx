import { useTheme } from '../theme/theme'

export const svg = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

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

