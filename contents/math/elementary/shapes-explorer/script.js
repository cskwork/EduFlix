/**
 * 도형 탐험가 - 탐험 로직
 * 초등학교 5학년 대상 도형 학습 탐험
 */

// 도형 데이터
const shapes = {
  plane: {
    triangle: {
      name: '삼각형',
      sides: 3,
      vertices: 3,
      angles: '180도',
      description: '세 개의 변과 세 개의 꼭짓점으로 이루어진 가장 기본적인 다각형입니다.',
      color: '#ff6b6b',
      draw: drawTriangle
    },
    square: {
      name: '사각형',
      sides: 4,
      vertices: 4,
      angles: '360도',
      description: '네 개의 변과 네 개의 꼭짓점으로 이루어진 다각형입니다. 정사각형은 모든 변의 길이와 각이 같습니다.',
      color: '#4ecdc4',
      draw: drawSquare
    },
    pentagon: {
      name: '오각형',
      sides: 5,
      vertices: 5,
      angles: '540도',
      description: '다섯 개의 변과 다섯 개의 꼭짓점으로 이루어진 다각형입니다.',
      color: '#45b7d1',
      draw: drawPentagon
    },
    hexagon: {
      name: '육각형',
      sides: 6,
      vertices: 6,
      angles: '720도',
      description: '여섯 개의 변과 여섯 개의 꼭짓점으로 이루어진 다각형입니다. 벌집 모양이 대표적입니다.',
      color: '#96ceb4',
      draw: drawHexagon
    },
    circle: {
      name: '원',
      sides: '없음',
      vertices: '없음',
      angles: '360도',
      description: '한 점에서 같은 거리에 있는 모든 점들로 이루어진 도형입니다. 변과 꼭짓점이 없습니다.',
      color: '#ffeaa7',
      draw: drawCircle
    }
  },
  solid: {
    cube: {
      name: '정육면체',
      faces: 6,
      edges: 12,
      vertices: 8,
      description: '여섯 개의 정사각형 면으로 이루어진 입체도형입니다. 주사위가 대표적입니다.',
      color: '#ff6b6b',
      draw: drawCube
    },
    pyramid: {
      name: '사각뿔',
      faces: 5,
      edges: 8,
      vertices: 5,
      description: '사각형 밑면과 네 개의 삼각형 옆면으로 이루어진 입체도형입니다. 피라미드가 대표적입니다.',
      color: '#ffd93d',
      draw: drawPyramid
    },
    cylinder: {
      name: '원기둥',
      faces: 3,
      edges: 2,
      vertices: 0,
      description: '두 개의 원형 밑면과 곡면으로 이루어진 입체도형입니다. 음료수 캔이 대표적입니다.',
      color: '#6bcb77',
      draw: drawCylinder
    },
    cone: {
      name: '원뿔',
      faces: 2,
      edges: 1,
      vertices: 1,
      description: '원형 밑면과 곡면으로 이루어진 입체도형입니다. 아이스크림 콘이 대표적입니다.',
      color: '#4d96ff',
      draw: drawCone
    },
    sphere: {
      name: '구',
      faces: 1,
      edges: 0,
      vertices: 0,
      description: '한 점에서 같은 거리에 있는 모든 점들로 이루어진 입체도형입니다. 공이 대표적입니다.',
      color: '#ff6b9d',
      draw: drawSphere
    }
  }
}

// 게임 상태
const gameState = {
  score: 0,
  currentTab: 'plane',
  currentShape: 'triangle',
  exploredShapes: new Set(['triangle']),
  rotation: 0,
  isRotating: false,
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
    shapeName: document.getElementById('shape-name'),
    propSides: document.getElementById('prop-sides'),
    propVertices: document.getElementById('prop-vertices'),
    propAngles: document.getElementById('prop-angles'),
    shapeDescription: document.getElementById('shape-description'),
    shapeProperties: document.getElementById('shape-properties'),
    shapeSelector: document.getElementById('shape-selector'),
    exploredCount: document.getElementById('explored-count'),
    totalShapes: document.getElementById('total-shapes'),
    btnRotate: document.getElementById('btn-rotate'),
    btnQuiz: document.getElementById('btn-quiz'),
    btnBack: document.getElementById('btn-back'),
    btnNext: document.getElementById('btn-next'),
    explorationArea: document.querySelector('.exploration-area'),
    quizArea: document.getElementById('quiz-area'),
    quizQuestion: document.getElementById('quiz-question'),
    quizOptions: document.getElementById('quiz-options'),
    quizFeedback: document.getElementById('quiz-feedback')
  }

  canvas = document.getElementById('shape-canvas')
  ctx = canvas.getContext('2d')

  setupEventListeners()
  updateShapeSelector()
  updateTotalShapes()
  loadShape(gameState.currentShape)
}

