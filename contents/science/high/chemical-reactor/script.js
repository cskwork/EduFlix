/**
 * 화학 반응 시뮬레이터 - 시뮬레이션 로직
 * 고등학교 1학년 대상 화학 반응 학습
 */

// 실험 데이터
const experiments = {
  combustion: {
    id: 1,
    name: '메탄의 연소',
    type: '연소 반응',
    typeColor: '#ff6b6b',
    description: '메탄(CH4)이 산소(O2)와 반응하여 이산화탄소(CO2)와 물(H2O)을 생성합니다.',
    reactants: ['CH<sub>4</sub>', '2O<sub>2</sub>'],
    products: ['CO<sub>2</sub>', '2H<sub>2</sub>O'],
    reactionType: '발열 반응',
    energy: '열 방출',
    liquidColorLeft: '#ff6b6b',
    liquidColorRight: '#4ecdc4',
    balanceChallenge: {
      equation: 'C₃H₈ + O₂ → CO₂ + H₂O',
      molecules: ['C<sub>3</sub>H<sub>8</sub>', 'O<sub>2</sub>', 'CO<sub>2</sub>', 'H<sub>2</sub>O'],
      correctCoefs: [1, 5, 3, 4]
    }
  },
  neutralization: {
    id: 2,
    name: '산-염기 중화',
    type: '중화 반응',
    typeColor: '#4ecdc4',
    description: '염산(HCl)과 수산화나트륨(NaOH)이 반응하여 물(H2O)과 염화나트륨(NaCl)을 생성합니다.',
    reactants: ['HCl', 'NaOH'],
    products: ['NaCl', 'H<sub>2</sub>O'],
    reactionType: '발열 반응',
    energy: '열 방출',
    liquidColorLeft: '#ff6b9d',
    liquidColorRight: '#45aaf2',
    balanceChallenge: {
      equation: 'H₂SO₄ + NaOH → Na₂SO₄ + H₂O',
      molecules: ['H<sub>2</sub>SO<sub>4</sub>', 'NaOH', 'Na<sub>2</sub>SO<sub>4</sub>', 'H<sub>2</sub>O'],
      correctCoefs: [1, 2, 1, 2]
    }
  },
  decomposition: {
    id: 3,
    name: '물의 전기분해',
    type: '분해 반응',
    typeColor: '#ffd93d',
    description: '물(H2O)에 전기 에너지를 가하면 수소(H2)와 산소(O2)로 분해됩니다.',
    reactants: ['2H<sub>2</sub>O'],
    products: ['2H<sub>2</sub>', 'O<sub>2</sub>'],
    reactionType: '흡열 반응',
    energy: '에너지 흡수',
    liquidColorLeft: '#45aaf2',
    liquidColorRight: '#a0d8ef',
    balanceChallenge: {
      equation: 'KClO₃ → KCl + O₂',
      molecules: ['KClO<sub>3</sub>', 'KCl', 'O<sub>2</sub>'],
      correctCoefs: [2, 2, 3]
    }
  },
  synthesis: {
    id: 4,
    name: '암모니아 합성',
    type: '합성 반응',
    typeColor: '#6c5ce7',
    description: '질소(N2)와 수소(H2)가 고온 고압에서 반응하여 암모니아(NH3)를 생성합니다.',
    reactants: ['N<sub>2</sub>', '3H<sub>2</sub>'],
    products: ['2NH<sub>3</sub>'],
    reactionType: '발열 반응',
    energy: '열 방출',
    liquidColorLeft: '#a8e6cf',
    liquidColorRight: '#dcedc1',
    balanceChallenge: {
      equation: 'Fe + O₂ → Fe₂O₃',
      molecules: ['Fe', 'O<sub>2</sub>', 'Fe<sub>2</sub>O<sub>3</sub>'],
      correctCoefs: [4, 3, 2]
    }
  }
}

// 게임 상태
const gameState = {
  score: 0,
  currentExperiment: 'combustion',
  completedExperiments: new Set(),
  isReacting: false,
  challengeMode: false
}

// DOM 요소
let elements = {}

