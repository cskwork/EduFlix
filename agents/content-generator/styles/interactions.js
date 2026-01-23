/**
 * EduFlix 인터랙션 유틸리티
 * 드래그앤드롭, 퀴즈 로직, 점수 관리 등 공통 인터랙션 기능
 */

// 게임 상태 관리
const EduGame = {
  // 현재 점수
  score: 0,

  // 현재 레벨
  level: 1,

  // 최고 점수
  highScore: 0,

  // 게임 상태
  state: 'idle', // idle, playing, paused, finished

  // 점수 초기화
  reset() {
    this.score = 0
    this.level = 1
    this.state = 'idle'
    this.updateScoreDisplay()
  },

  // 점수 추가
  addScore(points) {
    this.score += points
    this.updateScoreDisplay()
    this.showScorePopup(points)
    if (this.score > this.highScore) {
      this.highScore = this.score
    }
  },

  // 점수 표시 업데이트
  updateScoreDisplay() {
    const scoreElement = document.getElementById('score-value')
    if (scoreElement) {
      scoreElement.textContent = this.score
      scoreElement.classList.add('animate-scale-up')
      setTimeout(() => scoreElement.classList.remove('animate-scale-up'), 300)
    }
  },

  // 점수 팝업
  showScorePopup(points) {
    const popup = document.createElement('div')
    popup.className = 'score-popup'
    popup.textContent = `+${points}`
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 48px;
      font-weight: bold;
      color: #ffd700;
      text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
      pointer-events: none;
      z-index: 9999;
      animation: scorePopup 0.8s ease-out forwards;
    `
    document.body.appendChild(popup)
    setTimeout(() => popup.remove(), 800)
  },

  // 레벨 업
  levelUp() {
    this.level++
    this.showLevelUp()
  },

  // 레벨 업 표시
  showLevelUp() {
    const modal = document.createElement('div')
    modal.className = 'level-up-modal'
    modal.innerHTML = `
      <div class="level-up-content">
        <div class="level-up-icon">&#127942;</div>
        <h2>레벨 업!</h2>
        <p>레벨 ${this.level}</p>
      </div>
    `
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      animation: fadeIn 0.3s ease;
    `
    document.body.appendChild(modal)
    setTimeout(() => {
      modal.style.animation = 'fadeOut 0.3s ease forwards'
      setTimeout(() => modal.remove(), 300)
    }, 1500)
  },

  // 게임 종료
  finish(success = true) {
    this.state = 'finished'
    this.showResult(success)
  },

  // 결과 화면 표시
  showResult(success) {
    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay active'
    overlay.innerHTML = `
      <div class="modal">
        <div class="result-screen">
          <div class="result-icon">${success ? '&#127881;' : '&#128546;'}</div>
          <h2 class="result-title">${success ? '축하합니다!' : '다시 도전해보세요!'}</h2>
          <div class="result-score">${this.score}점</div>
          <p class="result-message">${success ? '모든 문제를 해결했습니다!' : '조금만 더 노력하면 됩니다!'}</p>
          <div class="modal-actions">
            <button class="btn btn-secondary" onclick="EduGame.closeResult(); EduGame.reset();">다시 시작</button>
            <button class="btn btn-primary" onclick="EduGame.closeResult();">확인</button>
          </div>
        </div>
      </div>
    `
    document.body.appendChild(overlay)
    if (success) {
      Confetti.burst()
    }
  },

  // 결과 화면 닫기
  closeResult() {
    const overlay = document.querySelector('.modal-overlay')
    if (overlay) {
      overlay.classList.remove('active')
      setTimeout(() => overlay.remove(), 300)
    }
  },
}

