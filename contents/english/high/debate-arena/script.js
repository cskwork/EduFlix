/**
 * Debate Arena - Interactive Story Logic
 * High School Grade 1 Persuasive Writing and Debate
 */

// Debate topics data
const debates = [
  {
    id: 1,
    topic: 'Social Media',
    statement: 'Social media does more good than harm to society.',
    proEvidence: [
      { text: 'Social media connects people across the world and helps maintain long-distance relationships.', strength: 'strong' },
      { text: 'It provides a platform for small businesses to reach customers without expensive advertising.', strength: 'strong' },
      { text: 'Social media enables rapid sharing of important news and emergency information.', strength: 'medium' },
      { text: 'People spend a lot of time on social media because they enjoy it.', strength: 'weak' }
    ],
    conEvidence: [
      { text: 'Studies show increased social media use correlates with higher rates of anxiety and depression.', strength: 'strong' },
      { text: 'Social media platforms spread misinformation faster than fact-checking can correct it.', strength: 'strong' },
      { text: 'It creates addictive behaviors through designed engagement features.', strength: 'medium' },
      { text: 'Some people waste time on social media.', strength: 'weak' }
    ],
    counterArguments: {
      pro: 'While social media has benefits, critics argue it damages mental health and spreads fake news.',
      con: 'Supporters claim social media connects people, but this ignores the superficial nature of online relationships.'
    },
    rebuttals: {
      pro: [
        { text: 'The mental health concerns can be addressed through digital wellness features and education.', correct: true },
        { text: 'Everything has some negative effects, so we should not worry about it.', correct: false },
        { text: 'Research shows that meaningful online connections can improve well-being when used mindfully.', correct: true }
      ],
      con: [
        { text: 'Face-to-face communication has proven benefits that online interaction cannot replicate.', correct: true },
        { text: 'Nobody actually makes real friends online anyway.', correct: false },
        { text: 'Studies indicate that heavy social media users report feeling more isolated despite having more online "friends".', correct: true }
      ]
    }
  },
  {
    id: 2,
    topic: 'Technology in Education',
    statement: 'Schools should replace textbooks with tablets and digital resources.',
    proEvidence: [
      { text: 'Digital resources can be updated instantly with the latest information and research.', strength: 'strong' },
      { text: 'Interactive digital content has been shown to increase student engagement and retention.', strength: 'strong' },
      { text: 'Tablets are lighter than carrying multiple heavy textbooks.', strength: 'medium' },
      { text: 'Most kids already use tablets at home.', strength: 'weak' }
    ],
    conEvidence: [
      { text: 'Research indicates that reading from paper leads to better comprehension and memory retention.', strength: 'strong' },
      { text: 'Screen time has been linked to eye strain, sleep problems, and reduced attention spans.', strength: 'strong' },
      { text: 'Not all families can afford tablets or reliable internet access at home.', strength: 'medium' },
      { text: 'Textbooks have been used successfully for centuries.', strength: 'weak' }
    ],
    counterArguments: {
      pro: 'Critics argue that screens harm learning, but this ignores the evolving nature of digital literacy skills.',
      con: 'While digital tools seem modern, the rush to adopt them ignores proven benefits of traditional learning materials.'
    },
    rebuttals: {
      pro: [
        { text: 'Blue light filters and scheduled breaks can mitigate screen-related health concerns.', correct: true },
        { text: 'Students should just get used to screens since the future is digital.', correct: false },
        { text: 'A blended approach using both digital and print materials can maximize learning benefits.', correct: true }
      ],
      con: [
        { text: 'Schools should invest in proven methods rather than unproven technology experiments.', correct: true },
        { text: 'All technology in classrooms is bad.', correct: false },
        { text: 'The digital divide means technology-focused education increases inequality.', correct: true }
      ]
    }
  },
  {
    id: 3,
    topic: 'Climate Action',
    statement: 'Individual actions are more important than government policies for addressing climate change.',
    proEvidence: [
      { text: 'Consumer choices drive market demand, pushing companies toward sustainable practices.', strength: 'strong' },
      { text: 'Collective individual actions create cultural shifts that make policy change possible.', strength: 'strong' },
      { text: 'Individuals can start making changes immediately without waiting for slow political processes.', strength: 'medium' },
      { text: 'People should take personal responsibility for their carbon footprint.', strength: 'weak' }
    ],
    conEvidence: [
      { text: 'Just 100 companies are responsible for 71% of global emissions, requiring regulatory solutions.', strength: 'strong' },
      { text: 'Government policies like carbon taxes create systemic change that individual actions cannot achieve alone.', strength: 'strong' },
      { text: 'Infrastructure changes (public transit, renewable energy grids) require government investment.', strength: 'medium' },
      { text: 'Most people will not change their behavior without laws requiring it.', strength: 'weak' }
    ],
    counterArguments: {
      pro: 'While individual action matters, critics note that structural problems require structural solutions beyond personal choice.',
      con: 'Supporters of individual action ignore that major polluters will not change without legal requirements.'
    },
    rebuttals: {
      pro: [
        { text: 'Individual actions build political will and create demand for stronger policies.', correct: true },
        { text: 'If everyone just recycled more, climate change would be solved.', correct: false },
        { text: 'Consumer pressure has already forced many companies to adopt sustainable practices.', correct: true }
      ],
      con: [
        { text: 'Historical evidence shows major environmental improvements came from regulation, not voluntary action.', correct: true },
        { text: 'Individuals are completely powerless against corporations.', correct: false },
        { text: 'International agreements and national policies are necessary to coordinate global climate action.', correct: true }
      ]
    }
  }
]

