/**
 * Where the atlas is running. The desktop app (Tauri) floats the scene on a
 * native glass window; the web build is unchanged. Detected at runtime, so
 * `npm run tauri dev` (which serves the web dev build) also gets app mode.
 */
export const IS_APP = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
/** lecture slide images are available (web always; the app only when built with INCLUDE_SLIDES=1) */
export const SLIDES_AVAILABLE = __SLIDES__

/**
 * The newest Mac build. The release workflow uploads the .dmg under this fixed
 * name, so /releases/latest/download/ always resolves to the latest version.
 */
export const MAC_DOWNLOAD_URL = 'https://github.com/Bumsparkle/nanoscale-atlas/releases/latest/download/Nanoscale-Atlas-macOS.dmg'
