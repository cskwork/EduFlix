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
                        ${subText ? `<p class="hook-subtext">${subText}</p>` : ''}
                    </div>
                    ${visual ? `<div class="hook-visual">${visual.content}</div>` : ''}
                    <button class="btn btn-primary-large" onclick="Engine.nextScene()">시작하기</button>
                </div>
            `;
            if (this.data.hook.onInit) this.data.hook.onInit(scene);
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
 * 공간 대각선
 * 중등 3학년 대상 공간 대각선 학습 콘텐츠
 */

const diagonalData = {
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
        instruction: "직육면체의 크기를 조절하고, 단계별로 대각선을 확인해보세요!",
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
            question: "가로 3, 세로 4, 높이 12인 직육면체의 공간 대각선 길이는?",
            options: ["13", "15", "17", "19"],
            answer: 0
        }
    ]
};

Engine.init(diagonalData);
