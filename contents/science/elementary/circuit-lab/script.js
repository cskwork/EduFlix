/**
 * 전기회로 실험실 - 시뮬레이션 로직
 * 초등학교 6학년 대상 전기회로 학습
 */

// 미션 데이터
const missions = [
  {
    id: 1,
    title: '전구 켜기',
    description: '전지와 전구를 전선으로 연결하여 전구를 켜보세요!',
    requiredComponents: ['battery', 'bulb'],
    hint: '전지의 (+)극에서 시작하여 전구를 거쳐 (-)극으로 돌아오는 회로를 만드세요.',
    successMessage: '전구가 켜졌어요! 전기는 닫힌 회로를 통해 흐릅니다.'
  },
  {
    id: 2,
    title: '스위치 사용',
    description: '스위치를 추가하여 전구를 켜고 끌 수 있게 만들어보세요!',
    requiredComponents: ['battery', 'bulb', 'switch'],
    hint: '스위치를 회로에 연결하고, 스위치를 클릭하여 켜고 끄세요.',
    successMessage: '스위치로 전기의 흐름을 조절할 수 있어요!'
  },
  {
    id: 3,
    title: '직렬 연결',
    description: '전구 2개를 직렬로 연결해보세요! 직렬 연결은 부품을 한 줄로 연결하는 방식입니다.',
    requiredComponents: ['battery', 'bulb', 'bulb'],
    hint: '전구를 한 줄로 연결하면 직렬 연결이 됩니다.',
    successMessage: '직렬 연결에서는 전구 하나가 꺼지면 모두 꺼집니다!'
  },
  {
    id: 4,
    title: '병렬 연결',
    description: '전구 2개를 병렬로 연결해보세요! 병렬 연결은 부품을 나란히 연결하는 방식입니다.',
    requiredComponents: ['battery', 'bulb', 'bulb'],
    hint: '전구 각각이 전지에 직접 연결되어야 병렬 연결이 됩니다.',
    successMessage: '병렬 연결에서는 전구 하나가 꺼져도 다른 전구는 켜져있어요!'
  },
  {
    id: 5,
    title: '복합 회로',
    description: '전지, 스위치, 전구 2개를 사용하여 회로를 완성하세요!',
    requiredComponents: ['battery', 'switch', 'bulb', 'bulb'],
    hint: '스위치로 모든 전구를 제어할 수 있게 만들어보세요.',
    successMessage: '축하합니다! 전기회로의 기본을 모두 배웠어요!'
  }
]

// 게임 상태
const gameState = {
  score: 0,
  currentMission: 0,
  selectedTool: null,
  components: [],
  wires: [],
  isCircuitComplete: false,
  switchState: false
}

// DOM 요소
let elements = {}
let canvas, ctx

// 초기화
function init() {
  elements = {
    scoreValue: document.getElementById('score-value'),
    currentMission: document.getElementById('current-mission'),
    missionTitle: document.getElementById('mission-title'),
    missionDescription: document.getElementById('mission-description'),
    missionProgress: document.getElementById('mission-progress'),
    totalMissions: document.getElementById('total-missions'),
    circuitBoard: document.getElementById('circuit-board'),
    circuitComponents: document.getElementById('circuit-components'),
    toolbox: document.getElementById('toolbox'),
    currentFlow: document.getElementById('current-flow'),
    voltage: document.getElementById('voltage'),
    circuitStatus: document.getElementById('circuit-status'),
    btnClear: document.getElementById('btn-clear'),
    btnCheck: document.getElementById('btn-check')
  }

  canvas = document.getElementById('circuit-canvas')
  ctx = canvas.getContext('2d')

  elements.totalMissions.textContent = missions.length

  setupEventListeners()
  loadMission()
}

// 이벤트 리스너 설정
function setupEventListeners() {
  // 도구 선택
  elements.toolbox.addEventListener('click', (e) => {
    const toolBtn = e.target.closest('.tool-btn')
    if (toolBtn) {
      selectTool(toolBtn.dataset.component)
    }
  })

  // 회로 보드 클릭 (부품 배치)
  elements.circuitBoard.addEventListener('click', (e) => {
    if (gameState.selectedTool && gameState.selectedTool !== 'wire') {
      const rect = elements.circuitBoard.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      placeComponent(gameState.selectedTool, x, y)
    }
  })

  // 초기화 버튼
  elements.btnClear.addEventListener('click', clearCircuit)

  // 회로 확인 버튼
  elements.btnCheck.addEventListener('click', checkCircuit)
}

// 도구 선택
function selectTool(tool) {
  gameState.selectedTool = tool
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.component === tool)
  })
}

