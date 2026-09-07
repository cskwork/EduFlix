import { expect, test } from 'bun:test'
import { readFile } from 'node:fs/promises'
import { Window } from 'happy-dom'
import { runInNewContext } from 'node:vm'

test('IRP scene initialization mounts controls before handlers bind', async () => {
  const window = new Window()
  try {
    const script = await readFile(new URL('../public/contents/math/middle/irp-future-wealth-simulator/script.js',import.meta.url),'utf8')
    const runtime = { document: window.document, setTimeout, location: {reload() {}}, parent: {postMessage() {}}, Engine: undefined as unknown as {nextScene():void}, window: undefined as unknown }
    runtime.window = runtime
    runInNewContext(script, runtime)
    const document = window.document
    expect(document.querySelectorAll('.scene').length).toBe(5)
    expect(document.querySelector('.scene.active')?.id).toBe('scene-hook')
    const next = document.getElementById('hook-next-btn') as unknown as {disabled:boolean}
    expect(next.disabled).toBe(true)
    ;(document.getElementById('btn-empty-wallet') as unknown as {click():void}).click()
    ;(document.getElementById('btn-rich-wallet') as unknown as {click():void}).click()
    expect(next.disabled).toBe(false)
    runtime.Engine.nextScene()
    expect(document.querySelector('.scene.active')?.id).toBe('scene-story')
  } finally { await window.happyDOM.close() }
})
