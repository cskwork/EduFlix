import { describe, expect, it } from 'vitest'
import { getLlmHealth } from '../../server/services/health'

describe('생성 엔진 헬스 체크', () => {
  it('기본 Z.ai 모델과 키 준비 상태를 반환한다', () => {
    expect(getLlmHealth({})).toEqual({ provider: 'zai', model: 'glm-5.2', keyConfigured: false })
    expect(getLlmHealth({ ZAI_API_KEY: 'key' })).toEqual({ provider: 'zai', model: 'glm-5.2', keyConfigured: true })
  })

  it('선택적 Codex provider를 반환한다', () => {
    expect(getLlmHealth({ FACTORY_LLM_PROVIDER: 'codex' })).toEqual({
      provider: 'codex', model: 'gpt-5.6-sol', keyConfigured: true,
    })
  })
})
