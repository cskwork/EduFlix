class Scene {
  constructor(id, element, onEnter = null) {
    this.id = id;
    this.element = element;
    this.onEnter = onEnter;
  }

  show() {
    this.element.classList.add('active');
    this.element.removeAttribute('aria-hidden');
    if (this.onEnter) this.onEnter();
  }

  hide() {
    this.element.classList.remove('active');
    this.element.setAttribute('aria-hidden', 'true');
  }
}

class EduFlixEngine {
  constructor() {
    this.container = document.getElementById('scene-container');
    this.scenes = new Map();
    this.currentSceneId = null;
    this.quizIndex = 0;
    this.quizSelected = null;
    this.quizAnswered = false;
    this.data = null;
  }

  escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  init(gameData) {
    this.data = gameData;
    this.createProgress();
    this.createScenes();
    this.start();
  }

  createProgress() {
    const progress = document.createElement('div');
    progress.className = 'app-progress';
    progress.innerHTML = '<div class="progress-track" id="progress-track" role="progressbar" aria-label="학습 진행도" aria-valuemin="1" aria-valuemax="5" aria-valuenow="1"><div class="progress-fill" id="progress-fill"></div></div><p class="progress-text" id="progress-text">1 / 5 · 궁금증 열기</p>';
    this.container.appendChild(progress);
  }

  createScenes() {
    this.createScene('hook', this.renderHook.bind(this), this.bindHook.bind(this));
    this.createScene('story', this.renderStory.bind(this), this.bindStory.bind(this));
    this.createScene('core', this.renderCore.bind(this), this.initCore.bind(this));
    this.createScene('quiz', this.renderQuizShell.bind(this), this.startQuiz.bind(this));
    this.createScene('wrap', this.renderWrap.bind(this), this.bindWrap.bind(this));
  }

  createScene(id, render, onEnter) {
    const element = document.createElement('section');
    element.id = `scene-${id}`;
    element.className = `scene ${id}-scene`;
    element.setAttribute('aria-hidden', 'true');
    render(element);
    this.container.appendChild(element);
    this.scenes.set(id, new Scene(id, element, onEnter));
  }

  switchScene(sceneId) {
    const next = this.scenes.get(sceneId);
    if (!next || sceneId === this.currentSceneId) return;
    if (this.currentSceneId) this.scenes.get(this.currentSceneId).hide();
    this.currentSceneId = sceneId;
    next.show();
    this.updateProgress(sceneId);
    this.container.scrollTop = 0;
    window.scrollTo(0, 0);
    const heading = next.element.querySelector('h1, h2');
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }

  updateProgress(sceneId) {
    const order = ['hook', 'story', 'core', 'quiz', 'wrap'];
    const labels = ['궁금증 열기', '개념 발견', '복원 실험', '대칭 퀴즈', '배움 정리'];
    const index = order.indexOf(sceneId);
    document.getElementById('progress-fill').style.width = `${(index + 1) * 20}%`;
    document.getElementById('progress-track').setAttribute('aria-valuenow', String(index + 1));
    document.getElementById('progress-text').textContent = `${index + 1} / 5 · ${labels[index]}`;
  }

  nextScene() {
    const order = ['hook', 'story', 'core', 'quiz', 'wrap'];
    const index = order.indexOf(this.currentSceneId);
    if (index >= 0 && index < order.length - 1) this.switchScene(order[index + 1]);
  }

  start() { this.switchScene('hook'); }

  showFeedback(message, type = 'neutral', targetId = 'core-feedback') {
    const target = document.getElementById(targetId) || document.getElementById('core-feedback');
    if (!target) return;
    target.textContent = message;
    target.className = `live-feedback feedback-${type}`;
  }

  enableNext() {
    const button = document.getElementById('core-next-btn');
    if (button) {
      button.hidden = false;
      button.disabled = false;
    }
  }

  renderHook(scene) {
    const question = this.escapeHtml(this.data.hook.question);
    scene.innerHTML = `
      <p class="eyebrow">복원 임무 01</p>
      <h2 class="scene-heading">${question}</h2>
      <p class="learning-objective"><strong>오늘의 목표</strong> 접거나 반 바퀴 돌렸을 때 겹치는 성질인 대칭을 구별하고, 움직인 뒤 서로 겹치는 두 점인 대응점을 찾아 도형을 완성해요.</p>
      <p class="lead">두 물건을 직접 움직여 완전히 겹치는 방법을 찾아보세요.</p>
      <div class="panel motif-line">
        <div class="hook-objects">${butterflyMarkup()}${pinwheelMarkup()}</div>
        <div id="hook-feedback" class="live-feedback feedback-neutral" role="status" aria-live="polite">나비와 바람개비를 하나씩 움직여 보세요.</div>
        <div class="action-row"><button id="continue-story" class="btn btn-primary" disabled>박물관 안으로</button></div>
      </div>
      ${doriMarkup('도리 로봇이 두 팔을 들고 대칭 물건을 안내합니다.')}`;
  }

  bindHook() {
    const scene = this.scenes.get('hook').element;
    if (scene.dataset.ready) return;
    scene.dataset.ready = 'true';
    const state = { fold: false, turn: false };
    scene.querySelector('#fold-butterfly').addEventListener('click', () => this.finishHookAction(state, 'fold', scene));
    scene.querySelector('#rotate-pinwheel').addEventListener('click', () => this.finishHookAction(state, 'turn', scene));
    scene.querySelector('#continue-story').addEventListener('click', () => this.nextScene());
  }

  finishHookAction(state, action, scene) {
    state[action] = true;
    const card = scene.querySelector(action === 'fold' ? '#butterfly-card' : '#pinwheel-card');
    card.classList.add(action === 'fold' ? 'is-folded' : 'is-turned', 'is-done');
    const text = action === 'fold'
      ? '나비는 가운데 선을 따라 접으니 양쪽 날개가 완전히 겹쳐요.'
      : '바람개비는 중심을 기준으로 반 바퀴 돌리니 날개가 완전히 겹쳐요.';
    this.showFeedback(text, 'positive', 'hook-feedback');
    if (state.fold && state.turn) scene.querySelector('#continue-story').disabled = false;
  }

  renderStory(scene) {
    scene.innerHTML = `
      <p class="eyebrow">도리의 대칭 전시실</p>
      <h2 class="scene-heading">접는 대칭, 돌리는 대칭</h2>
      <div class="dori-row">${doriSvg('대칭 박물관 안내 로봇 도리')}<p class="speech">나는 도리야! 한 직선을 따라 접어 겹치면 <strong>선대칭도형</strong>, 한 점을 중심으로 반 바퀴 돌려 겹치면 <strong>점대칭도형</strong>이라고 해. 접는 기준선은 <strong>대칭축</strong>, 돌리는 기준점은 <strong>대칭의 중심</strong>이야.</p></div>
      <div class="panel">
        <div class="story-demo">${shieldMarkup()}${propellerMarkup()}</div>
        <p class="definition"><strong>대응점</strong>은 움직인 뒤 서로 겹치는 두 점이에요. <strong>대응변</strong>은 같은 방법으로 겹치는 두 선분이에요.</p>
        <div class="action-row"><button id="compare-motions" class="btn btn-secondary" disabled>두 움직임 비교하기</button><button id="continue-core" class="btn btn-primary" disabled>복원 작업대로</button></div>
        <div id="story-feedback" class="live-feedback feedback-neutral" role="status" aria-live="polite">방패를 접고 프로펠러를 돌려 보세요.</div>
      </div>`;
  }

  bindStory() {
    const scene = this.scenes.get('story').element;
    if (scene.dataset.ready) return;
    scene.dataset.ready = 'true';
    const state = { shield: false, propeller: false, compared: false };
    scene.querySelector('#fold-scanner').addEventListener('click', () => this.storyAction(state, 'shield', scene));
    scene.querySelector('#turn-scanner').addEventListener('click', () => this.storyAction(state, 'propeller', scene));
    scene.querySelector('#compare-motions').addEventListener('click', () => this.compareStory(state, scene));
    scene.querySelector('#continue-core').addEventListener('click', () => this.nextScene());
  }

