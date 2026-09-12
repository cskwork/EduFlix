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
 * 공간 대각선
 * 중등 3학년 대상 공간 대각선 학습 콘텐츠
 */

const diagonalData = {
    objective: "피타고라스 정리를 두 번 써서 직육면체의 공간 대각선을 구해요.",
    workedExample: "가로 3, 세로 4인 밑면의 대각선은 √(3²+4²)=5입니다. 이 대각선과 높이 12는 직각을 이루므로 공간 대각선은 √(5²+12²)=13입니다. 세 길이를 그대로 더한 19는 모서리를 따라간 거리입니다.",
    reflection: "상자 모서리를 따라간 경로와 내부의 곧은 대각선 중 어느 것이 짧을까요? 3,4,12 예제로 계산하고 그림에서 설명하세요.",
    title: "공간 대각선",
    hook: {
        question: "방 한쪽 모서리에서 대각선 반대쪽 모서리까지 줄을 달면, 줄의 길이는 얼마일까요?",
        subText: "3D 공간에서 가장 긴 대각선을 찾아보세요!",
        visual: {
            type: "svg",
            content: `
                <svg viewBox="0 0 400 250" class="hook-svg">
                    <!-- 직육면체 -->
                    <g transform="translate(100, 50)">
                        <!-- 뒷면 -->
                        <polygon points="60,20 180,20 180,140 60,140" fill="rgba(33, 150, 243, 0.1)" stroke="#90CAF9" stroke-width="1"/>
                        <!-- 밑면 -->
                        <polygon points="0,80 120,80 180,140 60,140" fill="rgba(33, 150, 243, 0.2)" stroke="#64B5F6" stroke-width="1"/>
                        <!-- 옆면 -->
                        <polygon points="0,80 0,200 60,140 60,20" fill="rgba(33, 150, 243, 0.15)" stroke="#64B5F6" stroke-width="1"/>
                        <!-- 앞면 -->
                        <polygon points="0,80 120,80 120,200 0,200" fill="rgba(33, 150, 243, 0.25)" stroke="#2196F3" stroke-width="2"/>
                        <!-- 윗면 -->
                        <polygon points="60,20 180,20 120,80 0,80" fill="rgba(33, 150, 243, 0.3)" stroke="#2196F3" stroke-width="2"/>
                        <!-- 오른쪽 옆면 -->
                        <polygon points="120,80 180,20 180,140 120,200" fill="rgba(33, 150, 243, 0.2)" stroke="#2196F3" stroke-width="2"/>
                        <!-- 바닥 대각선 (노랑) -->
                        <line x1="0" y1="200" x2="120" y2="80" stroke="#FFC107" stroke-width="3" stroke-dasharray="5,3"/>
                        <!-- 공간 대각선 (보라) -->
                        <line x1="0" y1="200" x2="180" y2="20" stroke="#9C27B0" stroke-width="4" class="pulse-line"/>
                        <!-- 꼭짓점 표시 -->
                        <circle cx="0" cy="200" r="6" fill="#4CAF50"/>
                        <circle cx="180" cy="20" r="6" fill="#E91E63"/>
                    </g>
                    <!-- 레이블 -->
                    <text x="320" y="220" font-size="14" fill="#333">피타고라스를 두 번!</text>
                </svg>
            `
        }
    },
    story: {
        character: { image: "assets/character.svg" },
        situation: "안녕! 나는 건축가 '민준'이야!<br><br>오늘 특별한 프로젝트가 있어. 직육면체 모양의 건물에 대각선 조명을 설치해야 해!<br>피타고라스의 정리를 두 번 적용하면 공간 대각선의 길이를 구할 수 있다는 걸 함께 발견해보자!"
    },
    interaction: {
        title: "공간 대각선 탐구",
        instruction: "가로 3, 세로 4, 높이 2로 설정하세요. 밑면은 5, 공간 대각선은 √29≈5.39입니다. 높이 12인 예제는 종이에 계산하세요. 밑면 대각선을 먼저 표시하고 공간 대각선을 켜서 두 직각삼각형을 찾으세요. 각 단계의 제곱과 제곱근을 기록하세요.",
        onInit: (container, engine) => {
            let a = 3, b = 4, c = 2;
            let currentStep = 0;

            container.innerHTML = `
                <div class="three-container" id="three-canvas"></div>
                <div class="control-panel">
                    <div class="size-controls">
                        <div class="size-item">
                            <span class="size-label a">가로 (a)</span>
                            <input type="range" class="size-slider" id="slider-a" min="1" max="5" value="3">
                            <span class="size-value" id="value-a">3</span>
                        </div>
                        <div class="size-item">
                            <span class="size-label b">세로 (b)</span>
                            <input type="range" class="size-slider" id="slider-b" min="1" max="5" value="4">
                            <span class="size-value" id="value-b">4</span>
                        </div>
                        <div class="size-item">
                            <span class="size-label c">높이 (c)</span>
                            <input type="range" class="size-slider" id="slider-c" min="1" max="5" value="2">
                            <span class="size-value" id="value-c">2</span>
                        </div>
                    </div>
                    <div class="step-buttons">
                        <button class="step-btn active" data-step="0">직육면체</button>
                        <button class="step-btn" data-step="1">바닥 대각선</button>
                        <button class="step-btn" data-step="2">공간 대각선</button>
                    </div>
                    <div class="formula-display">
                        <div class="formula-step active" id="step-0">
                            <div class="formula-title">직육면체</div>
                            <div class="formula-content">
                                가로: <span class="val-a" id="f-a">3</span>,
                                세로: <span class="val-b" id="f-b">4</span>,
                                높이: <span class="val-c" id="f-c">2</span>
                            </div>
                        </div>
                        <div class="formula-step" id="step-1">
                            <div class="formula-title">1단계: 바닥 대각선 (d1)</div>
                            <div class="formula-content">
                                d1 = sqrt(<span class="val-a">a</span>^2 + <span class="val-b">b</span>^2)
                            </div>
                            <div class="formula-content" style="margin-top:8px;">
                                d1 = sqrt(<span class="val-a" id="calc-a1">9</span> + <span class="val-b" id="calc-b1">16</span>)
                            </div>
                            <div class="formula-result">d1 = <span id="result-d1">5</span></div>
                        </div>
                        <div class="formula-step" id="step-2">
                            <div class="formula-title">2단계: 공간 대각선 (d)</div>
                            <div class="formula-content">
                                d = sqrt(<span class="val-d1">d1</span>^2 + <span class="val-c">c</span>^2) = sqrt(<span class="val-a">a</span>^2 + <span class="val-b">b</span>^2 + <span class="val-c">c</span>^2)
                            </div>
                            <div class="formula-content" style="margin-top:8px;">
                                d = sqrt(<span class="val-a" id="calc-a2">9</span> + <span class="val-b" id="calc-b2">16</span> + <span class="val-c" id="calc-c2">4</span>)
                            </div>
                            <div class="formula-result val-d2">d = <span id="result-d">5.39</span></div>
                        </div>
                    </div>
                </div>
                <p class="hint-text">드래그해서 직육면체를 여러 각도에서 관찰하세요!</p>
                <div class="discovery-box" id="discovery-box">
                    피타고라스를 두 번 적용하면 공간 대각선을 구할 수 있어요!<br>
                    <strong>d = sqrt(a^2 + b^2 + c^2)</strong>
                </div>
            `;

            // Three.js 초기화
            const threeContainer = document.getElementById('three-canvas');
            const w = threeContainer.clientWidth;
            const h = threeContainer.clientHeight;

            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x1a1a2e);

            const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
            camera.position.set(10, 8, 10);

            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(w, h);
            renderer.setPixelRatio(window.devicePixelRatio);
            threeContainer.appendChild(renderer.domElement);

            const controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;

            // 조명
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(10, 15, 10);
            scene.add(directionalLight);

            // 직육면체 와이어프레임
            let boxEdges;
            let floorDiagonal;
            let spaceDiagonal;

            // 꼭짓점 표시
            const vertexMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const vertices = [];

            const createBox = () => {
                // 기존 제거
                if (boxEdges) scene.remove(boxEdges);
                if (floorDiagonal) scene.remove(floorDiagonal);
                if (spaceDiagonal) scene.remove(spaceDiagonal);
                vertices.forEach(v => scene.remove(v));
                vertices.length = 0;

                // 직육면체 와이어프레임
                const boxGeom = new THREE.BoxGeometry(a, c, b);
                const edges = new THREE.EdgesGeometry(boxGeom);
                boxEdges = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
                    color: 0xffffff,
                    linewidth: 2
                }));
                boxEdges.position.set(a / 2, c / 2, b / 2);
                scene.add(boxEdges);

                // 꼭짓점
                const vertexPositions = [
                    [0, 0, 0], [a, 0, 0], [0, 0, b], [a, 0, b],
                    [0, c, 0], [a, c, 0], [0, c, b], [a, c, b]
                ];
                vertexPositions.forEach(pos => {
                    const sphere = new THREE.Mesh(
                        new THREE.SphereGeometry(0.1, 16, 16),
                        vertexMaterial
                    );
                    sphere.position.set(...pos);
                    scene.add(sphere);
                    vertices.push(sphere);
                });

                // 바닥 대각선 (노랑)
                const floorDiagGeom = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(0, 0, 0),
                    new THREE.Vector3(a, 0, b)
                ]);
                floorDiagonal = new THREE.Line(floorDiagGeom, new THREE.LineBasicMaterial({
                    color: 0xFFC107,
                    linewidth: 3
                }));
                floorDiagonal.visible = currentStep >= 1;
                scene.add(floorDiagonal);

                // 공간 대각선 (보라)
                const spaceDiagGeom = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(0, 0, 0),
                    new THREE.Vector3(a, c, b)
                ]);
                spaceDiagonal = new THREE.Line(spaceDiagGeom, new THREE.LineBasicMaterial({
                    color: 0x9C27B0,
                    linewidth: 3
                }));
                spaceDiagonal.visible = currentStep >= 2;
                scene.add(spaceDiagonal);

                updateFormulas();
            };

            const updateFormulas = () => {
                const a2 = a * a;
                const b2 = b * b;
                const c2 = c * c;
                const d1 = Math.sqrt(a2 + b2);
                const d = Math.sqrt(a2 + b2 + c2);

                document.getElementById('f-a').textContent = a;
                document.getElementById('f-b').textContent = b;
                document.getElementById('f-c').textContent = c;

                document.getElementById('calc-a1').textContent = a2;
                document.getElementById('calc-b1').textContent = b2;
                document.getElementById('result-d1').textContent = d1.toFixed(2);

                document.getElementById('calc-a2').textContent = a2;
                document.getElementById('calc-b2').textContent = b2;
                document.getElementById('calc-c2').textContent = c2;
                document.getElementById('result-d').textContent = d.toFixed(2);
            };

            const updateStep = (step) => {
                currentStep = step;

                // 버튼 상태
                container.querySelectorAll('.step-btn').forEach((btn, i) => {
                    btn.classList.remove('active');
                    if (i < step) btn.classList.add('completed');
                    if (i === step) btn.classList.add('active');
                });

                // 공식 표시
                container.querySelectorAll('.formula-step').forEach((el, i) => {
                    el.classList.remove('active');
                    if (i === step) el.classList.add('active');
                });

                // 대각선 표시
                if (floorDiagonal) floorDiagonal.visible = step >= 1;
                if (spaceDiagonal) spaceDiagonal.visible = step >= 2;

                // 마지막 단계에서 발견 메시지
                if (step === 2) {
                    document.getElementById('discovery-box').classList.add('show');
                    engine.showFeedback("훌륭해요! 공간 대각선의 공식을 발견했어요!", "positive");
                    engine.enableNext();
                }
            };

            // 초기화
            createBox();

            // 슬라이더 이벤트
            document.getElementById('slider-a').addEventListener('input', (e) => {
                a = parseInt(e.target.value);
                document.getElementById('value-a').textContent = a;
                createBox();
            });

            document.getElementById('slider-b').addEventListener('input', (e) => {
                b = parseInt(e.target.value);
                document.getElementById('value-b').textContent = b;
                createBox();
            });

            document.getElementById('slider-c').addEventListener('input', (e) => {
                c = parseInt(e.target.value);
                document.getElementById('value-c').textContent = c;
                createBox();
            });

            // 단계 버튼 이벤트
            container.querySelectorAll('.step-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const step = parseInt(btn.dataset.step);
                    updateStep(step);
                });
            });

            // 애니메이션 루프
            const animate = () => {
                requestAnimationFrame(animate);
                controls.update();
                renderer.render(scene, camera);
            };
            animate();

            // 리사이즈
            window.addEventListener('resize', () => {
                const newW = threeContainer.clientWidth;
                const newH = threeContainer.clientHeight;
                camera.aspect = newW / newH;
                camera.updateProjectionMatrix();
                renderer.setSize(newW, newH);
            });
        }
    },
    quiz: [
        {
                "question": "가로 3, 세로 4, 높이 12인 직육면체의 공간 대각선은?",
                "options": [
                        "13",
                        "15",
                        "17",
                        "19"
                ],
                "answer": 0,
                "explanation": "√(3²+4²+12²)=√169=13입니다. 3+4+12=19는 모서리를 따라 이동한 길이입니다."
        },
        {
                "question": "가로·세로·높이가 모두 2배가 되면 공간 대각선은?",
                "options": [
                        "2배",
                        "4배",
                        "8배"
                ],
                "answer": 0,
                "explanation": "√((2a)²+(2b)²+(2c)²)=2√(a²+b²+c²)이므로 길이는 2배입니다."
        }
]
};

Engine.init(diagonalData);