// 부품 배치
function placeComponent(type, x, y) {
  // 경계 체크
  const padding = 40
  x = Math.max(padding, Math.min(canvas.width - padding, x))
  y = Math.max(padding, Math.min(canvas.height - padding, y))

  const component = {
    id: Date.now(),
    type: type,
    x: x,
    y: y,
    state: type === 'switch' ? 'open' : 'off'
  }

  gameState.components.push(component)
  renderComponent(component)
  updateCircuitInfo()
}

// 부품 렌더링
function renderComponent(component) {
  const div = document.createElement('div')
  div.className = `circuit-component component-${component.type}`
  div.dataset.id = component.id
  div.style.left = `${component.x - 25}px`
  div.style.top = `${component.y - 25}px`

  let icon, label
  switch (component.type) {
    case 'battery':
      icon = '&#128267;'
      label = '전지'
      break
    case 'bulb':
      icon = '&#128161;'
      label = '전구'
      break
    case 'switch':
      icon = '&#9211;'
      label = '스위치'
      break
    default:
      icon = '?'
      label = ''
  }

  div.innerHTML = `
    <span class="component-icon">${icon}</span>
    <span class="component-label">${label}</span>
  `

  // 스위치 클릭 이벤트
  if (component.type === 'switch') {
    div.addEventListener('click', (e) => {
      e.stopPropagation()
      toggleSwitch(component.id)
    })
  }

  // 부품 삭제 (더블클릭)
  div.addEventListener('dblclick', (e) => {
    e.stopPropagation()
    removeComponent(component.id)
  })

  elements.circuitComponents.appendChild(div)
}

// 스위치 토글
function toggleSwitch(id) {
  const component = gameState.components.find(c => c.id === id)
  if (component && component.type === 'switch') {
    component.state = component.state === 'open' ? 'closed' : 'open'
    const div = document.querySelector(`[data-id="${id}"]`)
    div.classList.toggle('closed', component.state === 'closed')
    updateCircuitInfo()
    checkAndUpdateBulbs()
  }
}

// 부품 삭제
function removeComponent(id) {
  gameState.components = gameState.components.filter(c => c.id !== id)
  const div = document.querySelector(`[data-id="${id}"]`)
  if (div) div.remove()
  updateCircuitInfo()
}

// 회로 초기화
function clearCircuit() {
  gameState.components = []
  gameState.wires = []
  gameState.isCircuitComplete = false
  elements.circuitComponents.innerHTML = ''
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  updateCircuitInfo()
}

// 회로 정보 업데이트
function updateCircuitInfo() {
  const hasBattery = gameState.components.some(c => c.type === 'battery')
  const hasBulb = gameState.components.some(c => c.type === 'bulb')
  const switchClosed = !gameState.components.some(c => c.type === 'switch' && c.state === 'open')

  // 간단한 회로 시뮬레이션
  const isComplete = hasBattery && hasBulb && switchClosed

  if (isComplete) {
    elements.currentFlow.textContent = '0.5 A'
    elements.currentFlow.classList.add('active')
    elements.voltage.textContent = '1.5 V'
    elements.voltage.classList.add('active')
    elements.circuitStatus.textContent = '완성'
    elements.circuitStatus.classList.remove('error')
    elements.circuitStatus.classList.add('active')
  } else {
    elements.currentFlow.textContent = '0 A'
    elements.currentFlow.classList.remove('active')
    elements.voltage.textContent = hasBattery ? '1.5 V' : '0 V'
    elements.voltage.classList.toggle('active', hasBattery)
    elements.circuitStatus.textContent = switchClosed ? '미완성' : '스위치 꺼짐'
    elements.circuitStatus.classList.remove('active')
  }

  gameState.isCircuitComplete = isComplete
}

// 전구 상태 업데이트
function checkAndUpdateBulbs() {
  const hasBattery = gameState.components.some(c => c.type === 'battery')
  const switchClosed = !gameState.components.some(c => c.type === 'switch' && c.state === 'open')
  const isOn = hasBattery && switchClosed

  gameState.components.forEach(c => {
    if (c.type === 'bulb') {
      const div = document.querySelector(`[data-id="${c.id}"]`)
      if (div) {
        div.classList.toggle('on', isOn)
        if (isOn) div.classList.add('glowing')
        else div.classList.remove('glowing')
      }
    }
  })
}

// 회로 확인
function checkCircuit() {
  const mission = missions[gameState.currentMission]

  // 필요한 부품 확인
  const componentCounts = {}
  gameState.components.forEach(c => {
    componentCounts[c.type] = (componentCounts[c.type] || 0) + 1
  })

  const requiredCounts = {}
  mission.requiredComponents.forEach(c => {
    requiredCounts[c] = (requiredCounts[c] || 0) + 1
  })

  let hasAllComponents = true
  for (const [type, count] of Object.entries(requiredCounts)) {
    if ((componentCounts[type] || 0) < count) {
      hasAllComponents = false
      break
    }
  }

  // 스위치가 있는 경우 닫혀있어야 함
  const hasBattery = gameState.components.some(c => c.type === 'battery')
  const switchOK = !gameState.components.some(c => c.type === 'switch' && c.state === 'open')

  if (hasAllComponents && hasBattery && switchOK) {
    // 미션 성공
    missionSuccess()
  } else {
    // 미션 실패
    showFeedback(false, !hasAllComponents ?
      `필요한 부품: ${mission.requiredComponents.map(c => getComponentName(c)).join(', ')}` :
      !switchOK ? '스위치를 켜주세요!' : '회로가 완성되지 않았습니다.',
      mission.hint)
  }
}