// 초기화
function init() {
  elements = {
    scoreValue: document.getElementById('score-value'),
    currentExperiment: document.getElementById('current-experiment'),
    reactionType: document.getElementById('reaction-type'),
    beakerLeft: document.getElementById('beaker-left'),
    beakerRight: document.getElementById('beaker-right'),
    liquidLeft: document.getElementById('liquid-left'),
    liquidRight: document.getElementById('liquid-right'),
    labelLeft: document.getElementById('label-left'),
    labelRight: document.getElementById('label-right'),
    reactants: document.getElementById('reactants'),
    products: document.getElementById('products'),
    reactionArrow: document.querySelector('.arrow'),
    btnReact: document.getElementById('btn-react'),
    reactionName: document.getElementById('reaction-name'),
    reactionDescription: document.getElementById('reaction-description'),
    propType: document.getElementById('prop-type'),
    propEnergy: document.getElementById('prop-energy'),
    balanceChallenge: document.getElementById('balance-challenge'),
    balanceEquation: document.getElementById('balance-equation'),
    btnCheckBalance: document.getElementById('btn-check-balance'),
    balanceFeedback: document.getElementById('balance-feedback'),
    experimentSelector: document.getElementById('experiment-selector'),
    completedCount: document.getElementById('completed-count'),
    totalExperiments: document.getElementById('total-experiments'),
    btnReset: document.getElementById('btn-reset'),
    btnChallenge: document.getElementById('btn-challenge')
  }

  elements.totalExperiments.textContent = Object.keys(experiments).length

  setupEventListeners()
  loadExperiment(gameState.currentExperiment)
}

// 이벤트 리스너 설정
function setupEventListeners() {
  // 실험 선택
  elements.experimentSelector.addEventListener('click', (e) => {
    if (e.target.classList.contains('exp-btn')) {
      selectExperiment(e.target.dataset.exp)
    }
  })

  // 반응 시작 버튼
  elements.btnReact.addEventListener('click', startReaction)

  // 초기화 버튼
  elements.btnReset.addEventListener('click', resetExperiment)

  // 균형 맞추기 버튼
  elements.btnChallenge.addEventListener('click', toggleChallenge)

  // 균형 확인 버튼
  elements.btnCheckBalance.addEventListener('click', checkBalance)
}

// 실험 선택
function selectExperiment(expKey) {
  gameState.currentExperiment = expKey
  gameState.isReacting = false

  document.querySelectorAll('.exp-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.exp === expKey)
  })

  loadExperiment(expKey)
  resetExperiment()
}

// 실험 로드
function loadExperiment(expKey) {
  const exp = experiments[expKey]

  elements.currentExperiment.textContent = exp.id
  elements.reactionType.textContent = exp.type
  elements.reactionType.style.background = `${exp.typeColor}4D`
  elements.reactionType.style.color = exp.typeColor

  elements.reactionName.textContent = exp.name
  elements.reactionDescription.textContent = exp.description
  elements.propType.textContent = exp.reactionType
  elements.propEnergy.textContent = exp.energy

  // 반응식 업데이트
  elements.reactants.innerHTML = exp.reactants.map((r, i) =>
    `<span class="molecule">${r}</span>${i < exp.reactants.length - 1 ? '<span class="plus">+</span>' : ''}`
  ).join('')

  elements.products.innerHTML = exp.products.map((p, i) =>
    `<span class="molecule">${p}</span>${i < exp.products.length - 1 ? '<span class="plus">+</span>' : ''}`
  ).join('')

  // 비커 색상
  elements.liquidLeft.style.background = `linear-gradient(to top, ${exp.liquidColorLeft} 0%, ${exp.liquidColorLeft}99 100%)`
  elements.liquidRight.style.background = `linear-gradient(to top, ${exp.liquidColorRight} 0%, ${exp.liquidColorRight}99 100%)`

  // 균형 맞추기 문제 로드
  loadBalanceChallenge(exp.balanceChallenge)
}

// 균형 맞추기 문제 로드
function loadBalanceChallenge(challenge) {
  const { molecules, correctCoefs } = challenge

  let html = ''
  molecules.forEach((mol, i) => {
    html += `<input type="number" class="coef-input" id="coef-${i}" value="1" min="1" max="9">`
    html += `<span class="molecule">${mol}</span>`

    if (i === 0 || (molecules.length === 4 && i === 1)) {
      if (i < molecules.length - 2 || (molecules.length === 3 && i === 0)) {
        html += '<span class="plus">+</span>'
      }
    }

    if ((molecules.length === 4 && i === 1) || (molecules.length === 3 && i === 0)) {
      html += '<span class="arrow">&#10145;</span>'
    } else if (molecules.length === 4 && i === 2) {
      html += '<span class="plus">+</span>'
    } else if (molecules.length === 3 && i === 1) {
      html += '<span class="plus">+</span>'
    }
  })

  elements.balanceEquation.innerHTML = html

  // 정답 저장
  elements.balanceEquation.dataset.correct = JSON.stringify(correctCoefs)
}

// 반응 시작
function startReaction() {
  if (gameState.isReacting) return

  gameState.isReacting = true
  elements.btnReact.disabled = true
  elements.reactionArrow.classList.add('active')
  elements.beakerLeft.classList.add('bubbling')

  // 버블 효과
  createBubbles(elements.beakerLeft)

  // 반응 애니메이션
  setTimeout(() => {
    elements.liquidLeft.style.height = '20%'
    elements.beakerRight.classList.add('filled')

    createBubbles(elements.beakerRight)
  }, 1000)

  setTimeout(() => {
    elements.beakerLeft.classList.remove('bubbling')
    elements.reactionArrow.classList.remove('active')

    // 완료 처리
    completeExperiment()
  }, 2500)
}

