import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import type { Plugin } from 'vite'

function filesIn(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? filesIn(path) : entry.isFile() ? [path] : []
  })
}
export function contentRevision(directory: string): string {
  const hash = createHash('sha256')
  for (const file of filesIn(directory)) hash.update(relative(directory, file)).update('\0').update(readFileSync(file)).update('\0')
  return hash.digest('hex').slice(0, 16)
}
export function rewriteContentReferences(text: string, revision: string): string {
  // Only origin-relative /contents references. Relative children inherit the revision URL.
  return text.replace(/(^|[^\w/:])\/contents\//g, `$1/content-revisions/${revision}/`)
}
export function contentRevisionPlugin(revision: string): Plugin {
  let outputDirectory = ''
  return {
    name: 'eduflix-content-revision',
    configResolved(config) { outputDirectory = resolve(config.root, config.build.outDir, 'contents') },
    writeBundle() {
      if (!revision || !existsSync(outputDirectory)) return
      for (const file of filesIn(outputDirectory)) {
        if (!/\.(?:html|css|js|mjs|json|svg)$/i.test(file)) continue
        const before = readFileSync(file, 'utf8')
        const after = rewriteContentReferences(before, revision)
        if (before !== after) writeFileSync(file, after)
      }
    },
    configurePreviewServer(server) {
      // Match the Vercel alias when checking a production build locally.
      server.middlewares.use((request, _response, next) => {
        if (request.url) request.url = request.url.replace(/^\/content-revisions\/[a-f0-9]{16}\//, '/contents/')
        next()
      })
    },
  }
}
