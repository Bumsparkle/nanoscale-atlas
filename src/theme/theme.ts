import { create } from 'zustand'

/**
 * Colour theme. The preference is System / Light / Dark (default System) and
 * is kept in localStorage. The resolved theme is written to
 * <html data-theme> before first paint by the inline script in index.html,
 * so the page never flashes the wrong theme; this module takes over after
 * boot, follows the OS appearance while the preference is System, and keeps
 * the attribute, `color-scheme` and the theme-color meta in step.
 */
export type ThemePref = 'system' | 'light' | 'dark'
export type Theme = 'light' | 'dark'

export const THEME_KEY = 'atlas.theme.v1'
/** the browser chrome colour per theme: the scene backdrop (--scene) */
export const THEME_COLOR: Record<Theme, string> = { dark: '#1d2124', light: '#e4e8ea' }

const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null

export function systemTheme(): Theme {
  return mq?.matches ? 'light' : 'dark'
}

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    /* storage blocked: fall back to System */
  }
  return 'system'
}

export function resolveTheme(pref: ThemePref): Theme {
  return pref === 'system' ? systemTheme() : pref
}

/** ?theme=light|dark overrides the preference for one page load (screenshot scripts) */
function urlOverride(): Theme | null {
  if (typeof location === 'undefined') return null
  const t = new URLSearchParams(location.search).get('theme')
  return t === 'light' || t === 'dark' ? t : null
}

/** desktop app: the native window appearance (and so the vibrancy glass) follows the preference */
function applyWindow(pref: ThemePref) {
  if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) return
  void import('@tauri-apps/api/window')
    .then(({ getCurrentWindow }) => getCurrentWindow().setTheme(pref === 'system' ? null : pref))
    .catch(() => {
      /* older shell without the permission: the glass keeps following macOS */
    })
}

function apply(theme: Theme) {
  if (typeof document === 'undefined') return
  const el = document.documentElement
  el.dataset.theme = theme
  el.style.colorScheme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
}

interface ThemeState {
  pref: ThemePref
  theme: Theme
  setPref: (p: ThemePref) => void
}

const initialPref = readPref()
const forced = urlOverride()

export const useTheme = create<ThemeState>((set) => ({
  pref: forced ?? initialPref,
  theme: forced ?? resolveTheme(initialPref),
  setPref: (pref) => {
    try {
      localStorage.setItem(THEME_KEY, pref)
    } catch {
      /* not persisted; still applies for this session */
    }
    const theme = resolveTheme(pref)
    apply(theme)
    applyWindow(pref)
    set({ pref, theme })
  },
}))

apply(useTheme.getState().theme)
applyWindow(useTheme.getState().pref)

mq?.addEventListener('change', () => {
  const { pref } = useTheme.getState()
  if (pref !== 'system') return
  const theme = systemTheme()
  apply(theme)
  useTheme.setState({ theme })
})
