// 생성 엔진 준비 상태
import { getFactoryLlmConfig } from '../../agents/content-factory/pipeline/lib/engine'

export function getLlmHealth(env: Partial<Record<string, string | undefined>> = process.env) {
  const { provider, model, keyConfigured } = getFactoryLlmConfig(env)
  return { provider, model, keyConfigured }
}
