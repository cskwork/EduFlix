/**
 * Grammar Quest - Quiz Logic
 * Middle School Grade 2 English Grammar Quiz
 */

// Questions data
const questions = [
  // Level 1: Present Simple (Subject-Verb Agreement)
  {
    level: 1,
    topic: 'Present Simple',
    icon: '&#128218;',
    sentence: 'She ___ to school every day.',
    options: ['go', 'goes', 'going', 'went'],
    correct: 'goes',
    explanation: 'With third person singular subjects (he, she, it), we add -s or -es to the verb in present simple.'
  },
  {
    level: 1,
    topic: 'Present Simple',
    icon: '&#128218;',
    sentence: 'They ___ football on weekends.',
    options: ['plays', 'play', 'playing', 'played'],
    correct: 'play',
    explanation: 'With plural subjects (they, we, you), we use the base form of the verb without -s.'
  },
  // Level 2: Past Simple
  {
    level: 2,
    topic: 'Past Simple',
    icon: '&#9200;',
    sentence: 'I ___ a delicious pizza yesterday.',
    options: ['eat', 'eats', 'ate', 'eating'],
    correct: 'ate',
    explanation: 'For past simple, we use the past form of the verb. "Ate" is the past form of "eat".'
  },
  {
    level: 2,
    topic: 'Past Simple',
    icon: '&#9200;',
    sentence: 'She ___ to the park last Sunday.',
    options: ['go', 'goes', 'went', 'gone'],
    correct: 'went',
    explanation: '"Went" is the past simple form of "go". We use it for completed actions in the past.'
  },
  // Level 3: Articles
  {
    level: 3,
    topic: 'Articles',
    icon: '&#128209;',
    sentence: 'I saw ___ elephant at the zoo.',
    options: ['a', 'an', 'the', '-'],
    correct: 'an',
    explanation: 'We use "an" before words that start with a vowel sound. "Elephant" starts with "e".'
  },
  {
    level: 3,
    topic: 'Articles',
    icon: '&#128209;',
    sentence: 'Please pass me ___ salt.',
    options: ['a', 'an', 'the', '-'],
    correct: 'the',
    explanation: 'We use "the" when we talk about something specific that both speaker and listener know about.'
  },
  // Level 4: Future Tense
  {
    level: 4,
    topic: 'Future Tense',
    icon: '&#128302;',
    sentence: 'I ___ help you with your homework tomorrow.',
    options: ['will', 'am', 'was', 'have'],
    correct: 'will',
    explanation: '"Will" is used to express future actions or promises.'
  },
  {
    level: 4,
    topic: 'Future Tense',
    icon: '&#128302;',
    sentence: 'They ___ going to visit Paris next month.',
    options: ['is', 'are', 'will', 'was'],
    correct: 'are',
    explanation: '"Be going to" is another way to express future plans. "They" takes "are".'
  },
  // Level 5: Present Continuous
  {
    level: 5,
    topic: 'Present Continuous',
    icon: '&#127939;',
    sentence: 'Look! The baby ___ walking!',
    options: ['is', 'are', 'am', 'be'],
    correct: 'is',
    explanation: 'Present continuous uses "be + -ing". "Baby" is singular, so we use "is".'
  },
  {
    level: 5,
    topic: 'Present Continuous',
    icon: '&#127939;',
    sentence: 'We ___ studying English right now.',
    options: ['is', 'are', 'am', 'be'],
    correct: 'are',
    explanation: 'With "we", use "are" in present continuous: we are + verb-ing.'
  }
]

// Game state
const gameState = {
  score: 0,
  currentQuestion: 0,
  totalQuestions: 10,
  correctCount: 0,
  streak: 0,
  maxStreak: 0,
  answered: false,
  questions: []
}

// DOM elements
let elements = {}