  storyAction(state, action, scene) {
    state[action] = true;
    const isShield = action === 'shield';
    const card = scene.querySelector(isShield ? '#shield-card' : '#propeller-card');
    card.classList.add(isShield ? 'is-folded' : 'is-turned', 'is-done');
    const message = isShield
      ? '방패는 대칭축에서 같은 거리만큼 떨어진 두 부분이 접혀 겹쳐요.'
      : '프로펠러는 대칭의 중심에서 같은 거리의 부분이 반 바퀴 돌아 겹쳐요.';
    this.showFeedback(message, 'positive', 'story-feedback');
    scene.querySelector('#compare-motions').disabled = !(state.shield && state.propeller);
  }

  compareStory(state, scene) {
    state.compared = true;
    const demo = scene.querySelector('.story-demo');
    const shield = scene.querySelector('#shield-card');
    const propeller = scene.querySelector('#propeller-card');
    shield.classList.remove('is-folded');
    propeller.classList.remove('is-turned');
    void demo.offsetWidth;
    shield.classList.add('is-folded');
    propeller.classList.add('is-turned');
    demo.classList.add('is-compared');
    this.showFeedback('선대칭은 직선을 기준으로 뒤집고, 점대칭은 한 점을 기준으로 반 바퀴 돌려요.', 'positive', 'story-feedback');
    scene.querySelector('#continue-core').disabled = false;
  }

  renderCore(scene) {
    scene.innerHTML = `
      <p class="eyebrow">격자 유물 복원 작업대</p>
      <h2 class="scene-heading">대응점을 같은 거리에 놓아요</h2>
      <p class="lead">${this.escapeHtml(this.data.interaction.instruction)}</p>
      <div id="core-interactive-area" class="interactive-area"></div>
      <div id="core-feedback" class="live-feedback feedback-neutral" role="status" aria-live="polite">첫 번째 복원 단계를 시작하세요.</div>
      <button id="core-next-btn" class="btn btn-primary core-next" hidden disabled>퀴즈 자물쇠로</button>`;
  }

  initCore() {
    const container = document.getElementById('core-interactive-area');
    if (container.dataset.ready) return;
    container.dataset.ready = 'true';
    this.data.interaction.onInit(container, this);
    document.getElementById('core-next-btn').addEventListener('click', () => this.nextScene());
  }

  renderQuizShell(scene) {
    scene.innerHTML = `
      <p class="eyebrow">개념 자물쇠 4개</p>
      <h2 class="scene-heading">대칭 퀴즈</h2>
      <div class="quiz-locks" id="quiz-locks" aria-label="퀴즈 진행 상황"></div>
      <div class="panel">
        <p id="quiz-question" class="lead" tabindex="-1"></p>
        <div id="quiz-visual" class="quiz-visual"></div>
        <div id="quiz-choice" class="quiz-options" role="radiogroup" aria-labelledby="quiz-question"></div>
        <div id="quiz-hint" class="quiz-hint" hidden></div>
        <div id="quiz-feedback" class="live-feedback feedback-neutral" role="status" aria-live="polite">답을 고르고 확인하세요.</div>
        <div class="action-row"><button id="check-answer" class="btn btn-primary" disabled>답 확인</button><button id="show-hint" class="btn btn-secondary" hidden>문제 힌트 보기</button><button id="retry-question" class="btn btn-secondary" hidden>문제 다시 풀기</button><button id="next-question" class="btn btn-primary" hidden>다음 문제</button></div>
      </div>`;
  }

  startQuiz() {
    const scene = this.scenes.get('quiz').element;
    if (scene.dataset.ready) return;
    this.quizIndex = 0;
    this.quizSelected = null;
    this.quizAnswered = false;
    scene.dataset.ready = 'true';
    scene.querySelector('#check-answer').addEventListener('click', () => this.submitQuiz());
    scene.querySelector('#show-hint').addEventListener('click', () => this.showQuizHint());
    scene.querySelector('#retry-question').addEventListener('click', () => this.retryQuiz());
    scene.querySelector('#next-question').addEventListener('click', () => this.advanceQuiz());
    this.renderQuizQuestion();
  }

  renderQuizQuestion() {
    const item = this.data.quiz[this.quizIndex];
    document.getElementById('quiz-question').textContent = `${this.quizIndex + 1}. ${item.question}`;
    document.getElementById('quiz-visual').innerHTML = quizVisualMarkup(this.quizIndex);
    const options = document.getElementById('quiz-choice');
    options.replaceChildren(...item.options.map((option, index) => this.makeQuizChoice(option, index)));
    this.quizAnswered = false;
    this.renderQuizLocks();
    this.resetQuizControls();
    document.getElementById('next-question').textContent = this.quizIndex === this.data.quiz.length - 1 ? '배움 정리로' : '다음 문제';
  }

