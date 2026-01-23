/**
 * 방정식 퍼즐 - 퀴즈 로직
 * 중학교 2학년 대상 방정식 학습 퀴즈
 */

// 문제 데이터
const problems = [
  // 레벨 1: 간단한 일차방정식 (ax = b)
  {
    level: 1,
    type: '일차방정식',
    equation: '2x = 6',
    leftSide: '2x',
    rightSide: '6',
    answer: 3,
    hint: '양변을 2로 나누어 보세요: x = 6 ÷ 2'
  },
  {
    level: 1,
    type: '일차방정식',
    equation: '3x = 12',
    leftSide: '3x',
    rightSide: '12',
    answer: 4,
    hint: '양변을 3으로 나누어 보세요: x = 12 ÷ 3'
  },
  // 레벨 2: ax + b = c 형태
  {
    level: 2,
    type: '일차방정식',
    equation: '2x + 3 = 7',
    leftSide: '2x + 3',
    rightSide: '7',
    answer: 2,
    hint: '먼저 양변에서 3을 빼세요: 2x = 4, 그다음 2로 나누세요'
  },
  {
    level: 2,
    type: '일차방정식',
    equation: '4x - 2 = 10',
    leftSide: '4x - 2',
    rightSide: '10',
    answer: 3,
    hint: '먼저 양변에 2를 더하세요: 4x = 12, 그다음 4로 나누세요'
  },
  {
    level: 2,
    type: '일차방정식',
    equation: '5x + 1 = 16',
    leftSide: '5x + 1',
    rightSide: '16',
    answer: 3,
    hint: '먼저 양변에서 1을 빼세요: 5x = 15, 그다음 5로 나누세요'
  },
  // 레벨 3: ax + b = cx + d 형태
  {
    level: 3,
    type: '일차방정식',
    equation: '3x + 2 = x + 8',
    leftSide: '3x + 2',
    rightSide: 'x + 8',
    answer: 3,
    hint: 'x항을 왼쪽으로, 상수항을 오른쪽으로: 3x - x = 8 - 2, 즉 2x = 6'
  },
  {
    level: 3,
    type: '일차방정식',
    equation: '5x - 3 = 2x + 9',
    leftSide: '5x - 3',
    rightSide: '2x + 9',
    answer: 4,
    hint: '5x - 2x = 9 + 3, 즉 3x = 12'
  },
  // 레벨 4: 음수 답이 나오는 경우
  {
    level: 4,
    type: '일차방정식',
    equation: '2x + 10 = 4',
    leftSide: '2x + 10',
    rightSide: '4',
    answer: -3,
    hint: '2x = 4 - 10 = -6, x = -3 (음수도 답이 될 수 있어요!)'
  },
  {
    level: 4,
    type: '일차방정식',
    equation: '3x + 5 = -1',
    leftSide: '3x + 5',
    rightSide: '-1',
    answer: -2,
    hint: '3x = -1 - 5 = -6, x = -2'
  },
  // 레벨 5: 분수 계수
  {
    level: 5,
    type: '일차방정식',
    equation: '2x = 5',
    leftSide: '2x',
    rightSide: '5',
    answer: 2.5,
    hint: 'x = 5 ÷ 2 = 2.5 (소수도 답이 될 수 있어요!)'
  }
]

// 게임 상태
const gameState = {
  score: 0,
  currentProblem: 0,
  totalProblems: 10,
  correctCount: 0,
  problems: [],
  answered: false
}

// DOM 요소
let elements = {}

