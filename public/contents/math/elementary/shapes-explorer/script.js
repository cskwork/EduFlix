/**
 * 도형 탐험가 - 독립형 스크립트
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
        if (!character || !character.image) return '<div class="story-character-emoji">🔷</div>';
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
   Draw Functions
   ======================================== */
// Draw functions (copied and adapted)
function drawTriangle(ctx, color) {
  const size = 100
  ctx.beginPath()
  ctx.moveTo(0, -size)
  ctx.lineTo(-size * 0.866, size * 0.5)
  ctx.lineTo(size * 0.866, size * 0.5)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 3
  ctx.stroke()
}

function drawSquare(ctx, color) {
  const size = 90
  ctx.fillStyle = color
  ctx.fillRect(-size, -size, size * 2, size * 2)
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 3
  ctx.strokeRect(-size, -size, size * 2, size * 2)
}

function drawPentagon(ctx, color) {
  const size = 90
  const sides = 5
  ctx.beginPath()
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI / sides) - Math.PI / 2
    const x = size * Math.cos(angle)
    const y = size * Math.sin(angle)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 3
  ctx.stroke()
}

function drawHexagon(ctx, color) {
  const size = 90
  const sides = 6
  ctx.beginPath()
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI / sides) - Math.PI / 2
    const x = size * Math.cos(angle)
    const y = size * Math.sin(angle)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 3
  ctx.stroke()
}

