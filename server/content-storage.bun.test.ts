import { afterEach, expect, test, spyOn } from 'bun:test'
import { mkdtemp, mkdir, readFile, writeFile, rm, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { handleContentRoute } from './routes/content'
import { acquireCatalogLock } from './services/catalog'
import * as catalogService from './services/catalog'
import { encodeContentZip, decodeContentZip } from '../src/services/contentArchive'
import { inflateRawSync } from 'node:zlib'

const roots: string[] = []
const manifest = { id: 'test-lesson', title: 'Test', subject: 'math', gradeLevel: 'elementary', grade: 'elementary-1', type: 'simulation', language: 'en', description: '', path: 'contents/math/elementary/test-lesson/index.html', thumbnail: '', createdAt: '2026-01-01', tags: [] }
const json = (data: unknown, status = 200) => Response.json(data, { status })
const fail = (message: string, status = 500) => json({ success: false, error: message }, status)
const inflate = async (bytes: Uint8Array, maxBytes: number) => new Uint8Array(inflateRawSync(bytes, { maxOutputLength: maxBytes }))
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'eduflix-storage-')); roots.push(root)
  const dir = join(root, 'public/contents/math/elementary/test-lesson')
  await mkdir(dir, { recursive: true })
  await writeFile(join(root, 'public/contents/index.json'), JSON.stringify({version: '1', lastUpdated: 'today', contents: [manifest]}))
  const files = {'index.html':'<html><body><h1 id="title">Original</h1></body></html>', 'style.css': ':root {--color:red}', 'script.js': 'window.test = 1', 'manifest.json': JSON.stringify(manifest)}
  for (const [name, content] of Object.entries(files)) await writeFile(join(dir, name), content)
  return {root, dir, files}
}
async function request(root: string, path: string, method = 'GET', body?: unknown) {
  const headers: Record<string,string> = {}
  if (process.env.ADMIN_TOKEN) headers['X-Admin-Token'] = process.env.ADMIN_TOKEN
  const req = new Request(`http://localhost/api/content${path}`, { method, headers, body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body) })
  return handleContentRoute(req, json, fail, { rootDir: root })
}
afterEach(async () => { for (const root of roots.splice(0)) await rm(root, {recursive:true, force:true}) })

