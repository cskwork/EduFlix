/**
 * Word Safari - Game Logic
 * English vocabulary game for 3rd grade elementary students
 */

// Word data by category
const wordData = {
  animals: [
    { word: 'cat', type: 'image', src: 'images/cat.png' },
    { word: 'dog', type: 'image', src: 'images/dog.png' },
    { word: 'lion', type: 'image', src: 'images/lion.png' },
    { word: 'elephant', type: 'image', src: 'images/elephant.png' },
    { word: 'monkey', type: 'image', src: 'images/monkey.png' },
    { word: 'rabbit', type: 'image', src: 'images/rabbit.png' },
    { word: 'bird', type: 'image', src: 'images/bird.png' },
    { word: 'fish', type: 'image', src: 'images/fish.png' },
  ],
  fruits: [
    { word: 'apple', type: 'image', src: 'images/apple.png' },
    { word: 'banana', type: 'image', src: 'images/banana.png' },
    { word: 'orange', type: 'image', src: 'images/orange.png' },
    { word: 'grape', type: 'image', src: 'images/grape.png' },
    { word: 'strawberry', type: 'emoji', value: '&#127827;' },
    { word: 'watermelon', type: 'emoji', value: '&#127817;' },
    { word: 'cherry', type: 'emoji', value: '&#127826;' },
    { word: 'peach', type: 'emoji', value: '&#127825;' },
  ],
  colors: [
    { word: 'red', type: 'emoji', value: '&#128308;' },
    { word: 'blue', type: 'emoji', value: '&#128309;' },
    { word: 'green', type: 'emoji', value: '&#128994;' },
    { word: 'yellow', type: 'emoji', value: '&#128993;' },
    { word: 'purple', type: 'emoji', value: '&#128995;' },
    { word: 'orange', type: 'emoji', value: '&#128992;' },
    { word: 'white', type: 'emoji', value: '&#9898;' },
    { word: 'black', type: 'emoji', value: '&#9899;' },
  ],
  weather: [
    { word: 'sun', type: 'emoji', value: '&#9728;&#65039;' },
    { word: 'rain', type: 'emoji', value: '&#127783;&#65039;' },
    { word: 'cloud', type: 'emoji', value: '&#9729;&#65039;' },
    { word: 'snow', type: 'emoji', value: '&#10052;&#65039;' },
    { word: 'wind', type: 'emoji', value: '&#128168;' },
    { word: 'rainbow', type: 'emoji', value: '&#127752;' },
    { word: 'thunder', type: 'emoji', value: '&#9889;' },
    { word: 'star', type: 'emoji', value: '&#11088;' },
  ],
}

// Game state
const gameState = {
  score: 0,
  currentRound: 1,
  totalRounds: 5,
  currentCategory: 'animals',
  currentWord: null,
  usedWords: [],
  isAnswered: false,
  categories: ['animals', 'fruits', 'colors', 'weather'],
  categoryIndex: 0,
}

// DOM elements
const elements = {
  scoreValue: document.getElementById('score-value'),
  categoryLabel: document.getElementById('category-label'),
  currentRound: document.getElementById('current-round'),
  totalRounds: document.getElementById('total-rounds'),
  pictureCard: document.getElementById('picture-card'),
  pictureEmoji: document.getElementById('picture-emoji'),
  pictureHint: document.getElementById('picture-hint'),
  wordChoices: document.getElementById('word-choices'),
  feedbackText: document.getElementById('feedback-text'),
  btnReset: document.getElementById('btn-reset'),
  btnNext: document.getElementById('btn-next'),
}

// Initialize
function init() {
  setupEventListeners()
  startNewGame()
}

// Setup event listeners
function setupEventListeners() {
  elements.btnReset.addEventListener('click', startNewGame)
  elements.btnNext.addEventListener('click', nextRound)
}

// Start new game
function startNewGame() {
  gameState.score = 0
  gameState.currentRound = 1
  gameState.usedWords = []
  gameState.categoryIndex = 0
  gameState.currentCategory = gameState.categories[0]

  updateScore()
  updateUI()
  loadRound()
}

// Load current round
function loadRound() {
  gameState.isAnswered = false
  elements.btnNext.disabled = true
  elements.pictureCard.classList.remove('correct', 'incorrect')
  elements.feedbackText.textContent = ''
  elements.feedbackText.className = 'feedback-text'
  elements.pictureHint.textContent = 'Click a word!'

  // Get category words
  const categoryWords = wordData[gameState.currentCategory]

  // Select a random unused word
  const availableWords = categoryWords.filter((w) => !gameState.usedWords.includes(w.word))

  if (availableWords.length === 0) {
    // Reset used words if all used
    gameState.usedWords = []
    loadRound()
    return
  }

  gameState.currentWord = availableWords[Math.floor(Math.random() * availableWords.length)]
  gameState.usedWords.push(gameState.currentWord.word)

  // Display picture
  if (gameState.currentWord.type === 'image') {
    elements.pictureEmoji.className = 'picture-emoji'
    elements.pictureEmoji.innerHTML = `<img src="${gameState.currentWord.src}" alt="${gameState.currentWord.word}">`
  } else {
    elements.pictureEmoji.className = 'picture-emoji emoji-text'
    elements.pictureEmoji.innerHTML = gameState.currentWord.value
  }

  // Generate word choices
  generateWordChoices()

  // Update UI
  updateUI()
}

