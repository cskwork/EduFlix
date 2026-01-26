/* ========================================
   Inline EduFlix Engine
   ======================================== */
class Scene {
    constructor(id, element) {
        this.id = id;
        this.element = element;
        this.onEnter = null;
        this.onExit = null;
    }

    show() {
        this.element.classList.add('active');
        if (this.onEnter) this.onEnter();
    }

    hide() {
        this.element.classList.remove('active');
        if (this.onExit) this.onExit();
    }
}

class EduFlixEngine {
    constructor() {
        this.scenes = new Map();
        this.currentSceneId = null;
        this.data = {};
        this.container = document.getElementById('scene-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'scene-container';
            document.body.appendChild(this.container);
        }
    }

    init(gameData) {
        this.data = gameData;
        this.createScenes();
        this.start();
    }

    escapeHtml(value) {
        return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    isImagePath(value) {
        return /^(?:\.{0,2}\/|assets\/|https?:\/\/|data:image\/)/i.test(value) || /\.(svg|png|jpe?g|gif|webp|avif)$/i.test(value);
    }

    getCharacterMarkup(character) {
        if (!character || !character.image) return '<div class="story-character-emoji">🎓</div>';
        const imageValue = String(character.image);
        if (this.isImagePath(imageValue)) {
            const altText = character.alt ? this.escapeHtml(character.alt) : '캐릭터';
            return `<img class="story-character-image" src="${this.escapeHtml(imageValue)}" alt="${altText}" />`;
        }
        return `<div class="story-character-emoji">${this.escapeHtml(imageValue)}</div>`;
    }

    createScenes() {
        this.createScene('hook', (scene) => {
            scene.innerHTML = `<h1 class="hook-question">${this.data.hook.question}</h1><button class="btn btn-primary-large" onclick="Engine.nextScene()">시작하기</button>`;
        });

        this.createScene('story', (scene) => {
            const { character, situation } = this.data.story;
            scene.innerHTML = `<div class="story-stage">${this.getCharacterMarkup(character)}</div><div class="scene-text typing-effect">${situation}</div><button class="btn btn-primary-large animate-fade-in" onclick="Engine.nextScene()">다음</button>`;
        });

        this.createScene('core', (scene) => {
            scene.innerHTML = `<h2 class="scene-title">${this.data.interaction.title || '체험하기'}</h2><div class="scene-text">${this.data.interaction.instruction}</div><div class="interactive-area" id="core-interactive-area"></div><div id="core-feedback" class="scene-text"></div><button class="btn btn-primary-large" id="core-next-btn" style="display:none;" onclick="Engine.nextScene()">다음</button>`;
        }, () => { if (this.data.interaction.onInit) this.data.interaction.onInit(document.getElementById('core-interactive-area'), this); });

        if (this.data.quiz) {
            this.createScene('quiz', (scene) => {
                scene.innerHTML = `<h2 class="scene-title">퀴즈!</h2><div class="scene-text" id="quiz-question"></div><div class="quiz-container" id="quiz-options"></div>`;
            }, () => { this.startQuiz(); });
        }

        this.createScene('wrap', (scene) => {
            scene.innerHTML = `<h1 class="scene-title">🎉 완료!</h1><div class="wrap-summary"><p class="scene-text">오늘 배운 내용</p><h3>${this.data.title}</h3></div><div style="display:flex; gap:15px;"><button class="btn btn-secondary-large" onclick="location.reload()">다시하기</button><button class="btn btn-primary-large" onclick="window.parent.postMessage('close', '*')">홈으로</button></div>`;
        });
    }

    createScene(id, renderFn, onEnterFn) {
        let sceneEl = document.createElement('div');
        sceneEl.id = `scene-${id}`;
        sceneEl.className = `scene scene-${id}`;
        renderFn(sceneEl);
        this.container.appendChild(sceneEl);
        const scene = new Scene(id, sceneEl);
        if (onEnterFn) scene.onEnter = onEnterFn;
        this.scenes.set(id, scene);
    }

    switchScene(sceneId) {
        if (this.currentSceneId) this.scenes.get(this.currentSceneId).hide();
        if (this.scenes.has(sceneId)) { this.currentSceneId = sceneId; this.scenes.get(sceneId).show(); }
    }

    nextScene() {
        const order = ['hook', 'story', 'core', 'quiz', 'wrap'];
        const currentIndex = order.indexOf(this.currentSceneId);
        if (currentIndex < order.length - 1) this.switchScene(order[currentIndex + 1]);
    }

    start() { this.switchScene('hook'); }

    showFeedback(msg, type='neutral') {
        const el = document.getElementById('core-feedback');
        if(el) { el.innerHTML = msg; el.className = `scene-text feedback-${type}`; }
    }

    enableNext() {
        const btn = document.getElementById('core-next-btn');
        if(btn) { btn.style.display = 'inline-block'; btn.classList.add('animate-fade-in'); }
    }

    startQuiz() {
        const q = this.data.quiz[0];
        document.getElementById('quiz-question').textContent = q.question;
        const optsContainer = document.getElementById('quiz-options');
        optsContainer.innerHTML = '';
        q.options.forEach((opt, idx) => {
            const btn = document.createElement('div');
            btn.className = 'quiz-option';
            btn.textContent = opt;
            btn.onclick = () => this.checkQuiz(idx, q.answer, btn);
            optsContainer.appendChild(btn);
        });
    }

    checkQuiz(selectedIdx, correctIdx, btnElement) {
        const opts = document.querySelectorAll('.quiz-option');
        opts.forEach(o => o.style.pointerEvents = 'none');
        if (selectedIdx === correctIdx) {
            btnElement.classList.add('correct');
            setTimeout(() => this.nextScene(), 1500);
        } else {
            btnElement.classList.add('incorrect');
            opts[correctIdx].classList.add('correct');
            setTimeout(() => this.nextScene(), 2000);
        }
    }
}

window.Engine = new EduFlixEngine();

/* ========================================
   Content Code
   ======================================== */
/**
 * 방정식 퍼즐 (Recreated with Shared Engine)
 */

const problems = [
  { equation: '2x = 6', left: '2x', right: '6', answer: 3, hint: '양변을 2로 나누어 보세요.' },
  { equation: '3x + 1 = 10', left: '3x+1', right: '10', answer: 3, hint: '먼저 1을 빼보세요.' },
  { equation: '2x - 4 = 10', left: '2x-4', right: '10', answer: 7, hint: '먼저 4를 더해보세요.' },
  { equation: '5x = 25', left: '5x', right: '25', answer: 5, hint: '5단 구구단을 생각해보세요.' }
];

const contentData = {
    title: "방정식 퍼즐",
    hook: {
        question: "양팔 저울의 균형을 맞추려면 x는 얼마일까요?"
    },
    story: {
        character: { image: "assets/character.svg" },
        situation: "고대 보물 창고의 문을 열려면 저울의 균형을 맞춰야 합니다.<br>x의 무게를 정확히 맞춰주세요!"
    },
    interaction: {
        title: "저울 균형 맞추기",
        instruction: "방정식을 보고 x의 값을 입력하여 저울의 수평을 맞추세요.",
        onInit: (container, engine) => {
             // State
             let currentIdx = 0;
             
             // UI
             container.innerHTML = `
                <div class="equation-display" id="eq-display"></div>
                <div class="balance-container">
                    <div class="balance-scale">
                        <div class="balance-bar" id="balance-bar">
                            <div class="plate left">
                                <div class="value-box" id="left-val"></div>
                            </div>
                            <div class="plate right">
                                <div class="value-box" id="right-val"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="input-area">
                    <span>x = </span>
                    <input type="number" id="answer-input" placeholder="?">
                    <button class="btn btn-primary" id="check-btn">확인</button>
                    <button class="btn btn-secondary" id="hint-btn">힌트</button>
                </div>
             `;
             
             const eqDisplay = container.querySelector('#eq-display');
             const leftVal = container.querySelector('#left-val');
             const rightVal = container.querySelector('#right-val');
             const balanceBar = container.querySelector('#balance-bar');
             const input = container.querySelector('#answer-input');
             const checkBtn = container.querySelector('#check-btn');
             const hintBtn = container.querySelector('#hint-btn');
             
             const loadProblem = () => {
                 const p = problems[currentIdx];
                 eqDisplay.textContent = p.equation;
                 leftVal.textContent = p.left;
                 rightVal.textContent = p.right;
                 input.value = '';
                 input.focus();
                 balanceBar.style.transform = 'translateX(-50%) rotate(0deg)';
                 checkBtn.disabled = false;
                 
                  // Random initial tilt
                 const tilt = Math.random() > 0.5 ? 10 : -10;
                 balanceBar.style.transform = `translateX(-50%) rotate(${tilt}deg)`;
             };
             
             checkBtn.onclick = () => {
                 const val = parseFloat(input.value);
                 const p = problems[currentIdx];
                 
                 if (val === p.answer) {
                     balanceBar.style.transform = 'translateX(-50%) rotate(0deg)';
                     engine.showFeedback("정답입니다! 균형이 맞았습니다.", "positive");
                     checkBtn.disabled = true;
                     
                     setTimeout(() => {
                         if(currentIdx < problems.length - 1) {
                             currentIdx++;
                             loadProblem();
                             engine.showFeedback("다음 문제로 넘어갑니다.", "neutral");
                         } else {
                             engine.enableNext();
                             engine.showFeedback("모든 자물쇠가 풀렸습니다!", "positive");
                         }
                     }, 1500);
                 } else {
                     const tilt = val > p.answer ? -15 : 15; // Simple direction check logic, usually logic is complex but this is visual proxy
                     balanceBar.style.transform = `translateX(-50%) rotate(${tilt}deg)`;
                     engine.showFeedback("틀렸습니다. 저울이 기울어집니다.", "negative");
                 }
             };
             
             hintBtn.onclick = () => {
                 engine.showFeedback(problems[currentIdx].hint, "neutral");
             };
             
             loadProblem();
        }
    },
    quiz: [
        {
            question: "방정식 2x + 4 = 10 의 해는?",
            options: ["2", "3", "4", "5"],
            answer: 1
        },
        {
            question: "3x = 21 의 해는?",
            options: ["5", "6", "7", "8"],
            answer: 2
        }
    ]
};

Engine.init(contentData);
