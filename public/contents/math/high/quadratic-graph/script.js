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
 * 이차함수 그래프
 */

const quadraticData = {
    title: "이차함수 그래프 탐구",
    hook: {
        question: "농구공이 날아가는 경로는 어떤 모양일까요?"
    },
    story: {
        character: { image: "assets/character.svg" },
        situation: "물리학자가 로켓을 쏘아 올리려고 해요.<br>이차함수 계수 a, b, c를 조절하여 로켓의 궤도를 완성해주세요!"
    },
    interaction: {
        title: "파라볼라 실험실",
        instruction: "슬라이더를 움직여 y = ax² + bx + c 그래프를 조작해보세요.",
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
                    y = <span id="val-a">1</span>x² + <span id="val-b">0</span>x + <span id="val-c">0</span>
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
                
                valA.textContent = a;
                valB.textContent = b >= 0 ? `+ ${b}` : b;
                valC.textContent = c >= 0 ? `+ ${c}` : c;
            };
            
            const updateState = () => {
                a = parseFloat(sliderA.value);
                if(a === 0) a = 0.1; // Avoid line
                b = parseFloat(sliderB.value);
                c = parseFloat(sliderC.value);
                render();
            };
            
            sliderA.oninput = updateState;
            sliderB.oninput = updateState;
            sliderC.oninput = updateState;
            
            checkBtn.onclick = () => {
                const msg = a > 0 ? "a > 0 이므로 아래로 볼록하군요!" : "a < 0 이므로 위로 볼록하군요!";
                engine.showFeedback(msg, "neutral");
                engine.enableNext();
            };
            
            render();
        }
    },
    quiz: [
        {
            question: "이차함수 y = -x² + 4 의 그래프가 x축과 만나는 점(x절편)은 어디일까요?",
            options: ["-2, 2", "-4, 4", "0", "없다"],
            answer: 0
        }
    ]
};

Engine.init(quadraticData);