// Game state
const gameState = {
  score: 0,
  currentDebate: 0,
  selectedSide: null,
  selectedEvidence: [],
  phase: 'select', // select, evidence, counter, rebuttal, result
  argumentScore: 0,
  debatesCompleted: 0
}

// DOM elements
let elements = {}

// Initialize
function init() {
  elements = {
    scoreValue: document.getElementById('score-value'),
    currentRound: document.getElementById('current-round'),
    roundTopic: document.getElementById('round-topic'),
    speakerPro: document.getElementById('speaker-pro'),
    speakerCon: document.getElementById('speaker-con'),
    topicText: document.getElementById('topic-text'),
    topicInstruction: document.getElementById('topic-instruction'),
    sideSelection: document.getElementById('side-selection'),
    argumentBuilder: document.getElementById('argument-builder'),
    evidenceOptions: document.getElementById('evidence-options'),
    argumentList: document.getElementById('argument-list'),
    opponentResponse: document.getElementById('opponent-response'),
    opponentSpeech: document.getElementById('opponent-speech'),
    rebuttalSection: document.getElementById('rebuttal-section'),
    rebuttalOptions: document.getElementById('rebuttal-options'),
    debateResult: document.getElementById('debate-result'),
    resultVerdict: document.getElementById('result-verdict'),
    verdictIcon: document.getElementById('verdict-icon'),
    verdictText: document.getElementById('verdict-text'),
    resultFeedback: document.getElementById('result-feedback'),
    debateProgress: document.getElementById('debate-progress'),
    totalDebates: document.getElementById('total-debates'),
    btnReset: document.getElementById('btn-reset'),
    btnContinue: document.getElementById('btn-continue')
  }

  elements.totalDebates.textContent = debates.length
  setupEventListeners()
  loadDebate()
}

// Setup event listeners
function setupEventListeners() {
  // Side selection
  elements.sideSelection.addEventListener('click', (e) => {
    const sideBtn = e.target.closest('.side-btn')
    if (sideBtn) {
      selectSide(sideBtn.dataset.side)
    }
  })

  // Reset
  elements.btnReset.addEventListener('click', resetDebate)

  // Continue
  elements.btnContinue.addEventListener('click', handleContinue)
}

// Load debate
function loadDebate() {
  const debate = debates[gameState.currentDebate]

  gameState.selectedSide = null
  gameState.selectedEvidence = []
  gameState.phase = 'select'
  gameState.argumentScore = 0

  // Update UI
  elements.currentRound.textContent = debate.id
  elements.roundTopic.textContent = debate.topic
  elements.topicText.textContent = debate.statement
  elements.topicInstruction.textContent = 'Choose a side and build your argument!'
  elements.debateProgress.textContent = gameState.currentDebate + 1

  // Reset visibility
  elements.sideSelection.classList.remove('hidden')
  elements.argumentBuilder.classList.add('hidden')
  elements.opponentResponse.classList.add('hidden')
  elements.rebuttalSection.classList.add('hidden')
  elements.debateResult.classList.add('hidden')

  // Reset speakers
  elements.speakerPro.classList.remove('selected', 'active')
  elements.speakerCon.classList.remove('selected', 'active')

  // Reset side buttons
  document.querySelectorAll('.side-btn').forEach(btn => btn.classList.remove('selected'))

  elements.btnContinue.disabled = true
}

