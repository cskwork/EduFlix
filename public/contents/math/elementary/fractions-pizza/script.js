/**
 * 피자로 배우는 분수 - 독립형 스크립트
 */

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
            console.error('Scene container (#scene-container) not found!');
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
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    isImagePath(value) {
        return /^(?:\.{0,2}\/|assets\/|https?:\/\/|data:image\/)/i.test(value) ||
            /\.(svg|png|jpe?g|gif|webp|avif)$/i.test(value);
    }

    getCharacterMarkup(character) {
        if (!character || !character.image) {
            return '<div class="story-character-emoji">🍕</div>';
        }

        const imageValue = String(character.image);
        if (this.isImagePath(imageValue)) {
            const altText = character.alt ? this.escapeHtml(character.alt) : '캐릭터';
            return `<img class="story-character-image" src="${this.escapeHtml(imageValue)}" alt="${altText}" />`;
        }

        return `<div class="story-character-emoji">${this.escapeHtml(imageValue)}</div>`;
    }

    createScenes() {
        // 1. Hook Scene
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

        // 2. Story Scene
        this.createScene('story', (scene) => {
            const { character, situation } = this.data.story;
            const characterMarkup = this.getCharacterMarkup(character);
            scene.innerHTML = `
                <div class="story-stage" id="story-stage">
                    <div class="story-character" id="story-char">
                       ${characterMarkup}
                    </div>
                </div>
                <div class="scene-text typing-effect">${situation}<br><br>${this.data.workedExample}</div>
                <button class="btn btn-primary-large animate-fade-in" style="opacity:0; animation-delay: 1s;" onclick="Engine.nextScene()">다음</button>
            `;
        });

        // 3. Core Scene (Interaction)
        this.createScene('core', (scene) => {
            scene.innerHTML = `
                <h2 class="scene-title">${this.data.interaction.title || '체험하기'}</h2>
                <div class="scene-text">${this.data.interaction.instruction}</div>
                <div class="interactive-area" id="core-interactive-area"></div>
                <div id="core-feedback" class="scene-text" style="min-height: 2em;"></div>
                <button class="btn btn-primary-large" id="core-next-btn" style="display:none;" onclick="Engine.nextScene()">다음</button>
            `;
        }, () => {
             if (this.data.interaction.onInit) {
                 this.data.interaction.onInit(document.getElementById('core-interactive-area'), this);
             }
        });

        // 4. Quiz Scene
        if (this.data.quiz) {
            this.createScene('quiz', (scene) => {
                scene.innerHTML = `
                    <h2 class="scene-title">퀴즈!</h2>
                    <div class="scene-text" id="quiz-question"></div>
                    <div class="quiz-container" id="quiz-options"></div>
                `;
            }, () => {
                this.startQuiz();
            });
        }

        // 5. Wrap Scene
        this.createScene('wrap', (scene) => {
             scene.innerHTML = `
                <h1 class="scene-title">🎉 완료!</h1>
                <div class="wrap-summary">
                    <p class="scene-text">오늘 배운 내용</p>
                    <h3>${this.data.title}</h3><p class="scene-text">${this.data.reflection}</p>
                </div>
                <div style="display:flex; gap: 15px;">
                    <button class="btn btn-secondary-large" onclick="location.reload()">다시하기</button>
                    <button class="btn btn-primary-large" onclick="window.parent.postMessage('close', '*')">홈으로</button>
                </div>
            `;
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
        if (this.currentSceneId) {
            this.scenes.get(this.currentSceneId).hide();
        }
        
        if (this.scenes.has(sceneId)) {
            this.currentSceneId = sceneId;
            this.scenes.get(sceneId).show();
        } else {
            console.error(`Scene ${sceneId} does not exist`);
        }
    }

    nextScene() {
        const order = ['hook', 'story', 'core', 'quiz', 'wrap'];
        const currentIndex = order.indexOf(this.currentSceneId);
        if (currentIndex < order.length - 1) {
            this.switchScene(order[currentIndex + 1]);
        }
    }

    start() {
        this.switchScene('hook');
    }

    showFeedback(msg, type='neutral') {
        const el = document.getElementById('core-feedback');
        if(el) {
            el.innerHTML = msg;
            el.className = `scene-text feedback-${type}`;
        }
    }
    
    enableNext() {
        const btn = document.getElementById('core-next-btn');
        if(btn) {
            btn.style.display = 'inline-block';
            btn.classList.add('animate-fade-in');
        }
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
   Content Data - 피자로 배우는 분수
   ======================================== */
const pizzaContentData = {
    objective: "같은 크기로 나눈 피자 한 조각을 분수로 나타내고 전체의 크기를 확인해요.",
    workedExample: "피자 한 판이 전체입니다. 넓이가 같은 4조각 중 한 조각은 1/4입니다. 네 조각의 넓이가 서로 다르면 한 조각을 1/4이라고 부를 수 없습니다.",
    reflection: "작은 피자의 1/2과 큰 피자의 1/2은 같은 양일까요? 비교하기 전에 전체의 크기를 확인해야 하는 이유를 말해 보세요.",
    title: "피자로 배우는 분수",
    hook: {
        question: "피자를 똑같이 나누려면 어떻게 해야 할까?",
        subText: "친구들과 사이좋게 나눠 먹으려면요!",
        visual: {
            type: "svg",
            content: `
                <svg viewBox="0 0 400 200" class="hook-svg">
                    <!-- 피자 -->
                    <circle cx="200" cy="100" r="80" fill="#F5D0A9" stroke="#8B4513" stroke-width="4"/>
                    <!-- 토핑들 -->
                    <circle cx="180" cy="80" r="8" fill="#E53935"/>
                    <circle cx="220" cy="70" r="8" fill="#E53935"/>
                    <circle cx="200" cy="110" r="8" fill="#E53935"/>
                    <circle cx="170" cy="120" r="8" fill="#E53935"/>
                    <circle cx="230" cy="115" r="8" fill="#E53935"/>
                    <circle cx="190" cy="140" r="6" fill="#43A047"/>
                    <circle cx="210" cy="90" r="6" fill="#43A047"/>
                    <!-- 나누는 선 (점선) -->
                    <line x1="200" y1="20" x2="200" y2="180" stroke="#333" stroke-width="2" stroke-dasharray="8,4"/>
                    <line x1="120" y1="100" x2="280" y2="100" stroke="#333" stroke-width="2" stroke-dasharray="8,4"/>
                    <!-- 레이블 -->
                    <text x="150" y="60" font-size="20" fill="#2196F3" font-weight="bold">1/4</text>
                    <text x="230" y="60" font-size="20" fill="#2196F3" font-weight="bold">1/4</text>
                    <text x="150" y="160" font-size="20" fill="#2196F3" font-weight="bold">1/4</text>
                    <text x="230" y="160" font-size="20" fill="#2196F3" font-weight="bold">1/4</text>
                </svg>
            `
        }
    },
    story: {
        character: { image: "assets/character.svg" }, 
        situation: "피자 가게 사장님이 고민에 빠졌어요.<br>손님들이 '내 조각이 더 작잖아!'라고 화를 냈거든요.<br>여러분이 사장님을 도와 피자를 똑같이 나눠주세요!"
    },
    interaction: {
        title: "피자 나누기 연습",
        instruction: "피자를 4조각으로 나눈 뒤 확인하세요. 한 조각과 두 조각은 각각 전체의 얼마인지 말해 보세요. 화면은 누를 때마다 같은 넓이로 다시 나누는 모형입니다.",
        onInit: (container, engine) => {
            let currentSlices = 1;
            const targetSlices = 4;
            
            container.innerHTML = `
                <div class="pizza-container">
                    <div class="pizza" id="pizza-target"></div>
                </div>
                <div class="fraction-display">
                    <span id="current-slice-count">1</span>조각
                </div>
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button class="btn btn-secondary" id="reset-slice-btn">다시 하기</button>
                    <button class="btn btn-primary" id="check-slice-btn">확인</button>
                </div>
            `;
            
            const pizza = container.querySelector('#pizza-target');
            const countDisplay = container.querySelector('#current-slice-count');
            const checkBtn = container.querySelector('#check-slice-btn');
            const resetBtn = container.querySelector('#reset-slice-btn');

            const render = () => {
                pizza.innerHTML = '';
                const sliceAngle = 360 / currentSlices;
                for (let i = 0; i < currentSlices; i++) {
                    const slice = document.createElement('div');
                    slice.className = 'pizza-slice';
                    const rotation = i * sliceAngle;
                    
                    if (currentSlices > 1) {
                         slice.style.transform = `rotate(${rotation}deg)`;
                         slice.style.height = '50%';
                         slice.style.width = '2px';
                         slice.style.background = 'rgba(139, 69, 19, 0.5)';
                         slice.style.transformOrigin = 'bottom center';
                         slice.style.position = 'absolute';
                         slice.style.top = '0';
                         slice.style.left = '50%';
                    }
                    pizza.appendChild(slice);
                }
                
                pizza.style.background = `repeating-conic-gradient(
                    from 0deg,
                    #f5d0a9 0deg ${360/currentSlices - 2}deg,
                    #e6a15c ${360/currentSlices - 2}deg ${360/currentSlices}deg
                )`;
                
                countDisplay.textContent = currentSlices;
            };

            pizza.onclick = () => {
                if(currentSlices < 12) {
                    currentSlices++;
                    render();
                } else {
                    engine.showFeedback("너무 조각이 많아요!", "neutral");
                }
            };

            resetBtn.onclick = () => {
                currentSlices = 1;
                checkBtn.disabled = false;
                pizza.style.pointerEvents = 'auto';
                document.getElementById('core-next-btn').style.display = 'none';
                render();
                engine.showFeedback("", "neutral");
            };

            checkBtn.onclick = () => {
                if (currentSlices === targetSlices) {
                    engine.showFeedback("성공! 똑같이 4조각으로 나눠졌네요.", "positive");
                    engine.enableNext();
                    checkBtn.disabled = true;
                    pizza.style.pointerEvents = 'none';
                } else {
                     engine.showFeedback(`${targetSlices}조각이 아니에요. 다시 해보세요!`, "negative");
                }
            };
            
            render();
        }
    },
    quiz: [
        {
                "question": "피자 한 판을 8명이 한 조각씩 똑같이 나누어 먹으려면 몇 조각으로 나누어야 할까요?",
                "options": [
                        "4조각",
                        "6조각",
                        "8조각",
                        "12조각"
                ],
                "answer": 2,
                "explanation": "8명이 한 조각씩 먹으므로 같은 넓이의 8조각이 필요합니다. 한 조각은 전체의 1/8입니다."
        },
        {
                "question": "같은 크기의 피자에서 1/4조각 두 개를 모으면 얼마인가요?",
                "options": [
                        "1/8",
                        "2/4",
                        "2/8"
                ],
                "answer": 1,
                "explanation": "같은 전체의 1/4을 두 개 모았으므로 2/4이고, 전체의 절반인 1/2과 같습니다."
        }
]
};

Engine.init(pizzaContentData);