  makeQuizChoice(label, index) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice';
    button.tabIndex = index === 0 ? 0 : -1;
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', 'false');
    button.textContent = label;
    button.addEventListener('click', () => this.selectQuizChoice(index, button));
    button.addEventListener('keydown', (event) => this.moveQuizFocus(event, index));
    return button;
  }

  selectQuizChoice(index, button) {
    this.quizSelected = index;
    document.querySelectorAll('#quiz-choice .choice').forEach((choice) => {
      choice.setAttribute('aria-checked', 'false');
      choice.tabIndex = -1;
    });
    button.setAttribute('aria-checked', 'true');
    button.tabIndex = 0;
    document.getElementById('check-answer').disabled = false;
    this.showFeedback(`${button.textContent} 보기를 골랐어요. 움직임의 기준을 생각하고 확인하세요.`, 'neutral', 'quiz-feedback');
  }

  moveQuizFocus(event, index) {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const choices = [...document.querySelectorAll('#quiz-choice .choice:not(:disabled)')];
    if (!choices.length) return;
    const step = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1 : (index + step + choices.length) % choices.length;
    choices.forEach((choice, choiceIndex) => { choice.tabIndex = choiceIndex === nextIndex ? 0 : -1; });
    choices[nextIndex].focus();
  }

  submitQuiz() {
    if (this.quizAnswered || this.quizSelected === null) return;
    const item = this.data.quiz[this.quizIndex];
    if (this.quizSelected === item.answer) {
      this.quizAnswered = true;
      this.showFeedback(item.reason, 'positive', 'quiz-feedback');
      this.lockQuizChoices();
      this.renderQuizLocks();
      document.getElementById('check-answer').hidden = true;
      const nextButton = document.getElementById('next-question');
      nextButton.hidden = false;
      nextButton.focus();
      return;
    }
    this.showFeedback(item.wrongFeedback, 'negative', 'quiz-feedback');
    document.getElementById('check-answer').hidden = true;
    document.getElementById('show-hint').hidden = false;
    const retryButton = document.getElementById('retry-question');
    retryButton.hidden = false;
    this.lockQuizChoices();
    retryButton.focus();
  }

  lockQuizChoices() {
    document.querySelectorAll('#quiz-choice .choice').forEach((choice) => { choice.disabled = true; });
  }

  showQuizHint() {
    const item = this.data.quiz[this.quizIndex];
    document.getElementById('quiz-hint').textContent = item.hint;
    document.getElementById('quiz-hint').hidden = false;
    document.getElementById('quiz-visual').classList.add('hint-active');
    document.getElementById('show-hint').hidden = true;
    this.showFeedback('강조된 기준과 칸 수를 확인한 뒤 다시 풀어 보세요.', 'neutral', 'quiz-feedback');
  }

  retryQuiz() {
    this.quizSelected = null;
    document.querySelectorAll('#quiz-choice .choice').forEach((choice, index) => {
      choice.disabled = false;
      choice.setAttribute('aria-checked', 'false');
      choice.tabIndex = index === 0 ? 0 : -1;
    });
    this.resetQuizControls();
    this.showFeedback('힌트를 떠올리며 다시 골라 보세요.', 'neutral', 'quiz-feedback');
    document.querySelector('#quiz-choice .choice').focus();
  }

  resetQuizControls() {
    const submit = document.getElementById('check-answer');
    submit.hidden = false;
    submit.disabled = true;
    document.getElementById('show-hint').hidden = true;
    document.getElementById('retry-question').hidden = true;
    document.getElementById('next-question').hidden = true;
    document.getElementById('quiz-hint').hidden = true;
    document.getElementById('quiz-visual').classList.remove('hint-active');
    this.showFeedback('답을 고르고 확인하세요.', 'neutral', 'quiz-feedback');
  }

  advanceQuiz() {
    if (!this.quizAnswered) return;
    if (this.quizIndex === this.data.quiz.length - 1) {
      this.nextScene();
      return;
    }
    this.quizIndex += 1;
    this.quizSelected = null;
    this.renderQuizQuestion();
    document.getElementById('quiz-question').focus();
  }

  renderQuizLocks() {
    const locks = this.data.quiz.map((_, index) => {
      const isDone = index < this.quizIndex || index === this.quizIndex && this.quizAnswered;
      const state = isDone ? 'done' : index === this.quizIndex ? 'current' : '';
      const mark = isDone ? '열림' : index === this.quizIndex ? '도전 중' : '잠김';
      return `<div class="quiz-lock ${state}">${index + 1} · ${mark}</div>`;
    });
    document.getElementById('quiz-locks').innerHTML = locks.join('');
  }

  renderWrap(scene) {
    scene.innerHTML = `
      <p class="eyebrow">복원 기록</p>
      <h2 class="scene-heading">대칭 박물관이 다시 빛나요</h2>
      <div class="panel">
        <ul class="summary-list">${this.data.wrap.summary.map((item) => `<li>${this.escapeHtml(item)}</li>`).join('')}</ul>
        <h3>나의 복원 기록</h3>
        <ul class="evidence-list">${this.data.wrap.evidence.map((item) => `<li>${this.escapeHtml(item)}</li>`).join('')}</ul>
        <div class="wrap-lab">${reviewFoldMarkup()}${reviewTurnMarkup()}</div>
        <div class="transfer"><p><strong>새 표지판은 반 바퀴 돌렸을 때만 겹칩니다. 어떤 대칭일까요?</strong></p>${transferSignMarkup()}<div class="action-row"><button id="transfer-fold" class="btn" aria-pressed="false">접기: 선대칭</button><button id="transfer-turn" class="btn" aria-pressed="false">반 바퀴: 점대칭</button></div><div id="transfer-reason-wrap" hidden><label for="transfer-reason">왜 그렇게 생각했나요?</label><textarea id="transfer-reason" rows="2" maxlength="120" aria-describedby="transfer-reason-help" placeholder="움직인 뒤 겹치는 모습을 근거로 써 보세요."></textarea><p id="transfer-reason-help">반 바퀴 돌리기와 겹침을 근거로 한 문장을 써 보세요.</p></div></div>
        <div id="wrap-feedback" class="live-feedback feedback-neutral" role="status" aria-live="polite">두 복습 움직임과 새 표지판 문제를 해결하세요.</div>
        <div class="action-row"><button id="complete-lesson" class="btn btn-primary" disabled>복원 완료</button></div>
        <div id="award" class="award" tabindex="-1" hidden><img src="/contents/icons/icon-trophy-achievement-cute-20260124.svg" alt="복원 임무 완수 트로피"><h3>대칭 복원가 인증!</h3><p>접기, 반 바퀴 돌리기, 같은 거리의 대응점을 모두 설명했어요.</p></div>
        <div class="action-row"><button id="replay" class="btn btn-secondary">처음부터</button><button id="home" class="btn btn-primary">홈으로</button></div>
      </div>`;
  }

  bindWrap() {
    const scene = this.scenes.get('wrap').element;
    if (scene.dataset.ready) return;
    scene.dataset.ready = 'true';
    const state = { fold: false, turn: false, transfer: false, reason: false };
    scene.querySelector('#review-fold').addEventListener('click', () => this.wrapReview(state, 'fold', scene));
    scene.querySelector('#review-turn').addEventListener('click', () => this.wrapReview(state, 'turn', scene));
    scene.querySelector('#transfer-fold').addEventListener('click', () => this.wrapTransfer(state, false, scene));
    scene.querySelector('#transfer-turn').addEventListener('click', () => this.wrapTransfer(state, true, scene));
    scene.querySelector('#transfer-reason').addEventListener('input', (event) => {
      const reason = event.target.value.trim();
      const hasMotion = /(반\s*바퀴|돌리|중심|180\s*도|회전)/.test(reason);
      const hasMatch = /(겹|포개|일치|같은\s*모양|원래\s*모양)/.test(reason);
      state.reason = reason.length >= 8 && hasMotion && hasMatch;
      event.target.setAttribute('aria-invalid', String(reason.length > 0 && !state.reason));
      this.updateWrapReady(state, scene);
    });
    scene.querySelector('#complete-lesson').addEventListener('click', () => this.completeWrap(state, scene));
    scene.querySelector('#replay').addEventListener('click', () => location.reload());
    scene.querySelector('#home').addEventListener('click', () => window.parent.postMessage('close', '*'));
  }

  wrapReview(state, action, scene) {
    state[action] = true;
    scene.querySelector(`#review-${action}`).setAttribute('aria-pressed', 'true');
    scene.querySelector(`#review-${action}-shape`).classList.add(action === 'turn' ? 'is-turned' : 'is-folded');
    const message = action === 'fold'
      ? '접었을 때 대응점은 대칭축에서 같은 거리에 있어요.'
      : '반 바퀴 돌렸을 때 대응점은 중심을 사이에 두고 반대쪽 같은 거리에 있어요.';
    this.showFeedback(message, 'positive', 'wrap-feedback');
    this.updateWrapReady(state, scene);
  }

  wrapTransfer(state, correct, scene) {
    const sign = scene.querySelector('#transfer-sign');
    sign.classList.remove('is-tested-fold', 'is-tested-turn');
    scene.querySelector('#transfer-reason-wrap').hidden = false;
    if (!correct) {
      sign.classList.add('is-tested-fold');
      this.showFeedback('접어서는 겹치지 않아요. 한 점을 중심으로 반 바퀴 돌리는 모습을 떠올려 보세요.', 'negative', 'wrap-feedback');
      return;
    }
    state.transfer = true;
    sign.classList.add('is-tested-turn');
    scene.querySelector('#transfer-turn').setAttribute('aria-pressed', 'true');
    scene.querySelectorAll('#transfer-fold, #transfer-turn').forEach((button) => { button.disabled = true; });
    this.showFeedback('맞아요. 반 바퀴 돌려 겹치므로 점대칭도형이에요.', 'positive', 'wrap-feedback');
    this.updateWrapReady(state, scene);
    scene.querySelector('#transfer-reason').focus();
  }

  updateWrapReady(state, scene) {
    scene.querySelector('#complete-lesson').disabled = !(state.fold && state.turn && state.transfer && state.reason);
  }

  completeWrap(state, scene) {
    if (state.completed) return;
    state.completed = true;
    scene.querySelector('#award').hidden = false;
    scene.querySelector('#complete-lesson').disabled = true;
    scene.querySelectorAll('#review-fold, #review-turn, #transfer-fold, #transfer-turn').forEach((button) => { button.disabled = true; });
    this.showFeedback('복원 완료! 움직임과 거리를 근거로 대칭을 설명할 수 있어요.', 'positive', 'wrap-feedback');
    scene.querySelector('#award').focus();
  }
}

function doriSvg(label) {
  return `<svg class="dori" viewBox="0 0 100 100" role="img" aria-label="${label}"><rect x="20" y="25" width="60" height="52" rx="16" fill="#8bd0b9" stroke="#292b2f" stroke-width="4"/><path d="M50 25V13" stroke="#292b2f" stroke-width="4"/><circle cx="50" cy="11" r="6" fill="#e45f42" stroke="#292b2f" stroke-width="3"/><circle cx="39" cy="48" r="5" fill="#292b2f"/><circle cx="61" cy="48" r="5" fill="#292b2f"/><path d="M38 63Q50 72 62 63" fill="none" stroke="#292b2f" stroke-width="4"/><path d="M20 45L8 35M80 45l12-10M35 77v13M65 77v13" stroke="#292b2f" stroke-width="5" stroke-linecap="round"/></svg>`;
}