// Select side
function selectSide(side) {
  gameState.selectedSide = side
  gameState.phase = 'evidence'

  // Update UI
  document.querySelectorAll('.side-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.side === side)
  })

  if (side === 'pro') {
    elements.speakerPro.classList.add('selected')
  } else {
    elements.speakerCon.classList.add('selected')
  }

  // Show evidence selection after delay
  setTimeout(() => {
    elements.sideSelection.classList.add('hidden')
    elements.topicInstruction.textContent = 'Select 2-3 pieces of evidence to support your argument.'
    showEvidenceSelection()
  }, 500)
}

// Show evidence selection
function showEvidenceSelection() {
  const debate = debates[gameState.currentDebate]
  const evidence = gameState.selectedSide === 'pro' ? debate.proEvidence : debate.conEvidence

  elements.evidenceOptions.innerHTML = ''
  elements.argumentList.innerHTML = ''
  gameState.selectedEvidence = []

  evidence.forEach((item, index) => {
    const btn = document.createElement('button')
    btn.className = 'evidence-btn'
    btn.dataset.index = index
    btn.dataset.strength = item.strength
    btn.textContent = item.text
    btn.addEventListener('click', () => selectEvidence(btn, item))
    elements.evidenceOptions.appendChild(btn)
  })

  elements.argumentBuilder.classList.remove('hidden')
  elements.argumentBuilder.classList.add('fade-in')
  elements.btnContinue.disabled = true
}

// Select evidence
function selectEvidence(button, evidence) {
  if (button.classList.contains('selected')) {
    // Deselect
    button.classList.remove('selected')
    gameState.selectedEvidence = gameState.selectedEvidence.filter(e => e.text !== evidence.text)
  } else if (gameState.selectedEvidence.length < 3) {
    // Select
    button.classList.add('selected')
    gameState.selectedEvidence.push(evidence)
  }

  // Update argument list
  elements.argumentList.innerHTML = ''
  gameState.selectedEvidence.forEach(e => {
    const li = document.createElement('li')
    li.textContent = e.text.slice(0, 60) + (e.text.length > 60 ? '...' : '')
    elements.argumentList.appendChild(li)
  })

  // Enable continue if enough evidence selected
  elements.btnContinue.disabled = gameState.selectedEvidence.length < 2
}

// Handle continue
function handleContinue() {
  switch (gameState.phase) {
    case 'evidence':
      showOpponentResponse()
      break
    case 'counter':
      showRebuttalOptions()
      break
    case 'rebuttal':
      showResult()
      break
    case 'result':
      nextDebate()
      break
  }
}

// Show opponent response
function showOpponentResponse() {
  gameState.phase = 'counter'
  const debate = debates[gameState.currentDebate]

  // Calculate evidence score
  let strengthScore = 0
  gameState.selectedEvidence.forEach(e => {
    if (e.strength === 'strong') strengthScore += 30
    else if (e.strength === 'medium') strengthScore += 20
    else strengthScore += 10
  })
  gameState.argumentScore = strengthScore

  // Show counter-argument
  const counter = gameState.selectedSide === 'pro' ? debate.counterArguments.pro : debate.counterArguments.con
  elements.opponentSpeech.textContent = counter
  elements.opponentResponse.classList.remove('hidden')
  elements.opponentResponse.classList.add('slide-in')

  elements.topicInstruction.textContent = 'Your opponent has responded. Prepare your rebuttal!'
  elements.btnContinue.disabled = false
}

// Show rebuttal options
function showRebuttalOptions() {
  gameState.phase = 'rebuttal'
  const debate = debates[gameState.currentDebate]
  const rebuttals = debate.rebuttals[gameState.selectedSide]

  elements.rebuttalOptions.innerHTML = ''
  const shuffled = shuffleArray([...rebuttals])

  shuffled.forEach((item, index) => {
    const btn = document.createElement('button')
    btn.className = 'rebuttal-btn'
    btn.dataset.correct = item.correct
    btn.textContent = item.text
    btn.addEventListener('click', () => selectRebuttal(btn, item))
    elements.rebuttalOptions.appendChild(btn)
  })

  elements.rebuttalSection.classList.remove('hidden')
  elements.rebuttalSection.classList.add('fade-in')
  elements.topicInstruction.textContent = 'Choose the best response to counter their argument.'
  elements.btnContinue.disabled = true
}

// Select rebuttal
function selectRebuttal(button, rebuttal) {
  // Disable all buttons
  document.querySelectorAll('.rebuttal-btn').forEach(btn => {
    btn.disabled = true
    if (btn.dataset.correct === 'true') {
      btn.classList.add('correct')
    }
  })

  if (rebuttal.correct) {
    button.classList.add('correct')
    gameState.argumentScore += 30
    addScore(20)
  } else {
    button.classList.add('incorrect')
  }

  elements.btnContinue.disabled = false
}

