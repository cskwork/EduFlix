/**
 * 세포 탐험 - 탐험 로직
 * 중학교 1학년 대상 세포 학습
 */

// 세포소기관 데이터
const organelles = {
  animal: {
    nucleus: {
      name: '핵',
      color: '#6b5b95',
      description: '세포의 중심부에 위치한 가장 큰 소기관입니다.',
      function: '유전 정보(DNA)를 저장하고 세포 활동을 조절합니다.',
      position: { x: 175, y: 175, radius: 50 }
    },
    mitochondria: {
      name: '미토콘드리아',
      color: '#ff6b6b',
      description: '세포 호흡을 통해 에너지를 생산하는 소기관입니다.',
      function: '포도당을 분해하여 ATP(에너지)를 만듭니다.',
      position: { x: 100, y: 120, radius: 25, isOval: true }
    },
    ribosome: {
      name: '리보솜',
      color: '#ffd93d',
      description: '단백질을 합성하는 아주 작은 소기관입니다.',
      function: 'mRNA 정보를 읽어 단백질을 만듭니다.',
      position: { x: 230, y: 100, radius: 8 }
    },
    er: {
      name: '소포체',
      color: '#4ecdc4',
      description: '핵 주변에서 물질을 운반하는 관 모양의 구조입니다.',
      function: '단백질과 지질을 합성하고 운반합니다.',
      position: { x: 120, y: 200, radius: 35, isNetwork: true }
    },
    golgi: {
      name: '골지체',
      description: '납작한 주머니가 여러 개 겹쳐있는 구조입니다.',
      color: '#f7b731',
      function: '단백질을 가공하고 포장하여 분비합니다.',
      position: { x: 250, y: 200, radius: 30, isStack: true }
    },
    lysosome: {
      name: '리소솜',
      color: '#eb3b5a',
      description: '소화 효소를 가진 주머니 모양의 소기관입니다.',
      function: '세포 내 노폐물과 이물질을 분해합니다.',
      position: { x: 280, y: 140, radius: 15 }
    },
    membrane: {
      name: '세포막',
      color: '#a55eea',
      description: '세포를 둘러싸는 얇은 막입니다.',
      function: '물질의 출입을 조절하고 세포를 보호합니다.',
      position: { x: 175, y: 175, radius: 140, isOutline: true }
    },
    cytoplasm: {
      name: '세포질',
      color: 'rgba(200, 230, 255, 0.3)',
      description: '세포막과 핵 사이를 채우는 젤리 같은 물질입니다.',
      function: '세포소기관이 떠있고, 화학 반응이 일어납니다.',
      position: { x: 175, y: 175, radius: 135, isFill: true }
    }
  },
  plant: {
    nucleus: {
      name: '핵',
      color: '#6b5b95',
      description: '세포의 중심부에 위치한 가장 큰 소기관입니다.',
      function: '유전 정보(DNA)를 저장하고 세포 활동을 조절합니다.',
      position: { x: 175, y: 200, radius: 40 }
    },
    chloroplast: {
      name: '엽록체',
      color: '#26de81',
      description: '광합성이 일어나는 식물 세포의 특수 소기관입니다.',
      function: '빛 에너지로 포도당을 합성합니다 (광합성).',
      position: { x: 100, y: 130, radius: 30, isOval: true }
    },
    vacuole: {
      name: '액포',
      color: '#45aaf2',
      description: '식물 세포 중앙에 있는 큰 주머니입니다.',
      function: '물과 영양분을 저장하고 세포 형태를 유지합니다.',
      position: { x: 175, y: 140, radius: 60 }
    },
    cellWall: {
      name: '세포벽',
      color: '#8d6e63',
      description: '세포막 바깥쪽의 두꺼운 벽입니다.',
      function: '세포를 보호하고 형태를 유지합니다.',
      position: { x: 175, y: 175, radius: 145, isOutline: true, thick: true }
    },
    mitochondria: {
      name: '미토콘드리아',
      color: '#ff6b6b',
      description: '세포 호흡을 통해 에너지를 생산하는 소기관입니다.',
      function: '포도당을 분해하여 ATP(에너지)를 만듭니다.',
      position: { x: 250, y: 230, radius: 20, isOval: true }
    },
    membrane: {
      name: '세포막',
      color: '#a55eea',
      description: '세포벽 안쪽의 얇은 막입니다.',
      function: '물질의 출입을 조절합니다.',
      position: { x: 175, y: 175, radius: 138, isOutline: true }
    },
    cytoplasm: {
      name: '세포질',
      color: 'rgba(200, 255, 200, 0.3)',
      description: '세포막과 핵 사이를 채우는 젤리 같은 물질입니다.',
      function: '세포소기관이 떠있고, 화학 반응이 일어납니다.',
      position: { x: 175, y: 175, radius: 135, isFill: true }
    }
  }
}

