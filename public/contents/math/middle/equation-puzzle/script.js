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
            const { question, subText, visual } = this.data.hook;
            scene.innerHTML = `
                <div class="hook-content">
                    <div class="question-box">
                        <h1 class="hook-question">${question}</h1>
                        ${subText ? `<p class="hook-subtext">${subText}</p>` : ''}<p class="scene-text">학습 목표: ${this.data.objective}</p>
                    </div>
                    ${visual ? `<div class="hook-visual">${visual.content}</div>` : ''}
                    <button class="btn btn-primary-large" onclick="Engine.nextScene()">시작하기</button>
                </div>
            `;
            if (this.data.hook.onInit) this.data.hook.onInit(scene);
        });

        this.createScene('story', (scene) => {
            const { character, situation } = this.data.story;
            scene.innerHTML = `<div class="story-stage">${this.getCharacterMarkup(character)}</div><div class="scene-text typing-effect">${situation}<br><br>${this.data.workedExample}</div><button class="btn btn-primary-large animate-fade-in" onclick="Engine.nextScene()">다음</button>`;
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
            scene.innerHTML = `<h1 class="scene-title">🎉 완료!</h1><div class="wrap-summary"><p class="scene-text">오늘 배운 내용</p><h3>${this.data.title}</h3><p class="scene-text">${this.data.reflection}</p></div><div style="display:flex; gap:15px;"><button class="btn btn-secondary-large" onclick="location.reload()">다시하기</button><button class="btn btn-primary-large" onclick="window.parent.postMessage('close', '*')">홈으로</button></div>`;
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

    startQuiz(index = 0) {
        this.quizIndex = index;
        const q = this.data.quiz[index];
        const question = document.getElementById('quiz-question');
        question.textContent = `${index + 1} / ${this.data.quiz.length} · ${q.question}`;
        const container = document.getElementById('quiz-options');
        container.innerHTML = '';
        q.options.forEach((option, selected) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'quiz-option';
            button.textContent = option;
            button.onclick = () => this.checkQuiz(selected, q.answer, button);
            container.appendChild(button);
        });
        const feedback = document.createElement('p');
        feedback.id = 'quiz-explanation';
        feedback.className = 'scene-text';
        feedback.setAttribute('role', 'status');
        container.appendChild(feedback);
    }

    checkQuiz(selected, answer, button) {
        const container = document.getElementById('quiz-options');
        const options = container.querySelectorAll('.quiz-option');
        if (button.disabled) return;
        options.forEach(option => { option.disabled = true; });
        button.classList.add(selected === answer ? 'correct' : 'incorrect');
        options[answer].classList.add('correct');
        document.getElementById('quiz-explanation').textContent =
            (selected === answer ? '정답입니다. ' : '답을 비교해 보세요. ') + this.data.quiz[this.quizIndex].explanation;
        const next = document.createElement('button');
        next.type = 'button';
        next.className = 'btn btn-primary-large';
        next.textContent = this.quizIndex + 1 < this.data.quiz.length ? '해설을 읽었어요 · 다음 문항' : '해설을 읽었어요 · 정리하기';
        next.onclick = () => {
            if (this.quizIndex + 1 < this.data.quiz.length) this.startQuiz(this.quizIndex + 1);
            else this.nextScene();
        };
        container.appendChild(next);
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
    objective: "양변에 같은 연산을 적용하여 방정식을 풀고 대입해 확인해요.",
    workedExample: "3x+1=10에서 양변에 1을 빼면 3x=9, 양변을 3으로 나누면 x=3입니다. 원래 식에 넣으면 3×3+1=10으로 양변이 같습니다.",
    reflection: "2x−4=10을 풀 때 왜 한쪽에만 4를 더하면 안 될까요? 같은 무게의 저울에 빗대어 설명하세요.",
    title: "방정식 퍼즐",
    hook: {
        question: "양팔 저울의 균형을 맞추려면 x는 얼마일까요?",
        subText: "무게가 같으면 저울이 수평이 되겠죠?",
        visual: {
            type: "svg",
            content: `
                <svg viewBox="0 0 400 200" class="hook-svg">
                    <defs>
                        <linearGradient id="metalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#B0BEC5"/>
                            <stop offset="100%" style="stop-color:#78909C"/>
                        </linearGradient>
                    </defs>
                    <!-- 받침대 -->
                    <polygon points="200,180 150,200 250,200" fill="url(#metalGrad)"/>
                    <rect x="195" y="80" width="10" height="100" fill="url(#metalGrad)"/>
                    <!-- 저울대 (기울어진 상태) -->
                    <g class="balance-beam">
                        <rect x="50" y="75" width="300" height="8" fill="url(#metalGrad)" rx="4" transform="rotate(-8 200 80)"/>
                        <!-- 왼쪽 접시 -->
                        <ellipse cx="80" cy="95" rx="50" ry="10" fill="#FFE082"/>
                        <text x="80" y="85" text-anchor="middle" font-size="20" font-weight="bold" fill="#E91E63">2x</text>
                        <!-- 오른쪽 접시 -->
                        <ellipse cx="320" cy="65" rx="50" ry="10" fill="#FFE082"/>
                        <text x="320" y="55" text-anchor="middle" font-size="20" font-weight="bold" fill="#4CAF50">6</text>
                    </g>
                    <!-- 물음표 -->
                    <text x="200" y="150" text-anchor="middle" font-size="24" fill="#FF5722" class="pulse-text">x = ?</text>
                </svg>
            `
        }
    },
    story: {
        character: { image: "assets/character.svg" },
        situation: "고대 보물 창고의 문을 열려면 저울의 균형을 맞춰야 합니다.<br>x의 무게를 정확히 맞춰주세요!"
    },
    interaction: {
        title: "저울 균형 맞추기",
        instruction: "x를 입력해 저울을 맞추세요. 답을 누르기 전에 양변에 적용한 연산을 말하고, 맞춘 뒤 원래 식에 대입해 확인하세요. 막히면 힌트를 활용하세요.",
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
                "question": "방정식 2x + 4 = 10의 해는?",
                "options": [
                        "2",
                        "3",
                        "4",
                        "5"
                ],
                "answer": 1,
                "explanation": "양변에서 4를 빼면 2x=6입니다. 양변을 2로 나누면 x=3이며 2×3+4=10으로 검산합니다."
        },
        {
                "question": "3x = 21의 해는?",
                "options": [
                        "5",
                        "6",
                        "7",
                        "8"
                ],
                "answer": 2,
                "explanation": "양변을 0이 아닌 3으로 나누면 x=7입니다. 3×7=21로 확인할 수 있습니다."
        }
]
};

Engine.init(contentData);
