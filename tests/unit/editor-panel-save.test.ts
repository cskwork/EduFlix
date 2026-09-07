import { describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ContentEditorPanel from '../../src/components/editor/ContentEditorPanel.vue'
import StyleEditor from '../../src/components/editor/StyleEditor.vue'
import { saveLocalContent } from '../../src/services/content/localContent'
vi.mock('../../src/services/content/localContent', () => ({
  isLocalContentId: () => true,
  getLocalContent: async () => ({id:'local-test',html:'<h2>Keep <em>markup</em></h2>',css:':root{--primary-color:#112233}',js:''}),
  saveLocalContent: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('../../src/components/editor/ExportImportButtons.vue', () => ({default:{template:'<div />'}}))

describe('editor saves changed fields', () => {
  it('persists changed colors and excludes untouched text markup', async () => {
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    await flushPromises()
    vi.spyOn(iframe.contentWindow!, 'postMessage').mockImplementation(() => {})
    const wrapper = mount(ContentEditorPanel, {props:{contentId:'local-test',iframeRef:iframe}})
    const style = {id:'color',variable:'--primary-color',value:'#112233',label:'Primary',type:'color',category:'primary'}
    window.dispatchEvent(new MessageEvent('message', {origin:window.location.origin, source:iframe.contentWindow, data:{type:'CONTENT_EXTRACTED',payload:{texts:[{id:'t',path:'h2',value:'Keep markup'}],styles:[style],quizzes:[]}}}))
    await flushPromises()
    await wrapper.findAll('.editor-tabs button')[1]!.trigger('click')
    wrapper.findComponent(StyleEditor).vm.$emit('update', {...style,value:'#445566'})
    await flushPromises()
    await wrapper.find('.btn-save').trigger('click')
    await flushPromises()
    expect(saveLocalContent).toHaveBeenCalledWith(expect.objectContaining({editorOverrides:expect.objectContaining({texts:[],styles:[expect.objectContaining({value:'#445566'})]})}))
    wrapper.unmount()
    iframe.remove()
  })
})