// 드래그 앤 드롭 유틸리티
const DragDrop = {
  // 현재 드래그 중인 요소
  draggedElement: null,

  // 드래그 데이터
  dragData: null,

  // 드래그 가능 요소 초기화
  makeDraggable(element, data = null) {
    element.classList.add('draggable')
    element.setAttribute('draggable', 'true')

    element.addEventListener('dragstart', (e) => {
      this.draggedElement = element
      this.dragData = data || element.dataset.value
      element.classList.add('dragging')
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', this.dragData)
    })

    element.addEventListener('dragend', () => {
      element.classList.remove('dragging')
      this.draggedElement = null
      this.dragData = null
    })

    // 터치 지원
    this.addTouchSupport(element, data)
  },

  // 드롭 영역 초기화
  makeDropzone(element, onDrop) {
    element.classList.add('dropzone')

    element.addEventListener('dragover', (e) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      element.classList.add('drag-over')
    })

    element.addEventListener('dragleave', () => {
      element.classList.remove('drag-over')
    })

    element.addEventListener('drop', (e) => {
      e.preventDefault()
      element.classList.remove('drag-over')
      const data = e.dataTransfer.getData('text/plain')
      if (onDrop) {
        const result = onDrop(data, this.draggedElement, element)
        if (result) {
          element.classList.add('drop-valid')
          setTimeout(() => element.classList.remove('drop-valid'), 500)
        }
      }
    })

    // 터치 지원
    this.addTouchDropzone(element, onDrop)
  },

  // 터치 드래그 지원
  addTouchSupport(element, data) {
    let startX, startY, initialX, initialY
    let clone = null

    element.addEventListener('touchstart', (e) => {
      const touch = e.touches[0]
      startX = touch.clientX
      startY = touch.clientY
      const rect = element.getBoundingClientRect()
      initialX = rect.left
      initialY = rect.top

      this.draggedElement = element
      this.dragData = data || element.dataset.value
    })

    element.addEventListener('touchmove', (e) => {
      if (!this.draggedElement) return
      e.preventDefault()

      const touch = e.touches[0]
      const deltaX = touch.clientX - startX
      const deltaY = touch.clientY - startY

      if (!clone) {
        clone = element.cloneNode(true)
        clone.style.cssText = `
          position: fixed;
          left: ${initialX}px;
          top: ${initialY}px;
          width: ${element.offsetWidth}px;
          height: ${element.offsetHeight}px;
          opacity: 0.8;
          pointer-events: none;
          z-index: 10000;
        `
        document.body.appendChild(clone)
        element.classList.add('dragging')
      }

      clone.style.transform = `translate(${deltaX}px, ${deltaY}px)`
    })

    element.addEventListener('touchend', (e) => {
      if (clone) {
        clone.remove()
        clone = null
      }
      element.classList.remove('dragging')

      // 드롭 영역 찾기
      const touch = e.changedTouches[0]
      const dropTarget = document
        .elementsFromPoint(touch.clientX, touch.clientY)
        .find((el) => el.classList.contains('dropzone'))

      if (dropTarget && dropTarget._onDrop) {
        dropTarget._onDrop(this.dragData, element, dropTarget)
      }

      this.draggedElement = null
      this.dragData = null
    })
  },

  // 터치 드롭존 지원
  addTouchDropzone(element, onDrop) {
    element._onDrop = onDrop
  },
}

