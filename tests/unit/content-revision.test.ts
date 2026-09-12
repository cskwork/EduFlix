import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { contentRevision, rewriteContentReferences } from '../../build/contentRevision'
import { revisionedContentUrl } from '../../src/services/content/revision'

const scratch: string[] = []
afterEach(() => scratch.splice(0).forEach(path => rmSync(path, { recursive: true, force: true })))
describe('deployed lesson cache revision', () => {
  it('changes the namespace when a child script changes, without changing source files', () => {
    const directory = mkdtempSync(join(tmpdir(), 'lesson-revision-')); scratch.push(directory)
    mkdirSync(join(directory, 'lesson'))
    writeFileSync(join(directory, 'lesson/index.html'), '<script src="script.js"></script>')
    writeFileSync(join(directory, 'lesson/script.js'), 'const answer = 1;')
    const before = contentRevision(directory)
    expect(contentRevision(directory)).toBe(before)
    writeFileSync(join(directory, 'lesson/script.js'), 'const answer = 2;')
    const after = contentRevision(directory)
    expect(after).not.toBe(before)
    const html = revisionedContentUrl('/contents/lesson/index.html', after)
    expect(new URL('script.js', `https://example.org${html}`).pathname).toBe(`/content-revisions/${after}/lesson/script.js`)
    expect(readFileSync(join(directory, 'lesson/index.html'), 'utf8')).toBe('<script src="script.js"></script>')
  })
  it('keeps relative common assets inside the revision and rewrites only origin-relative references', () => {
    const revision = '0123456789abcdef'
    const html = revisionedContentUrl('/contents/math/elementary/test/index.html', revision)
    expect(new URL('../../../common/engine.js', `https://example.org${html}`).pathname).toBe(`/content-revisions/${revision}/common/engine.js`)
    const source = '<script src="/contents/common/engine.js"></script><img src="https://cdn.example/contents/icon.svg"><style>.x{background:url(/contents/bg.svg)}</style>'
    const rewritten = rewriteContentReferences(source, revision)
    expect(rewritten).toContain(`/content-revisions/${revision}/common/engine.js`)
    expect(rewritten).toContain(`url(/content-revisions/${revision}/bg.svg)`)
    expect(rewritten).toContain('https://cdn.example/contents/icon.svg')
    const catalog = JSON.parse(rewriteContentReferences('{"path":"/contents/math/lesson/index.html"}', revision))
    expect(revisionedContentUrl(catalog.path, revision)).toBe(catalog.path)
  })
  it('does not revise Bun/dev paths, Blob lessons, or external resources', () => {
    expect(revisionedContentUrl('/contents/lesson/index.html', '')).toBe('/contents/lesson/index.html')
    expect(revisionedContentUrl('blob:local-lesson', '0123456789abcdef')).toBe('blob:local-lesson')
    expect(revisionedContentUrl('https://example.org/contents/a.js', '0123456789abcdef')).toBe('https://example.org/contents/a.js')
  })
})
