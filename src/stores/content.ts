// Pinia 콘텐츠 상태 관리 스토어
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ContentManifest,
  ContentCardData,
  ContentGroup,
  Subject,
  GradeLevel,
} from '../types/content'
import { SUBJECT_LABELS } from '../types/content'

export const useContentStore = defineStore('content', () => {
  // 상태
  const contents = ref<ContentManifest[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const selectedSubject = ref<Subject | null>(null)
  const selectedGradeLevel = ref<GradeLevel | null>(null)

  // 계산된 속성: 필터링된 콘텐츠
  const filteredContents = computed(() => {
    let result = contents.value

    if (selectedSubject.value) {
      result = result.filter((c) => c.subject === selectedSubject.value)
    }

    if (selectedGradeLevel.value) {
      result = result.filter((c) => c.gradeLevel === selectedGradeLevel.value)
    }

    return result
  })

  // 계산된 속성: 카드 데이터로 변환
  const contentCards = computed<ContentCardData[]>(() => {
    return filteredContents.value.map((c) => ({
      id: c.id,
      title: c.title,
      thumbnail: c.thumbnail,
      subject: c.subject,
      gradeLevel: c.gradeLevel,
      type: c.type,
      description: c.description,
    }))
  })

  // 계산된 속성: 과목별 그룹화
  const contentGroups = computed<ContentGroup[]>(() => {
    const subjects: Subject[] = ['math', 'science', 'english']
    const groups: ContentGroup[] = []

    for (const subject of subjects) {
      const subjectContents = filteredContents.value.filter((c) => c.subject === subject)

      if (subjectContents.length > 0) {
        groups.push({
          subject,
          subjectLabel: SUBJECT_LABELS[subject],
          contents: subjectContents.map((c) => ({
            id: c.id,
            title: c.title,
            thumbnail: c.thumbnail,
            subject: c.subject,
            gradeLevel: c.gradeLevel,
            type: c.type,
            description: c.description,
          })),
        })
      }
    }

    return groups
  })

  // ID로 콘텐츠 찾기
  const getContentById = computed(() => {
    return (id: string) => contents.value.find((c) => c.id === id) || null
  })

  // 액션: 콘텐츠 카탈로그 로드
  async function loadContents() {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('/contents/index.json')
      if (!response.ok) {
        throw new Error('콘텐츠 카탈로그를 불러올 수 없습니다')
      }
      const catalog = await response.json()
      contents.value = catalog.contents || []
    } catch (e) {
      error.value = e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다'
      // 개발 환경에서 더미 데이터 사용
      contents.value = getDummyContents()
    } finally {
      isLoading.value = false
    }
  }

  // 액션: 필터 설정
  function setSubjectFilter(subject: Subject | null) {
    selectedSubject.value = subject
  }

  function setGradeLevelFilter(gradeLevel: GradeLevel | null) {
    selectedGradeLevel.value = gradeLevel
  }

  function clearFilters() {
    selectedSubject.value = null
    selectedGradeLevel.value = null
  }

  // 액션: 새 콘텐츠 추가 (AI 생성 후)
  function addContent(content: ContentManifest) {
    contents.value.push(content)
  }

  return {
    // 상태
    contents,
    isLoading,
    error,
    selectedSubject,
    selectedGradeLevel,
    // 계산된 속성
    filteredContents,
    contentCards,
    contentGroups,
    getContentById,
    // 액션
    loadContents,
    setSubjectFilter,
    setGradeLevelFilter,
    clearFilters,
    addContent,
  }
})

