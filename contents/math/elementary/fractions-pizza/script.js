/**
 * 피자로 배우는 분수 - 게임 로직
 * 초등학교 3학년 대상 분수 학습 게임
 */

// 게임 상태
const gameState = {
  score: 0,
  level: 1,
  maxLevel: 5,
  currentSlices: 1,
  targetSlices: 4,
  isCorrect: false,
  levels: [
    { target: 2, hint: '피자를 반으로 나눠보세요!' },
    { target: 4, hint: '피자를 4조각으로 나눠보세요!' },
    { target: 3, hint: '피자를 3조각으로 나눠보세요!' },
    { target: 6, hint: '피자를 6조각으로 나눠보세요!' },
    { target: 8, hint: '피자를 8조각으로 나눠보세요!' },
  ],
}

// DOM 요소
const elements = {
  pizza: document.getElementById('pizza'),
  scoreValue: document.getElementById('score-value'),
  numerator: document.getElementById('numerator'),
  denominator: document.getElementById('denominator'),
  targetPieces: document.getElementById('target-pieces'),
  questionText: document.getElementById('question-text'),
  hintText: document.getElementById('hint-text'),
  currentLevel: document.getElementById('current-level'),
  btnDivide: document.getElementById('btn-divide'),
  btnCheck: document.getElementById('btn-check'),
  btnReset: document.getElementById('btn-reset'),
  btnNext: document.getElementById('btn-next'),
  fractionDisplay: document.querySelector('.fraction'),
}

// 초기화
function init() {
  loadLevel(gameState.level)
  setupEventListeners()
  createToppings()
}

// 레벨 로드
function loadLevel(level) {
  const levelData = gameState.levels[level - 1]
  gameState.targetSlices = levelData.target
  gameState.currentSlices = 1
  gameState.isCorrect = false

  // UI 업데이트
  elements.targetPieces.textContent = levelData.target
  elements.hintText.textContent = levelData.hint
  elements.currentLevel.textContent = level
  elements.btnNext.disabled = true
  elements.fractionDisplay.classList.remove('correct', 'incorrect')

  // 피자 초기화
  resetPizza()
  updateFractionDisplay()
}

// 피자 초기화
function resetPizza() {
  gameState.currentSlices = 1
  renderPizzaSlices()
  updateFractionDisplay()
}

// 피자 조각 렌더링
function renderPizzaSlices() {
  // 기존 조각 제거
  const existingSlices = elements.pizza.querySelectorAll('.pizza-slice')
  existingSlices.forEach((slice) => slice.remove())

  // 새 조각 생성
  const sliceAngle = 360 / gameState.currentSlices

  for (let i = 0; i < gameState.currentSlices; i++) {
    const slice = document.createElement('div')
    slice.className = 'pizza-slice'
    slice.dataset.slice = i

    // 조각 회전 및 크기 조정
    const rotation = i * sliceAngle - 90
    slice.style.transform = `rotate(${rotation}deg)`

    // 조각 모양 (부채꼴)
    if (gameState.currentSlices > 1) {
      slice.style.clipPath = `polygon(0 0, 100% 0, 100% 100%)`
      slice.style.width = '50%'
      slice.style.height = '50%'
    }

    elements.pizza.appendChild(slice)
  }

  // 피자에 펄스 애니메이션 추가
  elements.pizza.classList.add('pulse')
  setTimeout(() => elements.pizza.classList.remove('pulse'), 500)
}

// 토핑 생성
function createToppings() {
  const toppingPositions = [
    { x: 30, y: 25 },
    { x: 60, y: 35 },
    { x: 45, y: 55 },
    { x: 25, y: 60 },
    { x: 70, y: 60 },
    { x: 50, y: 30 },
    { x: 35, y: 70 },
    { x: 65, y: 70 },
  ]

  toppingPositions.forEach((pos) => {
    const topping = document.createElement('div')
    topping.className = 'topping'
    topping.style.left = `${pos.x}%`
    topping.style.top = `${pos.y}%`
    topping.style.transform = 'translate(-50%, -50%)'
    elements.pizza.appendChild(topping)
  })
}

// 분수 표시 업데이트
function updateFractionDisplay() {
  elements.numerator.textContent = '1'
  elements.denominator.textContent = gameState.currentSlices
}

