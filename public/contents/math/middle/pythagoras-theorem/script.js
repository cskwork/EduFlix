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
 * 피타고라스의 정리
 */

const pythagorasData = {
    objective: "직각삼각형의 세 변 위 정사각형 넓이로 a²+b²=c²를 설명해요.",
    workedExample: "직각을 끼는 두 변이 3, 4이면 그 위 정사각형의 넓이는 9, 16입니다. 빗변 위 넓이는 25이므로 빗변의 길이는 √25=5입니다. 넓이와 길이의 단위를 구별하세요.",
    reflection: "길이가 3, 4, 6인 세 변에는 3²+4²=6²이 성립하나요? 직각 표시를 확인해야 하는 이유를 설명하세요.",
    title: "피타고라스의 정리",
    hook: {
        question: "직각삼각형의 세 변 사이에는 어떤 비밀이 숨겨져 있을까요?",
        subText: "직각삼각형의 세 변 위에 정사각형을 그려 비교해요!",
        visual: {
            type: "svg",
            content: `
                <svg viewBox="0 0 400 250" class="hook-svg">
                    <!-- 직각삼각형 -->
                    <polygon points="50,200 200,200 200,80" fill="rgba(33, 150, 243, 0.3)" stroke="#2196F3" stroke-width="3"/>
                    <!-- 직각 표시 -->
                    <rect x="180" y="180" width="20" height="20" fill="none" stroke="#333" stroke-width="2"/>
                    <!-- 변 a의 정사각형 -->
                    <rect x="200" y="80" width="120" height="120" fill="rgba(233, 30, 99, 0.3)" stroke="#E91E63" stroke-width="2"/>
                    <text x="260" y="150" text-anchor="middle" font-size="16" fill="#E91E63" font-weight="bold">a^2</text>
                    <!-- 변 b의 정사각형 -->
                    <rect x="50" y="200" width="150" height="150" fill="rgba(76, 175, 80, 0.3)" stroke="#4CAF50" stroke-width="2" transform="translate(0,-150)"/>
                    <text x="125" y="275" text-anchor="middle" font-size="16" fill="#4CAF50" font-weight="bold">b^2</text>
                    <!-- 변 c의 정사각형 (빗변) -->
                    <g transform="rotate(-53 50 200)">
                        <rect x="50" y="200" width="180" height="180" fill="rgba(156, 39, 176, 0.2)" stroke="#9C27B0" stroke-width="2" transform="translate(0,-180)"/>
                    </g>
                    <text x="80" y="120" text-anchor="middle" font-size="16" fill="#9C27B0" font-weight="bold">c^2</text>
                    <!-- 공식 -->
                    <text x="320" y="230" text-anchor="middle" font-size="18" fill="#333" font-weight="bold">a^2 + b^2 = c^2</text>
                </svg>
            `
        }
    },
    story: {
        character: { image: "assets/character.svg" }, // Placeholder, engine might use default if missing
        situation: "수업용 창작 상황입니다. 타일 설계자가 직각삼각형의 세 변 위에 정사각형을 그렸습니다.<br>어느 두 정사각형의 넓이를 합하면 나머지 넓이와 같을까요?"
    },
    interaction: {
        title: "직각삼각형 탐구",
        instruction: "파란 점을 움직여 두 직각변의 길이를 바꾸세요. a², b², c²를 세 번 기록하고 합을 비교하세요. 그림을 관찰한 결과와 모든 직각삼각형에 대한 증명은 구별합니다.",
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
                "question": "직각을 끼는 두 변이 5cm, 12cm인 직각삼각형의 빗변은?",
                "options": [
                        "13cm",
                        "15cm",
                        "17cm",
                        "25cm"
                ],
                "answer": 0,
                "explanation": "빗변의 제곱은 5²+12²=169이므로 길이는 양수인 √169=13cm입니다."
        },
        {
                "question": "빗변이 10이고 한 직각변이 6이면 다른 직각변은?",
                "options": [
                        "4",
                        "8",
                        "√136"
                ],
                "answer": 1,
                "explanation": "다른 직각변의 제곱은 10²−6²=64이므로 길이는 8입니다. 빗변을 알고 있을 때는 두 제곱을 빼야 합니다."
        }
]
};

Engine.init(pythagorasData);
