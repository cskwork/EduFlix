const ContentApp = {
  scenes: ['hook-scene', 'anchor-scene', 'story-scene', 'core-scene', 'visualize-scene', 'quiz-scene', 'wrap-scene'],
  currentSceneIndex: 0,

  game: {
    active: false,
    totalWaves: 10,
    wave: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    life: 3,
    correct: 0,
    wrong: 0,
    hintUsed: 0,
    hintLevel: 0,
    currentQuestion: null
  },

  quiz: {
    crates: 5,
    answer: 60
  },

  animation: {
    playerFrame: 0,
    enemyFrame: 0,
    frameTimer: null
  },

  assets: {
    playerRunFrames: [
      '/contents/icons/icon-home-cute-20260124.svg',
      '/contents/icons/icon-arithmetic-basic-color-20260124.svg',
      '/contents/icons/icon-star-reward-cute-20260124.svg',
      '/contents/icons/icon-lightbulb-idea-bright-20260124.svg'
    ],
    enemyFrames: [
      '/contents/icons/icon-help-question-cute-20260124.svg',
      '/contents/icons/icon-trophy-achievement-cute-20260124.svg',
      '/contents/diagrams/diagram-ratio-proportion-blocks-20260125.svg',
      '/contents/diagrams/diagram-prism-net-unfolded-20260125.svg'
    ]
  },

  elements: {},

  init() {
    this.cacheElements();
    this.bindSceneNavigation();
    this.bindCoreActions();
    this.bindQuizActions();
    this.bindWrapActions();
    this.startSpriteLoop();
    this.syncQuizDisplay();
    this.showScene(0);
  },

  cacheElements() {
    this.elements.sceneCounter = document.getElementById('scene-counter');
    this.elements.core = {
      battleStage: document.getElementById('battle-stage'),
      startButton: document.getElementById('start-button'),
      hintButton: document.getElementById('hint-button'),
      hintText: document.getElementById('hint-text'),
      feedback: document.getElementById('core-feedback'),
      equation: document.getElementById('equation-text'),
      enemyGrid: document.getElementById('enemy-grid'),
      score: document.getElementById('score-value'),
      combo: document.getElementById('combo-value'),
      life: document.getElementById('life-value'),
      wave: document.getElementById('wave-progress'),
      player: document.getElementById('player-sprite'),
      shot: document.getElementById('shot-sprite')
    };

    this.elements.visualize = {
      accuracy: document.getElementById('accuracy-text'),
      maxCombo: document.getElementById('max-combo-text'),
      hintUsed: document.getElementById('hint-used-text'),
      correctBar: document.getElementById('correct-bar'),
      wrongBar: document.getElementById('wrong-bar')
    };

    this.elements.quiz = {
      slider: document.getElementById('crate-slider'),
      count: document.getElementById('crate-count'),
      answer: document.getElementById('quiz-answer'),
      down: document.getElementById('answer-down'),
      up: document.getElementById('answer-up'),
      check: document.getElementById('quiz-check'),
      feedback: document.getElementById('quiz-feedback')
    };

    this.elements.wrap = {
      report: document.getElementById('final-report'),
      retryCore: document.getElementById('retry-core'),
      restartAll: document.getElementById('restart-all')
    };
  },

  bindSceneNavigation() {
    document.querySelectorAll('[data-next]').forEach((button) => {
      button.addEventListener('click', () => {
        const nextSceneId = button.getAttribute('data-next');
        const nextIndex = this.scenes.indexOf(nextSceneId);
        if (nextIndex >= 0) {
          this.showScene(nextIndex);
          if (nextSceneId === 'visualize-scene') {
            this.updateVisualizeScene();
          }
        }
      });
    });

    document.querySelectorAll('[data-prev]').forEach((button) => {
      button.addEventListener('click', () => {
        const prevSceneId = button.getAttribute('data-prev');
        const prevIndex = this.scenes.indexOf(prevSceneId);
        if (prevIndex >= 0) {
          this.showScene(prevIndex);
        }
      });
    });
  },

  bindCoreActions() {
    this.elements.core.startButton.addEventListener('click', () => this.startCoreGame());
    this.elements.core.hintButton.addEventListener('click', () => this.requestHint());
  },

  bindQuizActions() {
    this.elements.quiz.slider.addEventListener('input', (event) => {
      this.quiz.crates = Number(event.target.value);
      this.syncQuizDisplay();
      this.elements.quiz.feedback.textContent = '정답 수를 조절한 뒤 확인해 주세요.';
    });

    this.elements.quiz.down.addEventListener('click', () => {
      this.quiz.answer = Math.max(0, this.quiz.answer - 1);
      this.syncQuizDisplay();
    });

    this.elements.quiz.up.addEventListener('click', () => {
      this.quiz.answer = Math.min(300, this.quiz.answer + 1);
      this.syncQuizDisplay();
    });

    this.elements.quiz.check.addEventListener('click', () => this.checkQuiz());
  },

  bindWrapActions() {
    this.elements.wrap.retryCore.addEventListener('click', () => {
      this.showScene(this.scenes.indexOf('core-scene'));
      this.startCoreGame();
    });

    this.elements.wrap.restartAll.addEventListener('click', () => {
      this.showScene(0);
    });
  },

  showScene(index) {
    this.currentSceneIndex = index;
    document.querySelectorAll('.scene').forEach((scene, sceneIndex) => {
      scene.classList.toggle('active', sceneIndex === index);
    });
    this.elements.sceneCounter.textContent = `${index + 1} / ${this.scenes.length}`;

    if (this.scenes[index] === 'wrap-scene') {
      this.updateWrapReport();
    }
  },

  startCoreGame() {
    this.game.active = true;
    this.game.wave = 1;
    this.game.score = 0;
    this.game.combo = 0;
    this.game.maxCombo = 0;
    this.game.life = 3;
    this.game.correct = 0;
    this.game.wrong = 0;
    this.game.hintUsed = 0;
    this.game.hintLevel = 0;
    this.game.currentQuestion = null;

    this.elements.core.feedback.textContent = '정답 몬스터를 선택하세요.';
    this.elements.core.hintText.textContent = '힌트가 여기에 표시됩니다.';
    this.updateCoreHud();
    this.generateQuestion();
  },

  generateQuestion() {
    const wave = this.game.wave;
    let a;
    let b;
    let operator;

    if (wave <= 3) {
      operator = Math.random() < 0.5 ? '+' : '-';
      a = this.randomInt(6, 30);
      b = this.randomInt(1, 15);
      if (operator === '-' && b > a) {
        const temp = a;
        a = b;
        b = temp;
      }
    } else if (wave <= 7) {
      operator = Math.random() < 0.6 ? '+' : '-';
      a = this.randomInt(18, 60);
      b = this.randomInt(8, 32);
      if (operator === '-' && b > a) {
        const temp = a;
        a = b;
        b = temp;
      }
    } else {
      operator = 'x';
      a = this.randomInt(3, 12);
      b = this.randomInt(2, 9);
    }

    const correct = this.calculate(a, b, operator);
    const options = this.createOptions(correct);

    this.game.currentQuestion = { a, b, operator, correct, options };
    this.game.hintLevel = 0;

    this.elements.core.equation.textContent = `${a} ${operator} ${b} = ?`;
    this.elements.core.hintText.textContent = '힌트가 여기에 표시됩니다.';
    this.renderEnemyOptions(options);
    this.updateCoreHud();
  },

  createOptions(correct) {
    const optionSet = new Set([correct]);
    while (optionSet.size < 3) {
      const offset = this.randomInt(-12, 12);
      if (offset === 0) {
        continue;
      }
      const candidate = Math.max(0, correct + offset);
      optionSet.add(candidate);
    }

    return Array.from(optionSet).sort(() => Math.random() - 0.5);
  },

  renderEnemyOptions(options) {
    this.elements.core.enemyGrid.innerHTML = '';

    options.forEach((value) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'enemy-card';
      button.setAttribute('data-answer', String(value));
      button.innerHTML = `
        <img class="enemy-sprite" src="${this.assets.enemyFrames[this.animation.enemyFrame]}" alt="적 몬스터">
        <span class="enemy-value">${value}</span>
      `;

      button.addEventListener('click', () => {
        if (!this.game.active) {
          return;
        }
        this.checkAnswer(value, button);
      });

      this.elements.core.enemyGrid.appendChild(button);
    });
  },

  checkAnswer(selectedValue, selectedElement) {
    const correct = this.game.currentQuestion.correct;
    const isCorrect = selectedValue === correct;

    this.toggleEnemyButtons(true);
    this.animateShot(selectedElement, isCorrect);

    if (isCorrect) {
      this.game.correct += 1;
      this.game.combo += 1;
      this.game.maxCombo = Math.max(this.game.maxCombo, this.game.combo);
      this.game.score += 100 + (this.game.combo * 10);
      this.elements.core.feedback.textContent = `정답입니다. ${selectedValue}가 맞습니다.`;
      selectedElement.classList.add('hit');
    } else {
      this.game.wrong += 1;
      this.game.life -= 1;
      this.game.combo = 0;
      this.elements.core.feedback.textContent = `오답입니다. 정답은 ${correct}입니다.`;
      selectedElement.classList.add('miss');
    }

    this.updateCoreHud();

    window.setTimeout(() => {
      if (this.game.life <= 0) {
        this.finishCoreGame('생명이 모두 소진되어 레이드가 종료되었습니다.');
        return;
      }

      if (this.game.wave >= this.game.totalWaves) {
        this.finishCoreGame('모든 웨이브를 완료했습니다.');
        return;
      }

      this.game.wave += 1;
      this.generateQuestion();
      this.toggleEnemyButtons(false);
    }, 560);
  },

  requestHint() {
    if (!this.game.active || !this.game.currentQuestion) {
      this.elements.core.hintText.textContent = '전투를 시작하면 힌트를 사용할 수 있습니다.';
      return;
    }

    this.game.hintLevel = Math.min(3, this.game.hintLevel + 1);
    this.game.hintUsed += 1;

    const question = this.game.currentQuestion;
    const hint = this.createHint(question, this.game.hintLevel);
    this.elements.core.hintText.textContent = hint;
    this.updateCoreHud();
  },

  createHint(question, level) {
    if (level === 1) {
      return `1단계 힌트: 이 문제는 ${question.operator === 'x' ? '곱셈' : question.operator === '+' ? '덧셈' : '뺄셈'}입니다.`;
    }

    if (level === 2) {
      const tens = Math.floor(question.correct / 10);
      return `2단계 힌트: 정답의 십의 자리는 ${tens}입니다.`;
    }

    const ones = Math.abs(question.correct % 10);
    return `3단계 힌트: 정답의 일의 자리는 ${ones}입니다.`;
  },

  finishCoreGame(message) {
    this.game.active = false;
    this.elements.core.equation.textContent = '전투 종료';
    this.elements.core.feedback.textContent = message;
    this.toggleEnemyButtons(true);
    this.updateVisualizeScene();
    this.updateWrapReport();
  },

  toggleEnemyButtons(disabled) {
    this.elements.core.enemyGrid.querySelectorAll('.enemy-card').forEach((button) => {
      button.disabled = disabled;
    });
  },

  animateShot(targetElement, isCorrect) {
    const shot = this.elements.core.shot;
    const battleRect = this.elements.core.battleStage.getBoundingClientRect();
    const playerRect = this.elements.core.player.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();

    const startX = playerRect.left + playerRect.width * 0.7 - battleRect.left;
    const startY = playerRect.top + playerRect.height * 0.35 - battleRect.top;

    const endX = targetRect.left + targetRect.width * 0.5 - battleRect.left;
    const endY = targetRect.top + targetRect.height * 0.5 - battleRect.top;

    const diffX = endX - startX;
    const diffY = endY - startY;

    shot.style.left = `${startX}px`;
    shot.style.top = `${startY}px`;
    shot.style.setProperty('--shot-x', `${diffX}px`);
    shot.style.setProperty('--shot-y', `${diffY}px`);
    shot.style.filter = isCorrect ? 'drop-shadow(0 0 8px #37d39a)' : 'drop-shadow(0 0 8px #f15846)';
    shot.classList.remove('fire');

    // 같은 프레임에서 재실행을 보장하기 위한 강제 리플로우
    void shot.offsetWidth;
    shot.classList.add('fire');

    window.setTimeout(() => {
      shot.classList.remove('fire');
    }, 360);
  },

  updateCoreHud() {
    this.elements.core.wave.textContent = `${this.game.wave} / ${this.game.totalWaves}`;
    this.elements.core.score.textContent = String(this.game.score);
    this.elements.core.combo.textContent = String(this.game.combo);
    this.elements.core.life.textContent = String(this.game.life);
  },

  updateVisualizeScene() {
    const total = this.game.correct + this.game.wrong;

    if (total === 0) {
      this.elements.visualize.accuracy.textContent = '아직 전투 기록이 없습니다.';
      this.elements.visualize.maxCombo.textContent = '0';
      this.elements.visualize.hintUsed.textContent = '0회';
      this.elements.visualize.correctBar.style.width = '0%';
      this.elements.visualize.wrongBar.style.width = '0%';
      return;
    }

    const accuracy = Math.round((this.game.correct / total) * 100);
    const wrongRate = 100 - accuracy;

    this.elements.visualize.accuracy.textContent = `${accuracy}% (${this.game.correct} / ${total})`;
    this.elements.visualize.maxCombo.textContent = `${this.game.maxCombo}`;
    this.elements.visualize.hintUsed.textContent = `${this.game.hintUsed}회`;
    this.elements.visualize.correctBar.style.width = `${accuracy}%`;
    this.elements.visualize.wrongBar.style.width = `${wrongRate}%`;
  },

  syncQuizDisplay() {
    this.elements.quiz.count.textContent = String(this.quiz.crates);
    this.elements.quiz.answer.textContent = String(this.quiz.answer);
  },

  checkQuiz() {
    const expected = this.quiz.crates * 12;
    const answer = this.quiz.answer;
    const diff = Math.abs(expected - answer);

    if (diff === 0) {
      this.elements.quiz.feedback.textContent = `정답입니다. ${this.quiz.crates} x 12 = ${expected}입니다.`;
      this.elements.quiz.feedback.style.color = '#37d39a';
      return;
    }

    if (diff <= 3) {
      this.elements.quiz.feedback.textContent = `거의 맞았습니다. 정답은 ${expected}이고 현재 답은 ${answer}입니다.`;
      this.elements.quiz.feedback.style.color = '#f8b937';
      return;
    }

    this.elements.quiz.feedback.textContent = `다시 계산해 보세요. ${this.quiz.crates}개의 상자 총량을 다시 떠올려 보세요.`;
    this.elements.quiz.feedback.style.color = '#f15846';
  },

  updateWrapReport() {
    const total = this.game.correct + this.game.wrong;

    if (total === 0) {
      this.elements.wrap.report.textContent = '전투 기록: 아직 없음';
      return;
    }

    const accuracy = Math.round((this.game.correct / total) * 100);
    this.elements.wrap.report.textContent = `전투 기록: 점수 ${this.game.score}, 정확도 ${accuracy}%, 최대 콤보 ${this.game.maxCombo}, 힌트 ${this.game.hintUsed}회`;
  },

  startSpriteLoop() {
    if (this.animation.frameTimer) {
      return;
    }

    this.animation.frameTimer = window.setInterval(() => {
      this.animation.playerFrame = (this.animation.playerFrame + 1) % this.assets.playerRunFrames.length;
      this.animation.enemyFrame = (this.animation.enemyFrame + 1) % this.assets.enemyFrames.length;

      this.elements.core.player.src = this.assets.playerRunFrames[this.animation.playerFrame];
      this.elements.core.enemyGrid.querySelectorAll('.enemy-sprite').forEach((sprite) => {
        sprite.src = this.assets.enemyFrames[this.animation.enemyFrame];
      });
    }, 170);
  },

  calculate(a, b, operator) {
    if (operator === '+') {
      return a + b;
    }
    if (operator === '-') {
      return a - b;
    }
    return a * b;
  },

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ContentApp.init();
});
