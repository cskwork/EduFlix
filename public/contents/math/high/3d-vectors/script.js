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
 * 3D 벡터: 힘의 합성
 * 고등 1학년 대상 3D 벡터 학습 콘텐츠
 */

const vectorData = {
    title: "3D 벡터: 힘의 합성",
    hook: {
        question: "우주에서 로켓에 여러 방향으로 힘이 가해지면, 로켓은 어느 방향으로 움직일까요?",
        subText: "두 힘을 합치면 어떤 방향이 될까요?",
        visual: {
            type: "svg",
            content: `
                <svg viewBox="0 0 400 220" class="hook-svg">
                    <!-- 원점 -->
                    <circle cx="150" cy="150" r="5" fill="#333"/>
                    <text x="140" y="170" font-size="12" fill="#666">O</text>
                    <!-- 벡터 A (빨강) -->
                    <line x1="150" y1="150" x2="280" y2="100" stroke="#E91E63" stroke-width="4"/>
                    <polygon points="280,100 265,98 268,112" fill="#E91E63"/>
                    <text x="220" y="110" font-size="14" fill="#E91E63" font-weight="bold">A</text>
                    <!-- 벡터 B (파랑) -->
                    <line x1="150" y1="150" x2="200" y2="50" stroke="#2196F3" stroke-width="4"/>
                    <polygon points="200,50 190,60 205,62" fill="#2196F3"/>
                    <text x="165" y="90" font-size="14" fill="#2196F3" font-weight="bold">B</text>
                    <!-- 합벡터 (초록, 점선 보조선) -->
                    <line x1="280" y1="100" x2="330" y2="0" stroke="#4CAF50" stroke-width="2" stroke-dasharray="5,3"/>
                    <line x1="200" y1="50" x2="330" y2="0" stroke="#4CAF50" stroke-width="2" stroke-dasharray="5,3"/>
                    <!-- 합벡터 (보라) -->
                    <line x1="150" y1="150" x2="330" y2="0" stroke="#9C27B0" stroke-width="5"/>
                    <polygon points="330,0 315,5 320,18" fill="#9C27B0"/>
                    <text x="250" y="60" font-size="14" fill="#9C27B0" font-weight="bold">A + B</text>
                    <!-- 로켓 아이콘 -->
                    <g transform="translate(340, -10) rotate(45)">
                        <polygon points="0,-15 5,10 0,5 -5,10" fill="#FF5722"/>
                        <rect x="-3" y="5" width="6" height="8" fill="#333"/>
                    </g>
                    <!-- 설명 -->
                    <text x="200" y="200" text-anchor="middle" font-size="14" fill="#333">벡터의 합: 각 성분을 더하면 돼요!</text>
                </svg>
            `
        }
    },
    story: {
        character: { image: "assets/character.svg" },
        situation: "안녕하세요! 저는 물리학자 '뉴턴 박사'입니다.<br><br>오늘 우주선에 작용하는 두 힘을 합성해야 합니다!<br>3D 공간에서 벡터의 덧셈은 각 성분을 따로 더하면 된다는 것을 함께 발견해봅시다!"
    },
    interaction: {
        title: "3D 벡터 합성",
        instruction: "두 벡터 A와 B의 성분을 조절하고 합력 벡터를 관찰하세요!",
        onInit: (container, engine) => {
            // 벡터 초기값
            let vecA = { x: 2, y: 1, z: 3 };
            let vecB = { x: 1, y: 3, z: 1 };
            let interactionCount = 0;

            container.innerHTML = `
                <div class="three-container" id="three-canvas"></div>
                <div class="control-panel">
                    <div class="vector-controls">
                        <div class="vector-group">
                            <div class="vector-title vec-a">벡터 A</div>
                            <div class="component-row">
                                <span class="component-label x">x:</span>
                                <input type="range" class="component-slider" id="a-x" min="-4" max="4" value="2">
                                <span class="component-value" id="a-x-val">2</span>
                            </div>
                            <div class="component-row">
                                <span class="component-label y">y:</span>
                                <input type="range" class="component-slider" id="a-y" min="-4" max="4" value="1">
                                <span class="component-value" id="a-y-val">1</span>
                            </div>
                            <div class="component-row">
                                <span class="component-label z">z:</span>
                                <input type="range" class="component-slider" id="a-z" min="-4" max="4" value="3">
                                <span class="component-value" id="a-z-val">3</span>
                            </div>
                        </div>
                        <div class="vector-group">
                            <div class="vector-title vec-b">벡터 B</div>
                            <div class="component-row">
                                <span class="component-label x">x:</span>
                                <input type="range" class="component-slider" id="b-x" min="-4" max="4" value="1">
                                <span class="component-value" id="b-x-val">1</span>
                            </div>
                            <div class="component-row">
                                <span class="component-label y">y:</span>
                                <input type="range" class="component-slider" id="b-y" min="-4" max="4" value="3">
                                <span class="component-value" id="b-y-val">3</span>
                            </div>
                            <div class="component-row">
                                <span class="component-label z">z:</span>
                                <input type="range" class="component-slider" id="b-z" min="-4" max="4" value="1">
                                <span class="component-value" id="b-z-val">1</span>
                            </div>
                        </div>
                        <div class="vector-group result-display">
                            <div class="vector-title vec-result">합력 A + B</div>
                            <div class="result-components">
                                <div class="result-item">
                                    <div class="result-value" id="r-x">3</div>
                                    <div class="result-label">x</div>
                                </div>
                                <div class="result-item">
                                    <div class="result-value" id="r-y">4</div>
                                    <div class="result-label">y</div>
                                </div>
                                <div class="result-item">
                                    <div class="result-value" id="r-z">4</div>
                                    <div class="result-label">z</div>
                                </div>
                            </div>
                            <div class="magnitude-display">
                                <span class="magnitude-label">크기 |A+B| =</span>
                                <span class="magnitude-value" id="magnitude">6.40</span>
                            </div>
                        </div>
                    </div>
                    <div class="formula-box">
                        <div class="formula-title">벡터 덧셈 공식</div>
                        <div class="formula-content">
                            A + B = (a_x + b_x, a_y + b_y, a_z + b_z)
                        </div>
                    </div>
                </div>
                <p class="hint-text">드래그해서 3D 공간을 돌려보세요!</p>
                <div class="discovery-message" id="discovery-msg">
                    벡터 덧셈은 각 성분을 따로 더하면 됩니다!
                </div>
            `;

            // Three.js 초기화
            const threeContainer = document.getElementById('three-canvas');
            const w = threeContainer.clientWidth;
            const h = threeContainer.clientHeight;

            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x0c0c0c);

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
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
            directionalLight.position.set(10, 15, 10);
            scene.add(directionalLight);

            // 좌표축
            const axisLength = 5;

            // X축
            const xAxisGeom = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-axisLength, 0, 0),
                new THREE.Vector3(axisLength, 0, 0)
            ]);
            scene.add(new THREE.Line(xAxisGeom, new THREE.LineBasicMaterial({ color: 0xff6b6b, opacity: 0.5, transparent: true })));

            // Y축
            const yAxisGeom = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, -axisLength, 0),
                new THREE.Vector3(0, axisLength, 0)
            ]);
            scene.add(new THREE.Line(yAxisGeom, new THREE.LineBasicMaterial({ color: 0x51cf66, opacity: 0.5, transparent: true })));

            // Z축
            const zAxisGeom = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, -axisLength),
                new THREE.Vector3(0, 0, axisLength)
            ]);
            scene.add(new THREE.Line(zAxisGeom, new THREE.LineBasicMaterial({ color: 0x339af0, opacity: 0.5, transparent: true })));

            // 그리드
            const gridHelper = new THREE.GridHelper(10, 10, 0x333333, 0x222222);
            scene.add(gridHelper);

            // 원점
            const origin = new THREE.Vector3(0, 0, 0);

            // 벡터 화살표
            let arrowA, arrowB, arrowResult;
            let dashedLineA, dashedLineB;

            const updateVectors = () => {
                // 기존 화살표 제거
                if (arrowA) scene.remove(arrowA);
                if (arrowB) scene.remove(arrowB);
                if (arrowResult) scene.remove(arrowResult);
                if (dashedLineA) scene.remove(dashedLineA);
                if (dashedLineB) scene.remove(dashedLineB);

                // 결과 벡터 계산
                const result = {
                    x: vecA.x + vecB.x,
                    y: vecA.y + vecB.y,
                    z: vecA.z + vecB.z
                };

                // UI 업데이트
                document.getElementById('r-x').textContent = result.x;
                document.getElementById('r-y').textContent = result.y;
                document.getElementById('r-z').textContent = result.z;

                const magnitude = Math.sqrt(result.x * result.x + result.y * result.y + result.z * result.z);
                document.getElementById('magnitude').textContent = magnitude.toFixed(2);

                // 벡터 A 화살표 (빨강)
                const dirA = new THREE.Vector3(vecA.x, vecA.y, vecA.z);
                const lenA = dirA.length();
                if (lenA > 0) {
                    dirA.normalize();
                    arrowA = new THREE.ArrowHelper(dirA, origin, lenA, 0xE91E63, 0.3, 0.2);
                    scene.add(arrowA);
                }

                // 벡터 B 화살표 (초록)
                const dirB = new THREE.Vector3(vecB.x, vecB.y, vecB.z);
                const lenB = dirB.length();
                if (lenB > 0) {
                    dirB.normalize();
                    arrowB = new THREE.ArrowHelper(dirB, origin, lenB, 0x4CAF50, 0.3, 0.2);
                    scene.add(arrowB);
                }

                // 결과 벡터 화살표 (노랑)
                const dirR = new THREE.Vector3(result.x, result.y, result.z);
                const lenR = dirR.length();
                if (lenR > 0) {
                    dirR.normalize();
                    arrowResult = new THREE.ArrowHelper(dirR, origin, lenR, 0xFFC107, 0.4, 0.25);
                    scene.add(arrowResult);
                }

                // 평행사변형 보조선 (점선)
                // A 끝에서 B 방향으로
                const endA = new THREE.Vector3(vecA.x, vecA.y, vecA.z);
                const endB = new THREE.Vector3(vecB.x, vecB.y, vecB.z);
                const endR = new THREE.Vector3(result.x, result.y, result.z);

                const dashedMatA = new THREE.LineDashedMaterial({
                    color: 0x4CAF50,
                    dashSize: 0.2,
                    gapSize: 0.1,
                    opacity: 0.5,
                    transparent: true
                });
                const dashedGeomA = new THREE.BufferGeometry().setFromPoints([endA, endR]);
                dashedLineA = new THREE.Line(dashedGeomA, dashedMatA);
                dashedLineA.computeLineDistances();
                scene.add(dashedLineA);

                const dashedMatB = new THREE.LineDashedMaterial({
                    color: 0xE91E63,
                    dashSize: 0.2,
                    gapSize: 0.1,
                    opacity: 0.5,
                    transparent: true
                });
                const dashedGeomB = new THREE.BufferGeometry().setFromPoints([endB, endR]);
                dashedLineB = new THREE.Line(dashedGeomB, dashedMatB);
                dashedLineB.computeLineDistances();
                scene.add(dashedLineB);
            };

            // 초기 벡터 생성
            updateVectors();

            // 슬라이더 이벤트
            const setupSlider = (id, vec, component) => {
                const slider = document.getElementById(id);
                const valueEl = document.getElementById(`${id}-val`);

                slider.addEventListener('input', () => {
                    vec[component] = parseInt(slider.value);
                    valueEl.textContent = slider.value;
                    updateVectors();

                    interactionCount++;
                    if (interactionCount >= 5) {
                        document.getElementById('discovery-msg').classList.add('show');
                        engine.showFeedback("벡터 덧셈은 성분별로 더하면 됩니다!", "positive");
                        engine.enableNext();
                    }
                });
            };

            setupSlider('a-x', vecA, 'x');
            setupSlider('a-y', vecA, 'y');
            setupSlider('a-z', vecA, 'z');
            setupSlider('b-x', vecB, 'x');
            setupSlider('b-y', vecB, 'y');
            setupSlider('b-z', vecB, 'z');

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
            question: "벡터 A = (2, 3, 1)과 B = (1, -1, 2)의 합 A + B는?",
            options: ["(3, 2, 3)", "(1, 4, -1)", "(2, 2, 2)", "(3, 4, 3)"],
            answer: 0
        }
    ]
};

Engine.init(vectorData);
