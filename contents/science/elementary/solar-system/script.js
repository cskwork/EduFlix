/**
 * 태양계 여행 - 시뮬레이션 로직
 * 초등학교 4학년 대상 태양계 학습 시뮬레이션
 */

// 행성 데이터
const planetData = {
  sun: {
    name: '태양',
    description: '태양은 태양계의 중심에 있는 별입니다. 지구에 빛과 열을 제공해요.',
    facts: [
      { label: '종류', value: '항성(별)' },
      { label: '표면 온도', value: '약 5,500°C' },
      { label: '크기', value: '지구의 109배' },
    ],
  },
  mercury: {
    name: '수성',
    description:
      '수성은 태양에서 가장 가까운 행성이에요. 낮에는 매우 뜨겁고 밤에는 매우 추워요.',
    facts: [
      { label: '태양과의 거리', value: '1위 (가장 가까움)' },
      { label: '공전 주기', value: '88일' },
      { label: '크기', value: '지구의 0.4배' },
    ],
  },
  venus: {
    name: '금성',
    description:
      '금성은 지구에서 가장 밝게 보이는 행성이에요. 새벽이나 저녁에 볼 수 있어서 "샛별"이라고도 불러요.',
    facts: [
      { label: '태양과의 거리', value: '2위' },
      { label: '공전 주기', value: '225일' },
      { label: '특징', value: '가장 뜨거운 행성' },
    ],
  },
  earth: {
    name: '지구',
    description: '지구는 우리가 살고 있는 행성이에요. 물과 공기가 있어서 생명체가 살 수 있어요.',
    facts: [
      { label: '태양과의 거리', value: '3위' },
      { label: '공전 주기', value: '365일 (1년)' },
      { label: '특징', value: '유일하게 생명체가 사는 행성' },
    ],
  },
  mars: {
    name: '화성',
    description:
      '화성은 붉은색을 띄어서 "붉은 행성"이라고 불러요. 과학자들이 탐사 로봇을 보내서 연구하고 있어요.',
    facts: [
      { label: '태양과의 거리', value: '4위' },
      { label: '공전 주기', value: '687일 (약 2년)' },
      { label: '특징', value: '산화철로 붉은색' },
    ],
  },
  jupiter: {
    name: '목성',
    description:
      '목성은 태양계에서 가장 큰 행성이에요. 표면에 있는 "대적점"은 지구보다 큰 거대한 폭풍이에요.',
    facts: [
      { label: '태양과의 거리', value: '5위' },
      { label: '공전 주기', value: '약 12년' },
      { label: '크기', value: '태양계에서 가장 큼' },
    ],
  },
  saturn: {
    name: '토성',
    description:
      '토성은 아름다운 고리를 가진 행성이에요. 고리는 얼음과 돌 조각으로 이루어져 있어요.',
    facts: [
      { label: '태양과의 거리', value: '6위' },
      { label: '공전 주기', value: '약 29년' },
      { label: '특징', value: '아름다운 고리' },
    ],
  },
  uranus: {
    name: '천왕성',
    description: '천왕성은 옆으로 누워서 자전하는 특이한 행성이에요. 파란 색깔이 아주 예뻐요.',
    facts: [
      { label: '태양과의 거리', value: '7위' },
      { label: '공전 주기', value: '약 84년' },
      { label: '특징', value: '옆으로 누워서 돔' },
    ],
  },
  neptune: {
    name: '해왕성',
    description:
      '해왕성은 태양에서 가장 먼 행성이에요. 강한 바람이 불고 매우 추운 얼음 행성이에요.',
    facts: [
      { label: '태양과의 거리', value: '8위 (가장 멂)' },
      { label: '공전 주기', value: '약 165년' },
      { label: '특징', value: '가장 강한 바람' },
    ],
  },
}

// 퀴즈 데이터
const quizData = [
  {
    question: '태양계에서 가장 큰 행성은?',
    options: ['화성', '토성', '목성', '천왕성'],
    answer: 2,
  },
  {
    question: '아름다운 고리를 가진 행성은?',
    options: ['금성', '토성', '수성', '해왕성'],
    answer: 1,
  },
  {
    question: '태양에서 세 번째로 가까운 행성은?',
    options: ['금성', '화성', '지구', '수성'],
    answer: 2,
  },
  {
    question: '"붉은 행성"이라고 불리는 행성은?',
    options: ['목성', '금성', '화성', '토성'],
    answer: 2,
  },
  {
    question: '태양에서 가장 먼 행성은?',
    options: ['천왕성', '토성', '목성', '해왕성'],
    answer: 3,
  },
]