test('corrupt and structurally invalid catalogs are not reset by writes', async () => {
  const {root} = await fixture()
  const path = join(root, 'public/contents/index.json')
  for (const source of ['{broken', JSON.stringify({version:'1',lastUpdated:'today',contents:{}})]) {
    await writeFile(path, source)
    expect((await request(root, '', 'POST', {...manifest,id:'new-lesson'})).status).toBe(500)
    expect(await readFile(path,'utf8')).toBe(source)
  }
})
test('CRUD respects the publication lock and can retry without losing entries', async () => {
  const {root} = await fixture()
  const path = join(root,'public/contents/index.json.lock')
  const lock = await acquireCatalogLock(path)
  try { expect((await request(root,'','POST',{...manifest,id:'second'})).status).toBe(409) }
  finally { await lock.release() }
  const responses = await Promise.all(['second','third'].map(id => request(root,'','POST',{...manifest,id})))
  expect(responses.some(r=>r.status===201)).toBe(true)
  for (let i=0;i<responses.length;i++) if (responses[i].status===409) expect((await request(root,'','POST',{...manifest,id:['second','third'][i]})).status).toBe(201)
  expect(JSON.parse(await readFile(join(root,'public/contents/index.json'),'utf8')).contents.map((x: {id:string})=>x.id).sort()).toEqual(['second','test-lesson','third'])
})
test('editor saves a durable overlay, rejects quizzes and reports missing HTML', async () => {
  const {root,dir} = await fixture()
  const change = {contentId:manifest.id,texts:[{path:'#title',value:'Updated </script> $&'}],styles:[{variable:'--color',value:'blue'}],quizzes:[]}
  expect((await request(root,`/${manifest.id}/files`,'PUT',change)).status).toBe(200)
  const html = await readFile(join(dir,'index.html'),'utf8')
  expect(html).toContain('eduflix-editor-overrides')
  expect(html).toContain('Updated \\u003c/script> $&')
  expect(html).toContain('editor-bridge.js')
  expect((await request(root,`/${manifest.id}/files`,'PUT',{...change,quizzes:[{id:'quiz'}]})).status).toBe(400)
  expect(await readFile(join(dir,'index.html'),'utf8')).toBe(html)
  await unlink(join(dir,'index.html'))
  expect((await request(root,`/${manifest.id}/files`,'PUT',change)).status).toBe(500)
})
test('export then import preserves all four files and rewrites duplicate manifest id', async () => {
  const {root,files} = await fixture()
  const exported = await request(root,`/${manifest.id}/export`)
  expect(exported.status).toBe(200)
  const bytes = new Uint8Array(await exported.arrayBuffer())
  expect(await decodeContentZip(bytes,inflate)).toEqual(files)
  const form = new FormData(); form.set('file',new File([bytes],'lesson.zip'))
  const imported = await request(root,'/import','POST',form)
  expect(imported.status).toBe(201)
  const result = await imported.json() as {contentId:string}
  expect(result.contentId).toBe('test-lesson-2')
  const dir = join(root,'public/contents/math/elementary/test-lesson-2')
  expect(await readFile(join(dir,'index.html'),'utf8')).toBe(files['index.html'])
  expect(JSON.parse(await readFile(join(dir,'manifest.json'),'utf8')).id).toBe('test-lesson-2')
})
test('archive rejects corruption and oversize before inflate', async () => {
  const {files} = await fixture()
  const bytes = encodeContentZip(files)
  bytes[42] ^= 1
  await expect(decodeContentZip(bytes,inflate)).rejects.toThrow()
  let inflated = false
  const oversized = encodeContentZip(files)
  const view = new DataView(oversized.buffer)
  const end = oversized.length-22
  const central = view.getUint32(end+16,true)
  view.setUint32(central+24,3*1024*1024,true)
  await expect(decodeContentZip(oversized,async()=>{inflated=true;return new Uint8Array()})).rejects.toThrow('2 MiB')
  expect(inflated).toBe(false)
})

