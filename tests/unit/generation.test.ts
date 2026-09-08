// AI 생성 파이프라인 테스트
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGenerationStore } from '../../src/stores/generation'
import { useContentStore } from '../../src/stores/content'
import { generateContent } from '../../src/services/api/claude'
import {
  GENERATION_STATUS_MESSAGES,
  SUBJECT_GENERATION_HINTS,
  ESTIMATED_GENERATION_TIME,
} from '../../src/composables/useAIGeneration'
import { subjectLabel } from '../../src/i18n/labels'

// generateContent mock
vi.mock('../../src/services/api/claude', () => ({
  generateContent: vi.fn(),
}))

describe('generation store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('초기 상태', () => {
    it('기본 상태가 올바르게 설정된다', () => {
      const store = useGenerationStore()

      expect(store.currentProgress.status).toBe('idle')
      expect(store.currentProgress.progress).toBe(0)
      expect(store.currentProgress.message).toBe('')
      expect(store.currentRequest).toBeNull()
      expect(store.lastResult).toBeNull()
      expect(store.history).toHaveLength(0)
    })

    it('계산된 속성이 올바르다', () => {
      const store = useGenerationStore()

      expect(store.isGenerating).toBe(false)
      expect(store.isCompleted).toBe(false)
      expect(store.hasError).toBe(false)
      expect(store.progressPercent).toBe(0)
      expect(store.statusMessage).toBe('')
    })
  })

  describe('cancelGeneration', () => {
    it('생성을 취소하고 상태를 초기화한다', () => {
      const store = useGenerationStore()

      // 진행 중 상태로 설정
      store.updateProgress('generating', 50, '생성 중...')
      expect(store.isGenerating).toBe(true)

      // 취소
      store.cancelGeneration()

      expect(store.currentProgress.status).toBe('idle')
      expect(store.currentProgress.progress).toBe(0)
      expect(store.currentRequest).toBeNull()
    })
  })

  describe('resetState', () => {
    it('모든 상태를 초기화한다', () => {
      const store = useGenerationStore()

      // 상태 설정
      store.updateProgress('completed', 100, '완료')

      // 초기화
      store.resetState()

      expect(store.currentProgress.status).toBe('idle')
      expect(store.currentProgress.progress).toBe(0)
      expect(store.currentRequest).toBeNull()
      expect(store.lastResult).toBeNull()
    })
  })

  describe('updateProgress', () => {
    it('진행 상태를 업데이트한다', () => {
      const store = useGenerationStore()

      store.updateProgress('generating', 50, '콘텐츠 생성 중...')

      expect(store.currentProgress.status).toBe('generating')
      expect(store.currentProgress.progress).toBe(50)
      expect(store.currentProgress.message).toBe('콘텐츠 생성 중...')
    })
  })

  it('POST 직후 전달된 jobId를 생성 완료 전 저장한다', async () => {
    const store = useGenerationStore()
    let release!: () => void
    const gate = new Promise<void>((resolve) => { release = resolve })
    vi.mocked(generateContent).mockImplementation(async (_options, _progress, onJobCreated) => {
      onJobCreated?.('job-live')
      await gate
      return { success: false, jobId: 'job-live', error: '테스트 종료' }
    })

    const pending = store.startGeneration({ interests: ['별'], subject: 'science', grade: 'elementary-3' })
    expect(store.currentJobId).toBe('job-live')
    release()
    await pending
  })

  describe('isGenerating computed', () => {
    it('preparing 상태면 true', () => {
      const store = useGenerationStore()
      store.updateProgress('preparing', 10, '준비 중')
      expect(store.isGenerating).toBe(true)
    })

    it('generating 상태면 true', () => {
      const store = useGenerationStore()
      store.updateProgress('generating', 50, '생성 중')
      expect(store.isGenerating).toBe(true)
    })

    it('generating-images 상태면 true', () => {
      const store = useGenerationStore()
      store.updateProgress('generating-images', 70, '이미지 생성 중')
      expect(store.isGenerating).toBe(true)
    })

    it('finalizing 상태면 true', () => {
      const store = useGenerationStore()
      store.updateProgress('finalizing', 90, '마무리 중')
      expect(store.isGenerating).toBe(true)
    })

    it('completed 상태면 false', () => {
      const store = useGenerationStore()
      store.updateProgress('completed', 100, '완료')
      expect(store.isGenerating).toBe(false)
    })

    it('error 상태면 false', () => {
      const store = useGenerationStore()
      store.updateProgress('error', 0, '오류')
      expect(store.isGenerating).toBe(false)
    })
  })

  describe('히스토리 관리', () => {
    it('clearHistory로 히스토리를 비운다', () => {
      const store = useGenerationStore()

      // 히스토리에 항목 추가 (직접 추가)
      store.history.push({
        id: 'test-1',
        request: { interests: ['수학'], subject: 'math', grade: 'elementary-3', language: 'ko' },
        response: { success: true },
        createdAt: new Date().toISOString(),
        duration: 1000,
      })

      expect(store.history).toHaveLength(1)

      store.clearHistory()

      expect(store.history).toHaveLength(0)
    })

    it('getHistoryItem으로 특정 항목을 조회한다', () => {
      const store = useGenerationStore()

      const item = {
        id: 'test-item-1',
        request: { interests: ['과학'], subject: 'science' as const, grade: 'middle-1' as const, language: 'ko' as const },
        response: { success: true },
        createdAt: new Date().toISOString(),
        duration: 2000,
      }

      store.history.push(item)

      const found = store.getHistoryItem('test-item-1')
      expect(found).toBeDefined()
      expect(found?.id).toBe('test-item-1')

      const notFound = store.getHistoryItem('nonexistent')
      expect(notFound).toBeUndefined()
    })
  })
})