function doriMarkup(label) {
  return `<div class="dori-row">${doriSvg(label)}<p class="speech">안녕! 나는 복원 로봇 <strong>도리</strong>야. 두 움직임을 모두 성공시키면 박물관 문이 열려!</p></div>`;
}

function butterflyMarkup() {
  return `<article id="butterfly-card" class="object-card"><h3>나비</h3><svg viewBox="0 0 220 150" role="img" aria-label="가운데 점선 양쪽에 같은 무늬의 날개가 있는 나비"><line x1="110" y1="10" x2="110" y2="140" stroke="#e45f42" stroke-width="3" stroke-dasharray="7 7"/><g class="butterfly-wing left"><path d="M105 72C70 15 20 24 37 72C15 115 69 137 105 82Z" fill="#f3b36a" stroke="#292b2f" stroke-width="4"/><circle cx="65" cy="65" r="8" fill="#16766d"/></g><g class="butterfly-wing right"><path d="M115 72C150 15 200 24 183 72C205 115 151 137 115 82Z" fill="#f3b36a" stroke="#292b2f" stroke-width="4"/><circle cx="155" cy="65" r="8" fill="#16766d"/></g><rect x="104" y="50" width="12" height="48" rx="6" fill="#292b2f"/></svg><button id="fold-butterfly" class="btn btn-small">가운데 선으로 접기</button></article>`;
}

function pinwheelMarkup() {
  return `<article id="pinwheel-card" class="object-card"><h3>바람개비</h3><svg viewBox="0 0 220 150" role="img" aria-label="가운데 점을 중심으로 마주 보는 날개가 같은 바람개비"><g class="pinwheel-blades"><path d="M110 75L42 20Q100 10 110 75Z" fill="#e45f42"/><path d="M110 75L165 8Q180 64 110 75Z" fill="#16766d"/><path d="M110 75L178 130Q120 140 110 75Z" fill="#e45f42"/><path d="M110 75L55 142Q40 86 110 75Z" fill="#16766d"/></g><circle cx="110" cy="75" r="8" fill="#292b2f"/></svg><button id="rotate-pinwheel" class="btn btn-small">가운데 점에서 반 바퀴</button></article>`;
}

function shieldMarkup() {
  return `<article id="shield-card" class="object-card"><h3>유물 A · 방패</h3><svg viewBox="0 0 180 130" role="img" aria-label="가운데 대칭축을 기준으로 양쪽 무늬가 같은 방패"><path class="shield-half left" d="M90 12L25 34Q28 100 90 120Z" fill="#f3b36a" stroke="#292b2f" stroke-width="4"/><path class="shield-half right" d="M90 12L155 34Q152 100 90 120Z" fill="#f3b36a" stroke="#292b2f" stroke-width="4"/><circle cx="61" cy="61" r="7" fill="#16766d"/><circle cx="119" cy="61" r="7" fill="#16766d"/><line x1="90" y1="8" x2="90" y2="123" stroke="#e45f42" stroke-width="3" stroke-dasharray="6 6"/></svg><button id="fold-scanner" class="btn btn-small">방패 접기</button></article>`;
}

function propellerMarkup() {
  return `<article id="propeller-card" class="object-card"><h3>유물 B · 프로펠러</h3><svg viewBox="0 0 180 130" role="img" aria-label="중심점 양쪽에 같은 날개가 있는 프로펠러"><g class="propeller-blades"><path d="M86 61C43 11 15 30 37 57C51 75 68 68 86 67Z" fill="#8bd0b9" stroke="#292b2f" stroke-width="4"/><path d="M94 69C137 119 165 100 143 73C129 55 112 62 94 63Z" fill="#8bd0b9" stroke="#292b2f" stroke-width="4"/></g><circle cx="90" cy="65" r="8" fill="#292b2f"/></svg><button id="turn-scanner" class="btn btn-small">반 바퀴 돌리기</button></article>`;
}

function reviewFoldMarkup() {
  return `<article class="review-card"><svg id="review-fold-shape" class="review-shape" viewBox="0 0 140 95" role="img" aria-label="대칭축이 있는 하트"><path d="M70 82C20 52 20 17 43 15C58 14 67 25 70 34C73 25 82 14 97 15C120 17 120 52 70 82Z" fill="#f3b36a" stroke="#292b2f" stroke-width="4"/><line x1="70" y1="8" x2="70" y2="88" stroke="#e45f42" stroke-width="3" stroke-dasharray="5 5"/></svg><button id="review-fold" class="btn btn-small" aria-pressed="false">접기 복습</button></article>`;
}

function reviewTurnMarkup() {
  return `<article class="review-card"><svg id="review-turn-shape" class="review-shape" viewBox="0 0 140 95" role="img" aria-label="중심점 양쪽의 점대칭 화살표"><path d="M65 42H22L36 27M22 42l14 15" fill="none" stroke="#e45f42" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M75 53h43L104 38m14 15l-14 15" fill="none" stroke="#16766d" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><circle cx="70" cy="48" r="6" fill="#292b2f"/></svg><button id="review-turn" class="btn btn-small" aria-pressed="false">반 바퀴 복습</button></article>`;
}

function transferSignMarkup() {
  return `<figure id="transfer-sign" class="transfer-sign"><svg viewBox="0 0 140 95" role="img" aria-label="반 바퀴 돌리면 겹치지만 한 직선으로 접으면 겹치지 않는 박물관 표지"><g class="transfer-sign-shape"><path d="M24 20H62V37H45" fill="none" stroke="#16766d" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M116 75H78V58H95" fill="none" stroke="#16766d" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></g><circle cx="70" cy="47.5" r="6" fill="#292b2f"/><circle class="turn-check" cx="120" cy="18" r="13" fill="#e8f6ed" stroke="#237044" stroke-width="3"/><path class="turn-check" d="M114 18l4 4 8-9" fill="none" stroke="#237044" stroke-width="3" stroke-linecap="round"/></svg><figcaption>새 표지판</figcaption></figure>`;
}

function quizVisualMarkup(index) {
  const visuals = [
    `<svg viewBox="0 0 220 120" role="img" aria-label="가운데 세로 대칭축을 따라 접으면 겹치는 잎 모양"><path d="M110 105C35 82 33 25 110 15C187 25 185 82 110 105Z" fill="#8bd0b9" stroke="#292b2f" stroke-width="4"/><line x1="110" y1="8" x2="110" y2="112" stroke="#b54732" stroke-width="4" stroke-dasharray="7 7"/></svg>`,
    `<svg viewBox="0 0 220 120" role="img" aria-label="가운데 점을 기준으로 반 바퀴 돌리면 겹치는 S형 도형"><path d="M154 25C132 8 77 9 70 34C64 58 103 59 119 61C144 65 151 78 143 93C131 113 79 111 59 93" fill="none" stroke="#16766d" stroke-width="17" stroke-linecap="round"/><circle cx="110" cy="60" r="6" fill="#292b2f"/></svg>`,
    quizGridVisual('axis'),
    quizGridVisual('center')
  ];
  return visuals[index];
}

function quizGridVisual(type) {
  const reference = type === 'axis'
    ? '<line x1="110" y1="8" x2="110" y2="132" stroke="#b54732" stroke-width="5" stroke-dasharray="7 7"/><circle cx="50" cy="50" r="9" fill="#16766d" stroke="#292b2f" stroke-width="3"/>'
    : '<circle cx="110" cy="70" r="8" fill="#292b2f"/><circle cx="150" cy="50" r="9" fill="#16766d" stroke="#292b2f" stroke-width="3"/>';
  const label = type === 'axis' ? '세로 대칭축 왼쪽 세 칸에 점이 있는 격자' : '대칭의 중심 오른쪽 두 칸, 위쪽 한 칸에 점이 있는 격자';
  return `<svg viewBox="0 0 220 140" role="img" aria-label="${label}"><path d="M20 10H200M20 30H200M20 50H200M20 70H200M20 90H200M20 110H200M20 130H200M30 0V140M50 0V140M70 0V140M90 0V140M110 0V140M130 0V140M150 0V140M170 0V140M190 0V140" stroke="#cbbca8" stroke-width="1"/>${reference}</svg>`;
}