// 퀴즈 유틸리티
const Quiz = {
  // 현재 문제 인덱스
  currentIndex: 0,

  // 문제 목록
  questions: [],

  // 정답 수
  correctCount: 0,

  // 퀴즈 초기화
  init(questions) {
    this.questions = questions
    this.currentIndex = 0
    this.correctCount = 0
  },

  // 현재 문제 가져오기
  getCurrentQuestion() {
    return this.questions[this.currentIndex]
  },

  // 답변 확인
  checkAnswer(answer) {
    const question = this.getCurrentQuestion()
    const isCorrect = answer === question.answer

    if (isCorrect) {
      this.correctCount++
      EduGame.addScore(question.points || 10)
    }

    return isCorrect
  },

  // 다음 문제로
  next() {
    this.currentIndex++
    return this.currentIndex < this.questions.length
  },

  // 퀴즈 완료 여부
  isFinished() {
    return this.currentIndex >= this.questions.length
  },

  // 결과 가져오기
  getResult() {
    return {
      total: this.questions.length,
      correct: this.correctCount,
      percentage: Math.round((this.correctCount / this.questions.length) * 100),
    }
  },

  // 퀴즈 옵션 렌더링
  renderOptions(containerId, options, onSelect) {
    const container = document.getElementById(containerId)
    if (!container) return

    container.innerHTML = ''
    const markers = ['A', 'B', 'C', 'D', 'E', 'F']

    options.forEach((option, index) => {
      const optionEl = document.createElement('div')
      optionEl.className = 'quiz-option stagger-item animate-slide-up'
      optionEl.innerHTML = `
        <div class="quiz-option-marker">${markers[index]}</div>
        <div class="quiz-option-text">${option}</div>
      `
      optionEl.addEventListener('click', () => {
        // 기존 선택 해제
        container.querySelectorAll('.quiz-option').forEach((el) => {
          el.classList.remove('selected', 'correct', 'incorrect')
        })
        optionEl.classList.add('selected')
        if (onSelect) onSelect(option, index, optionEl)
      })
      container.appendChild(optionEl)
    })
  },

  // 정답/오답 표시
  showResult(optionEl, isCorrect) {
    optionEl.classList.remove('selected')
    optionEl.classList.add(isCorrect ? 'correct' : 'incorrect')

    if (isCorrect) {
      optionEl.classList.add('correct-effect')
    } else {
      optionEl.classList.add('incorrect-effect')
    }
  },
}

// 타이머 유틸리티
const Timer = {
  // 타이머 ID
  timerId: null,

  // 남은 시간 (초)
  remaining: 0,

  // 콜백 함수
  onTick: null,
  onComplete: null,

  // 타이머 시작
  start(seconds, onTick, onComplete) {
    this.stop()
    this.remaining = seconds
    this.onTick = onTick
    this.onComplete = onComplete

    this.tick()
    this.timerId = setInterval(() => this.tick(), 1000)
  },

  // 틱
  tick() {
    if (this.onTick) {
      this.onTick(this.remaining)
    }

    this.updateDisplay()

    if (this.remaining <= 0) {
      this.stop()
      if (this.onComplete) {
        this.onComplete()
      }
    }

    this.remaining--
  },

  // 타이머 정지
  stop() {
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }
  },

  // 타이머 일시정지
  pause() {
    this.stop()
  },

  // 타이머 재개
  resume() {
    if (!this.timerId && this.remaining > 0) {
      this.timerId = setInterval(() => this.tick(), 1000)
    }
  },

  // 시간 포맷팅
  format(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  },

  // 표시 업데이트
  updateDisplay() {
    const timerEl = document.getElementById('timer')
    if (timerEl) {
      timerEl.textContent = this.format(this.remaining)
      timerEl.classList.remove('warning', 'danger')
      if (this.remaining <= 10) {
        timerEl.classList.add('danger')
      } else if (this.remaining <= 30) {
        timerEl.classList.add('warning')
      }
    }
  },
}

// 컨페티 효과
const Confetti = {
  colors: ['#e50914', '#ffd700', '#28a745', '#17a2b8', '#6c5ce7', '#fd79a8'],

  // 컨페티 발사
  burst(count = 50) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => this.createParticle(), i * 30)
    }
  },

  // 파티클 생성
  createParticle() {
    const particle = document.createElement('div')
    particle.className = 'confetti-particle'
    particle.style.cssText = `
      left: ${Math.random() * 100}vw;
      background: ${this.colors[Math.floor(Math.random() * this.colors.length)]};
      transform: rotate(${Math.random() * 360}deg);
      animation-duration: ${2 + Math.random() * 2}s;
    `
    document.body.appendChild(particle)
    setTimeout(() => particle.remove(), 4000)
  },
}