// 초기화
function init() {
  elements = {
    scoreValue: document.getElementById('score-value'),
    currentLevel: document.getElementById('current-level'),
    levelType: document.getElementById('level-type'),
    equation: document.getElementById('equation'),
    equationHint: document.getElementById('equation-hint'),
    plateLeft: document.getElementById('plate-left'),
    plateRight: document.getElementById('plate-right'),
    balanceArm: document.querySelector('.balance-arm'),
    answerInput: document.getElementById('answer-input'),
    btnSubmit: document.getElementById('btn-submit'),
    btnHint: document.getElementById('btn-hint'),
    hintSection: document.getElementById('hint-section'),
    hintContent: document.getElementById('hint-content'),
    feedback: document.getElementById('feedback'),
    progressBar: document.getElementById('progress-bar'),
    questionNum: document.getElementById('question-num'),
    totalQuestions: document.getElementById('total-questions'),
    btnReset: document.getElementById('btn-reset'),
    btnNext: document.getElementById('btn-next')
  }

  generateProblems()
  setupEventListeners()
  loadProblem()
}

// 문제 생성 (섞기)
function generateProblems() {
  gameState.problems = shuffleArray([...problems]).slice(0, gameState.totalProblems)
  elements.totalQuestions.textContent = gameState.totalProblems
}

// 배열 섞기
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

// 이벤트 리스너 설정
function setupEventListeners() {
  // 제출 버튼
  elements.btnSubmit.addEventListener('click', submitAnswer)

  // Enter 키로 제출
  elements.answerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      submitAnswer()
    }
  })

  // 힌트 버튼
  elements.btnHint.addEventListener('click', showHint)

  // 다시 시작
  elements.btnReset.addEventListener('click', resetGame)

  // 다음 문제
  elements.btnNext.addEventListener('click', nextProblem)
}

// 문제 로드
function loadProblem() {
  const problem = gameState.problems[gameState.currentProblem]
  if (!problem) {
    showResult()
    return
  }

  gameState.answered = false

  // UI 업데이트
  elements.currentLevel.textContent = problem.level
  elements.levelType.textContent = problem.type
  elements.equation.textContent = problem.equation
  elements.equationHint.textContent = 'x의 값을 구하세요'
  elements.plateLeft.querySelector('.plate-content').textContent = problem.leftSide
  elements.plateRight.querySelector('.plate-content').textContent = problem.rightSide

  // 초기화
  elements.answerInput.value = ''
  elements.answerInput.classList.remove('correct', 'incorrect')
  elements.answerInput.disabled = false
  elements.answerInput.focus()
  elements.feedback.classList.add('hidden')
  elements.hintContent.classList.add('hidden')
  elements.hintSection.classList.remove('hidden')
  elements.btnNext.disabled = true

  // 저울 균형
  elements.balanceArm.classList.remove('tilted-left', 'tilted-right')
  elements.plateLeft.classList.remove('correct')
  elements.plateRight.classList.remove('correct')

  // 진행률 업데이트
  updateProgress()
}

// 정답 제출
function submitAnswer() {
  if (gameState.answered) return

  const userAnswer = parseFloat(elements.answerInput.value)
  const problem = gameState.problems[gameState.currentProblem]

  if (isNaN(userAnswer)) {
    elements.answerInput.classList.add('incorrect')
    setTimeout(() => elements.answerInput.classList.remove('incorrect'), 300)
    return
  }

  gameState.answered = true
  elements.answerInput.disabled = true

  // 소수점 비교 (0.01 오차 허용)
  const isCorrect = Math.abs(userAnswer - problem.answer) < 0.01

  if (isCorrect) {
    handleCorrectAnswer()
  } else {
    handleIncorrectAnswer(problem.answer)
  }

  elements.btnNext.disabled = false
  elements.hintSection.classList.add('hidden')

  // 마지막 문제인지 확인
  if (gameState.currentProblem >= gameState.totalProblems - 1) {
    elements.btnNext.textContent = '결과 보기'
  }
}

// 정답 처리
function handleCorrectAnswer() {
  gameState.correctCount++

  // 점수 계산 (레벨에 따라 차등)
  const problem = gameState.problems[gameState.currentProblem]
  const points = 10 + (problem.level - 1) * 5
  addScore(points)

  // UI 피드백
  elements.answerInput.classList.add('correct')
  elements.feedback.textContent = '정답입니다!'
  elements.feedback.className = 'feedback correct'
  elements.feedback.classList.remove('hidden')

  // 저울 균형
  elements.plateLeft.classList.add('correct')
  elements.plateRight.classList.add('correct')

  // 효과
  showSuccessEffect()
}

