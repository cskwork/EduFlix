// 서버 설정 기본값과 환경변수 해석 유틸
import { getFactoryLlmConfig } from '../agents/content-factory/pipeline/lib/engine'

// 3000 충돌을 피하기 위한 기본 서버 포트
export const DEFAULT_SERVER_PORT = 3001

// 서버 포트 해석
export function getServerPort(env: Partial<Record<string, string | undefined>> = process.env): number {
  const rawPort = env.PORT
  const parsedPort = rawPort ? Number(rawPort) : NaN

  if (Number.isFinite(parsedPort) && parsedPort > 0) {
    return parsedPort
  }

  return DEFAULT_SERVER_PORT
}

export function getZaiConfig(env: Partial<Record<string, string | undefined>> = process.env) {
  const config = getFactoryLlmConfig({ ...env, FACTORY_LLM_PROVIDER: 'zai' })
  return { apiKey: config.apiKey, apiUrl: config.apiUrl, model: config.model }
}