// Shuffle array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

// Show result
function showResult() {
  gameState.phase = 'result'
  gameState.debatesCompleted++

  const won = gameState.argumentScore >= 60

  elements.debateResult.classList.remove('hidden')
  elements.debateResult.classList.add('fade-in')

  elements.resultVerdict.className = 'result-verdict ' + (won ? 'win' : 'lose')
  elements.verdictIcon.innerHTML = won ? '&#127942;' : '&#128567;'
  elements.verdictText.textContent = won ? 'You Won!' : 'You Lost'

  let feedback
  if (gameState.argumentScore >= 80) {
    feedback = 'Excellent! Your arguments were exceptionally well-structured and persuasive. You used strong evidence and responded effectively to counter-arguments.'
    addScore(30)
  } else if (gameState.argumentScore >= 60) {
    feedback = 'Good job! Your arguments were solid and you made some valid points. Try to use stronger evidence next time.'
    addScore(20)
  } else {
    feedback = 'Keep practicing! Focus on selecting strong evidence and constructing logical rebuttals. Every debate helps you improve.'
    addScore(10)
  }

  elements.resultFeedback.textContent = feedback

  // Hide other sections
  elements.argumentBuilder.classList.add('hidden')
  elements.opponentResponse.classList.add('hidden')
  elements.rebuttalSection.classList.add('hidden')

  elements.btnContinue.textContent = gameState.currentDebate < debates.length - 1 ? 'Next Debate' : 'See Final Results'
  elements.btnContinue.disabled = false

  if (won) {
    showSuccessEffect()
  }
}

// Next debate
function nextDebate() {
  gameState.currentDebate++

  if (gameState.currentDebate >= debates.length) {
    showFinalResults()
  } else {
    elements.btnContinue.textContent = 'Continue'
    loadDebate()
  }
}

// Show final results
function showFinalResults() {
  const overlay = document.createElement('div')
  overlay.className = 'result-overlay'
  overlay.innerHTML = `
    <div class="result-content">
      <div class="result-icon">&#127942;</div>
      <h2 class="result-title">All Debates Complete!</h2>
      <div class="result-score">${gameState.score} pts</div>
      <div class="result-stats">
        You completed all ${debates.length} debates!
      </div>
      <p class="result-message">
        You've practiced constructing arguments, analyzing evidence,
        and responding to counter-arguments. These skills are essential
        for persuasive writing and critical thinking!
      </p>
      <div class="result-buttons">
        <button class="btn btn-secondary" onclick="closeResultAndReset()">Play Again</button>
        <button class="btn btn-primary" onclick="closeResult()">Done</button>
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
      animation: fadeIn 0.3s ease;
    }
    .result-content {
      text-align: center;
      padding: 40px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      max-width: 500px;
    }
    .result-icon { font-size: 80px; margin-bottom: 20px; }
    .result-title { font-size: 28px; font-weight: 700; margin-bottom: 16px; color: #fff; }
    .result-score { font-size: 48px; font-weight: 700; color: #ffd700; margin-bottom: 8px; }
    .result-stats { font-size: 16px; color: rgba(255, 255, 255, 0.7); margin-bottom: 16px; }
    .result-message { font-size: 14px; color: rgba(255, 255, 255, 0.8); margin-bottom: 24px; line-height: 1.6; }
  `

  if (!document.getElementById('final-result-style')) {
    const styleEl = document.createElement('style')
    styleEl.id = 'final-result-style'
    styleEl.textContent = style
    document.head.appendChild(styleEl)
  }

  document.body.appendChild(overlay)
  showSuccessEffect()
}

// Close result
function closeResult() {
  const overlay = document.querySelector('.result-overlay')
  if (overlay) overlay.remove()
}

// Close result and reset
function closeResultAndReset() {
  closeResult()
  resetGame()
}

// Reset debate
function resetDebate() {
  loadDebate()
}

// Reset game
function resetGame() {
  gameState.score = 0
  gameState.currentDebate = 0
  gameState.debatesCompleted = 0
  elements.scoreValue.textContent = 0
  loadDebate()
}

// Add score
function addScore(points) {
  gameState.score += points
  elements.scoreValue.textContent = gameState.score
  showScorePopup(points)
}

// Score popup
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

// Success effect
function showSuccessEffect() {
  const colors = ['#e50914', '#ffd700', '#28a745', '#17a2b8', '#6c5ce7']
  for (let i = 0; i < 20; i++) {
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

// Start game
init()