// 이벤트 리스너 설정
function setupEventListeners() {
  // 탭 전환
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab
      switchTab(tab)
    })
  })

  // 도형 선택
  elements.shapeSelector.addEventListener('click', (e) => {
    if (e.target.classList.contains('shape-btn')) {
      const shape = e.target.dataset.shape
      selectShape(shape)
    }
  })

  // 회전 버튼
  elements.btnRotate.addEventListener('click', toggleRotation)

  // 퀴즈 버튼
  elements.btnQuiz.addEventListener('click', startQuiz)

  // 탐험으로 돌아가기
  elements.btnBack.addEventListener('click', backToExploration)

  // 다음 도형
  elements.btnNext.addEventListener('click', nextShape)
}

// 탭 전환
function switchTab(tab) {
  gameState.currentTab = tab
  gameState.rotation = 0
  gameState.isRotating = false

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab)
  })

  updateShapeSelector()

  const shapeKeys = Object.keys(shapes[tab])
  const firstShape = shapeKeys[0]
  selectShape(firstShape)
}

// 도형 선택기 업데이트
function updateShapeSelector() {
  const shapeData = shapes[gameState.currentTab]
  elements.shapeSelector.innerHTML = ''

  Object.entries(shapeData).forEach(([key, shape]) => {
    const btn = document.createElement('button')
    btn.className = 'shape-btn'
    btn.dataset.shape = key
    btn.textContent = shape.name

    if (key === gameState.currentShape && gameState.currentTab === 'plane') {
      btn.classList.add('active')
    }

    if (gameState.exploredShapes.has(key)) {
      btn.classList.add('explored')
    }

    elements.shapeSelector.appendChild(btn)
  })
}

// 도형 선택
function selectShape(shapeKey) {
  gameState.currentShape = shapeKey
  gameState.rotation = 0

  // 처음 탐험하는 도형이면 점수 추가
  if (!gameState.exploredShapes.has(shapeKey)) {
    gameState.exploredShapes.add(shapeKey)
    addScore(10)
    updateExploredCount()
    updateShapeSelector()
  }

  // 버튼 활성화 상태 업데이트
  document.querySelectorAll('.shape-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.shape === shapeKey)
  })

  loadShape(shapeKey)
}

// 도형 로드
function loadShape(shapeKey) {
  const shapeData = shapes[gameState.currentTab][shapeKey]
  if (!shapeData) return

  elements.shapeName.textContent = shapeData.name
  elements.shapeDescription.textContent = shapeData.description

  // 속성 업데이트
  if (gameState.currentTab === 'plane') {
    elements.propSides.parentElement.querySelector('.property-label').textContent = '변'
    elements.propVertices.parentElement.querySelector('.property-label').textContent = '꼭짓점'
    elements.propAngles.parentElement.querySelector('.property-label').textContent = '내각의 합'
    elements.propSides.textContent = shapeData.sides
    elements.propVertices.textContent = shapeData.vertices
    elements.propAngles.textContent = shapeData.angles
  } else {
    elements.propSides.parentElement.querySelector('.property-label').textContent = '면'
    elements.propVertices.parentElement.querySelector('.property-label').textContent = '꼭짓점'
    elements.propAngles.parentElement.querySelector('.property-label').textContent = '모서리'
    elements.propSides.textContent = shapeData.faces
    elements.propVertices.textContent = shapeData.vertices
    elements.propAngles.textContent = shapeData.edges
  }

  drawShape()
}

// 도형 그리기
function drawShape() {
  const shapeData = shapes[gameState.currentTab][gameState.currentShape]
  if (!shapeData || !shapeData.draw) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.save()
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate(gameState.rotation * Math.PI / 180)
  shapeData.draw(ctx, shapeData.color)
  ctx.restore()

  if (gameState.isRotating) {
    gameState.rotation += 2
    requestAnimationFrame(drawShape)
  }
}

// 평면도형 그리기 함수들
function drawTriangle(ctx, color) {
  const size = 100
  ctx.beginPath()
  ctx.moveTo(0, -size)
  ctx.lineTo(-size * 0.866, size * 0.5)
  ctx.lineTo(size * 0.866, size * 0.5)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 3
  ctx.stroke()
}

function drawSquare(ctx, color) {
  const size = 90
  ctx.fillStyle = color
  ctx.fillRect(-size, -size, size * 2, size * 2)
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 3
  ctx.strokeRect(-size, -size, size * 2, size * 2)
}

function drawPentagon(ctx, color) {
  const size = 90
  const sides = 5
  ctx.beginPath()
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI / sides) - Math.PI / 2
    const x = size * Math.cos(angle)
    const y = size * Math.sin(angle)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 3
  ctx.stroke()
}

