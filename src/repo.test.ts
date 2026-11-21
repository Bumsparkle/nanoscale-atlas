import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

/** The public repository must never contain the lecture material. */
describe('repository hygiene', () => {
  const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n')
  it('tracks no PDFs and no slide images', () => {
    expect(tracked.filter((f) => /\.pdf$/i.test(f))).toEqual([])
    expect(tracked.filter((f) => /(^|\/)slides?\//i.test(f) && /\.(jpe?g|png|webp|gif)$/i.test(f))).toEqual([])
    expect(tracked.filter((f) => f.startsWith('private/') || f.startsWith('public/slides'))).toEqual([])
  })
  it('ignores the slide folders and the lecture PDF', () => {
    const gi = readFileSync('.gitignore', 'utf8')
    expect(gi).toMatch(/^private\/$/m)
    expect(gi).toMatch(/^\*\.pdf$/m)
  })
})