function createCoreActivity(container, engine) {
  const stages = [
    { title: '1단계 · 선대칭 한 점', mode: 'fold', reference: 'axis', sources: [[1, 3]], presets: [{ value: 3, label: '가운데 축' }, { value: 2, label: '왼쪽 축' }] },
    { title: '2단계 · 점대칭 한 점', mode: 'turn', reference: 'center', sources: [[5, 1]], presets: [{ value: [3, 3], label: '가운데 중심' }, { value: [4, 2], label: '오른쪽 위 중심' }] },
    { title: '3단계 · 선분 도형 완성', mode: 'fold', reference: 'axis', sources: [[0, 1], [1, 1], [1, 2]], segments: [[0, 1], [1, 2]], presets: [{ value: 3, label: '가운데 축' }, { value: 2, label: '왼쪽 축' }] }
  ];
  const state = newCoreStageState(0, stages);
  renderCoreActivity(container, engine, stages, state);
  engine.showFeedback('1단계는 접기와 가운데 축이 기본으로 선택되어 있어요. 축 위치를 바꾸면 목표 대응점도 달라지는지 살펴보세요.', 'neutral');
}

function newCoreStageState(stageIndex, stages) {
  const stage = stages[stageIndex];
  return { stage: stageIndex, mode: stageIndex === 0 ? 'fold' : null, reference: stage.reference, referenceIndex: 0, placed: [], history: [], cursor: [0, 0], attempts: 0, preview: false, connected: false, connecting: false, connectionOrder: [], errorPoint: null };
}

function renderCoreActivity(container, engine, stages, state) {
  const stage = stages[state.stage];
  container.innerHTML = `<div class="core-shell"><div><div class="stage-status"><span>${stage.title}</span><span>시도 ${state.attempts}</span></div><div class="grid-wrap"><div id="grid-point-placement" class="symmetry-grid" role="grid" aria-label="7 곱하기 7 대칭점 격자"></div><svg id="grid-segments" class="grid-segments" viewBox="0 0 700 700" aria-hidden="true"></svg></div></div>${coreToolbox(stage)}</div>`;
  renderGrid(container, engine, stage, state);
  bindCoreControls(container, engine, stages, state);
  syncCoreControls(container, state);
}

function coreToolbox(stage) {
  const presets = stage.presets.map((preset, index) => `<button class="btn btn-small reference-preset" data-ref-index="${index}" aria-pressed="false">${preset.label}</button>`).join('');
  const previewId = stage.mode === 'fold' ? 'fold-preview' : 'turn-preview';
  const connect = stage.segments ? '<button id="connect-segments" class="btn btn-small">대응변 잇기</button>' : '';
  return `<aside class="toolbox" aria-label="복원 도구"><div class="tool-group"><h3>1. 움직임</h3><div class="tool-buttons"><button id="mode-fold" class="btn btn-small" aria-pressed="false">접기</button><button id="mode-turn" class="btn btn-small" aria-pressed="false">반 바퀴</button></div></div><div class="tool-group"><h3>2. 기준 위치</h3><div id="symmetry-reference" class="tool-buttons">${presets}<button id="ref-clear" class="btn btn-small">기준 지우기</button></div></div><div class="tool-group"><h3>3. 확인</h3><div class="tool-buttons"><button id="distance-check" class="btn btn-small">거리 확인</button><button id="${previewId}" class="btn btn-small" aria-pressed="false">움직임 미리보기</button><button id="undo-point" class="btn btn-small">되돌리기</button>${connect}</div><p id="distance-readout" class="distance-readout" role="status">점을 놓으면 거리를 비교할 수 있어요.</p></div><div class="tool-group"><button id="submit-restoration" class="btn btn-primary">복원 확인</button></div></aside>`;
}

function renderGrid(container, engine, stage, state) {
  const grid = container.querySelector('#grid-point-placement');
  for (let y = 0; y < 7; y += 1) {
    for (let x = 0; x < 7; x += 1) grid.appendChild(makeGridCell(x, y, engine, stage, state));
  }
  drawCoreSegments(container, stage, state);
  grid.addEventListener('keydown', (event) => handleGridKey(event, container, engine, stage, state));
}

function makeGridCell(x, y, engine, stage, state) {
  const cell = document.createElement('button');
  cell.type = 'button';
  cell.className = 'grid-cell';
  cell.dataset.x = x;
  cell.dataset.y = y;
  cell.tabIndex = samePoint(state.cursor, [x, y]) ? 0 : -1;
  cell.setAttribute('role', 'gridcell');
  addCellStates(cell, x, y, stage, state);
  cell.setAttribute('aria-label', describeGridCell(x, y, stage, state));
  if (samePoint(state.errorPoint, [x, y])) cell.setAttribute('aria-invalid', 'true');
  cell.addEventListener('click', () => placeCorePoint(cell.closest('#core-interactive-area'), engine, stage, state, [x, y]));
  return cell;
}

function addCellStates(cell, x, y, stage, state) {
  if (samePoint(state.cursor, [x, y])) cell.classList.add('cursor');
  if (stage.sources.some((point) => samePoint(point, [x, y]))) cell.classList.add('source');
  if (state.placed.some((point) => samePoint(point, [x, y]))) cell.classList.add('placed');
  const reference = currentReference(stage, state);
  if (state.reference === 'axis' && x === reference) cell.classList.add('axis');
  if (state.reference === 'center' && samePoint([x, y], reference)) cell.classList.add('center');
  if (state.preview && stage.sources.some((point) => samePoint(point, [x, y]))) cell.classList.add('preview');
  if (state.connectionOrder.some((point) => samePoint(point, [x, y]))) cell.classList.add('connection-point');
  if (samePoint(state.errorPoint, [x, y])) cell.classList.add('error-point');
}

function describeGridCell(x, y, stage, state) {
  const labels = [`가로 ${x + 1}, 세로 ${y + 1}`];
  const reference = currentReference(stage, state);
  if (stage.sources.some((point) => samePoint(point, [x, y]))) labels.push('별 모양 원래 점');
  if (state.placed.some((point) => samePoint(point, [x, y]))) labels.push('놓은 대응점');
  if (state.reference === 'axis' && x === reference) labels.push('대칭축 위');
  if (state.reference === 'center' && samePoint([x, y], reference)) labels.push('대칭의 중심');
  const order = state.connectionOrder.findIndex((point) => samePoint(point, [x, y]));
  if (order >= 0) labels.push(`대응변 연결 ${order + 1}번째 점`);
  return labels.join(', ');
}

function bindCoreControls(container, engine, stages, state) {
  const bind = (id, action) => container.querySelector(id).addEventListener('click', action);
  const stage = stages[state.stage];
  bind('#mode-fold', () => setCoreMode(container, engine, stage, state, 'fold'));
  bind('#mode-turn', () => setCoreMode(container, engine, stage, state, 'turn'));
  container.querySelectorAll('.reference-preset').forEach((button) => button.addEventListener('click', () => setCoreReference(container, engine, stage, state, Number(button.dataset.refIndex))));
  bind('#ref-clear', () => clearCoreReference(container, engine, stage, state));
  bind('#distance-check', () => showDistance(container, engine, stage, state));
  bind(stage.mode === 'fold' ? '#fold-preview' : '#turn-preview', () => togglePreview(container, engine, stage, state));
  bind('#undo-point', () => undoPoint(container, engine, stage, state));
  if (stage.segments) bind('#connect-segments', () => connectCoreSegments(container, engine, stage, state));
  bind('#submit-restoration', () => submitCore(container, engine, stages, state));
}

