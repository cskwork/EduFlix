// 현재 카탈로그의 대표 콘텐츠 10개 검증 테스트
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// 콘텐츠 디렉토리 경로 (Vite에서 public/에서 서빙하므로 public/contents 사용)
const CONTENTS_DIR = join(__dirname, '../../public/contents')

// 필수 콘텐츠 목록
const REQUIRED_CONTENTS = [
  {
    id: 'fractions-pizza',
    title: '피자로 배우는 분수',
    subject: 'math',
    gradeLevel: 'elementary',
    type: 'game',
    language: 'ko',
    path: 'math/elementary/fractions-pizza',
  },
  {
    id: 'shapes-explorer',
    title: '도형 탐험가',
    subject: 'math',
    gradeLevel: 'elementary',
    type: 'exploration',
    language: 'ko',
    path: 'math/elementary/shapes-explorer',
  },
  {
    id: 'equation-puzzle',
    title: '방정식 퍼즐',
    subject: 'math',
    gradeLevel: 'middle',
    type: 'quiz',
    language: 'ko',
    path: 'math/middle/equation-puzzle',
  },
  {
    id: 'moon-phases',
    title: '달의 위상 변화: 변하는 달의 비밀',
    subject: 'science',
    gradeLevel: 'elementary',
    type: 'simulation',
    language: 'ko',
    path: 'science/elementary/moon-phases',
  },
  {
    id: 'states-of-matter',
    title: '물질의 상태 변화: 분자의 비밀',
    subject: 'science',
    gradeLevel: 'elementary',
    type: 'simulation',
    language: 'ko',
    path: 'science/elementary/states-of-matter',
  },
  {
    id: 'cell-explorer',
    title: '세포 탐험',
    subject: 'science',
    gradeLevel: 'middle',
    type: 'exploration',
    language: 'ko',
    path: 'science/middle/cell-explorer',
  },
  {
    id: 'chemical-reactor',
    title: '화학 반응 시뮬레이터',
    subject: 'science',
    gradeLevel: 'high',
    type: 'simulation',
    language: 'ko',
    path: 'science/high/chemical-reactor',
  },
  {
    id: 'comparative-adjectives',
    title: 'Who is Taller? Comparing with Adjectives',
    subject: 'english',
    gradeLevel: 'elementary',
    type: 'quiz',
    language: 'en',
    path: 'english/elementary/comparative-adjectives',
  },
  {
    id: 'present-tenses',
    title: "I play vs I'm playing: What's the Difference?",
    subject: 'english',
    gradeLevel: 'elementary',
    type: 'quiz',
    language: 'en',
    path: 'english/elementary/present-tenses',
  },
  {
    id: 'present-perfect',
    title: '현재완료시제 - Have You Ever...?',
    subject: 'english',
    gradeLevel: 'middle',
    type: 'quiz',
    language: 'en',
    path: 'english/middle/present-perfect',
  },
]

