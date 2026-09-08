import { afterEach, describe, expect, it, vi } from 'vitest'
import { saveLocalContent, type LocalContent } from '../../src/services/content/localContent'

afterEach(() => vi.unstubAllGlobals())
describe('IndexedDB commit boundary', () => {
  it('waits for transaction completion and rejects an abort after request success', async () => {
    const request = { result: 'local-qa' }
    const transaction = { objectStore: () => ({ put: () => request }), oncomplete: null as null | (() => void), onabort: null as null | (() => void), error: new Error('Aborted') }
    const database = { transaction: () => transaction, close: vi.fn() }
    const openRequest = { result: database, onsuccess: null as null | (() => void) }
    vi.stubGlobal('indexedDB', { open: () => { queueMicrotask(() => openRequest.onsuccess?.()); return openRequest } })
    let settled = false
    const promise = saveLocalContent({ id:'local-qa' } as LocalContent)
    void promise.then(() => { settled = true }, () => { settled = true })
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve()
    expect(settled).toBe(false)
    transaction.onabort?.()
    await expect(promise).rejects.toThrow('Aborted')
    expect(database.close).toHaveBeenCalledOnce()
  })
})
