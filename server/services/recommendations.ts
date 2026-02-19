// SQLite 기반 추천 시스템 서비스
import Database from 'bun:sqlite'
import { join, dirname } from 'path'
import { mkdirSync, existsSync } from 'fs'

// DB 경로 설정
const DB_DIR = join(dirname(import.meta.dir), 'db')
const DB_PATH = join(DB_DIR, 'recommendations.db')

// DB 디렉토리 생성
if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true })
}

// SQLite 데이터베이스 연결
const db = new Database(DB_PATH)

// 테이블 초기화
db.run(`
  CREATE TABLE IF NOT EXISTS content_clicks (
    content_id TEXT PRIMARY KEY,
    click_count INTEGER DEFAULT 0,
    first_clicked_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_clicked_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

// 인덱스 생성 (클릭 수 정렬 최적화)
db.run(`
  CREATE INDEX IF NOT EXISTS idx_click_count ON content_clicks(click_count DESC)
`)

console.log(`📊 추천 시스템 DB 초기화 완료: ${DB_PATH}`)

export interface ContentClick {
  content_id: string
  click_count: number
  first_clicked_at: string
  last_clicked_at: string
}

export interface RecommendedContent {
  contentId: string
  clickCount: number
  lastClickedAt: string
}

/**
 * 콘텐츠 클릭 기록
 */
export function recordClick(contentId: string): ContentClick {
  const stmt = db.prepare(`
    INSERT INTO content_clicks (content_id, click_count, first_clicked_at, last_clicked_at)
    VALUES (?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(content_id) DO UPDATE SET
      click_count = click_count + 1,
      last_clicked_at = CURRENT_TIMESTAMP
    RETURNING *
  `)

  return stmt.get(contentId) as ContentClick
}

/**
 * 인기 콘텐츠 목록 조회 (클릭 수 내림차순)
 */
export function getPopularContent(limit = 10): RecommendedContent[] {
  const stmt = db.prepare(`
    SELECT content_id, click_count, last_clicked_at
    FROM content_clicks
    ORDER BY click_count DESC, last_clicked_at DESC
    LIMIT ?
  `)

  const results = stmt.all(limit) as ContentClick[]

  return results.map(row => ({
    contentId: row.content_id,
    clickCount: row.click_count,
    lastClickedAt: row.last_clicked_at,
  }))
}

/**
 * 특정 콘텐츠의 클릭 수 조회
 */
export function getClickCount(contentId: string): number {
  const stmt = db.prepare(`
    SELECT click_count FROM content_clicks WHERE content_id = ?
  `)

  const result = stmt.get(contentId) as ContentClick | null
  return result?.click_count ?? 0
}

/**
 * 전체 클릭 통계
 */
export function getStats(): { totalClicks: number; uniqueContents: number } {
  const stmt = db.prepare(`
    SELECT
      COALESCE(SUM(click_count), 0) as total_clicks,
      COUNT(*) as unique_contents
    FROM content_clicks
  `)

  const result = stmt.get() as { total_clicks: number; unique_contents: number }

  return {
    totalClicks: result.total_clicks,
    uniqueContents: result.unique_contents,
  }
}

/**
 * 전체 클릭 데이터 초기화
 */
export function clearAllClicks(): number {
  const stmt = db.prepare('DELETE FROM content_clicks')
  const result = stmt.run()
  return Number(result.changes || 0)
}

/**
 * DB 연결 종료 (서버 종료 시)
 */
export function closeDb(): void {
  db.close()
}
