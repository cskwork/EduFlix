import { expect, test } from 'bun:test'
import { validateGeneration as validateServer } from './validation/generation'
import { validateGeneration as validateVercel, buildPrompt, POST } from '../api/generate'
import type { GenerationRequest } from '../src/types/generation'

const valid: GenerationRequest = {mode:'problem',problem:'What is one plus two?',difficulty:'easy',language:'en'}
test('Bun and Vercel reject malformed roots, inherited difficulties and invalid languages without LLM calls', async () => {
  for (const body of [null, [], {...valid,difficulty:'toString'}, {...valid,language:'fr'}, {...valid,additionalContext: []}, {...valid,subject:['math']}, {...valid,difficulty:['easy']}]) {
    expect(validateServer(body as GenerationRequest)).toBeTruthy()
    expect(validateVercel(body as GenerationRequest)).toBeTruthy()
  }
  expect(validateServer(valid)).toBeUndefined()
  expect(validateVercel(valid)).toBeUndefined()
  const response = await POST(new Request('http://localhost/api/generate',{method:'POST',body:'null'}))
  expect(response.status).toBe(400)
})
test('Vercel prompts preserve selected English and Korean generation languages', () => {
  expect(buildPrompt(valid)).toContain('모든 학습자용 텍스트는 영어로 작성할 것')
  expect(buildPrompt({...valid,language:'ko'})).toContain('모든 학습자용 텍스트는 한국어로 작성할 것')
  expect(buildPrompt(valid)).not.toContain('모든 텍스트는 한국어로')
})