// 게임 상태
const gameState = {
  score: 0,
  currentTab: 'animal',
  currentOrganelle: null,
  exploredOrganelles: new Set(),
  zoomLevel: 100,
  quizMode: false,
  currentQuiz: null
}

// DOM 요소
let elements = {}
let canvas, ctx

// 초기화
function init() {
  elements = {
    scoreValue: document.getElementById('score-value'),
    organelleName: document.getElementById('organelle-name'),
    organelleDescription: document.getElementById('organelle-description'),
    organelleFunction: document.getElementById('organelle-function'),
    functionText: document.getElementById('function-text'),
    listItems: document.getElementById('list-items'),
    exploredCount: document.getElementById('explored-count'),
    totalOrganelles: document.getElementById('total-organelles'),
    zoomLevel: document.getElementById('zoom-level'),
    btnZoomIn: document.getElementById('btn-zoom-in'),
    btnZoomOut: document.getElementById('btn-zoom-out'),
    btnQuiz: document.getElementById('btn-quiz'),
    btnBack: document.getElementById('btn-back'),
    btnNext: document.getElementById('btn-next'),
    explorationArea: document.querySelector('.exploration-area'),
    quizArea: document.getElementById('quiz-area'),
    quizQuestion: document.getElementById('quiz-question'),
    quizImage: document.getElementById('quiz-image'),
    quizOptions: document.getElementById('quiz-options'),
    quizFeedback: document.getElementById('quiz-feedback')
  }

  canvas = document.getElementById('cell-canvas')
  ctx = canvas.getContext('2d')

  updateTotalOrganelles()
  setupEventListeners()
  renderOrganelleList()
  drawCell()
}

// 이벤트 리스너 설정
function setupEventListeners() {
  // 탭 전환
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab))
  })

  // 캔버스 클릭
  canvas.addEventListener('click', handleCanvasClick)

  // 줌 버튼
  elements.btnZoomIn.addEventListener('click', () => changeZoom(50))
  elements.btnZoomOut.addEventListener('click', () => changeZoom(-50))

  // 퀴즈 버튼
  elements.btnQuiz.addEventListener('click', startQuiz)

  // 탐험으로 돌아가기
  elements.btnBack.addEventListener('click', backToExploration)

  // 다음 버튼
  elements.btnNext.addEventListener('click', nextQuiz)
}

// 탭 전환
function switchTab(tab) {
  gameState.currentTab = tab
  gameState.currentOrganelle = null

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab)
  })

  renderOrganelleList()
  drawCell()
  resetOrganelleInfo()
}

// 세포 그리기
function drawCell() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const cellData = organelles[gameState.currentTab]
  const scale = gameState.zoomLevel / 100

  ctx.save()
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.scale(scale, scale)
  ctx.translate(-canvas.width / 2, -canvas.height / 2)

  // 세포질 먼저 그리기
  const cytoplasm = cellData.cytoplasm
  if (cytoplasm) {
    ctx.beginPath()
    ctx.arc(cytoplasm.position.x, cytoplasm.position.y, cytoplasm.position.radius, 0, Math.PI * 2)
    ctx.fillStyle = cytoplasm.color
    ctx.fill()
  }

  // 나머지 소기관 그리기
  Object.entries(cellData).forEach(([key, org]) => {
    if (key === 'cytoplasm') return
    drawOrganelle(key, org)
  })

  ctx.restore()
}

// 소기관 그리기
function drawOrganelle(key, org) {
  const pos = org.position

  ctx.save()

  if (org.position.isOutline) {
    // 세포막/세포벽
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, pos.radius, 0, Math.PI * 2)
    ctx.strokeStyle = org.color
    ctx.lineWidth = pos.thick ? 6 : 3
    ctx.stroke()
  } else if (org.position.isOval) {
    // 타원형 (미토콘드리아, 엽록체)
    ctx.beginPath()
    ctx.ellipse(pos.x, pos.y, pos.radius * 1.5, pos.radius, Math.PI / 4, 0, Math.PI * 2)
    ctx.fillStyle = org.color
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 2
    ctx.stroke()

    // 내부 구조
    ctx.beginPath()
    ctx.ellipse(pos.x, pos.y, pos.radius * 0.8, pos.radius * 0.5, Math.PI / 4, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.stroke()
  } else if (org.position.isNetwork) {
    // 소포체
    ctx.strokeStyle = org.color
    ctx.lineWidth = 3
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.arc(pos.x, pos.y + i * 8 - 16, pos.radius - i * 3, 0.3, Math.PI - 0.3)
      ctx.stroke()
    }
  } else if (org.position.isStack) {
    // 골지체
    ctx.fillStyle = org.color
    for (let i = 0; i < 4; i++) {
      ctx.beginPath()
      ctx.ellipse(pos.x, pos.y + i * 10 - 15, pos.radius, 6, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.stroke()
    }
  } else {
    // 일반 원형
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, pos.radius, 0, Math.PI * 2)
    ctx.fillStyle = org.color
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 2
    ctx.stroke()

    // 핵의 경우 핵막 표시
    if (key === 'nucleus') {
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, pos.radius * 0.4, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.fill()
    }
  }

  ctx.restore()
}

