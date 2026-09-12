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
 * 이차함수 그래프
 */

const quadraticData = {
    objective: "계수와 그래프의 관계를 비교하고 꼭짓점과 x절편을 계산해요.",
    workedExample: "y=x²−4x+3=(x−2)²−1의 꼭짓점은 (2,−1)입니다. (x−1)(x−3)=0에서 x절편의 x좌표는 1과 3입니다. a=0이면 이차함수가 아니며 b와 c에 따라 일차함수 또는 상수함수가 됩니다.",
    reflection: "c만 2만큼 늘리면 모든 점의 y좌표는 어떻게 바뀔까요? 식에 같은 x를 넣어 비교하고 그래프의 이동으로 설명하세요.",
    title: "이차함수 그래프 탐구",
    hook: {
        question: "농구공이 날아가는 경로는 어떤 모양일까요?",
        subText: "포물선의 비밀을 알아봐요!",
        visual: {
            type: "svg",
            content: `
                <svg viewBox="0 0 400 220" class="hook-svg">
                    <!-- 좌표축 -->
                    <line x1="50" y1="180" x2="350" y2="180" stroke="#333" stroke-width="2"/>
                    <line x1="200" y1="20" x2="200" y2="180" stroke="#333" stroke-width="2"/>
                    <!-- 축 레이블 -->
                    <text x="360" y="185" font-size="14" fill="#333">x</text>
                    <text x="205" y="25" font-size="14" fill="#333">y</text>
                    <!-- 포물선 -->
                    <path d="M 80,170 Q 200,20 320,170" fill="none" stroke="#2196F3" stroke-width="3"/>
                    <!-- 꼭짓점 -->
                    <circle cx="200" cy="40" r="6" fill="#E91E63"/>
                    <text x="215" y="45" font-size="12" fill="#E91E63">꼭짓점</text>
                    <!-- 농구공 -->
                    <g class="ball-trajectory">
                        <circle cx="120" cy="130" r="12" fill="#FF9800" stroke="#E65100" stroke-width="2"/>
                        <path d="M108,130 Q120,118 132,130" fill="none" stroke="#E65100" stroke-width="1.5"/>
                        <path d="M108,130 Q120,142 132,130" fill="none" stroke="#E65100" stroke-width="1.5"/>
                        <line x1="120" y1="118" x2="120" y2="142" stroke="#E65100" stroke-width="1.5"/>
                    </g>
                    <!-- 공식 -->
                    <text x="200" y="210" text-anchor="middle" font-size="16" fill="#333" font-weight="bold">y = ax^2 + bx + c</text>
                </svg>
            `
        }
    },
    story: {
        character: { image: "assets/character.svg" },
        situation: "그래프 실험실에서 이차함수 계수를 비교합니다.<br>이 화면은 함수 그래프 모형이며 실제 로켓의 비행 조건을 계산하지는 않습니다."
    },
    interaction: {
        title: "파라볼라 실험실",
        instruction: "a=1, b=−4, c=3으로 설정하고 꼭짓점을 확인하세요. b와 c를 그대로 두고 a의 부호를 바꾸어 열린 방향을 비교하세요. a=0도 시험하고 이차항이 사라지는 이유를 설명하세요.",
        onInit: (container, engine) => {
            // State
            let a = 1;
            let b = 0;
            let c = 0;
            
            // Config
            const w = 500;
            const h = 400;
            const scale = 20; // px per unit
            const ox = w/2; // Origin X
            const oy = h/2; // Origin Y
            
            container.innerHTML = `
                <div class="formula-display">
                    y = <span id="val-a">1</span>x² <span id="val-b">+ 0</span>x <span id="val-c">+ 0</span>
                </div>
                
                <div class="graph-container">
                     <svg class="graph-canvas" id="graph-svg" viewBox="0 0 ${w} ${h}">
                        <!-- Content injected by render -->
                     </svg>
                </div>
                
                <div class="slider-panel">
                    <div class="slider-row">
                        <span class="slider-label" style="color:#E91E63">a</span>
                        <input type="range" id="slider-a" class="slider-input" min="-5" max="5" step="0.1" value="1">
                        <span class="slider-value" id="disp-a">1</span>
                    </div>
                    <div class="slider-row">
                        <span class="slider-label" style="color:#2196F3">b</span>
                        <input type="range" id="slider-b" class="slider-input" min="-10" max="10" step="0.5" value="0">
                        <span class="slider-value" id="disp-b">0</span>
                    </div>
                    <div class="slider-row">
                        <span class="slider-label" style="color:#9C27B0">c</span>
                        <input type="range" id="slider-c" class="slider-input" min="-10" max="10" step="1" value="0">
                        <span class="slider-value" id="disp-c">0</span>
                    </div>
                </div>
                 <div style="text-align: center; margin-top: 10px;">
                     <button class="btn btn-primary" id="check-quad-btn">완료</button>
                </div>
            `;
            
            const svg = container.querySelector('#graph-svg');
            const sliderA = container.querySelector('#slider-a');
            const sliderB = container.querySelector('#slider-b');
            const sliderC = container.querySelector('#slider-c');
            const dispA = container.querySelector('#disp-a');
            const dispB = container.querySelector('#disp-b');
            const dispC = container.querySelector('#disp-c');
            const valA = container.querySelector('#val-a');
            const valB = container.querySelector('#val-b');
            const valC = container.querySelector('#val-c');
            const checkBtn = container.querySelector('#check-quad-btn');

            const render = () => {
                // Background Grid & Axes
                let html = `
                    <line x1="0" y1="${oy}" x2="${w}" y2="${oy}" stroke="#333" stroke-width="2"/>
                    <line x1="${ox}" y1="0" x2="${ox}" y2="${h}" stroke="#333" stroke-width="2"/>
                `;
                
                // Draw Grid
                for(let x=0; x<=w; x+=scale) {
                     html += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="#eee" />`;
                }
                 for(let y=0; y<=h; y+=scale) {
                     html += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#eee" />`;
                }
                
                // Draw Parabola
                // Plot points
                let pathD = "M";
                let started = false;
                
                for(let px=0; px<=w; px+=5) {
                    // Screen X to Graph X
                    const gx = (px - ox) / scale;
                    // Graph Y
                    const gy = a * gx * gx + b * gx + c;
                    // Graph Y to Screen Y
                    const py = oy - gy * scale;
                    
                    if(py >= -100 && py <= h+100) { // Clip roughly
                        if(!started) {
                            pathD += `${px},${py}`;
                            started = true;
                        } else {
                            pathD += ` L${px},${py}`;
                        }
                    } else {
                        // if we go out of bounds, we might want to break the path or continue blindly?
                         if(started) pathD += ` L${px},${py}`;
                    }
                }
                
                html += `<path d="${pathD}" fill="none" stroke="#E91E63" stroke-width="3" />`;
                
                // Vertex
                const vx = -b / (2*a);
                const vy = a*vx*vx + b*vx + c;
                // Only draw if a != 0
                if(Math.abs(a) > 0.01) {
                    const svx = ox + vx*scale;
                    const svy = oy - vy*scale;
                    html += `<circle cx="${svx}" cy="${svy}" r="5" class="vertex-point" />`;
                }
                
                svg.innerHTML = html;
                
                // Update Text
                dispA.textContent = a;
                dispB.textContent = b;
                dispC.textContent = c;
                
                valA.textContent = String(a);
                valB.textContent = b >= 0 ? `+ ${b}` : b;
                valC.textContent = c >= 0 ? `+ ${c}` : c;
            };
            
            const updateState = () => {
                a = parseFloat(sliderA.value);
                b = parseFloat(sliderB.value);
                c = parseFloat(sliderC.value);
                render();
            };
            
            sliderA.oninput = updateState;
            sliderB.oninput = updateState;
            sliderC.oninput = updateState;
            
            checkBtn.onclick = () => {
                const msg = a === 0 ? "a=0이므로 이차항이 사라졌습니다. 이 그래프는 이차함수가 아닙니다." : a > 0 ? "a > 0 이므로 아래로 볼록하군요!" : "a < 0 이므로 위로 볼록하군요!";
                engine.showFeedback(msg, "neutral");
                engine.enableNext();
            };
            
            render();
        }
    },
    quiz: [
        {
                "question": "y = −x² + 4의 x절편의 x좌표는?",
                "options": [
                        "−2, 2",
                        "−4, 4",
                        "0",
                        "없다"
                ],
                "answer": 0,
                "explanation": "y=0을 대입하면 x²=4이므로 x=−2 또는 2입니다. x축과 만나는 점은 (−2,0), (2,0)입니다."
        },
        {
                "question": "y=(x−2)²−1의 꼭짓점은?",
                "options": [
                        "(−2,−1)",
                        "(2,−1)",
                        "(2,1)"
                ],
                "answer": 1,
                "explanation": "제곱 항이 0이 되는 x=2에서 y=−1입니다. 제곱의 계수가 양수이므로 이 값은 최솟값입니다."
        }
]
};

Engine.init(quadraticData);
