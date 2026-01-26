import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const contentsRoot = resolve(process.cwd(), 'public/contents')

const collectFiles = (dir: string, ext: string, acc: string[] = []) => {
  const entries = readdirSync(dir)
  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stats = statSync(fullPath)
    if (stats.isDirectory()) {
      collectFiles(fullPath, ext, acc)
      continue
    }
    if (entry.endsWith(ext)) {
      acc.push(fullPath)
    }
  }
  return acc
}

describe('content asset paths', () => {
  const htmlFiles = collectFiles(contentsRoot, '.html')
  const cssFiles = collectFiles(contentsRoot, '.css')

  it('HTML은 아이콘/다이어그램/일러스트 경로를 /contents 기준 절대 경로로 사용한다', () => {
    const badPattern = /(?:src|href)=["'](?:\.\.\/)+(?:icons|diagrams|illustrations|backgrounds)\//
    for (const file of htmlFiles) {
      const html = readFileSync(file, 'utf-8')
      expect(html, file).not.toMatch(badPattern)
    }
  })

  it('CSS 배경 이미지는 /contents 기준 절대 경로를 사용한다', () => {
    const badPattern = /url\(["']?(?:\.\.\/)+backgrounds\//
    for (const file of cssFiles) {
      const css = readFileSync(file, 'utf-8')
      expect(css, file).not.toMatch(badPattern)
    }
  })
})
