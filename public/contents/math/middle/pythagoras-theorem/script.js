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
 * 피타고라스의 정리
 */

const pythagorasData = {
    title: "피타고라스의 정리",
    hook: {
        question: "직각삼각형의 세 변 사이에는 어떤 비밀이 숨겨져 있을까요?"
    },
    story: {
        character: { image: "assets/character.svg" }, // Placeholder, engine might use default if missing
        situation: "고대 그리스의 수학자 피타고라스가 타일 바닥을 보다가 깜짝 놀랐습니다.<br>'어? 이 직각삼각형 빗변 위의 정사각형 넓이가 나머지 두 정사각형 넓이의 합과 같네!'"
    },
    interaction: {
        title: "직각삼각형 탐구",
        instruction: "파란색 점을 드래그하여 직각삼각형의 모양을 바꿔보세요.",
        onInit: (container, engine) => {
            // State
            let a = 3;
            let b = 4;
            // Scale for display (pixels per unit)
            const scale = 30;
            const offsetX = 250; // Center X
            const offsetY = 250; // Center Y
            
            // Create DOM
            container.innerHTML = `
                <div class="pythagoras-container">
                    <svg class="triangle-svg" id="pytha-svg">
                        <!-- Squares -->
                        <g id="squares-group"></g>
                        <!-- Triangle -->
                        <path id="triangle-path" fill="rgba(33, 150, 243, 0.2)" stroke="#2196F3" stroke-width="2"/>
                        <!-- Vertices -->
                        <circle id="vertex-drag" r="8" class="vertex-handle" />
                        <circle id="vertex-static-1" r="5" fill="#333" />
                        <circle id="vertex-static-2" r="5" fill="#333" />
                        <!-- Labels -->
                        <text id="label-a" fill="#E91E63" font-size="14" font-weight="bold"></text>
                        <text id="label-b" fill="#4CAF50" font-size="14" font-weight="bold"></text>
                        <text id="label-c" fill="#9C27B0" font-size="14" font-weight="bold"></text>
                    </svg>
                </div>
                <div class="info-panel">
                    <span class="equation-part val-a">a² = <span id="val-aaa">9</span></span>
                    <span class="equation-part val-b">b² = <span id="val-bbb">16</span></span>
                    <span class="equation-part val-c">c² = <span id="val-ccc">25</span></span>
                </div>
                <div class="info-panel">
                    <span id="equation-check">9 + 16 = 25 (성립!)</span>
                </div>
                <div style="text-align: center; margin-top: 10px;">
                     <button class="btn btn-primary" id="check-pytha-btn">확인했습니다!</button>
                </div>
            `;

            const svg = container.querySelector('#pytha-svg');
            const squaresGroup = container.querySelector('#squares-group');
            const trianglePath = container.querySelector('#triangle-path');
            const vertexDrag = container.querySelector('#vertex-drag');
            const vertexStatic1 = container.querySelector('#vertex-static-1');
            const vertexStatic2 = container.querySelector('#vertex-static-2');
            
            const labelA = container.querySelector('#label-a');
            const labelB = container.querySelector('#label-b');
            const labelC = container.querySelector('#label-c');

            const valAAA = container.querySelector('#val-aaa');
            const valBBB = container.querySelector('#val-bbb');
            const valCCC = container.querySelector('#val-ccc');
            const equationCheck = container.querySelector('#equation-check');
            const checkBtn = container.querySelector('#check-pytha-btn');

            // Render Function
            const render = () => {
                // Coordinates
                // Right angle at (0,0) relative to offset
                // Vertex C (Right Angle) at (offsetX, offsetY)
                // Vertex A at (offsetX, offsetY - a*scale)  (Top)
                // Vertex B at (offsetX + b*scale, offsetY)  (Right)
                
                // Let's position right angle at bottom-left ish? 
                // Let's put Right Angle at (offsetX, offsetY)
                // Leg 'a' is vertical (up), Leg 'b' is horizontal (right)
                
                const xC = 150; 
                const yC = 300; // Fixed Right Angle Corner

                // Drag point controls 'a' (height) and 'b' (width) ??
                // Actually let's make drag point Vertex A (top) to control height 'a'
                // And another drag point ?? 
                // For simplicity, let's fix C, and let user drag A (vertical) and B (horizontal) independently?
                // Or just one point (A) and B is fixed? 
                // Let's try: Drag A (moves vertically), B is fixed width? 
                // Better: 2 handles if possible, but let's stick to 1 for simplicity of this snippet.
                // Drag handle moves both? No.
                
                // Impl: Drag handle is Vertex B (the one on the right).
                // User changes base 'b'. Height 'a' is fixed? No that's boring.
                // Let's allow dragging the Hypotenuse tip?
                
                // Let's make it simpler: Fixed orientation.
                // Drag Handle 1: Top Vertex (Controls 'a')
                // Drag Handle 2: Bottom-Right Vertex (Controls 'b')
                // Right-Angle Vertex is fixed.
                
                // Rewriting logic: 
                // We use mouse movement to update a and b.
            };
            
            // Simplified Render for this demo:
            // Fixed Right Angle at (150, 250)
            // A is (150, 250 - a*scale)
            // B is (150 + b*scale, 250)
            
            const originX = 150; 
            const originY = 250;

            const updateView = () => {
                const Ax = originX;
                const Ay = originY - a * scale;
                const Bx = originX + b * scale;
                const By = originY;
                
                // Update Triangle
                trianglePath.setAttribute('d', `M${originX},${originY} L${Ax},${Ay} L${Bx},${By} Z`);
                
                // Update Vertices
                vertexStatic1.setAttribute('cx', originX); vertexStatic1.setAttribute('cy', originY); // Right Angle
                // vertexDrag controls Both? No let's control B with one handle.
                
                vertexDrag.setAttribute('cx', Bx); vertexDrag.setAttribute('cy', By);

                // Let's assume 'a' is fixed at 3 for a moment or make 'a' vary with time?
                // Let's add functionality to drag B.
                
                // Squares
                // Square on 'a' (Left side)
                const sqA_Path = `M${originX},${originY} L${Ax},${Ay} L${Ax-a*scale},${Ay} L${originX-a*scale},${originY} Z`;
                // Square on 'b' (Bottom side)
                const sqB_Path = `M${originX},${originY} L${Bx},${By} L${Bx},${By+b*scale} L${originX},${originY+b*scale} Z`;
                // Square on 'c' (Hypotenuse)
                // Slope vector (Bx-Ax, By-Ay) = (b*scale, a*scale)
                // Normal vector (-a*scale, b*scale) normalized? No.
                // Vector AB = (b*scale, a*scale) -> length c*scale
                // Rotated -90 deg: (a*scale, -b*scale)
                const dx = Bx - Ax;
                const dy = By - Ay;
                // Square points C1(Ax,Ay), C2(Bx,By), C3(Bx-dy, By+dx), C4(Ax-dy, Ay+dx) - wait signs
                // Normal to AB pointing "up/left": (-dy, dx) ? 
                // AB vector is (b*scale, a*scale). 
                // We want square "outward". 
                // Let's just use simple math.
                
                const c = Math.sqrt(a*a + b*b);
                const sqC_Path = `M${Ax},${Ay} L${Bx},${By} L${Bx + dy},${By - dx} L${Ax + dy},${Ay - dx} Z`; // Check signs visually

                squaresGroup.innerHTML = `
                    <path d="${sqA_Path}" class="square-a" />
                    <path d="${sqB_Path}" class="square-b" />
                    <path d="${sqC_Path}" class="square-c" />
                `;

                // Text
                labelA.setAttribute('x', originX - 40); labelA.setAttribute('y', (originY+Ay)/2); labelA.textContent = `a=${a}`;
                labelB.setAttribute('x', (originX+Bx)/2); labelB.setAttribute('y', originY + 30); labelB.textContent = `b=${b}`;
                labelC.setAttribute('x', (Ax+Bx)/2 + 10); labelC.setAttribute('y', (Ay+By)/2 - 10); labelC.textContent = `c=${c.toFixed(1)}`;

                // Info Panel
                const A2 = a*a;
                const B2 = b*b;
                const C2 = (c*c).toFixed(0); // Should be integer if 3,4,5
                valAAA.textContent = A2;
                valBBB.textContent = B2;
                valCCC.textContent = parseFloat((a*a + b*b).toFixed(2));
                
                equationCheck.innerHTML = `<span style="color:#E91E63">${A2}</span> + <span style="color:#4CAF50">${B2}</span> = <span style="color:#9C27B0">${parseInt(A2)+parseInt(B2)}</span>`;
            
                // Logic check
                if (A2 + B2 === parseInt(A2+B2)) {
                   //
                }
            };
            
            // Drag Logic
            let isDragging = false;
            
            vertexDrag.onmousedown = (e) => {
                isDragging = true;
                e.preventDefault();
            };
            
            window.onmousemove = (e) => {
                if(!isDragging) return;
                const rect = container.querySelector('svg').getBoundingClientRect();
                const x = e.clientX - rect.left;
                // Constrain to horizontal axis for B
                const newB = Math.max(1, Math.min(8, Math.round((x - originX) / scale)));
                // Snap to integers for nicer numbers
                b = newB;
                updateView();
            };
            
            window.onmouseup = () => {
                isDragging = false;
            };

            // Init
            updateView();
            
            checkBtn.onclick = () => {
                engine.showFeedback("맞아요! 직각삼각형에서는 항상 a² + b² = c²가 성립합니다.", "positive");
                engine.enableNext();
            };
        }
    },
    quiz: [
        {
            question: "직각삼각형의 두 변의 길이가 5cm, 12cm일 때, 빗변의 길이는 얼마일까요?",
            options: ["13cm", "15cm", "17cm", "25cm"],
            answer: 0
        }
    ]
};

Engine.init(pythagorasData);
