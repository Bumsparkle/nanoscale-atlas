// Write latest.json, the manifest the in-app updater reads from the latest GitHub Release.
//   node scripts/updater-manifest.mjs <tag> <signature file> <notes file> > latest.json
// The universal macOS build serves both Apple Silicon and Intel.
import { readFileSync } from 'node:fs'
const [tag, sigFile, notesFile] = process.argv.slice(2)
const conf = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8'))
const repo = process.env.GITHUB_REPOSITORY ?? 'Bumsparkle/nanoscale-atlas'
const url = `https://github.com/${repo}/releases/download/${tag}/Nanoscale-Atlas-macOS.app.tar.gz`
const signature = readFileSync(sigFile, 'utf8').trim()
const notes = notesFile ? readFileSync(notesFile, 'utf8').trim() : ''
const entry = { signature, url }
process.stdout.write(
  JSON.stringify(
    { version: conf.version, notes, pub_date: new Date().toISOString(), platforms: { 'darwin-aarch64': entry, 'darwin-x86_64': entry, 'darwin-universal': entry } },
    null,
    2,
  ) + '\n',
)
