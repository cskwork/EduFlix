import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LivePreview from '../../src/components/creator/LivePreview.vue'
import { subscribeToPreview } from '../../src/services/preview/stream'

vi.mock('../../src/services/preview/stream', () => ({
  subscribeToPreview: vi.fn(),
  buildPreviewDocument: () => '<html></html>',
}))

describe('LivePreview connection lifecycle', () => {
  const close = vi.fn()
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(subscribeToPreview).mockReturnValue({ close, isConnected: true })
  })

  it('subscribes when mounted with an active job and closes on unmount', () => {
    const wrapper = mount(LivePreview, { props: { jobId: 'first', isActive: true } })
    expect(subscribeToPreview).toHaveBeenCalledWith('first', expect.any(Function))
    wrapper.unmount()
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('closes on cancellation and subscribes once to the restarted job', async () => {
    const wrapper = mount(LivePreview, { props: { jobId: 'first', isActive: true } })
    await wrapper.setProps({ isActive: false })
    expect(close).toHaveBeenCalledTimes(1)
    await wrapper.setProps({ jobId: 'second', isActive: true })
    expect(subscribeToPreview).toHaveBeenCalledTimes(2)
    expect(subscribeToPreview).toHaveBeenLastCalledWith('second', expect.any(Function))
    wrapper.unmount()
    expect(close).toHaveBeenCalledTimes(2)
  })

  it('waits until an inactive initial job becomes active', async () => {
    const wrapper = mount(LivePreview, { props: { jobId: 'first', isActive: false } })
    expect(subscribeToPreview).not.toHaveBeenCalled()
    await wrapper.setProps({ isActive: true })
    expect(subscribeToPreview).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})
