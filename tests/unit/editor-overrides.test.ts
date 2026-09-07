import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { embedEditorOverrides, validateEditorOverrides } from '../../src/services/editor/overrides'

const bridge = readFileSync('public/contents/common/editor-bridge.js', 'utf8')
const changes = { contentId: 'fixture', texts: [{ id: 't', path: 'h2:nth-of-type(2)', value: '</script><b>$& plain text</b>' }], styles: [{ variable: '--primary-color', value: '#123456' }], quizzes: [] }

describe('durable editor changes', () => {
  it('escapes HTML payload and replaces previous overrides', () => {
    const html = embedEditorOverrides('<body><h2>A</h2></body>', changes)
    expect(html).not.toContain('</script><b>')
    expect(embedEditorOverrides(html, changes).match(/id="eduflix-editor-overrides"/g)).toHaveLength(1)
    expect(html).toContain('/contents/common/editor-bridge.js')
  })
  it('rejects unsupported quiz writes', () => {
    expect(() => validateEditorOverrides({ ...changes, quizzes: [{}] })).toThrow(/quiz/)
  })
  it('replays changes and selects the actual same-tag sibling index', () => {
    document.body.innerHTML = embedEditorOverrides('<body><h2 class="other">One</h2><h2 class="target">Two</h2></body>', changes).replace(/<script id="editor-bridge-script"[^>]*><\/script>/, '')
    const targetWindow = { parent: { postMessage() {} }, location: window.location, addEventListener() {}, EduFlixEditor: undefined as undefined | { extractAllContent(): { texts: { path: string }[] } } }
    new Function('window', 'document', 'getComputedStyle', 'MutationObserver', 'CSS', bridge)(targetWindow, document, getComputedStyle, MutationObserver, CSS)
    document.dispatchEvent(new Event('DOMContentLoaded'))
    expect(document.querySelectorAll('h2')[1]?.textContent).toBe(changes.texts[0]!.value)
    expect(document.documentElement.style.getPropertyValue('--primary-color')).toBe('#123456')
    expect(targetWindow.EduFlixEditor?.extractAllContent().texts[1]?.path).toBe('h2:nth-of-type(2)')
  })
  it('applies delayed matching targets without changing unrelated markup', async () => {
    const delayed = { ...changes, texts: [{id:'t',path:'#dynamic',value:'Saved',originalValue:'Original',scene:'lesson'}], styles: [] }
    document.body.innerHTML = embedEditorOverrides('<body><h3>Keep <em>markup</em></h3><div id="lesson-scene" class="scene"></div></body>', delayed).replace(/<script id="editor-bridge-script"[^>]*><\/script>/, '')
    const targetWindow = { parent: { postMessage() {} }, location: window.location, addEventListener() {} }
    new Function('window', 'document', 'getComputedStyle', 'MutationObserver', 'CSS', bridge)(targetWindow, document, getComputedStyle, MutationObserver, CSS)
    document.dispatchEvent(new Event('DOMContentLoaded'))
    document.querySelector('#lesson-scene')!.innerHTML = '<h2 id="dynamic">Original</h2>'
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(document.querySelector('#dynamic')?.textContent).toBe('Saved')
    expect(document.querySelector('h3 em')?.textContent).toBe('markup')
    document.querySelector('#dynamic')!.textContent = 'Different activity'
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(document.querySelector('#dynamic')?.textContent).toBe('Different activity')
  })

  it('allows restoring original text while editing instead of replaying the old save', async () => {
    const stored = { ...changes, texts: [{ id:'t', path:'#original', value:'Saved', originalValue:'Original' }], styles: [] }
    document.body.innerHTML = embedEditorOverrides('<body><h2 id="original">Original</h2></body>', stored).replace(/<script id="editor-bridge-script"[^>]*><\/script>/, '')
    let listener: ((event: unknown) => void) | undefined
    const parent = { postMessage() {} }
    const targetWindow = { parent, location: window.location, addEventListener(_name: string, fn: (event: unknown) => void) { listener = fn } }
    new Function('window', 'document', 'getComputedStyle', 'MutationObserver', 'CSS', bridge)(targetWindow, document, getComputedStyle, MutationObserver, CSS)
    document.dispatchEvent(new Event('DOMContentLoaded'))
    listener?.({ origin: window.location.origin, source: parent, data: {type:'EDITOR_INIT'} })
    document.querySelector('#original')!.textContent = 'Original'
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(document.querySelector('#original')?.textContent).toBe('Original')
  })

})
