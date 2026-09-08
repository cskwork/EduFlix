import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useLearningStore } from '../../src/stores/learning'

const map = { nodes: [{id:'first',subject:'math',contentIds:['one','two']},{id:'next',subject:'math',contentIds:['three']}], edges:[{from:'first',to:'next',relation:'prerequisite'}] }
beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok:true,json:async()=>map}))
})
describe('explicit learning completion', () => {
  it('unlocks only after all related contents and survives a new store', async () => {
    const store = useLearningStore()
    await store.loadKnowledgeMap()
    store.markContentCompleted('first','one')
    expect(store.getNodeStatus('first')).toBe('in_progress')
    expect(store.getNodeStatus('next')).toBe('locked')
    store.markContentCompleted('first','one')
    expect(store.stats.completedContents).toBe(1)
    store.markContentCompleted('first','two')
    expect(store.getNodeStatus('next')).toBe('available')
    setActivePinia(createPinia())
    const restored = useLearningStore()
    await restored.loadKnowledgeMap()
    expect(restored.getNodeStatus('first')).toBe('completed')
    expect(restored.stats.completedContents).toBe(2)
  })
  it('does not accept unrelated content or nonexistent nodes', async () => {
    const store = useLearningStore()
    await store.loadKnowledgeMap()
    store.markContentCompleted('first','three')
    store.markContentCompleted('missing','one')
    expect(store.progressMap.size).toBe(0)
  })
})