function drawCircle(ctx, color) {
  const size = 90
  ctx.beginPath()
  ctx.arc(0, 0, size, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 3
  ctx.stroke()
}

const shapesData = {
    triangle: { name: '삼각형', sides: 3, vertices: 3, color: '#ff6b6b', draw: drawTriangle, description: '세 개의 변과 세 개의 꼭짓점이 있어요.' },
    square: { name: '사각형', sides: 4, vertices: 4, color: '#4ecdc4', draw: drawSquare, description: '네 개의 변과 네 개의 꼭짓점이 있어요.' },
    pentagon: { name: '오각형', sides: 5, vertices: 5, color: '#45b7d1', draw: drawPentagon, description: '다섯 개의 변과 다섯 개의 꼭짓점이 있어요.' },
    hexagon: { name: '육각형', sides: 6, vertices: 6, color: '#96ceb4', draw: drawHexagon, description: '여섯 개의 변과 여섯 개의 꼭짓점이 있어요.' },
    circle: { name: '원', sides: 0, vertices: 0, color: '#ffeaa7', draw: drawCircle, description: '변과 꼭짓점이 없어요. 동그란 모양이에요.' }
};

const contentData = {
    objective: "변과 꼭짓점의 수로 다각형을 분류하고 원과 구별해요.",
    workedExample: "삼각형은 곧은 변 3개와 꼭짓점 3개가 있습니다. 모양을 돌리거나 길쭉하게 그려도 변의 수는 바뀌지 않습니다. 원에는 다각형의 곧은 변이나 꼭짓점이 없습니다.",
    reflection: "삼각형을 거꾸로 놓아도 삼각형일까요? 위치나 색 대신 어떤 특징으로 판단했는지 설명하세요.",
    title: "도형 탐험가",
    hook: {
        question: "네모, 세모, 동그라미... 이름이 뭘까요?",
        subText: "주변에서 찾을 수 있는 모양들이에요!",
        visual: {
            type: "svg",
            content: `
                <svg viewBox="0 0 400 180" class="hook-svg">
                    <!-- 삼각형 -->
                    <polygon points="80,140 40,60 120,60" fill="#FF6B6B" stroke="#fff" stroke-width="3"/>
                    <text x="80" y="110" text-anchor="middle" font-size="12" fill="#fff" font-weight="bold">3</text>
                    <!-- 사각형 -->
                    <rect x="150" y="60" width="80" height="80" fill="#4ECDC4" stroke="#fff" stroke-width="3"/>
                    <text x="190" y="105" text-anchor="middle" font-size="12" fill="#fff" font-weight="bold">4</text>
                    <!-- 오각형 -->
                    <polygon points="290,65 325,90 310,130 270,130 255,90" fill="#45B7D1" stroke="#fff" stroke-width="3"/>
                    <text x="290" y="105" text-anchor="middle" font-size="12" fill="#fff" font-weight="bold">5</text>
                    <!-- 원 -->
                    <circle cx="370" cy="100" r="40" fill="#FFEAA7" stroke="#fff" stroke-width="3"/>
                    <text x="370" y="105" text-anchor="middle" font-size="12" fill="#333" font-weight="bold">0</text>
                    <!-- 레이블 -->
                    <text x="200" y="170" text-anchor="middle" font-size="14" fill="#333">변의 개수가 이름이 돼요!</text>
                </svg>
            `
        }
    },
    story: {
        character: { image: "assets/character.svg" },
        situation: "도형 나라의 건축가가 잃어버린 설계도를 찾고 있어요.<br>도형들의 이름을 맞춰야 설계도가 완성된대요!"
    },
    interaction: {
        title: "도형 관찰하기",
        instruction: "도형을 둘 이상 선택해 변과 꼭짓점을 하나씩 세어 보세요. 삼각형과 사각형의 차이를 말하고, 종이에 모양이 다른 삼각형 두 개를 그려 비교하세요.",
        onInit: (container, engine) => {
             // UI Structure
             container.innerHTML = `
                <div class="exploration-area">
                    <div class="shape-tabs">
                         <div class="shape-selector" id="shape-selector"></div>
                    </div>
                    <div class="shape-display">
                        <canvas id="shape-canvas" width="300" height="300"></canvas>
                    </div>
                    <div class="shape-info">
                        <h2 class="shape-name" id="display-name"></h2>
                        <p class="shape-description" id="display-desc"></p>
                        <div class="shape-properties">
                            <div class="property"><span class="property-label">변</span><span class="property-value" id="val-sides">-</span></div>
                            <div class="property"><span class="property-label">꼭짓점</span><span class="property-value" id="val-vertices">-</span></div>
                        </div>
                    </div>
                </div>
             `;
             
             const canvas = container.querySelector('#shape-canvas');
             const ctx = canvas.getContext('2d');
             const selector = container.querySelector('#shape-selector');
             
             let currentShape = 'triangle';
             const explored = new Set();
             
             // Draw Shape
             const renderShape = (key) => {
                 const data = shapesData[key];
                 ctx.clearRect(0, 0, canvas.width, canvas.height);
                 ctx.save();
                 ctx.translate(canvas.width/2, canvas.height/2);
                 data.draw(ctx, data.color);
                 ctx.restore();
                 
                 // Info
                 container.querySelector('#display-name').textContent = data.name;
                 container.querySelector('#display-desc').textContent = data.description;
                 container.querySelector('#val-sides').textContent = data.sides;
                 container.querySelector('#val-vertices').textContent = data.vertices;
                 
                 // Update buttons
                 selector.querySelectorAll('.shape-btn').forEach(btn => {
                     btn.classList.toggle('active', btn.dataset.key === key);
                 });
                 
                 if(!explored.has(key)) {
                     explored.add(key);
                     const btn = selector.querySelector(`[data-key="${key}"]`);
                     if(btn) btn.classList.add('explored');
                     
                     if(explored.size === Object.keys(shapesData).length) {
                         engine.enableNext();
                         engine.showFeedback("모든 도형을 찾았습니다!", "positive");
                     }
                 }
             };
             
             // Build Selector
             Object.keys(shapesData).forEach(key => {
                 const btn = document.createElement('button');
                 btn.className = 'shape-btn';
                 btn.textContent = shapesData[key].name;
                 btn.dataset.key = key;
                 btn.onclick = () => {
                     currentShape = key;
                     renderShape(key);
                 };
                 selector.appendChild(btn);
             });
             
             // Init
             renderShape(currentShape);
        }
    },
    quiz: [
        {
                "question": "변이 3개이고 꼭짓점이 3개인 도형은?",
                "options": [
                        "사각형",
                        "삼각형",
                        "원",
                        "육각형"
                ],
                "answer": 1,
                "explanation": "삼각형은 곧은 변 3개와 꼭짓점 3개로 둘러싸인 도형입니다."
        },
        {
                "question": "다각형의 곧은 변과 꼭짓점이 없는 도형은?",
                "options": [
                        "삼각형",
                        "사각형",
                        "원",
                        "오각형"
                ],
                "answer": 2,
                "explanation": "원은 곡선으로 둘러싸여 있어 다각형의 곧은 변과 꼭짓점이 없습니다."
        }
]
};

Engine.init(contentData);