// 게임 상태
const gameState = {
  visitedPlanets: new Set(),
  quizIndex: 0,
  quizScore: 0,
}

// DOM 요소
const elements = {
  planetsVisited: document.getElementById('planets-visited'),
  infoPanel: document.getElementById('info-panel'),
  infoTitle: document.getElementById('info-title'),
  infoContent: document.getElementById('info-content'),
  infoFacts: document.getElementById('info-facts'),
  closePanel: document.getElementById('close-panel'),
  spaceship: document.getElementById('spaceship'),
  btnReset: document.getElementById('btn-reset'),
  btnQuiz: document.getElementById('btn-quiz'),
  stars: document.getElementById('stars'),
}

// 초기화
function init() {
  createStars()
  setupEventListeners()
  positionSpaceship()
}

// 별 배경 생성
function createStars() {
  for (let i = 0; i < 100; i++) {
    const star = document.createElement('div')
    star.className = 'star'
    star.style.left = `${Math.random() * 100}%`
    star.style.top = `${Math.random() * 100}%`
    star.style.animationDelay = `${Math.random() * 2}s`
    star.style.opacity = Math.random() * 0.5 + 0.3
    elements.stars.appendChild(star)
  }
}

// 이벤트 리스너 설정
function setupEventListeners() {
  // 태양 클릭
  document.getElementById('sun').addEventListener('click', () => {
    showPlanetInfo('sun')
  })

  // 행성 클릭
  const planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']
  planets.forEach((planet) => {
    const planetEl = document.getElementById(planet)
    if (planetEl) {
      planetEl.addEventListener('click', () => {
        visitPlanet(planet)
      })
    }
  })

  // 패널 닫기
  elements.closePanel.addEventListener('click', closeInfoPanel)

  // 초기화 버튼
  elements.btnReset.addEventListener('click', resetGame)

  // 퀴즈 버튼
  elements.btnQuiz.addEventListener('click', startQuiz)
}

// 우주선 위치 설정
function positionSpaceship() {
  const earth = document.getElementById('earth')
  if (earth) {
    const rect = earth.getBoundingClientRect()
    elements.spaceship.style.left = `${rect.left - 40}px`
    elements.spaceship.style.top = `${rect.top}px`
  }
}

// 행성 방문
function visitPlanet(planetId) {
  const planet = document.getElementById(planetId)
  if (!planet) return

  // 우주선 이동
  moveSpaceshipTo(planet)

  // 방문 기록
  if (!gameState.visitedPlanets.has(planetId)) {
    gameState.visitedPlanets.add(planetId)
    planet.classList.add('visited')
    elements.planetsVisited.textContent = gameState.visitedPlanets.size

    // 모든 행성 방문 완료
    if (gameState.visitedPlanets.size === 8) {
      setTimeout(() => {
        showCompletionMessage()
      }, 1500)
    }
  }

  // 정보 패널 표시
  showPlanetInfo(planetId)
}

// 우주선 이동
function moveSpaceshipTo(target) {
  const rect = target.getBoundingClientRect()
  const mainRect = document.getElementById('main-content').getBoundingClientRect()

  elements.spaceship.style.left = `${rect.left - mainRect.left - 40}px`
  elements.spaceship.style.top = `${rect.top - mainRect.top}px`
}

// 행성 정보 표시
function showPlanetInfo(planetId) {
  const data = planetData[planetId]
  if (!data) return

  elements.infoTitle.textContent = data.name
  elements.infoContent.innerHTML = `<p>${data.description}</p>`

  // 팩트 목록
  elements.infoFacts.innerHTML = ''
  data.facts.forEach((fact) => {
    const factItem = document.createElement('div')
    factItem.className = 'fact-item'
    factItem.innerHTML = `
      <span class="fact-label">${fact.label}</span>
      <span class="fact-value">${fact.value}</span>
    `
    elements.infoFacts.appendChild(factItem)
  })

  elements.infoPanel.classList.add('active')
}

// 정보 패널 닫기
function closeInfoPanel() {
  elements.infoPanel.classList.remove('active')
}