// 부품 이름 가져오기
function getComponentName(type) {
  const names = { battery: '전지', bulb: '전구', switch: '스위치', wire: '전선' }
  return names[type] || type
}

// 미션 성공
function missionSuccess() {
  const mission = missions[gameState.currentMission]

  // 점수 추가
  const points = 20 + gameState.currentMission * 10
  addScore(points)

  // 전구 켜기
  checkAndUpdateBulbs()

  // 성공 피드백
  showFeedback(true, mission.successMessage, '')

  // 다음 미션으로
  setTimeout(() => {
    gameState.currentMission++
    if (gameState.currentMission >= missions.length) {
      showResult()
    } else {
      clearCircuit()
      loadMission()
      closeFeedback()
    }
  }, 2500)
}

// 미션 로드
function loadMission() {
  const mission = missions[gameState.currentMission]

  elements.currentMission.textContent = mission.id
  elements.missionTitle.textContent = mission.title
  elements.missionDescription.textContent = mission.description
  elements.missionProgress.textContent = gameState.currentMission + 1

  clearCircuit()
}

// 피드백 표시
function showFeedback(success, message, hint) {
  const overlay = document.createElement('div')
  overlay.className = 'feedback-overlay'
  overlay.id = 'feedback-overlay'
  overlay.innerHTML = `
    <div class="feedback-content">
      <div class="feedback-icon">${success ? '&#128161;' : '&#129300;'}</div>
      <h3 class="feedback-title">${success ? '성공!' : '다시 시도해보세요'}</h3>
      <p class="feedback-message">${message}</p>
      ${!success && hint ? `<p class="feedback-hint" style="color: #ffd700; font-size: 14px;">힌트: ${hint}</p>` : ''}
      ${!success ? `<div class="feedback-buttons">
        <button class="btn btn-primary" onclick="closeFeedback()">확인</button>
      </div>` : ''}
    </div>
  `
  document.body.appendChild(overlay)
}

// 피드백 닫기
function closeFeedback() {
  const overlay = document.getElementById('feedback-overlay')
  if (overlay) overlay.remove()
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

// 결과 화면
function showResult() {
  closeFeedback()

  const overlay = document.createElement('div')
  overlay.className = 'result-overlay'
  overlay.innerHTML = `
    <div class="result-content">
      <div class="result-icon">&#127881;</div>
      <h2 class="result-title">모든 미션 완료!</h2>
      <div class="result-score">${gameState.score}점</div>
      <p class="result-message">전기회로의 기초를 모두 배웠어요!<br>이제 전기가 어떻게 흐르는지 알게 되었습니다.</p>
      <div class="result-buttons">
        <button class="btn btn-secondary" onclick="resetGame()">다시 시작</button>
        <button class="btn btn-primary" onclick="closeResult()">확인</button>
      </div>
    </div>
  `
  document.body.appendChild(overlay)

  // 컨페티 효과
  showSuccessEffect()
}

// 결과 화면 닫기
function closeResult() {
  const overlay = document.querySelector('.result-overlay')
  if (overlay) overlay.remove()
}

// 게임 리셋
function resetGame() {
  closeResult()
  gameState.score = 0
  gameState.currentMission = 0
  elements.scoreValue.textContent = 0
  clearCircuit()
  loadMission()
}

// 성공 효과
function showSuccessEffect() {
  const colors = ['#e50914', '#ffd700', '#28a745', '#17a2b8', '#6c5ce7']
  for (let i = 0; i < 30; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div')
      confetti.style.cssText = `
        position: fixed;
        top: -20px;
        left: ${Math.random() * 100}vw;
        width: 10px;
        height: 10px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        animation: confettiFall ${2 + Math.random() * 2}s linear forwards;
        z-index: 2000;
      `
      document.body.appendChild(confetti)
      setTimeout(() => confetti.remove(), 4000)
    }, i * 50)
  }

  if (!document.getElementById('confetti-style')) {
    const style = document.createElement('style')
    style.id = 'confetti-style'
    style.textContent = `
      @keyframes confettiFall {
        to {
          top: 100vh;
          transform: rotate(720deg);
        }
      }
    `
    document.head.appendChild(style)
  }
}

// 게임 시작
init()