// 캔버스 클릭 처리
function handleCanvasClick(e) {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY

  const scale = gameState.zoomLevel / 100
  const adjustedX = (x - canvas.width / 2) / scale + canvas.width / 2
  const adjustedY = (y - canvas.height / 2) / scale + canvas.height / 2

  const cellData = organelles[gameState.currentTab]
  let clickedOrganelle = null

  // 작은 소기관부터 체크 (겹침 고려)
  const sortedOrganelles = Object.entries(cellData).sort((a, b) => {
    return (a[1].position.radius || 0) - (b[1].position.radius || 0)
  })

  for (const [key, org] of sortedOrganelles) {
    if (org.position.isFill) continue // 세포질 제외

    const pos = org.position
    const dist = Math.sqrt((adjustedX - pos.x) ** 2 + (adjustedY - pos.y) ** 2)
    const threshold = org.position.isOutline ? 15 : pos.radius + 10

    if (dist < threshold) {
      clickedOrganelle = key
    }
  }

  if (clickedOrganelle) {
    selectOrganelle(clickedOrganelle)
  }
}

// 소기관 선택
function selectOrganelle(key) {
  gameState.currentOrganelle = key
  const org = organelles[gameState.currentTab][key]

  // 탐험 기록
  if (!gameState.exploredOrganelles.has(`${gameState.currentTab}-${key}`)) {
    gameState.exploredOrganelles.add(`${gameState.currentTab}-${key}`)
    addScore(10)
    updateExploredCount()
    updateOrganelleList()
  }

  // 정보 표시
  elements.organelleName.textContent = org.name
  elements.organelleDescription.textContent = org.description
  elements.functionText.textContent = org.function
  elements.organelleFunction.classList.remove('hidden')

  // 목록에서 활성화
  document.querySelectorAll('.organelle-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.key === key)
  })
}

// 소기관 정보 초기화
function resetOrganelleInfo() {
  elements.organelleName.textContent = '세포소기관을 클릭하세요'
  elements.organelleDescription.textContent = '세포의 각 부분을 클릭하면 자세한 정보를 볼 수 있습니다.'
  elements.organelleFunction.classList.add('hidden')
}

// 소기관 목록 렌더링
function renderOrganelleList() {
  const cellData = organelles[gameState.currentTab]
  elements.listItems.innerHTML = ''

  Object.entries(cellData).forEach(([key, org]) => {
    if (key === 'cytoplasm') return

    const chip = document.createElement('div')
    chip.className = 'organelle-chip'
    chip.dataset.key = key
    chip.textContent = org.name

    if (gameState.exploredOrganelles.has(`${gameState.currentTab}-${key}`)) {
      chip.classList.add('explored')
    }

    chip.addEventListener('click', () => selectOrganelle(key))
    elements.listItems.appendChild(chip)
  })
}

// 소기관 목록 업데이트
function updateOrganelleList() {
  document.querySelectorAll('.organelle-chip').forEach(chip => {
    const key = chip.dataset.key
    if (gameState.exploredOrganelles.has(`${gameState.currentTab}-${key}`)) {
      chip.classList.add('explored')
    }
  })
}

// 줌 변경
function changeZoom(delta) {
  gameState.zoomLevel = Math.max(50, Math.min(200, gameState.zoomLevel + delta))
  elements.zoomLevel.textContent = `${gameState.zoomLevel}x`
  drawCell()
}

// 퀴즈 시작
function startQuiz() {
  gameState.quizMode = true
  elements.explorationArea.classList.add('hidden')
  elements.quizArea.classList.remove('hidden')
  elements.btnBack.style.display = 'inline-block'
  elements.btnQuiz.style.display = 'none'

  generateQuiz()
}

