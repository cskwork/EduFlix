import { describe, it, expect } from 'vitest'
import {
  DEFAULT_ART_ASSETS_PORT,
  DEFAULT_SERVER_PORT,
  getArtAssetsUrl,
  getServerPort,
} from '../../server/config'

describe('서버 설정 기본값', () => {
  it('기본 서버 포트는 3000이 아니다', () => {
    const port = getServerPort({})

    expect(port).toBe(DEFAULT_SERVER_PORT)
    expect(port).not.toBe(3000)
  })

  it('기본 art-assets 포트는 3000이 아니다', () => {
    const url = getArtAssetsUrl({})
    const parsed = new URL(url)

    expect(Number(parsed.port)).toBe(DEFAULT_ART_ASSETS_PORT)
    expect(parsed.port).not.toBe('3000')
  })
})