describe('content store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('필터 기능', () => {
    it('과목 필터를 설정한다', () => {
      const store = useContentStore()

      store.setSubjectFilter('math')
      expect(store.selectedSubject).toBe('math')

      store.setSubjectFilter(null)
      expect(store.selectedSubject).toBeNull()
    })

    it('학년 레벨 필터를 설정한다', () => {
      const store = useContentStore()

      store.setGradeLevelFilter('middle')
      expect(store.selectedGradeLevel).toBe('middle')

      store.setGradeLevelFilter(null)
      expect(store.selectedGradeLevel).toBeNull()
    })

    it('clearFilters로 모든 필터를 초기화한다', () => {
      const store = useContentStore()

      store.setSubjectFilter('science')
      store.setGradeLevelFilter('high')

      store.clearFilters()

      expect(store.selectedSubject).toBeNull()
      expect(store.selectedGradeLevel).toBeNull()
    })

    it('검색어 필터가 적용된다', () => {
      const store = useContentStore()

      store.addContent({
        id: 'math-1',
        title: '분수의 기초',
        subject: 'math',
        gradeLevel: 'elementary',
        grade: 'elementary-3',
        type: 'game',
        language: 'ko',
        description: '피자를 나누며 분수를 배워요',
        thumbnail: '',
        path: '',
        createdAt: new Date().toISOString(),
        tags: ['분수', '피자'],
      })

      store.addContent({
        id: 'science-1',
        title: '세포 탐험',
        subject: 'science',
        gradeLevel: 'middle',
        grade: 'middle-1',
        type: 'simulation',
        language: 'ko',
        description: '현미경으로 세포를 관찰해요',
        thumbnail: '',
        path: '',
        createdAt: new Date().toISOString(),
        tags: ['세포', '현미경'],
      })

      store.setSearchQuery('피자')
      expect(store.filteredContents).toHaveLength(1)
      expect(store.filteredContents[0].id).toBe('math-1')

      store.setSearchQuery('세포')
      expect(store.filteredContents).toHaveLength(1)
      expect(store.filteredContents[0].id).toBe('science-1')
    })
  })

  describe('콘텐츠 추가', () => {
    it('addContent로 새 콘텐츠를 추가한다', () => {
      const store = useContentStore()
      expect(store.contents).toHaveLength(0)

      store.addContent({
        id: 'new-content',
        title: '새 콘텐츠',
        subject: 'math',
        gradeLevel: 'elementary',
        grade: 'elementary-3',
        type: 'game',
        language: 'ko',
        description: '설명',
        thumbnail: '',
        path: '/test/path',
        createdAt: new Date().toISOString(),
      })

      expect(store.contents).toHaveLength(1)
      expect(store.contents[0].id).toBe('new-content')
    })
  })

  describe('getContentById', () => {
    it('ID로 콘텐츠를 찾는다', () => {
      const store = useContentStore()

      store.addContent({
        id: 'test-content',
        title: '테스트',
        subject: 'english',
        gradeLevel: 'middle',
        grade: 'middle-2',
        type: 'quiz',
        language: 'en',
        description: 'Test',
        thumbnail: '',
        path: '/test',
        createdAt: new Date().toISOString(),
      })

      const found = store.getContentById('test-content')
      expect(found).not.toBeNull()
      expect(found?.title).toBe('테스트')

      const notFound = store.getContentById('nonexistent')
      expect(notFound).toBeNull()
    })
  })

  describe('filteredContents', () => {
    it('과목 필터가 적용된다', () => {
      const store = useContentStore()

      store.addContent({
        id: 'math-1',
        title: '수학 콘텐츠',
        subject: 'math',
        gradeLevel: 'elementary',
        grade: 'elementary-3',
        type: 'game',
        language: 'ko',
        description: '',
        thumbnail: '',
        path: '',
        createdAt: new Date().toISOString(),
      })

      store.addContent({
        id: 'science-1',
        title: '과학 콘텐츠',
        subject: 'science',
        gradeLevel: 'elementary',
        grade: 'elementary-4',
        type: 'simulation',
        language: 'ko',
        description: '',
        thumbnail: '',
        path: '',
        createdAt: new Date().toISOString(),
      })

      expect(store.filteredContents).toHaveLength(2)

      store.setSubjectFilter('math')
      expect(store.filteredContents).toHaveLength(1)
      expect(store.filteredContents[0].subject).toBe('math')
    })

    it('학년 레벨 필터가 적용된다', () => {
      const store = useContentStore()

      store.addContent({
        id: 'elem-1',
        title: '초등 콘텐츠',
        subject: 'math',
        gradeLevel: 'elementary',
        grade: 'elementary-3',
        type: 'game',
        language: 'ko',
        description: '',
        thumbnail: '',
        path: '',
        createdAt: new Date().toISOString(),
      })

      store.addContent({
        id: 'middle-1',
        title: '중등 콘텐츠',
        subject: 'math',
        gradeLevel: 'middle',
        grade: 'middle-1',
        type: 'quiz',
        language: 'ko',
        description: '',
        thumbnail: '',
        path: '',
        createdAt: new Date().toISOString(),
      })

      store.setGradeLevelFilter('elementary')
      expect(store.filteredContents).toHaveLength(1)
      expect(store.filteredContents[0].gradeLevel).toBe('elementary')
    })
  })

  describe('contentGroups', () => {
    it('과목별로 그룹화한다', () => {
      const store = useContentStore()

      store.addContent({
        id: 'math-1',
        title: '수학 1',
        subject: 'math',
        gradeLevel: 'elementary',
        grade: 'elementary-3',
        type: 'game',
        language: 'ko',
        description: '',
        thumbnail: '',
        path: '',
        createdAt: new Date().toISOString(),
      })

      store.addContent({
        id: 'math-2',
        title: '수학 2',
        subject: 'math',
        gradeLevel: 'middle',
        grade: 'middle-1',
        type: 'quiz',
        language: 'ko',
        description: '',
        thumbnail: '',
        path: '',
        createdAt: new Date().toISOString(),
      })

      store.addContent({
        id: 'science-1',
        title: '과학 1',
        subject: 'science',
        gradeLevel: 'elementary',
        grade: 'elementary-4',
        type: 'simulation',
        language: 'ko',
        description: '',
        thumbnail: '',
        path: '',
        createdAt: new Date().toISOString(),
      })

      const groups = store.contentGroups

      expect(groups).toHaveLength(2) // math, science

      const mathGroup = groups.find((g) => g.subject === 'math')
      expect(mathGroup).toBeDefined()
      expect(mathGroup?.contents).toHaveLength(2)
      expect(mathGroup?.subjectLabel).toBe(subjectLabel('math'))

      const scienceGroup = groups.find((g) => g.subject === 'science')
      expect(scienceGroup).toBeDefined()
      expect(scienceGroup?.contents).toHaveLength(1)
    })
  })
})

