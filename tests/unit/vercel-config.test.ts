// Vercel 리라이트 설정 회귀 테스트
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('vercel.json rewrites', () => {
  it('/api 경로는 SPA 리라이트에서 제외되어야 한다', () => {
    const configPath = resolve(process.cwd(), 'vercel.json')
    const raw = readFileSync(configPath, 'utf-8')
    const config = JSON.parse(raw) as {
      rewrites?: Array<{ source?: string; destination?: string }>
    }

    const rewrite = config.rewrites?.find((item) => item.destination === '/index.html')

    expect(rewrite).toBeDefined()
    expect(rewrite?.source).toContain('api')
  })
})
