import { describe, expect, it } from 'vitest'
import { DEFAULT_SERVER_PORT, getServerPort, getZaiConfig } from '../../server/config'

describe('서버 설정', () => {
  it('PORT가 없거나 올바르지 않으면 3001을 사용한다', () => {
    expect(getServerPort({})).toBe(DEFAULT_SERVER_PORT)
    expect(getServerPort({ PORT: 'invalid' })).toBe(DEFAULT_SERVER_PORT)
  })

  it('양의 PORT를 사용한다', () => {
    expect(getServerPort({ PORT: '9888' })).toBe(9888)
  })

  it('Z.ai 기본 URL과 모델을 제공한다', () => {
    expect(getZaiConfig({ ZAI_API_KEY: 'test' })).toMatchObject({
      apiKey: 'test',
      apiUrl: 'https://api.z.ai/api/coding/paas/v4/chat/completions',
      model: 'glm-5.2',
    })
  })
})