// 사운드 효과 (옵션)
const Sound = {
  // 사운드 활성화 여부
  enabled: true,

  // 사운드 재생
  play(type) {
    if (!this.enabled) return

    // Web Audio API로 간단한 사운드 생성
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    switch (type) {
      case 'correct':
        oscillator.frequency.value = 880
        gainNode.gain.value = 0.1
        oscillator.type = 'sine'
        break
      case 'incorrect':
        oscillator.frequency.value = 220
        gainNode.gain.value = 0.1
        oscillator.type = 'sawtooth'
        break
      case 'click':
        oscillator.frequency.value = 440
        gainNode.gain.value = 0.05
        oscillator.type = 'sine'
        break
      case 'levelup':
        oscillator.frequency.value = 660
        gainNode.gain.value = 0.1
        oscillator.type = 'triangle'
        break
      default:
        oscillator.frequency.value = 440
        gainNode.gain.value = 0.05
    }

    oscillator.start()
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
    oscillator.stop(audioContext.currentTime + 0.2)
  },

  // 사운드 토글
  toggle() {
    this.enabled = !this.enabled
    return this.enabled
  },
}

// 힌트 시스템
const Hints = {
  // 남은 힌트 수
  remaining: 3,

  // 힌트 표시
  show(message) {
    if (this.remaining <= 0) {
      alert('힌트를 모두 사용했습니다!')
      return false
    }

    this.remaining--
    EduGame.addScore(-5) // 힌트 사용 시 점수 감소

    const bubble = document.createElement('div')
    bubble.className = 'hint-bubble animate-scale-up'
    bubble.innerHTML = `
      <div class="speech-bubble">
        <p>${message}</p>
      </div>
      <div class="character">&#129300;</div>
    `
    bubble.style.cssText = `
      position: fixed;
      bottom: 100px;
      right: 20px;
      z-index: 1000;
    `
    document.body.appendChild(bubble)
    setTimeout(() => {
      bubble.style.animation = 'fadeOut 0.3s ease forwards'
      setTimeout(() => bubble.remove(), 300)
    }, 3000)

    this.updateButton()
    return true
  },

  // 힌트 버튼 업데이트
  updateButton() {
    const btn = document.querySelector('.hint-btn')
    if (btn) {
      btn.textContent = `? (${this.remaining})`
      if (this.remaining <= 0) {
        btn.disabled = true
      }
    }
  },

  // 힌트 초기화
  reset(count = 3) {
    this.remaining = count
    this.updateButton()
  },
}

// 진행 상황 저장
const Progress = {
  // 저장 키 접두사
  prefix: 'eduflix_',

  // 진행 상황 저장
  save(contentId, data) {
    const key = this.prefix + contentId
    localStorage.setItem(key, JSON.stringify(data))
  },

  // 진행 상황 로드
  load(contentId) {
    const key = this.prefix + contentId
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  },

  // 진행 상황 삭제
  clear(contentId) {
    const key = this.prefix + contentId
    localStorage.removeItem(key)
  },

  // 최고 점수 저장
  saveHighScore(contentId, score) {
    const data = this.load(contentId) || {}
    if (!data.highScore || score > data.highScore) {
      data.highScore = score
      this.save(contentId, data)
      return true
    }
    return false
  },

  // 최고 점수 가져오기
  getHighScore(contentId) {
    const data = this.load(contentId)
    return data?.highScore || 0
  },
}

// 스타일 주입
const style = document.createElement('style')
style.textContent = `
  @keyframes scorePopup {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.5);
    }
    50% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.2);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -100%) scale(1);
    }
  }

  .level-up-content {
    text-align: center;
    color: white;
    animation: scaleUp 0.3s ease-out;
  }

  .level-up-icon {
    font-size: 80px;
    margin-bottom: 20px;
  }

  .level-up-content h2 {
    font-size: 48px;
    margin-bottom: 10px;
    color: #ffd700;
  }

  .level-up-content p {
    font-size: 24px;
  }

  .hint-bubble {
    display: flex;
    flex-direction: column-reverse;
    align-items: flex-end;
    gap: 10px;
  }
`
document.head.appendChild(style)

// 전역 노출
window.EduGame = EduGame
window.DragDrop = DragDrop
window.Quiz = Quiz
window.Timer = Timer
window.Confetti = Confetti
window.Sound = Sound
window.Hints = Hints
window.Progress = Progress
