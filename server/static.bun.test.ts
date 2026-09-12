import { expect, test } from 'bun:test'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { serveStaticFile } from './static'

test('live catalog and edited lessons override stale dist while application assets prefer dist', async () => {
  const root = await mkdtemp(join(tmpdir(),'eduflix-static-'))
  const directories = {staticDir:join(root,'dist'),publicDir:join(root,'public')}
  try {
    for (const base of Object.values(directories)) {
      await mkdir(join(base,'contents/math/elementary/lesson'),{recursive:true})
      await writeFile(join(base,'contents/index.json'),base===directories.publicDir?'current catalog':'stale catalog')
      await writeFile(join(base,'contents/math/elementary/lesson/index.html'),base===directories.publicDir?'saved lesson':'stale lesson')
      await writeFile(join(base,'app.js'),base===directories.staticDir?'built app':'public app')
    }
    expect(await (await serveStaticFile('/contents/index.json',directories))?.text()).toBe('current catalog')
    expect(await (await serveStaticFile('/contents/math/elementary/lesson/index.html',directories))?.text()).toBe('saved lesson')
    const revised = await serveStaticFile('/content-revisions/0123456789abcdef/math/elementary/lesson/index.html',directories)
    expect(await revised?.text()).toBe('saved lesson')
    expect(revised?.headers.get('cache-control')).toBe('public, max-age=0, must-revalidate')
    expect(await (await serveStaticFile('/content-revisions/0123456789abcdef/index.json',directories))?.text()).toBe('current catalog')
    expect(await (await serveStaticFile('/app.js',directories))?.text()).toBe('built app')
    await writeFile(join(root,'private.txt'),'private')
    expect(await serveStaticFile('/../private.txt',directories)).toBeNull()
  } finally { await rm(root,{recursive:true,force:true}) }
})