function setCoreMode(container, engine, stage, state, mode) {
  state.mode = mode;
  state.preview = false;
  state.connected = false;
  state.connecting = false;
  state.connectionOrder = [];
  syncCoreControls(container, state);
  refreshGrid(container, engine, stage, state);
  const reason = mode === 'fold' ? '접기는 대칭축을 기준으로 점을 반대쪽에 옮겨요.' : '반 바퀴는 대칭의 중심을 사이에 두고 점을 반대편으로 옮겨요.';
  engine.showFeedback(`${mode === 'fold' ? '접기' : '반 바퀴'}를 선택했어요. ${reason}`, 'neutral');
}

function setCoreReference(container, engine, stage, state, index) {
  const changed = state.reference !== stage.reference || state.referenceIndex !== index;
  const cleared = changed && resetCorePlacement(state);
  state.reference = stage.reference;
  state.referenceIndex = index;
  syncCoreControls(container, state);
  refreshGrid(container, engine, stage, state);
  if (changed) container.querySelector('#distance-readout').textContent = '새 기준에서 대응점을 놓고 거리를 다시 비교하세요.';
  const label = stage.presets[index].label;
  const value = stage.presets[index].value;
  const position = stage.reference === 'axis'
    ? `가로 ${value + 1}번째 칸을 지나는 세로축`
    : `가로 ${value[0] + 1}, 세로 ${value[1] + 1}번째 칸의 중심점`;
  const resetMessage = cleared ? ' 이전 기준에서 놓은 점과 되돌리기 기록은 비웠어요.' : '';
  engine.showFeedback(`${label}, ${position}(으)로 기준을 옮겼어요. 기준이 움직이면 목표 대응점도 바뀝니다.${resetMessage}`, 'neutral');
}

function clearCoreReference(container, engine, stage, state) {
  const cleared = state.reference !== null && resetCorePlacement(state);
  state.reference = null;
  syncCoreControls(container, state);
  refreshGrid(container, engine, stage, state);
  container.querySelector('#distance-readout').textContent = '기준을 다시 고르면 거리를 비교할 수 있어요.';
  engine.showFeedback(`기준을 지웠어요. 대칭은 기준이 있어야 대응점의 위치를 정할 수 있어요.${cleared ? ' 놓았던 점과 되돌리기 기록도 비웠어요.' : ''}`, 'neutral');
}

function resetCorePlacement(state) {
  const hadPlacement = state.placed.length > 0 || state.history.length > 0;
  state.placed = [];
  state.history = [];
  state.preview = false;
  state.connected = false;
  state.connecting = false;
  state.connectionOrder = [];
  state.errorPoint = null;
  return hadPlacement;
}

function syncCoreControls(container, state) {
  container.querySelector('#mode-fold').setAttribute('aria-pressed', String(state.mode === 'fold'));
  container.querySelector('#mode-turn').setAttribute('aria-pressed', String(state.mode === 'turn'));
  container.querySelectorAll('.reference-preset').forEach((button) => button.setAttribute('aria-pressed', String(state.reference !== null && Number(button.dataset.refIndex) === state.referenceIndex)));
  const preview = container.querySelector('#fold-preview, #turn-preview');
  preview.setAttribute('aria-pressed', String(state.preview));
}

function refreshGrid(container, engine, stage, state) {
  const grid = container.querySelector('#grid-point-placement');
  grid.replaceChildren();
  for (let y = 0; y < 7; y += 1) {
    for (let x = 0; x < 7; x += 1) grid.appendChild(makeGridCell(x, y, engine, stage, state));
  }
  drawCoreSegments(container, stage, state);
}

function currentReference(stage, state) {
  return stage.presets[state.referenceIndex].value;
}

function transformedPoints(stage, state) {
  if (state.reference !== stage.reference) return [];
  const reference = currentReference(stage, state);
  const points = stage.reference === 'axis'
    ? stage.sources.map(([x, y]) => [2 * reference - x, y])
    : stage.sources.map(([x, y]) => [2 * reference[0] - x, 2 * reference[1] - y]);
  return points.map((point) => isGridPoint(point) ? point : null);
}

function isGridPoint(point) {
  return Array.isArray(point) && point.length === 2 && point.every((value) => Number.isInteger(value) && value >= 0 && value < 7);
}

function drawCoreSegments(container, stage, state) {
  const svg = container.querySelector('#grid-segments');
  const lines = state.preview ? previewGuideMarkup(stage, state) : [];
  if (!stage.segments) {
    svg.innerHTML = lines.join('');
    return;
  }
  lines.push(...stage.segments.map(([from, to]) => gridSegmentMarkup(stage.sources[from], stage.sources[to], 'source-segment')));
  const expected = transformedPoints(stage, state);
  if (state.connected) stage.segments.forEach(([from, to]) => {
    if (pointIsPlaced(state, expected[from]) && pointIsPlaced(state, expected[to])) lines.push(gridSegmentMarkup(expected[from], expected[to], 'placed-segment'));
  });
  svg.innerHTML = lines.join('');
}

function previewGuideMarkup(stage, state) {
  if (state.reference !== stage.reference) return [];
  const reference = currentReference(stage, state);
  const targets = transformedPoints(stage, state);
  return stage.sources.flatMap((point, index) => {
    const from = [(point[0] + .5) * 100, (point[1] + .5) * 100];
    const target = targets[index];
    if (!target) return [];
    const to = [(target[0] + .5) * 100, (target[1] + .5) * 100];
    const pivot = stage.reference === 'axis' ? [(reference + .5) * 100, from[1] - 55] : [(reference[0] + .5) * 100, (reference[1] + .5) * 100 - 75];
    return [`<path d="M${from[0]} ${from[1]} Q${pivot[0]} ${pivot[1]} ${to[0]} ${to[1]}" class="preview-guide"/>`, `<circle cx="${to[0]}" cy="${to[1]}" r="21" class="preview-target"/>`];
  });
}

function pointIsPlaced(state, point) {
  return Boolean(point) && state.placed.some((placed) => samePoint(placed, point));
}

function gridSegmentMarkup(from, to, className) {
  return `<line x1="${(from[0] + .5) * 100}" y1="${(from[1] + .5) * 100}" x2="${(to[0] + .5) * 100}" y2="${(to[1] + .5) * 100}" class="${className}"/>`;
}

function placeCorePoint(container, engine, stage, state, point) {
  state.cursor = point;
  state.errorPoint = null;
  state.connected = false;
  if (stage.sources.some((source) => samePoint(source, point))) {
    engine.showFeedback('별 모양은 원래 점이에요. 반대쪽 빈칸에 대응점을 놓아 보세요.', 'neutral');
    refreshAndFocusGrid(container, engine, stage, state, point);
    return;
  }
  const reference = currentReference(stage, state);
  if (state.reference === 'axis' && point[0] === reference || state.reference === 'center' && samePoint(point, reference)) {
    engine.showFeedback('기준 위가 아니라 기준의 반대편에서 같은 거리인 칸을 찾아보세요.', 'neutral');
    refreshAndFocusGrid(container, engine, stage, state, point);
    return;
  }
  const existing = state.placed.findIndex((placed) => samePoint(placed, point));
  if (state.connecting) {
    selectConnectionPoint(container, engine, stage, state, point, existing);
    return;
  }
  if (existing >= 0) {
    state.placed.splice(existing, 1);
    state.history.push({ point: [...point], added: false });
    engine.showFeedback('놓았던 점을 뺐어요. 도형의 선분도 함께 바뀌었습니다.', 'neutral');
  }
  else {
    state.placed.push(point);
    state.history.push({ point: [...point], added: true });
    engine.showFeedback(`가로 ${point[0] + 1}, 세로 ${point[1] + 1} 칸에 점을 놓았어요. 기준까지 거리를 비교해 보세요.`, 'neutral');
  }
  refreshAndFocusGrid(container, engine, stage, state, point);
}

