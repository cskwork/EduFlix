import { describe, expect, it } from 'vitest'
import { validateGeneration as localValidate } from '../../server/validation/generation'
import { validateGeneration as deployedValidate, buildPrompt } from '../../api/generate'
import type { GenerationRequest } from '../../src/types/generation'

describe('teacher generation brief', () => {
  const request: GenerationRequest = { mode: 'problem', language: 'ko', problem: '같은 크기의 분수를 비교해 보자', grade: 'elementary-1', difficulty: 'hard', contentType: 'quiz', additionalContext: '수업 목표: 분수 비교. 20분.' }
  it('keeps explicit grade separate from difficulty in both generation paths', () => {
    expect(localValidate(request)).toBeUndefined()
    expect(deployedValidate(request)).toBeUndefined()
    const prompt = buildPrompt(request)
    expect(prompt).toContain('대상 학년: elementary-1')
    expect(prompt).toContain('학년 내 난이도: hard')
    expect(prompt).toContain('콘텐츠 유형: quiz')
    expect(prompt).toContain('20분')
    expect(prompt).toContain('data-editable')
    expect(buildPrompt({ ...request, grade: undefined })).toContain('대상 학년: high-2')
  })
  it('rejects invalid grade and content type in both entrypoints', () => {
    for (const validate of [localValidate, deployedValidate]) {
      expect(validate({ ...request, grade: 'unknown' } as never)).toBeTruthy()
      expect(validate({ ...request, contentType: 'unknown' } as never)).toBeTruthy()
    }
  })
})