// Fixture produced by Python zipfile.ZIP_DEFLATED, independent of our ZIP writer.
test('ordinary DEFLATE enclosing-folder archive supports standalone HTML', async () => {
  const bytes = new Uint8Array(Buffer.from('UEsDBBQAAAAIAOQuKF18oxIhGwAAABoAAAARAAAAbGVzc29uL2luZGV4Lmh0bWyzyTC0Cy5JzEtJzMnPS1XISS0uzs+z0QeKAgBQSwMEFAAAAAgA5C4oXX/oTIFMAAAAWgAAABQAAABsZXNzb24vbWFuaWZlc3QuanNvbqtWykxRslIqzsxLz0lV0lEqySwB0lZKwTCB4tKkrNTkEqBQbmJJBlAgvSgxJdUntSw1ByiWmpOam5pXklhUCdJbWQDSWlySD+TWAgBQSwECFAMUAAAACADkLihdfKMSIRsAAAAaAAAAEQAAAAAAAAAAAAAAgAEAAAAAbGVzc29uL2luZGV4Lmh0bWxQSwECFAMUAAAACADkLihdf+hMgUwAAABaAAAAFAAAAAAAAAAAAAAAgAFKAAAAbGVzc29uL21hbmlmZXN0Lmpzb25QSwUGAAAAAAIAAgCBAAAAyAAAAAAA', 'base64'))
  const files = await decodeContentZip(bytes,inflate)
  expect(files['index.html']).toBe('<h1>Standalone lesson</h1>')
  for (const speedBits of [2, 4, 6]) {
    const hinted = bytes.slice()
    const headers = new DataView(hinted.buffer)
    for (let offset = 0; offset < hinted.length - 10; offset++) {
      const signature = headers.getUint32(offset, true)
      if (signature === 0x04034b50) headers.setUint16(offset + 6, speedBits, true)
      if (signature === 0x02014b50) headers.setUint16(offset + 8, speedBits, true)
    }
    expect((await decodeContentZip(hinted, inflate))['index.html']).toBe(files['index.html'])
  }
  expect(files['style.css']).toBe('')
  expect(files['script.js']).toBe('')
  const {root} = await fixture()
  const form = new FormData(); form.set('file',new File([bytes],'single.zip'))
  expect((await request(root,'/import','POST',form)).status).toBe(201)
})
test('import never overwrites an uncatalogued lesson directory', async () => {
  const {root,files} = await fixture()
  const orphan = join(root,'public/contents/math/elementary/test-lesson-2')
  await mkdir(orphan)
  await writeFile(join(orphan,'index.html'),'Unpublished original')
  const form = new FormData(); form.set('file',new File([encodeContentZip(files)],'lesson.zip'))
  const response = await request(root,'/import','POST',form)
  expect(response.status).toBe(201)
  expect((await response.json() as {contentId:string}).contentId).toBe('test-lesson-3')
  expect(await readFile(join(orphan,'index.html'),'utf8')).toBe('Unpublished original')
})
test('malformed archive returns a client error and leaves the catalog unchanged', async () => {
  const {root} = await fixture()
  const catalog = join(root,'public/contents/index.json')
  const before = await readFile(catalog,'utf8')
  const form = new FormData(); form.set('file',new File(['not a zip'],'bad.zip'))
  expect((await request(root,'/import','POST',form)).status).toBe(400)
  expect(await readFile(catalog,'utf8')).toBe(before)
})

test('export reports unsupported assets instead of silently omitting them', async () => {
  const {root,dir} = await fixture()
  await writeFile(join(dir,'diagram.png'),'image bytes')
  const response = await request(root,`/${manifest.id}/export`)
  expect(response.status).toBe(400)
  expect(await response.text()).toContain('diagram.png')
})


test('simultaneous stale-lock contenders leave the lock and catalog intact', async () => {
  const {root} = await fixture()
  const path = join(root, 'public/contents/index.json.lock')
  const source = JSON.stringify({pid: 99_999_999})
  await writeFile(path, source)
  const results = await Promise.allSettled([acquireCatalogLock(path), acquireCatalogLock(path)])
  expect(results.every(result => result.status === 'rejected')).toBe(true)
  expect(await readFile(path, 'utf8')).toBe(source)
})

test('release preserves a replacement lock owned by another acquisition', async () => {
  const {root} = await fixture()
  const path = join(root, 'public/contents/index.json.lock')
  const original = await acquireCatalogLock(path)
  await unlink(path)
  const replacement = await acquireCatalogLock(path)
  await original.release()
  expect(await Bun.file(path).exists()).toBe(true)
  await replacement.release()
  expect(await Bun.file(path).exists()).toBe(false)
})

test('delete restores lesson files when catalog commit fails, then can retry', async () => {
  const {root, dir, files} = await fixture()
  const path = join(root, 'public/contents/index.json')
  const before = await readFile(path, 'utf8')
  const write = spyOn(catalogService, 'atomicWriteFile').mockRejectedValue(new Error('injected commit failure'))
  try {
    expect((await request(root, `/${manifest.id}?deleteFiles=true`, 'DELETE')).status).toBe(500)
  } finally { write.mockRestore() }
  expect(await readFile(path, 'utf8')).toBe(before)
  expect(await readFile(join(dir, 'index.html'), 'utf8')).toBe(files['index.html'])
  expect((await request(root, `/${manifest.id}?deleteFiles=true`, 'DELETE')).status).toBe(200)
  expect(JSON.parse(await readFile(path, 'utf8')).contents).toEqual([])
  expect(await Bun.file(join(dir, 'index.html')).exists()).toBe(false)
})