// 오답 처리
function handleIncorrectAnswer(correctAnswer) {
  elements.answerInput.classList.add('incorrect')
  elements.feedback.textContent = `틀렸습니다. 정답은 ${correctAnswer}입니다.`
  elements.feedback.className = 'feedback incorrect'
  elements.feedback.classList.remove('hidden')

  // 저울 기울기
  const userAnswer = parseFloat(elements.answerInput.value)
  if (userAnswer > correctAnswer) {
    elements.balanceArm.classList.add('tilted-left')
  } else {
    elements.balanceArm.classList.add('tilted-right')
  }
}

// 힌트 보기
function showHint() {
  const problem = gameState.problems[gameState.currentProblem]
  elements.hintContent.textContent = problem.hint
  elements.hintContent.classList.remove('hidden')
  elements.btnHint.style.display = 'none'
}

// 다음 문제
function nextProblem() {
  gameState.currentProblem++

  if (gameState.currentProblem >= gameState.totalProblems) {
    showResult()
  } else {
    elements.btnNext.textContent = '다음 문제'
    elements.btnHint.style.display = 'inline-block'
    loadProblem()
  }
}

// 진행률 업데이트
function updateProgress() {
  const progress = ((gameState.currentProblem + 1) / gameState.totalProblems) * 100
  elements.progressBar.style.setProperty('--progress', `${progress}%`)
  elements.questionNum.textContent = gameState.currentProblem + 1
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
  const colors = ['#e50914', '#ffd700', '#28a745', '#17a2b8', '#6c5ce7']
  for (let i = 0; i < 15; i++) {
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

// 결과 화면
function showResult() {
  const percentage = Math.round((gameState.correctCount / gameState.totalProblems) * 100)
  let message, icon

  if (percentage >= 90) {
    message = '완벽해요! 수학 천재!'
    icon = '&#127881;'
  } else if (percentage >= 70) {
    message = '잘했어요! 조금만 더 연습하면 완벽해요!'
    icon = '&#128079;'
  } else if (percentage >= 50) {
    message = '괜찮아요! 다시 도전해 보세요!'
    icon = '&#128170;'
  } else {
    message = '더 열심히 연습하면 실력이 늘어요!'
    icon = '&#128218;'
  }

  const overlay = document.createElement('div')
  overlay.className = 'result-overlay'
  overlay.innerHTML = `
    <div class="result-content">
      <div class="result-icon">${icon}</div>
      <h2 class="result-title">퀴즈 완료!</h2>
      <div class="result-score">${gameState.score}점</div>
      <div class="result-stats">${gameState.correctCount}/${gameState.totalProblems} 정답 (${percentage}%)</div>
      <p class="result-message">${message}</p>
      <div class="result-buttons">
        <button class="btn btn-secondary" onclick="closeResultAndReset()">다시 시작</button>
        <button class="btn btn-primary" onclick="closeResult()">확인</button>
      </div>
    </div>
  `
  document.body.appendChild(overlay)

  if (percentage >= 70) {
    showSuccessEffect()
  }
}

// 결과 화면 닫기
function closeResult() {
  const overlay = document.querySelector('.result-overlay')
  if (overlay) overlay.remove()
}

// 결과 닫고 리셋
function closeResultAndReset() {
  closeResult()
  resetGame()
}

// 게임 리셋
function resetGame() {
  gameState.score = 0
  gameState.currentProblem = 0
  gameState.correctCount = 0
  gameState.answered = false

  elements.scoreValue.textContent = 0
  elements.btnNext.textContent = '다음 문제'
  elements.btnHint.style.display = 'inline-block'

  generateProblems()
  loadProblem()
}

// 게임 시작
init()