// Initialize
function init() {
  elements = {
    scoreValue: document.getElementById('score-value'),
    currentLevel: document.getElementById('current-level'),
    levelTopic: document.getElementById('level-topic'),
    questIcon: document.getElementById('quest-icon'),
    questQuestion: document.getElementById('quest-question'),
    sentenceDisplay: document.getElementById('sentence-display'),
    blank: document.getElementById('blank'),
    optionsContainer: document.getElementById('options-container'),
    feedback: document.getElementById('feedback'),
    feedbackIcon: document.getElementById('feedback-icon'),
    feedbackText: document.getElementById('feedback-text'),
    feedbackExplanation: document.getElementById('feedback-explanation'),
    streakFlames: document.getElementById('streak-flames'),
    progressBar: document.getElementById('progress-bar'),
    questionNum: document.getElementById('question-num'),
    totalQuestions: document.getElementById('total-questions'),
    btnReset: document.getElementById('btn-reset'),
    btnNext: document.getElementById('btn-next')
  }

  generateQuestions()
  setupEventListeners()
  loadQuestion()
}

// Generate questions (shuffle and select)
function generateQuestions() {
  gameState.questions = shuffleArray([...questions]).slice(0, gameState.totalQuestions)
  elements.totalQuestions.textContent = gameState.totalQuestions
}

// Shuffle array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

// Setup event listeners
function setupEventListeners() {
  elements.optionsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('option-btn') && !gameState.answered) {
      selectOption(e.target)
    }
  })

  elements.btnReset.addEventListener('click', resetGame)
  elements.btnNext.addEventListener('click', nextQuestion)
}

// Load question
function loadQuestion() {
  const question = gameState.questions[gameState.currentQuestion]
  if (!question) {
    showResult()
    return
  }

  gameState.answered = false

  // Update UI
  elements.currentLevel.textContent = question.level
  elements.levelTopic.textContent = question.topic
  elements.questIcon.innerHTML = question.icon
  elements.questQuestion.textContent = 'Choose the correct word to complete the sentence:'

  // Update sentence with blank
  const sentenceParts = question.sentence.split('___')
  elements.sentenceDisplay.innerHTML = `${sentenceParts[0]}<span class="blank" id="blank">_____</span>${sentenceParts[1]}`

  // Update options
  const shuffledOptions = shuffleArray([...question.options])
  elements.optionsContainer.innerHTML = shuffledOptions.map(opt =>
    `<button class="option-btn" data-option="${opt}">${opt}</button>`
  ).join('')

  // Reset UI
  elements.feedback.classList.add('hidden')
  elements.btnNext.disabled = true
  updateProgress()
  updateStreak()
}

// Select option
function selectOption(button) {
  const selected = button.dataset.option
  const question = gameState.questions[gameState.currentQuestion]

  gameState.answered = true

  // Update blank
  const blank = document.getElementById('blank')
  blank.textContent = selected
  blank.classList.add('filled')

  // Disable all options
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.disabled = true
    if (btn.dataset.option === question.correct) {
      btn.classList.add('correct')
    }
  })

  // Check answer
  const isCorrect = selected === question.correct

  if (isCorrect) {
    handleCorrectAnswer(button, question)
  } else {
    handleIncorrectAnswer(button, question)
  }

  elements.btnNext.disabled = false

  // Check if last question
  if (gameState.currentQuestion >= gameState.totalQuestions - 1) {
    elements.btnNext.textContent = 'See Results'
  }
}

// Handle correct answer
function handleCorrectAnswer(button, question) {
  gameState.correctCount++
  gameState.streak++
  if (gameState.streak > gameState.maxStreak) {
    gameState.maxStreak = gameState.streak
  }

  // Calculate score with streak bonus
  const basePoints = 10 + (question.level - 1) * 5
  const streakBonus = Math.min(gameState.streak - 1, 5) * 2
  const points = basePoints + streakBonus
  addScore(points)

  // UI feedback
  button.classList.add('correct')
  document.getElementById('blank').classList.add('correct')

  elements.feedback.className = 'feedback correct'
  elements.feedbackIcon.innerHTML = '&#127881;'
  elements.feedbackText.textContent = streakBonus > 0 ? `Correct! +${streakBonus} Streak Bonus!` : 'Correct!'
  elements.feedbackExplanation.textContent = question.explanation
  elements.feedback.classList.remove('hidden')

  updateStreak()
  showSuccessEffect()
}

