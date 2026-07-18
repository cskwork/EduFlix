import { describe, expect, it, vi } from 'vitest'
import { getFactoryLlmConfig, runFactoryFiles, runFactoryText } from './engine'

describe('팩토리 LLM 엔진 라우팅', () => {
  it('기본 Z.ai와 선택적 Codex 설정을 해석한다', () => {
    expect(getFactoryLlmConfig({ ZAI_API_KEY: 'key' })).toMatchObject({ provider: 'zai', model: 'glm-5.2', keyConfigured: true })
    expect(getFactoryLlmConfig({ FACTORY_LLM_PROVIDER: 'codex' })).toMatchObject({ provider: 'codex', keyConfigured: true })
  })

  it('일반 텍스트 옵션을 provider별 구현으로 그대로 라우팅한다', async () => {
    const runZaiText = vi.fn().mockResolvedValue(undefined)
    const runCodex = vi.fn().mockResolvedValue(undefined)
    const options = { prompt: 'x', outFile: 'review.txt', timeoutMs: 123, label: 'review judge' }
    await runFactoryText(options, {
      env: { ZAI_API_KEY: 'key' }, runZaiText, runCodex,
    })
    expect(runZaiText).toHaveBeenCalledWith(expect.objectContaining(options))
    await runFactoryText(options, {
      env: { FACTORY_LLM_PROVIDER: 'codex' }, runZaiText, runCodex,
    })
    expect(runCodex).toHaveBeenCalledWith(options)
  })

  it('파일 생성 계약을 Z.ai에는 명시적으로, Codex에는 기존 workspace-write 옵션으로 전달한다', async () => {
    const runZaiFiles = vi.fn().mockResolvedValue(undefined)
    const runCodex = vi.fn().mockResolvedValue(undefined)
    const options = {
      prompt: 'build',
      requiredFiles: ['lesson.html', 'meta.json'],
      stagingDir: '/tmp/staging',
      responseFile: '/tmp/response.txt',
      timeoutMs: 456,
      label: 'content build',
    }

    await runFactoryFiles(options, {
      env: { ZAI_API_KEY: 'key' }, runZaiFiles, runCodex,
    })
    expect(runZaiFiles).toHaveBeenCalledWith(expect.objectContaining(options))

    await runFactoryFiles(options, {
      env: { FACTORY_LLM_PROVIDER: 'codex' }, runZaiFiles, runCodex,
    })
    expect(runCodex).toHaveBeenCalledWith({
      prompt: 'build',
      outFile: '/tmp/response.txt',
      cwd: '/tmp/staging',
      workspaceWrite: true,
      timeoutMs: 456,
      label: 'content build',
    })
  })
})
