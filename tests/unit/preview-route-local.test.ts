import { describe, expect, it, vi } from 'vitest'
import { createPreviewStream, PREVIEW_STREAM_DURATION_MS } from '../../server/routes/preview'

describe('로컬 preview stream', () => {
  it('Z.ai/Codex 재시도 최악 7시간보다 긴 연결 시간을 보장한다', () => {
    expect(PREVIEW_STREAM_DURATION_MS).toBeGreaterThan(7 * 60 * 60 * 1000)
  })

  it('콘텐츠 변화가 없으면 빈 placeholder를 반복 전송하지 않는다', async () => {
    const getJob = vi.fn().mockReturnValue({ status: 'processing' })
    const stream = createPreviewStream('job-1', {
      getJob,
      getPreview: () => undefined,
      sleep: async () => undefined,
      maxPolls: 3,
    })

    expect(await new Response(stream).text()).toBe('')
    expect(getJob).toHaveBeenCalledTimes(3)
  })
})