// Handle incorrect answer
function handleIncorrectAnswer(button, question) {
  gameState.streak = 0

  button.classList.add('incorrect')
  document.getElementById('blank').classList.add('incorrect')

  elements.feedback.className = 'feedback incorrect'
  elements.feedbackIcon.innerHTML = '&#128546;'
  elements.feedbackText.textContent = `Incorrect. The answer is "${question.correct}"`
  elements.feedbackExplanation.textContent = question.explanation
  elements.feedback.classList.remove('hidden')

  updateStreak()
}

// Next question
function nextQuestion() {
  gameState.currentQuestion++

  if (gameState.currentQuestion >= gameState.totalQuestions) {
    showResult()
  } else {
    elements.btnNext.textContent = 'Next Question'
    loadQuestion()
  }
}

// Update progress
function updateProgress() {
  const progress = ((gameState.currentQuestion + 1) / gameState.totalQuestions) * 100
  elements.progressBar.style.setProperty('--progress', `${progress}%`)
  elements.questionNum.textContent = gameState.currentQuestion + 1
}

// Update streak display
function updateStreak() {
  const flames = '&#128293;'.repeat(Math.min(gameState.streak, 5))
  elements.streakFlames.innerHTML = flames || '-'
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
  if (gameState.streak >= 3) {
    const colors = ['#e50914', '#ffd700', '#28a745', '#17a2b8', '#6c5ce7']
    for (let i = 0; i < 10; i++) {
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
}

// Show result
function showResult() {
  const percentage = Math.round((gameState.correctCount / gameState.totalQuestions) * 100)
  let message, icon, grade

  if (percentage >= 90) {
    message = 'Excellent! You\'re a Grammar Master!'
    icon = '&#127941;'
    grade = 'A+'
  } else if (percentage >= 80) {
    message = 'Great job! Almost perfect!'
    icon = '&#127881;'
    grade = 'A'
  } else if (percentage >= 70) {
    message = 'Good work! Keep practicing!'
    icon = '&#128079;'
    grade = 'B'
  } else if (percentage >= 60) {
    message = 'Not bad! Room for improvement!'
    icon = '&#128170;'
    grade = 'C'
  } else {
    message = 'Keep studying! You\'ll get better!'
    icon = '&#128218;'
    grade = 'D'
  }

  const overlay = document.createElement('div')
  overlay.className = 'result-overlay'
  overlay.innerHTML = `
    <div class="result-content">
      <div class="result-icon">${icon}</div>
      <h2 class="result-title">Quest Complete!</h2>
      <div class="result-score">${gameState.score} pts</div>
      <div class="result-stats">
        ${gameState.correctCount}/${gameState.totalQuestions} correct (${percentage}%)<br>
        Grade: ${grade} | Max Streak: ${gameState.maxStreak}&#128293;
      </div>
      <p class="result-message">${message}</p>
      <div class="result-buttons">
        <button class="btn btn-secondary" onclick="closeResultAndReset()">Play Again</button>
        <button class="btn btn-primary" onclick="closeResult()">Done</button>
      </div>
    </div>
  `
  document.body.appendChild(overlay)

  if (percentage >= 70) {
    showBigSuccessEffect()
  }
}

// Big success effect
function showBigSuccessEffect() {
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

// Reset game
function resetGame() {
  gameState.score = 0
  gameState.currentQuestion = 0
  gameState.correctCount = 0
  gameState.streak = 0
  gameState.maxStreak = 0
  gameState.answered = false

  elements.scoreValue.textContent = 0
  elements.btnNext.textContent = 'Next Question'

  generateQuestions()
  loadQuestion()
}

// Start game
init()