// Generate word choices
function generateWordChoices() {
  const choices = [gameState.currentWord.word]
  const categoryWords = wordData[gameState.currentCategory]

  // Add 3 random incorrect choices
  while (choices.length < 4) {
    const randomWord = categoryWords[Math.floor(Math.random() * categoryWords.length)]
    if (!choices.includes(randomWord.word)) {
      choices.push(randomWord.word)
    }
  }

  // Shuffle choices
  shuffleArray(choices)

  // Render choices
  elements.wordChoices.innerHTML = ''
  choices.forEach((word) => {
    const choiceEl = document.createElement('div')
    choiceEl.className = 'word-choice'
    choiceEl.textContent = word
    choiceEl.addEventListener('click', () => handleChoice(word, choiceEl))
    elements.wordChoices.appendChild(choiceEl)
  })
}

// Handle word choice
function handleChoice(word, choiceEl) {
  if (gameState.isAnswered) return

  gameState.isAnswered = true
  const isCorrect = word === gameState.currentWord.word

  // Disable all choices
  document.querySelectorAll('.word-choice').forEach((el) => {
    el.classList.add('disabled')
    if (el.textContent === gameState.currentWord.word) {
      el.classList.add('correct')
    }
  })

  if (isCorrect) {
    choiceEl.classList.add('correct')
    elements.pictureCard.classList.add('correct')
    elements.feedbackText.textContent = 'Correct! Great job! &#127881;'
    elements.feedbackText.className = 'feedback-text correct'
    elements.pictureHint.textContent = `${gameState.currentWord.word.toUpperCase()}`

    // Add score
    addScore(20)
    showSuccessEffect()
  } else {
    choiceEl.classList.add('incorrect')
    elements.pictureCard.classList.add('incorrect')
    elements.feedbackText.textContent = `Oops! It's "${gameState.currentWord.word}"`
    elements.feedbackText.className = 'feedback-text incorrect'
    elements.pictureHint.textContent = `${gameState.currentWord.word.toUpperCase()}`
  }

  // Enable next button or show result
  if (gameState.currentRound >= gameState.totalRounds) {
    setTimeout(() => showResult(), 1500)
  } else {
    elements.btnNext.disabled = false
  }
}

// Next round
function nextRound() {
  gameState.currentRound++

  // Change category every 5 rounds
  if (gameState.currentRound % 5 === 1 && gameState.currentRound > 1) {
    gameState.categoryIndex = (gameState.categoryIndex + 1) % gameState.categories.length
    gameState.currentCategory = gameState.categories[gameState.categoryIndex]
  }

  loadRound()
}

// Add score
function addScore(points) {
  gameState.score += points
  updateScore()
  showScorePopup(points)
}

// Update score display
function updateScore() {
  elements.scoreValue.textContent = gameState.score
  elements.scoreValue.classList.add('pulse')
  setTimeout(() => elements.scoreValue.classList.remove('pulse'), 500)
}

// Update UI
function updateUI() {
  elements.categoryLabel.textContent =
    gameState.currentCategory.charAt(0).toUpperCase() + gameState.currentCategory.slice(1)
  elements.currentRound.textContent = gameState.currentRound
  elements.totalRounds.textContent = gameState.totalRounds
}

// Show score popup
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

// Show success effect
function showSuccessEffect() {
  const colors = ['#28a745', '#ffd700', '#17a2b8', '#e83e8c', '#6c5ce7']
  for (let i = 0; i < 20; i++) {
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

// Show result
function showResult() {
  const maxScore = gameState.totalRounds * 20
  const percentage = Math.round((gameState.score / maxScore) * 100)
  const stars = percentage >= 80 ? 3 : percentage >= 60 ? 2 : percentage >= 40 ? 1 : 0
  const isSuccess = percentage >= 60

  const overlay = document.createElement('div')
  overlay.className = 'result-overlay'
  overlay.innerHTML = `
    <div class="result-content">
      <div class="result-icon">${isSuccess ? '&#127942;' : '&#128170;'}</div>
      <h2 class="result-title">${isSuccess ? 'Amazing!' : 'Nice Try!'}</h2>
      <div class="stars-earned">
        ${[1, 2, 3]
          .map(
            (n) => `
          <div class="star ${n <= stars ? 'active' : ''}">
            <img src="images/star.png" alt="star">
          </div>
        `
          )
          .join('')}
      </div>
      <div class="result-score">${gameState.score} Points</div>
      <p class="result-message">${
        isSuccess
          ? 'You are a Word Safari Champion!'
          : "Keep practicing and you'll get even better!"
      }</p>
      <div class="result-buttons">
        <button class="btn btn-secondary" onclick="closeResult()">Close</button>
        <button class="btn btn-primary" onclick="closeResult(); startNewGame();">Play Again</button>
      </div>
    </div>
  `
  document.body.appendChild(overlay)

  if (isSuccess) {
    showSuccessEffect()
  }

  // Animate stars
  setTimeout(() => {
    const starEls = overlay.querySelectorAll('.star.active')
    starEls.forEach((star, index) => {
      setTimeout(() => {
        star.style.animation = 'starPop 0.3s ease'
      }, index * 200)
    })
  }, 300)
}

// Close result
function closeResult() {
  const overlay = document.querySelector('.result-overlay')
  if (overlay) {
    overlay.remove()
  }
}

// Shuffle array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

// Expose functions globally for inline onclick handlers
window.startNewGame = startNewGame
window.closeResult = closeResult

// Start the game
init()