// 퀴즈 생성
function generateQuiz() {
  const allOrganelles = []
  Object.entries(organelles).forEach(([cellType, cellData]) => {
    Object.entries(cellData).forEach(([key, org]) => {
      if (key !== 'cytoplasm' && key !== 'membrane') {
        allOrganelles.push({ key, cellType, ...org })
      }
    })
  })

  const quizOrganelle = allOrganelles[Math.floor(Math.random() * allOrganelles.length)]

  // 선택지 생성
  const options = [quizOrganelle.name]
  const otherOrganelles = allOrganelles.filter(o => o.name !== quizOrganelle.name)
  while (options.length < 4 && otherOrganelles.length > 0) {
    const idx = Math.floor(Math.random() * otherOrganelles.length)
    const org = otherOrganelles.splice(idx, 1)[0]
    if (!options.includes(org.name)) {
      options.push(org.name)
    }
  }

  // 섞기
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]]
  }

  gameState.currentQuiz = {
    organelle: quizOrganelle,
    correctAnswer: quizOrganelle.name
  }

  // 문제 유형 랜덤
  const questionTypes = [
    `이 세포소기관의 이름은?`,
    `"${quizOrganelle.function.slice(0, 20)}..."의 기능을 하는 것은?`
  ]

  elements.quizQuestion.textContent = questionTypes[Math.floor(Math.random() * questionTypes.length)]

  // 이미지 그리기
  drawQuizImage(quizOrganelle)

  // 옵션 렌더링
  elements.quizOptions.innerHTML = ''
  elements.quizFeedback.classList.add('hidden')

  options.forEach(option => {
    const btn = document.createElement('button')
    btn.className = 'quiz-option'
    btn.textContent = option
    btn.addEventListener('click', () => checkQuizAnswer(option, btn))
    elements.quizOptions.appendChild(btn)
  })

  elements.btnNext.disabled = true
}

// 퀴즈 이미지 그리기
function drawQuizImage(org) {
  elements.quizImage.innerHTML = ''
  const quizCanvas = document.createElement('canvas')
  quizCanvas.width = 120
  quizCanvas.height = 120
  const quizCtx = quizCanvas.getContext('2d')

  quizCtx.translate(60, 60)

  // 간단한 형태 그리기
  quizCtx.fillStyle = org.color
  quizCtx.strokeStyle = 'rgba(255,255,255,0.5)'
  quizCtx.lineWidth = 2

  if (org.position.isOval) {
    quizCtx.beginPath()
    quizCtx.ellipse(0, 0, 40, 25, 0, 0, Math.PI * 2)
    quizCtx.fill()
    quizCtx.stroke()
  } else if (org.position.isStack) {
    for (let i = 0; i < 4; i++) {
      quizCtx.beginPath()
      quizCtx.ellipse(0, i * 12 - 18, 35, 8, 0, 0, Math.PI * 2)
      quizCtx.fill()
      quizCtx.stroke()
    }
  } else {
    quizCtx.beginPath()
    quizCtx.arc(0, 0, 40, 0, Math.PI * 2)
    quizCtx.fill()
    quizCtx.stroke()
  }

  elements.quizImage.appendChild(quizCanvas)
}

// 퀴즈 정답 확인
function checkQuizAnswer(answer, button) {
  const isCorrect = answer === gameState.currentQuiz.correctAnswer

  document.querySelectorAll('.quiz-option').forEach(btn => {
    btn.style.pointerEvents = 'none'
    if (btn.textContent === gameState.currentQuiz.correctAnswer) {
      btn.classList.add('correct')
    }
  })

  if (isCorrect) {
    button.classList.add('correct')
    elements.quizFeedback.textContent = '정답입니다!'
    elements.quizFeedback.className = 'quiz-feedback correct'
    addScore(20)
  } else {
    button.classList.add('incorrect')
    elements.quizFeedback.textContent = `틀렸습니다. 정답은 "${gameState.currentQuiz.correctAnswer}"입니다.`
    elements.quizFeedback.className = 'quiz-feedback incorrect'
  }

  elements.quizFeedback.classList.remove('hidden')
  elements.btnNext.disabled = false
}

// 탐험으로 돌아가기
function backToExploration() {
  gameState.quizMode = false
  elements.explorationArea.classList.remove('hidden')
  elements.quizArea.classList.add('hidden')
  elements.btnBack.style.display = 'none'
  elements.btnQuiz.style.display = 'inline-block'
  elements.btnNext.disabled = true
}

// 다음 퀴즈
function nextQuiz() {
  generateQuiz()
}

// 점수 추가
function addScore(points) {
  gameState.score += points
  elements.scoreValue.textContent = gameState.score
  showScorePopup(points)
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

// 탐험 개수 업데이트
function updateExploredCount() {
  elements.exploredCount.textContent = gameState.exploredOrganelles.size
}

// 총 소기관 수 업데이트
function updateTotalOrganelles() {
  let total = 0
  Object.values(organelles).forEach(cellData => {
    total += Object.keys(cellData).filter(k => k !== 'cytoplasm').length
  })
  elements.totalOrganelles.textContent = total
}

// 게임 시작
init()