describe('generation constants', () => {
  describe('GENERATION_STATUS_MESSAGES', () => {
    it('모든 상태에 대한 메시지가 정의되어 있다', () => {
      const statuses = [
        'idle',
        'preparing',
        'generating',
        'generating-images',
        'finalizing',
        'completed',
        'error',
      ]

      statuses.forEach((status) => {
        expect(GENERATION_STATUS_MESSAGES).toHaveProperty(status)
      })
    })

    it('한국어 메시지를 포함한다', () => {
      expect(GENERATION_STATUS_MESSAGES.preparing).toContain('준비')
      expect(GENERATION_STATUS_MESSAGES.generating).toContain('만들')
      expect(GENERATION_STATUS_MESSAGES.completed).toContain('완성')
    })
  })

  describe('SUBJECT_GENERATION_HINTS', () => {
    it('모든 과목에 힌트가 있다', () => {
      expect(SUBJECT_GENERATION_HINTS.math).toBeDefined()
      expect(SUBJECT_GENERATION_HINTS.science).toBeDefined()
      expect(SUBJECT_GENERATION_HINTS.english).toBeDefined()
    })

    it('각 과목에 최소 1개의 힌트가 있다', () => {
      expect(SUBJECT_GENERATION_HINTS.math.length).toBeGreaterThan(0)
      expect(SUBJECT_GENERATION_HINTS.science.length).toBeGreaterThan(0)
      expect(SUBJECT_GENERATION_HINTS.english.length).toBeGreaterThan(0)
    })
  })

  describe('ESTIMATED_GENERATION_TIME', () => {
    it('예상 시간이 양수다', () => {
      expect(ESTIMATED_GENERATION_TIME).toBeGreaterThan(0)
    })

    it('합리적인 범위다 (10초 ~ 120초)', () => {
      expect(ESTIMATED_GENERATION_TIME).toBeGreaterThanOrEqual(10)
      expect(ESTIMATED_GENERATION_TIME).toBeLessThanOrEqual(120)
    })
  })
})