function selectConnectionPoint(container, engine, stage, state, point, existing) {
  if (existing < 0) {
    engine.showFeedback('대응변은 이미 놓은 점끼리 이어요. 점이 있는 칸을 선택하세요.', 'negative');
    refreshAndFocusGrid(container, engine, stage, state, point);
    return;
  }
  if (state.connectionOrder.some((selected) => samePoint(selected, point))) {
    engine.showFeedback('이미 고른 점이에요. 선을 따라 다음 점을 선택하세요.', 'neutral');
    return;
  }
  state.connectionOrder.push(point);
  finishConnectionIfReady(container, engine, stage, state);
  refreshAndFocusGrid(container, engine, stage, state, point);
}

function finishConnectionIfReady(container, engine, stage, state) {
  if (state.connectionOrder.length < stage.sources.length) {
    engine.showFeedback(`${state.connectionOrder.length}번째 점을 골랐어요. 원래 선분의 꺾이는 순서를 따라 다음 점을 고르세요.`, 'neutral');
    return;
  }
  const expected = transformedPoints(stage, state);
  const forward = samePointSequence(state.connectionOrder, expected);
  const backward = samePointSequence(state.connectionOrder, [...expected].reverse());
  state.connected = forward || backward;
  state.connecting = !state.connected;
  if (!state.connected) state.connectionOrder = [];
  engine.showFeedback(state.connected ? '점 세 개를 알맞은 순서로 이어 대응변을 완성했어요.' : '선분의 순서가 달라요. 원래 도형의 이어진 길을 보고 다시 연결하세요.', state.connected ? 'positive' : 'negative');
}

function samePointSequence(actual, expected) {
  return actual.length === expected.length && actual.every((point, index) => samePoint(point, expected[index]));
}

function refreshAndFocusGrid(container, engine, stage, state, point) {
  refreshGrid(container, engine, stage, state);
  const focused = container.querySelector(`.grid-cell[data-x="${point[0]}"][data-y="${point[1]}"]`);
  if (focused) focused.focus({ preventScroll: true });
}

function handleGridKey(event, container, engine, stage, state) {
  const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  if (moves[event.key]) {
    event.preventDefault();
    const move = moves[event.key];
    state.cursor = [clamp(state.cursor[0] + move[0]), clamp(state.cursor[1] + move[1])];
    refreshGrid(container, engine, stage, state);
    container.querySelector(`.grid-cell[data-x="${state.cursor[0]}"][data-y="${state.cursor[1]}"]`).focus();
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    placeCorePoint(container, engine, stage, state, state.cursor);
  }
}

function clamp(value) { return Math.max(0, Math.min(6, value)); }
function samePoint(a, b) { return Boolean(a && b) && a[0] === b[0] && a[1] === b[1]; }

function undoPoint(container, engine, stage, state) {
  const action = state.history.pop();
  if (!action) {
    engine.showFeedback('되돌릴 점이 없어요. 먼저 빈칸에 점을 놓아 보세요.', 'neutral');
    return;
  }
  const index = state.placed.findIndex((placed) => samePoint(placed, action.point));
  if (action.added && index >= 0) state.placed.splice(index, 1);
  if (!action.added && index < 0) state.placed.push(action.point);
  state.connected = false;
  state.connecting = false;
  state.connectionOrder = [];
  state.errorPoint = null;
  refreshGrid(container, engine, stage, state);
  const message = action.added ? '마지막에 놓은 점을 되돌렸어요.' : '마지막에 뺀 점을 다시 놓았어요.';
  engine.showFeedback(`${message} 이전 모양으로 돌아갔습니다.`, 'neutral');
}

function togglePreview(container, engine, stage, state) {
  if (state.mode !== stage.mode) {
    state.preview = false;
    syncCoreControls(container, state);
    refreshGrid(container, engine, stage, state);
    const correction = stage.mode === 'fold' ? '대칭축이 있는 이 과제는 접기로 확인해요.' : '대칭의 중심이 있는 이 과제는 반 바퀴 돌리기로 확인해요.';
    engine.showFeedback(correction, 'negative');
    container.querySelector(stage.mode === 'fold' ? '#mode-fold' : '#mode-turn').focus();
    return;
  }
  state.preview = !state.preview;
  syncCoreControls(container, state);
  refreshGrid(container, engine, stage, state);
  container.querySelector('#distance-readout').textContent = state.preview
    ? stage.mode === 'fold' ? '점선을 거울처럼 생각해 원래 점이 넘어가는 방향을 살펴보세요.' : '중심점을 사이에 두고 화살표를 반 바퀴 돌린다고 생각하세요.'
    : '미리보기를 껐어요. 대응점을 직접 놓아 보세요.';
  engine.showFeedback(state.preview ? '움직임의 궤적과 도착 윤곽을 표시했어요. 기준을 건너 같은 거리에 닿는지 살펴보세요.' : '움직임 미리보기를 껐어요.', 'neutral');
}

function connectCoreSegments(container, engine, stage, state) {
  const expected = transformedPoints(stage, state);
  if (!samePointSet(state.placed, expected)) {
    engine.showFeedback('대응점을 모두 정확히 놓은 뒤 대응변을 이어 보세요.', 'negative');
    focusFirstCoreError(container, engine, stage, state, expected);
    return;
  }
  state.connected = false;
  state.connecting = true;
  state.connectionOrder = [];
  engine.showFeedback('연결 시작! 놓은 점을 원래 도형의 선분 순서대로 하나씩 선택하세요.', 'neutral');
  container.querySelector('.grid-cell[tabindex="0"]').focus();
}

function showDistance(container, engine, stage, state) {
  const readout = container.querySelector('#distance-readout');
  if (!state.placed.length) {
    readout.textContent = '먼저 빈 격자에 대응점을 놓아 보세요.';
    engine.showFeedback('거리 확인에는 비교할 점이 필요해요. 먼저 대응점이라고 생각하는 칸을 눌러 보세요.', 'neutral');
    return;
  }
  const reference = currentReference(stage, state);
  if (state.reference === 'axis') {
    const sourceDistances = stage.sources.map((point) => Math.abs(point[0] - reference)).join(', ');
    const placedDistances = state.placed.map((point) => Math.abs(point[0] - reference)).join(', ');
    readout.textContent = `대칭축까지 거리 · 원래 점 ${sourceDistances}칸 / 놓은 점 ${placedDistances}칸`;
  } else if (state.reference === 'center') showCenterDistance(readout, stage, state, reference);
  else readout.textContent = '먼저 대칭축 또는 중심점을 선택하세요.';
  engine.showFeedback(state.reference ? '원래 점과 놓은 점이 기준의 반대편에서 같은 거리인지 수를 비교하세요.' : '대칭축이나 대칭의 중심을 먼저 골라야 거리를 잴 수 있어요.', 'neutral');
}

function showCenterDistance(readout, stage, state, center) {
  const format = (point) => `가로 ${Math.abs(point[0] - center[0])}, 세로 ${Math.abs(point[1] - center[1])}`;
  readout.textContent = `중심까지 거리 · 원래 점 ${format(stage.sources[0])} / 놓은 점 ${format(state.placed[0])}`;
}