function drawHexagon(ctx, color) {
  const size = 90
  const sides = 6
  ctx.beginPath()
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI / sides) - Math.PI / 2
    const x = size * Math.cos(angle)
    const y = size * Math.sin(angle)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 3
  ctx.stroke()
}

function drawCircle(ctx, color) {
  const size = 90
  ctx.beginPath()
  ctx.arc(0, 0, size, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 3
  ctx.stroke()
}

// 입체도형 그리기 함수들 (2D 표현)
function drawCube(ctx, color) {
  const size = 70
  // 앞면
  ctx.fillStyle = color
  ctx.fillRect(-size / 2, -size / 2, size, size)
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.strokeRect(-size / 2, -size / 2, size, size)

  // 윗면 (평행사변형)
  ctx.beginPath()
  ctx.moveTo(-size / 2, -size / 2)
  ctx.lineTo(-size / 2 + size * 0.4, -size / 2 - size * 0.4)
  ctx.lineTo(size / 2 + size * 0.4, -size / 2 - size * 0.4)
  ctx.lineTo(size / 2, -size / 2)
  ctx.closePath()
  ctx.fillStyle = adjustBrightness(color, 20)
  ctx.fill()
  ctx.stroke()

  // 옆면
  ctx.beginPath()
  ctx.moveTo(size / 2, -size / 2)
  ctx.lineTo(size / 2 + size * 0.4, -size / 2 - size * 0.4)
  ctx.lineTo(size / 2 + size * 0.4, size / 2 - size * 0.4)
  ctx.lineTo(size / 2, size / 2)
  ctx.closePath()
  ctx.fillStyle = adjustBrightness(color, -20)
  ctx.fill()
  ctx.stroke()
}

function drawPyramid(ctx, color) {
  const size = 80
  // 밑면 (사각형처럼 보이게)
  ctx.beginPath()
  ctx.moveTo(-size, size * 0.3)
  ctx.lineTo(0, size * 0.8)
  ctx.lineTo(size, size * 0.3)
  ctx.lineTo(0, -size * 0.1)
  ctx.closePath()
  ctx.fillStyle = adjustBrightness(color, -30)
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.stroke()

  // 앞면 삼각형
  ctx.beginPath()
  ctx.moveTo(-size, size * 0.3)
  ctx.lineTo(0, -size)
  ctx.lineTo(0, -size * 0.1)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.stroke()

  // 옆면 삼각형
  ctx.beginPath()
  ctx.moveTo(0, -size * 0.1)
  ctx.lineTo(0, -size)
  ctx.lineTo(size, size * 0.3)
  ctx.closePath()
  ctx.fillStyle = adjustBrightness(color, -15)
  ctx.fill()
  ctx.stroke()
}

function drawCylinder(ctx, color) {
  const width = 80
  const height = 120
  // 옆면
  ctx.fillStyle = color
  ctx.fillRect(-width / 2, -height / 2 + 20, width, height - 40)
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.strokeRect(-width / 2, -height / 2 + 20, width, height - 40)

  // 밑면 타원
  ctx.beginPath()
  ctx.ellipse(0, height / 2 - 20, width / 2, 20, 0, 0, Math.PI * 2)
  ctx.fillStyle = adjustBrightness(color, -30)
  ctx.fill()
  ctx.stroke()

  // 윗면 타원
  ctx.beginPath()
  ctx.ellipse(0, -height / 2 + 20, width / 2, 20, 0, 0, Math.PI * 2)
  ctx.fillStyle = adjustBrightness(color, 20)
  ctx.fill()
  ctx.stroke()
}

function drawCone(ctx, color) {
  const width = 100
  const height = 130
  // 옆면 삼각형
  ctx.beginPath()
  ctx.moveTo(-width / 2, height / 2 - 20)
  ctx.lineTo(0, -height / 2)
  ctx.lineTo(width / 2, height / 2 - 20)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.stroke()

  // 밑면 타원
  ctx.beginPath()
  ctx.ellipse(0, height / 2 - 20, width / 2, 20, 0, 0, Math.PI * 2)
  ctx.fillStyle = adjustBrightness(color, -30)
  ctx.fill()
  ctx.stroke()
}

function drawSphere(ctx, color) {
  const size = 80
  // 기본 원
  const gradient = ctx.createRadialGradient(-size * 0.3, -size * 0.3, 0, 0, 0, size)
  gradient.addColorStop(0, adjustBrightness(color, 40))
  gradient.addColorStop(0.5, color)
  gradient.addColorStop(1, adjustBrightness(color, -40))

  ctx.beginPath()
  ctx.arc(0, 0, size, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.stroke()

  // 하이라이트
  ctx.beginPath()
  ctx.arc(-size * 0.3, -size * 0.3, size * 0.2, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.fill()
}

// 색상 밝기 조절
function adjustBrightness(color, percent) {
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, Math.max(0, (num >> 16) + amt))
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt))
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt))
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
}

