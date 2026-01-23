// 키보드 네비게이션 컴포저블
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

export interface KeyboardNavigationOptions {
  enableGlobalShortcuts?: boolean
  enableArrowNavigation?: boolean
  enableFocusTrap?: boolean
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions = {}) {
  const { enableGlobalShortcuts = true, enableArrowNavigation = true } = options
  const router = useRouter()

  // 전역 키보드 이벤트 핸들러
  function handleKeydown(event: KeyboardEvent) {
    // 입력 필드에서는 전역 단축키 비활성화
    const target = event.target as HTMLElement
    const isInputField =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable

    if (isInputField && !event.key.startsWith('Escape')) {
      return
    }

    // 전역 단축키
    if (enableGlobalShortcuts) {
      switch (event.key) {
        case 'Escape':
          // ESC: 홈으로 이동 또는 모달 닫기
          if (document.fullscreenElement) {
            document.exitFullscreen()
          } else if (router.currentRoute.value.path !== '/') {
            router.push('/')
          }
          break

        case '/': {
          // /: 검색 포커스 (미구현 - placeholder)
          event.preventDefault()
          const searchButton = document.querySelector(
            '.icon-button[aria-label="검색"]'
          ) as HTMLElement
          searchButton?.focus()
          break
        }

        case 'c':
          // c: 창조 모드로 이동
          if (event.ctrlKey || event.metaKey) return // Ctrl+C는 복사
          if (router.currentRoute.value.path !== '/create') {
            router.push('/create')
          }
          break

        case 'h':
          // h: 홈으로 이동
          if (event.ctrlKey || event.metaKey) return
          if (router.currentRoute.value.path !== '/') {
            router.push('/')
          }
          break

        case '?':
          // ?: 키보드 단축키 도움말 (미구현)
          console.info(
            '키보드 단축키:\n' +
              'h: 홈으로 이동\n' +
              'c: 창조 모드\n' +
              '/: 검색\n' +
              'ESC: 이전으로/전체화면 종료\n' +
              '화살표: 콘텐츠 탐색'
          )
          break
      }
    }

    // 화살표 키 네비게이션 (콘텐츠 카드)
    if (enableArrowNavigation && !isInputField) {
      handleArrowNavigation(event)
    }
  }

  // 화살표 키로 콘텐츠 카드 탐색
  function handleArrowNavigation(event: KeyboardEvent) {
    const focusedElement = document.activeElement as HTMLElement
    if (!focusedElement) return

    // 현재 포커스된 요소가 콘텐츠 카드인지 확인
    const isContentCard = focusedElement.classList.contains('content-card')
    const isInContentRow = focusedElement.closest('.row-content')

    if (!isContentCard && !isInContentRow) return

    const cards = Array.from(
      document.querySelectorAll('.content-card')
    ) as HTMLElement[]
    const currentIndex = cards.indexOf(focusedElement)

    if (currentIndex === -1) return

    let nextIndex = currentIndex

    switch (event.key) {
      case 'ArrowRight':
        nextIndex = Math.min(currentIndex + 1, cards.length - 1)
        break
      case 'ArrowLeft':
        nextIndex = Math.max(currentIndex - 1, 0)
        break
      case 'ArrowDown': {
        // 다음 행의 같은 위치로 이동
        const currentRow = focusedElement.closest('.content-row')
        if (currentRow) {
          const rows = Array.from(document.querySelectorAll('.content-row'))
          const rowIndex = rows.indexOf(currentRow)
          if (rowIndex < rows.length - 1) {
            const nextRow = rows[rowIndex + 1]
            const nextRowCards = nextRow.querySelectorAll(
              '.content-card'
            ) as NodeListOf<HTMLElement>
            const cardIndexInRow = Array.from(
              currentRow.querySelectorAll('.content-card')
            ).indexOf(focusedElement)
            if (nextRowCards[cardIndexInRow]) {
              nextRowCards[cardIndexInRow].focus()
              event.preventDefault()
              return
            } else if (nextRowCards.length > 0) {
              nextRowCards[0].focus()
              event.preventDefault()
              return
            }
          }
        }
        break
      }
      case 'ArrowUp': {
        // 이전 행의 같은 위치로 이동
        const currentRowUp = focusedElement.closest('.content-row')
        if (currentRowUp) {
          const rows = Array.from(document.querySelectorAll('.content-row'))
          const rowIndex = rows.indexOf(currentRowUp)
          if (rowIndex > 0) {
            const prevRow = rows[rowIndex - 1]
            const prevRowCards = prevRow.querySelectorAll(
              '.content-card'
            ) as NodeListOf<HTMLElement>
            const cardIndexInRow = Array.from(
              currentRowUp.querySelectorAll('.content-card')
            ).indexOf(focusedElement)
            if (prevRowCards[cardIndexInRow]) {
              prevRowCards[cardIndexInRow].focus()
              event.preventDefault()
              return
            } else if (prevRowCards.length > 0) {
              prevRowCards[prevRowCards.length - 1].focus()
              event.preventDefault()
              return
            }
          }
        }
        break
      }
      case 'Enter':
      case ' ':
        // Enter/Space: 콘텐츠 선택
        if (isContentCard) {
          focusedElement.click()
          event.preventDefault()
        }
        return
    }

    if (nextIndex !== currentIndex) {
      cards[nextIndex]?.focus()
      cards[nextIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      event.preventDefault()
    }
  }

  // 첫 번째 콘텐츠 카드로 포커스 이동
  function focusFirstCard() {
    const firstCard = document.querySelector('.content-card') as HTMLElement
    firstCard?.focus()
  }

  // 스킵 네비게이션 링크 처리
  function handleSkipLink(targetId: string) {
    const target = document.getElementById(targetId)
    if (target) {
      target.setAttribute('tabindex', '-1')
      target.focus()
      target.removeAttribute('tabindex')
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })

  return {
    focusFirstCard,
    handleSkipLink,
  }
}