function submitCore(container, engine, stages, state) {
  const stage = stages[state.stage];
  if (!validateCoreSetup(container, engine, stage, state)) return;
  const expected = transformedPoints(stage, state);
  const transformFits = expected.length === stage.sources.length && expected.every(isGridPoint);
  const pointsCorrect = transformFits && state.mode === stage.mode && state.reference === stage.reference && samePointSet(state.placed, expected);
  const correct = pointsCorrect && (!stage.segments || state.connected);
  if (!correct) {
    state.attempts += 1;
    container.querySelector('.stage-status span:last-child').textContent = `시도 ${state.attempts}`;
    const relation = stage.mode === 'fold' ? '대응점은 대칭축의 반대쪽에서 같은 거리에 있어야 해요.' : '중심이 두 대응점의 한가운데가 되도록 반 바퀴 돌려야 해요.';
    const recovery = pointsCorrect ? '대응변 잇기 버튼으로 놓은 점을 같은 순서로 이어 보세요.' : transformFits ? '기준과 움직임을 확인한 뒤 다시 놓아 보세요.' : '이 기준에서는 대응점이 격자 밖으로 나가요. 다른 기준을 골라 보세요.';
    engine.showFeedback(`${relation} ${recovery}`, 'negative');
    if (pointsCorrect) container.querySelector('#connect-segments').focus();
    else focusFirstCoreError(container, engine, stage, state, expected);
    return;
  }
  if (state.stage === stages.length - 1) {
    engine.showFeedback('세 유물을 모두 복원했어요! 대응점이 기준에서 같은 거리에 있음을 확인했습니다.', 'positive');
    engine.enableNext();
    showCoreTrophy(container);
    return;
  }
  const successReason = state.stage === 0
    ? '두 대응점은 대칭축에서 같은 거리만큼 떨어져 있고 같은 높이에 있어서 접으면 겹쳐요.'
    : '두 대응점은 대칭의 중심에서 가로·세로 같은 거리만큼 반대쪽에 있고, 중심이 두 점의 한가운데라서 반 바퀴 돌리면 겹쳐요.';
  Object.assign(state, newCoreStageState(state.stage + 1, stages));
  engine.showFeedback(`${stage.title} 복원 성공! ${successReason} 다음 유물로 이동합니다.`, 'positive');
  renderCoreActivity(container, engine, stages, state);
}

function validateCoreSetup(container, engine, stage, state) {
  if (state.mode !== stage.mode) {
    recordCoreAttempt(container, state);
    const correction = stage.mode === 'fold' ? '이 과제는 대칭축이 있으므로 접기를 선택하세요.' : '이 과제는 대칭의 중심이 있으므로 반 바퀴를 선택하세요.';
    engine.showFeedback(correction, 'negative');
    container.querySelector(stage.mode === 'fold' ? '#mode-fold' : '#mode-turn').focus();
    return false;
  }
  if (state.reference !== stage.reference) {
    recordCoreAttempt(container, state);
    engine.showFeedback('대칭축 또는 대칭의 중심 위치를 먼저 선택하세요.', 'negative');
    container.querySelector('.reference-preset').focus();
    return false;
  }
  return true;
}

function recordCoreAttempt(container, state) {
  state.attempts += 1;
  container.querySelector('.stage-status span:last-child').textContent = `시도 ${state.attempts}`;
}

function focusFirstCoreError(container, engine, stage, state, expected) {
  const wrong = state.placed.find((point) => !expected.some((target) => samePoint(point, target)));
  state.errorPoint = wrong || state.cursor;
  refreshGrid(container, engine, stage, state);
  const point = state.errorPoint;
  const cell = container.querySelector(`.grid-cell[data-x="${point[0]}"][data-y="${point[1]}"]`);
  if (cell) cell.focus({ preventScroll: true });
}

function samePointSet(actual, expected) {
  return actual.length === expected.length && expected.every((point) => actual.some((placed) => samePoint(placed, point)));
}

function showCoreTrophy(container) {
  container.querySelectorAll('button').forEach((button) => { button.disabled = true; });
  const trophy = document.createElement('div');
  trophy.className = 'trophy';
  trophy.innerHTML = '<img src="/contents/icons/icon-trophy-achievement-cute-20260124.svg" alt="대칭 복원 트로피"><span>격자 유물 3개 복원 완료</span>';
  container.appendChild(trophy);
}

window.Engine = new EduFlixEngine();

const data = {
  title: '도리와 대칭 박물관 복원 작전',
  hook: {
    question: '나비와 바람개비는 각각 어떻게 움직여야 완전히 겹칠까요?'
  },
  story: {
    character: { name: '도리', role: '대칭 박물관 복원 로봇' },
    situation: '접기와 반 바퀴 돌리기로 유물의 대칭을 확인합니다.'
  },
  interaction: {
    instruction: '움직임과 기준을 고르고, 격자에서 대응점을 직접 놓으세요. 방향키로 이동하고 Enter 또는 Space로도 놓을 수 있어요.',
    onInit: (container, engine) => { createCoreActivity(container, engine); }
  },
  quiz: [
    {
      question: '이 잎 모양은 가운데 세로선을 따라 접으면 양쪽이 정확히 겹칩니다. 어떤 도형인가요?',
      options: ['선대칭도형', '점대칭도형만 해당', '둘 다 아님'],
      answer: 0,
      wrongFeedback: '접었을 때 양쪽이 정확히 겹치는지가 중요해요. 겉모양만 보고 판단하지 마세요.',
      hint: '가운데 세로선을 경첩처럼 생각하고 오른쪽을 왼쪽으로 접어 보세요.',
      reason: '가운데 세로선을 따라 접었을 때 대응점과 대응변이 겹치므로 선대칭도형이에요.'
    },
    {
      question: '이 S형 도형은 한 직선으로 접으면 겹치지 않지만 가운데 점을 기준으로 반 바퀴 돌리면 겹칩니다. 어떤 도형인가요?',
      options: ['선대칭도형만 해당', '점대칭도형', '둘 다 아님'],
      answer: 1,
      wrongFeedback: '점대칭은 거울에 비추는 것이 아니라 한 점을 중심으로 반 바퀴 돌려 확인해요.',
      hint: '가운데 점을 누른 채 도형을 180도 돌린 모습을 떠올려 보세요.',
      reason: '가운데 점을 기준으로 반 바퀴 돌렸을 때 겹치므로 점대칭도형이에요.'
    },
    {
      question: '점 P가 세로 대칭축의 왼쪽으로 세 칸, 위쪽으로 한 칸에 있습니다. 대응점 P′는 어디에 있나요?',
      options: ['대칭축 오른쪽 세 칸, 같은 높이', '대칭축 오른쪽 두 칸, 같은 높이', '대칭축 왼쪽 세 칸, 아래쪽 한 칸', '대칭축 위의 점'],
      answer: 0,
      wrongFeedback: '대응점은 대칭축을 사이에 두고 서로 같은 거리만큼 떨어져야 해요.',
      hint: 'P에서 대칭축까지 세 칸을 센 뒤 반대편으로도 세 칸을 세어 보세요.',
      reason: '대응점은 대칭축 반대편의 같은 높이에서 축까지 세 칸 떨어져 있어요.'
    },
    {
      question: '점 A가 대칭의 중심에서 오른쪽 두 칸, 위쪽 한 칸에 있습니다. 점대칭도형을 완성하려면 대응점 A′를 어디에 놓아야 하나요?',
      options: ['중심에서 왼쪽 두 칸, 아래쪽 한 칸', '중심에서 왼쪽 두 칸, 위쪽 한 칸', '중심에서 오른쪽 두 칸, 아래쪽 한 칸', '중심에서 왼쪽 한 칸, 아래쪽 두 칸'],
      answer: 0,
      wrongFeedback: '한 방향만 바꾸면 거울에 비춘 위치가 됩니다. 반 바퀴 돌리면 가로와 세로 방향이 모두 반대가 돼요.',
      hint: '중심에서 A까지의 가로 두 칸과 세로 한 칸을 완전히 반대 방향으로 옮겨 보세요.',
      reason: '반 바퀴 돌리면 오른쪽 위의 점은 중심에서 같은 거리인 왼쪽 아래로 이동해요.'
    }
  ],
  wrap: {
    summary: [
      '선대칭도형은 한 직선을 따라 접으면 완전히 겹쳐요.',
      '점대칭도형은 한 점을 중심으로 반 바퀴 돌리면 완전히 겹쳐요.',
      '선대칭의 대응점은 대칭축에서 같은 거리에 있고 대응변도 겹쳐요.',
      '점대칭의 중심은 두 대응점을 이은 선분의 한가운데에 있어요. 종이에 새 점 두 개를 찍고 그 중점을 중심으로 반 바퀴 돌려 두 점이 서로 바뀌는지 확인해 보세요.'
    ],
    evidence: [
      '분류 성공: 퀴즈에서 접기와 반 바퀴 돌리기를 구별했어요.',
      '대응점 찾기 성공: 격자 1단계와 2단계를 복원했어요.',
      '도형 완성 성공: 격자 3단계의 대응점과 대응변을 완성했어요.'
    ]
  }
};

Engine.init(data);