// 회전 토글
function toggleRotation() {
  gameState.isRotating = !gameState.isRotating
  elements.btnRotate.textContent = gameState.isRotating ? '정지' : '회전'
  if (gameState.isRotating) {
    drawShape()
  }
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
  const currentShapeData = shapes[gameState.currentTab][gameState.currentShape]
  const quizTypes = gameState.currentTab === 'plane'
    ? ['sides', 'vertices', 'name']
    : ['faces', 'edges', 'vertices', 'name']

  const quizType = quizTypes[Math.floor(Math.random() * quizTypes.length)]

  let question, correctAnswer, options

  if (quizType === 'sides') {
    question = `${currentShapeData.name}의 변의 개수는?`
    correctAnswer = currentShapeData.sides
    options = generateOptions(correctAnswer, [1, 2, 3, 4, 5, 6, 8, '없음'])
  } else if (quizType === 'vertices') {
    question = `${currentShapeData.name}의 꼭짓점 개수는?`
    correctAnswer = currentShapeData.vertices
    options = generateOptions(correctAnswer, [0, 1, 3, 4, 5, 6, 8, '없음'])
  } else if (quizType === 'faces') {
    question = `${currentShapeData.name}의 면의 개수는?`
    correctAnswer = currentShapeData.faces
    options = generateOptions(correctAnswer, [1, 2, 3, 4, 5, 6, 8])
  } else if (quizType === 'edges') {
    question = `${currentShapeData.name}의 모서리 개수는?`
    correctAnswer = currentShapeData.edges
    options = generateOptions(correctAnswer, [0, 1, 2, 4, 6, 8, 12])
  } else {
    question = '이 도형의 이름은?'
    correctAnswer = currentShapeData.name
    const allNames = Object.values(shapes[gameState.currentTab]).map(s => s.name)
    options = generateOptions(correctAnswer, allNames)
  }

  gameState.currentQuiz = { correctAnswer, quizType }

  elements.quizQuestion.textContent = question
  elements.quizOptions.innerHTML = ''
  elements.quizFeedback.classList.add('hidden')

  options.forEach(option => {
    const btn = document.createElement('button')
    btn.className = 'quiz-option'
    btn.textContent = option
    btn.addEventListener('click', () => checkQuizAnswer(option, btn))
    elements.quizOptions.appendChild(btn)
  })
}

// 옵션 생성
function generateOptions(correct, pool) {
  const options = [correct]
  const filteredPool = pool.filter(p => p !== correct)

  while (options.length < 4 && filteredPool.length > 0) {
    const idx = Math.floor(Math.random() * filteredPool.length)
    options.push(filteredPool.splice(idx, 1)[0])
  }

  return shuffleArray(options)
}

// 배열 섞기
function shuffleArray(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// 퀴즈 정답 확인
function checkQuizAnswer(answer, button) {
  const isCorrect = answer === gameState.currentQuiz.correctAnswer

  // 모든 버튼 비활성화
  document.querySelectorAll('.quiz-option').forEach(btn => {
    btn.style.pointerEvents = 'none'
    if (btn.textContent === String(gameState.currentQuiz.correctAnswer)) {
      btn.classList.add('correct')
    }
  })

  if (isCorrect) {
    button.classList.add('correct')
    elements.quizFeedback.textContent = '정답입니다!'
    elements.quizFeedback.className = 'quiz-feedback correct'
    addScore(20)
    elements.btnNext.disabled = false
  } else {
    button.classList.add('incorrect')
    elements.quizFeedback.textContent = `틀렸습니다. 정답은 ${gameState.currentQuiz.correctAnswer}입니다.`
    elements.quizFeedback.className = 'quiz-feedback incorrect'
  }

  elements.quizFeedback.classList.remove('hidden')
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

// 다음 도형
function nextShape() {
  const shapeKeys = Object.keys(shapes[gameState.currentTab])
  const currentIndex = shapeKeys.indexOf(gameState.currentShape)
  const nextIndex = (currentIndex + 1) % shapeKeys.length

  selectShape(shapeKeys[nextIndex])

  if (gameState.quizMode) {
    generateQuiz()
    elements.btnNext.disabled = true
  }
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
  elements.exploredCount.textContent = gameState.exploredShapes.size
}

// 총 도형 수 업데이트
function updateTotalShapes() {
  const total = Object.keys(shapes.plane).length + Object.keys(shapes.solid).length
  elements.totalShapes.textContent = total
}

// 게임 시작
init()