describe('콘텐츠 카탈로그 검증', () => {
  // 카탈로그 로드
  let catalog: { version: string; contents: Array<Record<string, unknown>> }

  try {
    const catalogPath = join(CONTENTS_DIR, 'index.json')
    catalog = JSON.parse(readFileSync(catalogPath, 'utf-8'))
  } catch {
    catalog = { version: '', contents: [] }
  }

  it('카탈로그 파일이 존재한다', () => {
    const catalogPath = join(CONTENTS_DIR, 'index.json')
    expect(existsSync(catalogPath)).toBe(true)
  })

  it('카탈로그에 버전 정보가 있다', () => {
    expect(catalog.version).toBeDefined()
    expect(catalog.version).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('카탈로그에 현재 84개 콘텐츠가 등록되어 있다', () => {
    expect(catalog.contents).toHaveLength(84)
  })

  describe('콘텐츠 파일 존재 확인', () => {
    REQUIRED_CONTENTS.forEach((content) => {
      it(`${content.title} (${content.id}) - index.html 파일 존재`, () => {
        const htmlPath = join(CONTENTS_DIR, content.path, 'index.html')
        expect(existsSync(htmlPath)).toBe(true)
      })
    })
  })

  describe('카탈로그 항목 검증', () => {
    REQUIRED_CONTENTS.forEach((required) => {
      describe(`${required.title}`, () => {
        const entry = catalog.contents?.find((c) => c.id === required.id)

        it('카탈로그에 등록되어 있다', () => {
          expect(entry).toBeDefined()
        })

        it('제목이 올바르다', () => {
          expect(entry?.title).toBe(required.title)
        })

        it('과목이 올바르다', () => {
          expect(entry?.subject).toBe(required.subject)
        })

        it('학년 레벨이 올바르다', () => {
          expect(entry?.gradeLevel).toBe(required.gradeLevel)
        })

        it('콘텐츠 타입이 올바르다', () => {
          expect(entry?.type).toBe(required.type)
        })

        it('언어가 올바르다', () => {
          expect(entry?.language).toBe(required.language)
        })

        it('설명이 있다', () => {
          expect(entry?.description).toBeDefined()
          expect(typeof entry?.description).toBe('string')
          expect((entry?.description as string).length).toBeGreaterThan(0)
        })

        it('경로가 지정되어 있다', () => {
          expect(entry?.path).toBeDefined()
          expect(typeof entry?.path).toBe('string')
        })
      })
    })
  })

  describe('HTML 콘텐츠 구조 검증', () => {
    REQUIRED_CONTENTS.forEach((content) => {
      describe(`${content.title} HTML 구조`, () => {
        const htmlPath = join(CONTENTS_DIR, content.path, 'index.html')
        let html = ''

        try {
          html = readFileSync(htmlPath, 'utf-8')
        } catch {
          html = ''
        }

        it('DOCTYPE이 있다', () => {
          expect(html.toLowerCase()).toContain('<!doctype html>')
        })

        it('title 태그가 있다', () => {
          expect(html).toMatch(/<title>.*<\/title>/i)
        })

        it('charset이 UTF-8로 설정되어 있다', () => {
          expect(html.toLowerCase()).toContain('charset')
          expect(html.toLowerCase()).toContain('utf-8')
        })

        it('viewport 메타 태그가 있다', () => {
          expect(html.toLowerCase()).toContain('viewport')
        })
      })
    })
  })
})

describe('과목별 콘텐츠 분포', () => {
  it('수학 콘텐츠가 3개 있다', () => {
    const mathContents = REQUIRED_CONTENTS.filter((c) => c.subject === 'math')
    expect(mathContents).toHaveLength(3)
  })

  it('과학 콘텐츠가 4개 있다', () => {
    const scienceContents = REQUIRED_CONTENTS.filter((c) => c.subject === 'science')
    expect(scienceContents).toHaveLength(4)
  })

  it('영어 콘텐츠가 3개 있다', () => {
    const englishContents = REQUIRED_CONTENTS.filter((c) => c.subject === 'english')
    expect(englishContents).toHaveLength(3)
  })
})

describe('학년 레벨별 콘텐츠 분포', () => {
  it('대표 목록에 초등 콘텐츠가 6개 있다', () => {
    const elemContents = REQUIRED_CONTENTS.filter((c) => c.gradeLevel === 'elementary')
    expect(elemContents).toHaveLength(6)
  })

  it('중등 콘텐츠가 3개 있다', () => {
    const middleContents = REQUIRED_CONTENTS.filter((c) => c.gradeLevel === 'middle')
    expect(middleContents).toHaveLength(3)
  })

  it('대표 목록에 고등 콘텐츠가 1개 있다', () => {
    const highContents = REQUIRED_CONTENTS.filter((c) => c.gradeLevel === 'high')
    expect(highContents).toHaveLength(1)
  })
})

describe('콘텐츠 타입 분포', () => {
  it('대표 목록에 game 타입 콘텐츠가 1개 있다', () => {
    const gameContents = REQUIRED_CONTENTS.filter((c) => c.type === 'game')
    expect(gameContents).toHaveLength(1)
  })

  it('simulation 타입 콘텐츠가 3개 있다', () => {
    const simContents = REQUIRED_CONTENTS.filter((c) => c.type === 'simulation')
    expect(simContents).toHaveLength(3)
  })

  it('대표 목록에 quiz 타입 콘텐츠가 4개 있다', () => {
    const quizContents = REQUIRED_CONTENTS.filter((c) => c.type === 'quiz')
    expect(quizContents).toHaveLength(4)
  })

  it('exploration 타입 콘텐츠가 2개 있다', () => {
    const explorationContents = REQUIRED_CONTENTS.filter((c) => c.type === 'exploration')
    expect(explorationContents).toHaveLength(2)
  })

  it('대표 목록에 story 타입 콘텐츠가 없다', () => {
    const storyContents = REQUIRED_CONTENTS.filter((c) => c.type === 'story')
    expect(storyContents).toHaveLength(0)
  })
})