describe('generation run isolation', () => {
  beforeEach(() => { setActivePinia(createPinia()); vi.clearAllMocks() })
  it('aborts client work and ignores late callbacks and results from a cancelled run', async () => {
    let finish!: (result: {success:boolean;contentId:string}) => void
    let lateProgress: ((value: {status:'completed';progress:number;message:string}) => void) | undefined
    let signal: AbortSignal | undefined
    vi.mocked(generateContent).mockImplementation((_options, progress, _job, abortSignal) => {
      lateProgress = progress
      signal = abortSignal
      return new Promise(resolve => { finish = resolve })
    })
    const store = useGenerationStore()
    const pending = store.startGeneration({ subject:'math' })
    store.cancelGeneration()
    expect(signal?.aborted).toBe(true)
    lateProgress?.({status:'completed',progress:100,message:'Late'})
    finish({success:true,contentId:'old'})
    expect((await pending).success).toBe(false)
    expect(store.currentProgress.status).toBe('idle')
    expect(store.lastResult).toBeNull()
    expect(store.history).toHaveLength(0)
  })
  it('uses the server manifest path for inferred-subject content', async () => {
    vi.mocked(generateContent).mockResolvedValue({success:true,contentId:'inferred',manifest:{id:'inferred',title:'Inferred',description:'',type:'simulation',subject:'science',gradeLevel:'middle',grade:'middle-2',path:'/contents/science/middle/inferred/index.html'}})
    const store = useGenerationStore()
    await store.startGeneration({mode:'problem',problem:'Why does light bend?'})
    expect(useContentStore().getContentById('inferred')?.path).toBe('/contents/science/middle/inferred/index.html')
    expect(useContentStore().getContentById('inferred')?.subject).toBe('science')
  })
})