// 이벤트 리스너 설정
function setupEventListeners() {
  // 나누기 버튼
  elements.btnDivide.addEventListener('click', dividePizza)

  // 피자 클릭으로 나누기
  elements.pizza.addEventListener('click', dividePizza)

  // 확인 버튼
  elements.btnCheck.addEventListener('click', checkAnswer)

  // 다시 시작 버튼
  elements.btnReset.addEventListener('click', () => {
    gameState.score = 0
    gameState.level = 1
    updateScore()
    loadLevel(1)
  })

  // 다음 문제 버튼
  elements.btnNext.addEventListener('click', nextLevel)
}

// 피자 나누기
function dividePizza() {
  if (gameState.isCorrect) return

  // 최대 12조각까지
  if (gameState.currentSlices >= 12) {
    elements.pizza.classList.add('shake')
    setTimeout(() => elements.pizza.classList.remove('shake'), 300)
    return
  }

  gameState.currentSlices++
  renderPizzaSlices()
  updateFractionDisplay()
}

// 정답 확인
function checkAnswer() {
  const isCorrect = gameState.currentSlices === gameState.targetSlices

  if (isCorrect) {
    gameState.isCorrect = true
    elements.fractionDisplay.classList.add('correct')

    // 점수 추가
    const points = 10 + (gameState.maxLevel - gameState.level) * 5
    addScore(points)

    // 성공 효과
    showSuccessEffect()

    // 다음 버튼 활성화
    elements.btnNext.disabled = false

    // 마지막 레벨인 경우
    if (gameState.level >= gameState.maxLevel) {
      setTimeout(() => showResult(true), 1000)
    }
  } else {
    elements.fractionDisplay.classList.add('incorrect')
    elements.pizza.classList.add('shake')

    setTimeout(() => {
      elements.fractionDisplay.classList.remove('incorrect')
      elements.pizza.classList.remove('shake')
    }, 500)
  }
}

// 다음 레벨
function nextLevel() {
  if (gameState.level < gameState.maxLevel) {
    gameState.level++
    loadLevel(gameState.level)
  }
}

// 점수 추가
function addScore(points) {
  gameState.score += points
  updateScore()
  showScorePopup(points)
}

// 점수 업데이트
function updateScore() {
  elements.scoreValue.textContent = gameState.score
  elements.scoreValue.classList.add('pulse')
  setTimeout(() => elements.scoreValue.classList.remove('pulse'), 500)
}

// 점수 팝업
function showScorePopup(points) {
  const popup = document.createElement('div')
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

  // 애니메이션 키프레임 추가
  if (!document.getElementById('score-popup-style')) {
    const style = document.createElement('style')
    style.id = 'score-popup-style'
    style.textContent = `
      @keyframes scorePopup {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
        50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
        100% { opacity: 0; transform: translate(-50%, -100%) scale(1); }
      }
    `
    document.head.appendChild(style)
  }

  setTimeout(() => popup.remove(), 800)
}

// 성공 효과
function showSuccessEffect() {
  // 컨페티 효과
  const colors = ['#e50914', '#ffd700', '#28a745', '#17a2b8', '#6c5ce7']
  for (let i = 0; i < 30; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div')
      confetti.className = 'confetti-particle'
      confetti.style.left = `${Math.random() * 100}vw`
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)]
      confetti.style.animationDuration = `${2 + Math.random() * 2}s`
      document.body.appendChild(confetti)
      setTimeout(() => confetti.remove(), 4000)
    }, i * 50)
  }
}

// 결과 화면
function showResult(success) {
  const overlay = document.createElement('div')
  overlay.className = 'result-overlay'
  overlay.innerHTML = `
    <div class="result-content">
      <div class="result-icon">${success ? '<img src="images/trophy.png" alt="Success">' : '<img src="images/sad.png" alt="Retry">'}</div>
      <h2 class="result-title">${success ? '축하합니다!' : '다시 도전해보세요!'}</h2>
      <div class="result-score">${gameState.score}점</div>
      <p class="result-message">${success ? '모든 레벨을 완료했습니다!' : '조금만 더 노력하면 됩니다!'}</p>
      <div class="result-buttons">
        <button class="btn btn-secondary" onclick="closeResult(); resetGame();">다시 시작</button>
        <button class="btn btn-primary" onclick="closeResult();">확인</button>
      </div>
    </div>
  `
  document.body.appendChild(overlay)

  if (success) {
    showSuccessEffect()
  }
}

// 결과 화면 닫기
function closeResult() {
  const overlay = document.querySelector('.result-overlay')
  if (overlay) {
    overlay.remove()
  }
}

// 게임 리셋
function resetGame() {
  gameState.score = 0
  gameState.level = 1
  updateScore()
  loadLevel(1)
}

// 게임 시작
init()