// 버블 생성
function createBubbles(beaker) {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const bubble = document.createElement('div')
      bubble.className = 'bubble'
      bubble.style.left = `${20 + Math.random() * 60}%`
      bubble.style.bottom = '30%'
      beaker.appendChild(bubble)

      setTimeout(() => bubble.remove(), 1000)
    }, i * 200)
  }
}

// 실험 완료
function completeExperiment() {
  const expKey = gameState.currentExperiment

  if (!gameState.completedExperiments.has(expKey)) {
    gameState.completedExperiments.add(expKey)
    addScore(15)
    updateCompletedCount()

    // 버튼에 완료 표시
    const btn = document.querySelector(`[data-exp="${expKey}"]`)
    if (btn) btn.classList.add('completed')
  }

  elements.btnReact.disabled = false

  // 모든 실험 완료 체크
  if (gameState.completedExperiments.size >= Object.keys(experiments).length) {
    showAllCompleteMessage()
  }
}

// 실험 초기화
function resetExperiment() {
  gameState.isReacting = false
  elements.btnReact.disabled = false
  elements.liquidLeft.style.height = '60%'
  elements.beakerRight.classList.remove('filled')
  elements.beakerLeft.classList.remove('bubbling')
  elements.reactionArrow.classList.remove('active')

  // 균형 맞추기 초기화
  document.querySelectorAll('.coef-input').forEach(input => {
    input.value = 1
    input.classList.remove('correct', 'incorrect')
  })
  elements.balanceFeedback.classList.add('hidden')
}

// 균형 맞추기 토글
function toggleChallenge() {
  gameState.challengeMode = !gameState.challengeMode
  elements.balanceChallenge.classList.toggle('hidden', !gameState.challengeMode)
  elements.btnChallenge.textContent = gameState.challengeMode ? '시뮬레이션' : '균형 맞추기'
}

// 균형 확인
function checkBalance() {
  const correctCoefs = JSON.parse(elements.balanceEquation.dataset.correct)
  const inputs = elements.balanceEquation.querySelectorAll('.coef-input')

  let allCorrect = true
  inputs.forEach((input, i) => {
    const value = parseInt(input.value)
    if (value === correctCoefs[i]) {
      input.classList.add('correct')
      input.classList.remove('incorrect')
    } else {
      input.classList.add('incorrect')
      input.classList.remove('correct')
      allCorrect = false
    }
  })

  if (allCorrect) {
    elements.balanceFeedback.textContent = '정답입니다! 반응식의 균형이 맞습니다.'
    elements.balanceFeedback.className = 'balance-feedback correct'
    addScore(20)
  } else {
    elements.balanceFeedback.textContent = '다시 확인해보세요. 양쪽의 원자 수가 같아야 합니다.'
    elements.balanceFeedback.className = 'balance-feedback incorrect'
  }

  elements.balanceFeedback.classList.remove('hidden')
}

// 완료 개수 업데이트
function updateCompletedCount() {
  elements.completedCount.textContent = gameState.completedExperiments.size
}

// 모든 실험 완료 메시지
function showAllCompleteMessage() {
  const overlay = document.createElement('div')
  overlay.className = 'result-overlay'
  overlay.innerHTML = `
    <div class="result-content">
      <div class="result-icon">&#127881;</div>
      <h2 class="result-title">모든 실험 완료!</h2>
      <div class="result-score">${gameState.score}점</div>
      <p class="result-message">화학 반응의 기초를 모두 배웠습니다!</p>
      <div class="result-buttons">
        <button class="btn btn-primary" onclick="this.closest('.result-overlay').remove()">확인</button>
      </div>
    </div>
  `

  const style = `
    .result-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .result-content {
      text-align: center;
      padding: 40px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .result-icon { font-size: 80px; margin-bottom: 20px; }
    .result-title { font-size: 32px; font-weight: 700; margin-bottom: 16px; color: #fff; }
    .result-score { font-size: 48px; font-weight: 700; color: #ffd700; margin-bottom: 16px; }
    .result-message { font-size: 18px; color: rgba(255, 255, 255, 0.8); margin-bottom: 24px; }
  `

  if (!document.getElementById('result-style')) {
    const styleEl = document.createElement('style')
    styleEl.id = 'result-style'
    styleEl.textContent = style
    document.head.appendChild(styleEl)
  }

  document.body.appendChild(overlay)
  showSuccessEffect()
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

// 성공 효과
function showSuccessEffect() {
  const colors = ['#ff6b6b', '#ffd700', '#4ecdc4', '#6c5ce7', '#ff6b9d']
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