// 개발용 더미 데이터
function getDummyContents(): ContentManifest[] {
  return [
    {
      id: 'fractions-pizza',
      title: '피자로 배우는 분수',
      subject: 'math',
      gradeLevel: 'elementary',
      grade: 'elementary-3',
      type: 'game',
      language: 'ko',
      description: '맛있는 피자를 나누며 분수의 개념을 재미있게 배워요!',
      thumbnail: '/contents/math/elementary/fractions-pizza/thumbnail.png',
      path: '/contents/math/elementary/fractions-pizza/index.html',
      createdAt: '2026-01-20T00:00:00Z',
      tags: ['분수', '나눗셈', '피자'],
      duration: 15,
      difficulty: 'easy',
    },
    {
      id: 'solar-system',
      title: '태양계 여행',
      subject: 'science',
      gradeLevel: 'elementary',
      grade: 'elementary-4',
      type: 'simulation',
      language: 'ko',
      description: '우주선을 타고 태양계의 행성들을 탐험해보세요!',
      thumbnail: '/contents/science/elementary/solar-system/thumbnail.png',
      path: '/contents/science/elementary/solar-system/index.html',
      createdAt: '2026-01-20T00:00:00Z',
      tags: ['태양계', '행성', '우주'],
      duration: 20,
      difficulty: 'medium',
    },
    {
      id: 'word-safari',
      title: 'Word Safari',
      subject: 'english',
      gradeLevel: 'elementary',
      grade: 'elementary-3',
      type: 'game',
      language: 'en',
      description: 'Join the safari adventure and learn new English words!',
      thumbnail: '/contents/english/elementary/word-safari/thumbnail.png',
      path: '/contents/english/elementary/word-safari/index.html',
      createdAt: '2026-01-20T00:00:00Z',
      tags: ['vocabulary', 'animals', 'nature'],
      duration: 15,
      difficulty: 'easy',
    },
    {
      id: 'shapes-explorer',
      title: '도형 탐험가',
      subject: 'math',
      gradeLevel: 'elementary',
      grade: 'elementary-5',
      type: 'exploration',
      language: 'ko',
      description: '다양한 도형의 성질을 탐험하고 발견해보세요!',
      thumbnail: '/contents/math/elementary/shapes-explorer/thumbnail.png',
      path: '/contents/math/elementary/shapes-explorer/index.html',
      createdAt: '2026-01-20T00:00:00Z',
      tags: ['도형', '기하학', '넓이'],
      duration: 20,
      difficulty: 'medium',
    },
    {
      id: 'equation-puzzle',
      title: '방정식 퍼즐',
      subject: 'math',
      gradeLevel: 'middle',
      grade: 'middle-2',
      type: 'quiz',
      language: 'ko',
      description: '퍼즐을 풀며 방정식의 원리를 마스터하세요!',
      thumbnail: '/contents/math/middle/equation-puzzle/thumbnail.png',
      path: '/contents/math/middle/equation-puzzle/index.html',
      createdAt: '2026-01-20T00:00:00Z',
      tags: ['방정식', '대수', '퍼즐'],
      duration: 25,
      difficulty: 'medium',
    },
    {
      id: 'circuit-lab',
      title: '전기회로 실험실',
      subject: 'science',
      gradeLevel: 'elementary',
      grade: 'elementary-6',
      type: 'simulation',
      language: 'ko',
      description: '가상 실험실에서 전기회로를 직접 만들어보세요!',
      thumbnail: '/contents/science/elementary/circuit-lab/thumbnail.png',
      path: '/contents/science/elementary/circuit-lab/index.html',
      createdAt: '2026-01-20T00:00:00Z',
      tags: ['전기', '회로', '실험'],
      duration: 25,
      difficulty: 'medium',
    },
    {
      id: 'cell-explorer',
      title: '세포 탐험',
      subject: 'science',
      gradeLevel: 'middle',
      grade: 'middle-1',
      type: 'exploration',
      language: 'ko',
      description: '세포 속으로 들어가 생명의 기본 단위를 탐험하세요!',
      thumbnail: '/contents/science/middle/cell-explorer/thumbnail.png',
      path: '/contents/science/middle/cell-explorer/index.html',
      createdAt: '2026-01-20T00:00:00Z',
      tags: ['세포', '생물', '현미경'],
      duration: 20,
      difficulty: 'medium',
    },
    {
      id: 'chemistry-sim',
      title: '화학 반응 시뮬레이터',
      subject: 'science',
      gradeLevel: 'high',
      grade: 'high-1',
      type: 'simulation',
      language: 'ko',
      description: '다양한 화학 반응을 안전하게 시뮬레이션해보세요!',
      thumbnail: '/contents/science/high/chemistry-sim/thumbnail.png',
      path: '/contents/science/high/chemistry-sim/index.html',
      createdAt: '2026-01-20T00:00:00Z',
      tags: ['화학반응', '원소', '실험'],
      duration: 30,
      difficulty: 'hard',
    },
    {
      id: 'grammar-quest',
      title: 'Grammar Quest',
      subject: 'english',
      gradeLevel: 'middle',
      grade: 'middle-2',
      type: 'quiz',
      language: 'en',
      description: 'Embark on a quest to master English grammar!',
      thumbnail: '/contents/english/middle/grammar-quest/thumbnail.png',
      path: '/contents/english/middle/grammar-quest/index.html',
      createdAt: '2026-01-20T00:00:00Z',
      tags: ['grammar', 'syntax', 'quiz'],
      duration: 20,
      difficulty: 'medium',
    },
    {
      id: 'debate-arena',
      title: 'Debate Arena',
      subject: 'english',
      gradeLevel: 'high',
      grade: 'high-1',
      type: 'story',
      language: 'en',
      description: 'Practice debate skills through interactive scenarios!',
      thumbnail: '/contents/english/high/debate-arena/thumbnail.png',
      path: '/contents/english/high/debate-arena/index.html',
      createdAt: '2026-01-20T00:00:00Z',
      tags: ['debate', 'speaking', 'critical thinking'],
      duration: 30,
      difficulty: 'hard',
    },
  ]
}