// 완료 메시지
function showCompletionMessage() {
  const overlay = document.createElement('div')
  overlay.className = 'result-overlay'
  overlay.innerHTML = `
    <div class="result-content">
      <div class="result-icon"><img src="images/trophy.png" alt="Success"></div>
      <h2 class="result-title">축하합니다!</h2>
      <p class="result-message">태양계의 모든 행성을 탐험했어요!<br>이제 퀴즈를 풀어볼까요?</p>
      <div class="result-buttons">
        <button class="btn btn-secondary" onclick="this.closest('.result-overlay').remove()">계속 탐험</button>
        <button class="btn btn-primary" onclick="this.closest('.result-overlay').remove(); startQuiz();">퀴즈 풀기</button>
      </div>
    </div>
  `
  document.body.appendChild(overlay)
}

// 퀴즈 시작
function startQuiz() {
  gameState.quizIndex = 0
  gameState.quizScore = 0
  showQuizQuestion()
}

// 퀴즈 문제 표시
function showQuizQuestion() {
  const quiz = quizData[gameState.quizIndex]
  if (!quiz) {
    showQuizResult()
    return
  }

  const modal = document.createElement('div')
  modal.className = 'quiz-modal'
  modal.id = 'quiz-modal'
  modal.innerHTML = `
    <div class="quiz-content">
      <h2 style="margin-bottom: 8px; color: #ffd700;">문제 ${gameState.quizIndex + 1} / ${quizData.length}</h2>
      <p class="quiz-question">${quiz.question}</p>
      <div class="quiz-options">
        ${quiz.options
          .map(
            (option, index) => `
          <div class="quiz-option" data-index="${index}">${option}</div>
        `
          )
          .join('')}
      </div>
    </div>
  `
  document.body.appendChild(modal)

  // 옵션 클릭 이벤트
  modal.querySelectorAll('.quiz-option').forEach((option) => {
    option.addEventListener('click', () => {
      handleQuizAnswer(parseInt(option.dataset.index))
    })
  })
}

// 퀴즈 답변 처리
function handleQuizAnswer(selectedIndex) {
  const quiz = quizData[gameState.quizIndex]
  const isCorrect = selectedIndex === quiz.answer
  const modal = document.getElementById('quiz-modal')
  const options = modal.querySelectorAll('.quiz-option')

  // 정답/오답 표시
  options.forEach((option, index) => {
    option.style.pointerEvents = 'none'
    if (index === quiz.answer) {
      option.classList.add('correct')
    } else if (index === selectedIndex && !isCorrect) {
      option.classList.add('incorrect')
    }
  })

  if (isCorrect) {
    gameState.quizScore++
  }

  // 다음 문제로
  setTimeout(() => {
    modal.remove()
    gameState.quizIndex++
    showQuizQuestion()
  }, 1500)
}

// 퀴즈 결과 표시
function showQuizResult() {
  const percentage = Math.round((gameState.quizScore / quizData.length) * 100)
  const isSuccess = percentage >= 60

  const overlay = document.createElement('div')
  overlay.className = 'result-overlay'
  overlay.innerHTML = `
    <div class="result-content">
      <div class="result-icon">${isSuccess ? '<img src="images/trophy.png" alt="Success">' : '<img src="images/sad.png" alt="Retry">'}</div>
      <h2 class="result-title">${isSuccess ? '잘했어요!' : '다시 도전해보세요!'}</h2>
      <div class="result-score">${gameState.quizScore} / ${quizData.length}</div>
      <p class="result-message">${isSuccess ? '태양계 전문가가 되셨네요!' : '행성들을 더 탐험하고 다시 도전해보세요!'}</p>
      <div class="result-buttons">
        <button class="btn btn-secondary" onclick="this.closest('.result-overlay').remove();">확인</button>
        <button class="btn btn-primary" onclick="this.closest('.result-overlay').remove(); startQuiz();">다시 풀기</button>
      </div>
    </div>
  `
  document.body.appendChild(overlay)
}

// 게임 초기화
function resetGame() {
  gameState.visitedPlanets.clear()
  gameState.quizIndex = 0
  gameState.quizScore = 0

  // UI 초기화
  elements.planetsVisited.textContent = '0'
  document.querySelectorAll('.planet.visited').forEach((planet) => {
    planet.classList.remove('visited')
  })

  closeInfoPanel()
  positionSpaceship()
}

// 게임 시작
init()