test('export requires readable HTML while absent CSS and JS remain optional', async () => {
  const {root, dir} = await fixture()
  await unlink(join(dir, 'style.css'))
  await unlink(join(dir, 'script.js'))
  expect((await request(root, `/${manifest.id}/export`)).status).toBe(200)
  await unlink(join(dir, 'index.html'))
  expect((await request(root, `/${manifest.id}/export`)).status).toBe(500)
})


async function streamingImport(root: string, bytes: Uint8Array, headers: Record<string, string>, chunkSize = 997) {
  let offset = 0
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset === bytes.length) { controller.close(); return }
      const next = Math.min(offset + chunkSize, bytes.length)
      controller.enqueue(bytes.slice(offset, next)); offset = next
    },
  })
  if (process.env.ADMIN_TOKEN) headers['X-Admin-Token'] = process.env.ADMIN_TOKEN
  const req = new Request('http://localhost/api/content/import', {method: 'POST', headers, body: stream, duplex: 'half'} as RequestInit)
  return handleContentRoute(req, json, fail, {rootDir: root})
}

test('streaming multipart imports an exact 2 MiB ZIP with framing overhead', async () => {
  const {root, files} = await fixture()
  const initial = encodeContentZip(files)
  files['index.html'] += ' '.repeat(2 * 1024 * 1024 - initial.length)
  const zip = encodeContentZip(files)
  expect(zip.length).toBe(2 * 1024 * 1024)
  const form = new FormData(); form.set('file', new File([zip], 'lesson.zip'))
  const source = new Request('http://localhost', {method: 'POST', body: form})
  const headers = Object.fromEntries(source.headers)
  const bytes = new Uint8Array(await source.arrayBuffer())
  expect(bytes.length).toBeGreaterThan(zip.length)
  expect((await streamingImport(root, bytes, headers)).status).toBe(201)
})

test('oversize streaming multipart is canceled before parsing and preserves catalog', async () => {
  const {root} = await fixture()
  const catalog = join(root, 'public/contents/index.json')
  const before = await readFile(catalog, 'utf8')
  let canceled = false
  let pulls = 0
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) { pulls++; controller.enqueue(new Uint8Array(256 * 1024)) },
    cancel() { canceled = true },
  })
  const headers: Record<string, string> = {'Content-Type': 'multipart/form-data; boundary=test'}
  if (process.env.ADMIN_TOKEN) headers['X-Admin-Token'] = process.env.ADMIN_TOKEN
  const req = new Request('http://localhost/api/content/import', {method: 'POST', headers, body: stream, duplex: 'half'} as RequestInit)
  const response = await handleContentRoute(req, json, fail, {rootDir: root})
  expect(response.status).toBe(413)
  expect(canceled).toBe(true)
  expect(pulls).toBeLessThanOrEqual(11)
  expect(await readFile(catalog, 'utf8')).toBe(before)
  expect(await Bun.file(`${catalog}.lock`).exists()).toBe(false)
})

test('file size is rejected before arrayBuffer even inside the multipart request bound', async () => {
  const {root} = await fixture()
  const form = new FormData(); form.set('file', new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'large.zip'))
  const read = spyOn(File.prototype, 'arrayBuffer').mockImplementation(() => { throw new Error('must not read oversized file') })
  try { expect((await request(root, '/import', 'POST', form)).status).toBe(413) }
  finally { read.mockRestore() }
})

test('malformed multipart returns 400 and releases its lock', async () => {
  const {root} = await fixture()
  expect((await streamingImport(root, new TextEncoder().encode('broken'), {'Content-Type':'multipart/form-data; boundary=missing'})).status).toBe(400)
  expect(await Bun.file(join(root, 'public/contents/index.json.lock')).exists()).toBe(false)
})
