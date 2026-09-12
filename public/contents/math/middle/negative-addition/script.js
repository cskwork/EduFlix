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
 * 정수의 덧셈과 뺄셈
 */

const negativeData = {
    objective: "수직선 이동으로 정수의 덧셈과 뺄셈을 설명해요.",
    workedExample: "−3+5는 −3에서 오른쪽으로 5칸 이동하여 2입니다. −3−(−5)는 −3+(+5)와 같아 역시 2입니다. 어떤 수를 빼는 것은 그 수의 반대수를 더하는 것입니다.",
    reflection: "온도가 −3℃에서 5℃ 올라간 경우와 5℃ 내려간 경우를 각각 식으로 쓰고 결과를 설명하세요.",
    title: "정수의 덧셈과 뺄셈",
    hook: {
        question: "용돈 5000원에서 7000원을 쓰면 어떻게 될까요?",
        subText: "마이너스 통장이 된다고요?",
        visual: {
            type: "svg",
            content: `
                <svg viewBox="0 0 400 180" class="hook-svg">
                    <!-- 수직선 배경 -->
                    <rect x="0" y="70" width="400" height="40" fill="#E3F2FD" rx="5"/>
                    <!-- 수직선 -->
                    <line x1="20" y1="90" x2="380" y2="90" stroke="#333" stroke-width="2"/>
                    <!-- 눈금과 숫자 -->
                    <g font-size="12" text-anchor="middle">
                        <line x1="60" y1="85" x2="60" y2="95" stroke="#333" stroke-width="2"/>
                        <text x="60" y="120" fill="#E91E63">-3</text>
                        <line x1="120" y1="85" x2="120" y2="95" stroke="#333" stroke-width="2"/>
                        <text x="120" y="120" fill="#E91E63">-2</text>
                        <line x1="180" y1="85" x2="180" y2="95" stroke="#333" stroke-width="2"/>
                        <text x="180" y="120" fill="#E91E63">-1</text>
                        <line x1="240" y1="85" x2="240" y2="95" stroke="#333" stroke-width="3"/>
                        <text x="240" y="120" font-weight="bold">0</text>
                        <line x1="300" y1="85" x2="300" y2="95" stroke="#333" stroke-width="2"/>
                        <text x="300" y="120" fill="#4CAF50">+1</text>
                        <line x1="360" y1="85" x2="360" y2="95" stroke="#333" stroke-width="2"/>
                        <text x="360" y="120" fill="#4CAF50">+2</text>
                    </g>
                    <!-- 펭귄 캐릭터 (애니메이션) -->
                    <g class="penguin-move">
                        <circle cx="300" cy="60" r="15" fill="#333"/>
                        <circle cx="300" cy="55" r="8" fill="#FFF"/>
                        <circle cx="300" cy="54" r="3" fill="#333"/>
                        <polygon points="300,60 295,70 305,70" fill="#FF9800"/>
                    </g>
                    <!-- 화살표 -->
                    <path d="M300,45 L180,45" stroke="#E91E63" stroke-width="3" fill="none" marker-end="url(#arrowhead)" stroke-dasharray="5,3"/>
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#E91E63"/>
                        </marker>
                    </defs>
                    <text x="240" y="35" text-anchor="middle" font-size="14" fill="#E91E63">-2</text>
                </svg>
            `
        }
    },
    story: {
        character: { image: "assets/character.svg" },
        situation: "수직선 마을의 펭귄은 오른쪽(+)으로 가면 따뜻해지고, 왼쪽(-)으로 가면 추워져요.<br>펭귄을 움직여 계산 결과를 알아보세요!"
    },
    interaction: {
        title: "수직선 탐험",
        instruction: "0에서 더하기 −3으로 출발점을 만드세요. 이어 더하기 5를 해 보세요. 초기화한 뒤 다시 −3으로 가서 빼기 −5를 해 보고 두 도착점을 비교하세요. 마지막에는 −3에서 빼기 5를 시험하세요.",
        onInit: (container, engine) => {
            // State
            let currentPos = 0;
            const min = -10;
            const max = 10;
            
            container.innerHTML = `
                <div class="equation-display">
                    <span id="start-display">0</span> <span id="op-display"></span> <span id="num-display"></span> = <span id="result-display">0</span>
                </div>
                
                <div class="number-line-container">
                    <div class="number-line" id="line-base"></div>
                    <div class="character-marker" id="penguin" style="left: 50%;"></div>
                </div>
                
                <div class="controls-panel">
                    <span>현재 위치에서</span>
                    <select id="op-select" class="card-input" style="width:auto;">
                        <option value="+">더하기(+)</option>
                        <option value="-">빼기(-)</option>
                    </select>
                    <input type="number" id="input-num" class="card-input" value="3" min="-10" max="10">
                    <button class="btn btn-primary" id="move-btn">이동!</button>
                    <button class="btn btn-secondary" id="reset-btn">초기화</button>
                </div>
            `;
            
            const lineBase = container.querySelector('#line-base');
            const penguin = container.querySelector('#penguin');
            const opSelect = container.querySelector('#op-select');
            const inputNum = container.querySelector('#input-num');
            const moveBtn = container.querySelector('#move-btn');
            const resetBtn = container.querySelector('#reset-btn');
            
            const opDisplay = container.querySelector('#op-display');
            const numDisplay = container.querySelector('#num-display');
            const resultDisplay = container.querySelector('#result-display');

            // Render Number Line
            const width = 100; // percent
            const step = 100 / (max - min); // percent per unit
            
            for(let i=min; i<=max; i++) {
                const tick = document.createElement('div');
                tick.className = 'tick';
                tick.style.left = `${(i - min) * step}%`;
                lineBase.appendChild(tick);
                
                const label = document.createElement('div');
                label.className = 'tick-label';
                label.textContent = i;
                label.style.left = `${(i - min) * step}%`;
                lineBase.appendChild(label);
            }
            
            const updatePenguin = (pos) => {
                const percent = (pos - min) * step;
                penguin.style.transition = "left 1s cubic-bezier(0.25, 1, 0.5, 1)";
                penguin.style.left = `${percent}%`;
                resultDisplay.textContent = String(pos);
                

            };
            
            moveBtn.onclick = () => {
                const val = Number(inputNum.value);
                const op = opSelect.value;
                if (!inputNum.value.trim() || !Number.isInteger(val) || val < -10 || val > 10) { engine.showFeedback('−10부터 10까지 정수를 입력하세요.', 'negative'); return; }
                
                let moveAmount = val;
                if(op === '-') moveAmount = -val;
                
                if (currentPos + moveAmount < min || currentPos + moveAmount > max) {
                    engine.showFeedback(`계산 결과는 ${currentPos + moveAmount}입니다. 이 화면의 범위는 −10~10이므로 초기화하거나 다른 수를 선택하세요.`, 'neutral');
                    return;
                }
                container.querySelector('#start-display').textContent = currentPos;
                opDisplay.textContent = op;
                numDisplay.textContent = val >= 0 ? val : `(${val})`;
                
                // Show Animation
                currentPos += moveAmount;
                updatePenguin(currentPos);
                
                const direction = moveAmount > 0 ? '오른쪽' : moveAmount < 0 ? '왼쪽' : '제자리';
                engine.showFeedback(`${direction}으로 ${Math.abs(moveAmount)}칸. 현재 위치는 ${currentPos}입니다. 빼기는 반대수를 더하는 것과 같습니다.`, 'neutral');
                moveCount++;
                if (moveCount >= 3) engine.enableNext();
            };

            resetBtn.onclick = () => {
                currentPos = 0;
                container.querySelector('#start-display').textContent = '0';
                opDisplay.textContent = "";
                numDisplay.textContent = "";
                resultDisplay.textContent = "0";
                updatePenguin(0);
            };
            
            // Allow completion after a few moves
            let moveCount = 0;

        }
    },
    quiz: [
        {
                "question": "(−3) − (−5)의 결과는?",
                "options": [
                        "−8",
                        "−2",
                        "2",
                        "8"
                ],
                "answer": 2,
                "explanation": "음수 −5를 빼면 반대수 +5를 더합니다. −3+5=2입니다."
        },
        {
                "question": "−3 − 5를 수직선으로 설명하면?",
                "options": [
                        "−3에서 오른쪽으로 5칸",
                        "−3에서 왼쪽으로 5칸",
                        "5에서 오른쪽으로 3칸"
                ],
                "answer": 1,
                "explanation": "양수 5를 빼므로 출발점 −3에서 왼쪽으로 5칸 이동하여 −8에 도착합니다."
        }
]
};

Engine.init(negativeData);
