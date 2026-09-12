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
 * 입체도형 탐험대
 * 초등 3-4학년 대상 3D 입체도형 학습 콘텐츠
 */

const shapesData = {
    objective: "입체도형을 돌려 보며 면, 모서리, 꼭짓점을 빠짐없이 세어요.",
    workedExample: "정육면체의 면은 앞뒤, 좌우, 위아래로 6개입니다. 꼭짓점은 위 4개와 아래 4개로 8개이고, 모서리는 위 4개, 아래 4개, 연결하는 4개로 12개입니다. 보이지 않는 뒤쪽도 포함합니다.",
    reflection: "정육면체와 직육면체는 면·모서리·꼭짓점 수가 같은데 무엇이 다를까요? 면의 모양과 변의 길이를 근거로 설명하세요.",
    title: "입체도형 탐험대",
    hook: {
        question: "상자, 공, 캔... 우리 주변의 물건들은 어떤 모양으로 이루어져 있을까요?",
        subText: "물건을 돌려 보며 숨은 면도 찾아봐요!",
        visual: {
            type: "svg",
            content: `
                <svg viewBox="0 0 400 180" class="hook-svg">
                    <!-- 정육면체 -->
                    <g transform="translate(50, 30)">
                        <polygon points="20,20 70,20 70,70 20,70" fill="#E91E63" opacity="0.8"/>
                        <polygon points="20,20 35,5 85,5 70,20" fill="#F48FB1"/>
                        <polygon points="70,20 85,5 85,55 70,70" fill="#AD1457"/>
                        <text x="45" y="90" text-anchor="middle" font-size="10" fill="#333">정육면체</text>
                    </g>
                    <!-- 구 -->
                    <g transform="translate(140, 30)">
                        <circle cx="40" cy="40" r="35" fill="#4CAF50"/>
                        <ellipse cx="40" cy="40" rx="35" ry="10" fill="#81C784" opacity="0.5"/>
                        <ellipse cx="30" cy="30" rx="8" ry="5" fill="#fff" opacity="0.4"/>
                        <text x="40" y="90" text-anchor="middle" font-size="10" fill="#333">구</text>
                    </g>
                    <!-- 원기둥 -->
                    <g transform="translate(230, 30)">
                        <ellipse cx="40" cy="65" rx="30" ry="10" fill="#1565C0"/>
                        <rect x="10" y="15" width="60" height="50" fill="#2196F3"/>
                        <ellipse cx="40" cy="15" rx="30" ry="10" fill="#64B5F6"/>
                        <text x="40" y="90" text-anchor="middle" font-size="10" fill="#333">원기둥</text>
                    </g>
                    <!-- 삼각뿔 -->
                    <g transform="translate(320, 30)">
                        <polygon points="40,5 10,70 70,70" fill="#FF9800"/>
                        <polygon points="40,5 70,70 55,65" fill="#F57C00"/>
                        <text x="40" y="90" text-anchor="middle" font-size="10" fill="#333">삼각뿔</text>
                    </g>
                    <!-- 설명 -->
                    <text x="200" y="130" text-anchor="middle" font-size="14" fill="#666">면, 모서리, 꼭짓점을 세어볼까요?</text>
                </svg>
            `
        }
    },
    story: {
        character: { 
            image: `data:image/svg+xml;utf8,<svg width="120" height="120" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="%23fff" stroke="%23333" stroke-width="3"/><path d="M20 30 Q 50 10 80 30" stroke="%23333" stroke-width="4" fill="none"/><path d="M15 35 L 25 5 L 45 20" fill="%23fff" stroke="%23333" stroke-width="3"/><path d="M85 35 L 75 5 L 55 20" fill="%23fff" stroke="%23333" stroke-width="3"/><circle cx="35" cy="45" r="5" fill="%23333"/><circle cx="65" cy="45" r="5" fill="%23333"/><path d="M40 60 Q 50 70 60 60" stroke="%23333" stroke-width="2" fill="none"/></svg>`
        },
        situation: "안녕! 나는 우주 탐험가 고양이 <strong>'보라'</strong>야. 🐾<br><br>새로운 행성을 발견했는데, 이곳의 모든 물건이 <strong>특별한 입체도형</strong>으로 되어있어!<br>이 도형들의 비밀(면, 모서리, 꼭짓점)을 알아내면 행성의 보물을 찾을 수 있대.<br>나와 함께 입체도형들을 360도로 돌려보면서 관찰해보자!"
    },
    interaction: {
        title: "입체도형 관찰하기",
        instruction: "정육면체를 선택해 천천히 돌리며 면, 모서리, 꼭짓점을 세세요. 그다음 삼각뿔을 선택해 면과 꼭짓점 수를 비교하세요. 곡면을 가진 도형은 평평한 면과 굽은 면을 구별해 설명하세요.",
        onInit: (container, engine) => {
            // 도형 데이터
            const shapes = {
                cube: { name: '정육면체', faces: 6, edges: 12, vertices: 8, color: 0xE91E63 },
                sphere: { name: '구', faces: 1, edges: 0, vertices: 0, color: 0x4CAF50 },
                cylinder: { name: '원기둥', faces: 3, edges: 2, vertices: 0, color: 0x2196F3 },
                cone: { name: '삼각뿔', faces: 4, edges: 6, vertices: 4, color: 0xFF9800 }
            };

            let currentShape = 'cube';
            let discoveredShapes = new Set();
            let threeScene, threeCamera, threeRenderer, controls, currentMesh;
            let animationFrameId = null;

            container.innerHTML = `
                <div class="shape-selector">
                    <button class="shape-btn active" data-shape="cube">정육면체</button>
                    <button class="shape-btn" data-shape="sphere">구</button>
                    <button class="shape-btn" data-shape="cylinder">원기둥</button>
                    <button class="shape-btn" data-shape="cone">삼각뿔</button>
                </div>
                <div class="three-container" id="three-canvas"></div>
                <div class="info-panel">
                    <h3 id="shape-name">정육면체</h3>
                    <div class="info-grid">
                        <div class="info-item faces">
                            <div class="info-value" id="face-count">6</div>
                            <div class="info-label">면</div>
                        </div>
                        <div class="info-item edges">
                            <div class="info-value" id="edge-count">12</div>
                            <div class="info-label">모서리</div>
                        </div>
                        <div class="info-item vertices">
                            <div class="info-value" id="vertex-count">8</div>
                            <div class="info-label">꼭짓점</div>
                        </div>
                    </div>
                </div>
                <p class="hint-text">도형을 드래그해서 여러 방향에서 관찰해보세요!</p>
                <div class="discovery-check">
                    <span id="discovery-count">발견한 도형: 0/4</span>
                </div>
            `;

            // Three.js 초기화
            const threeContainer = document.getElementById('three-canvas');
            const width = threeContainer.clientWidth;
            const height = threeContainer.clientHeight;

            threeScene = new THREE.Scene();
            threeScene.background = new THREE.Color(0x1a1a2e);

            threeCamera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
            threeCamera.position.set(3, 2, 4);

            threeRenderer = new THREE.WebGLRenderer({ antialias: true });
            threeRenderer.setSize(width, height);
            threeRenderer.setPixelRatio(window.devicePixelRatio);
            threeContainer.appendChild(threeRenderer.domElement);

            // OrbitControls
            controls = new THREE.OrbitControls(threeCamera, threeRenderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.enableZoom = false;
            controls.autoRotate = true;
            controls.autoRotateSpeed = 2;

            // 조명
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            threeScene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(5, 5, 5);
            threeScene.add(directionalLight);

            const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
            backLight.position.set(-5, -5, -5);
            threeScene.add(backLight);

            // 도형 생성 함수
            const createShape = (type) => {
                let geometry;

                switch(type) {
                    case 'cube':
                        geometry = new THREE.BoxGeometry(2, 2, 2);
                        break;
                    case 'sphere':
                        geometry = new THREE.SphereGeometry(1.2, 32, 32);
                        break;
                    case 'cylinder':
                        geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
                        break;
                    case 'cone':
                        geometry = new THREE.ConeGeometry(1.2, 2, 4);
                        break;
                }

                const material = new THREE.MeshPhongMaterial({
                    color: shapes[type].color,
                    flatShading: type !== 'sphere',
                    shininess: 100
                });

                // 와이어프레임 추가
                const wireframeMaterial = new THREE.LineBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.3
                });
                const wireframe = new THREE.LineSegments(
                    new THREE.EdgesGeometry(geometry),
                    wireframeMaterial
                );

                const mesh = new THREE.Mesh(geometry, material);
                mesh.add(wireframe);

                return mesh;
            };

            // 초기 도형
            currentMesh = createShape('cube');
            threeScene.add(currentMesh);
            discoveredShapes.add('cube');

            // 정보 업데이트
            const updateInfo = (type) => {
                const shape = shapes[type];
                const shapeNameEl = document.getElementById('shape-name');
                const faceCountEl = document.getElementById('face-count');
                const edgeCountEl = document.getElementById('edge-count');
                const vertexCountEl = document.getElementById('vertex-count');
                const discoveryCountEl = document.getElementById('discovery-count');

                if (shapeNameEl) shapeNameEl.textContent = shape.name;
                if (faceCountEl) faceCountEl.textContent = shape.faces;
                if (edgeCountEl) edgeCountEl.textContent = shape.edges;
                if (vertexCountEl) vertexCountEl.textContent = shape.vertices;
                if (discoveryCountEl) {
                    discoveryCountEl.textContent = `발견한 도형: ${discoveredShapes.size}/4`;
                }
            };

            // 버튼 이벤트
            container.querySelectorAll('.shape-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const shapeType = btn.dataset.shape;

                    // 버튼 활성화
                    container.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    // 기존 도형 리소스 해제
                    if (currentMesh) {
                        currentMesh.geometry.dispose();
                        currentMesh.material.dispose();
                        if (currentMesh.children[0]) {
                            currentMesh.children[0].geometry.dispose();
                            currentMesh.children[0].material.dispose();
                        }
                        threeScene.remove(currentMesh);
                    }
                    currentMesh = createShape(shapeType);
                    threeScene.add(currentMesh);
                    currentShape = shapeType;

                    // 발견 추가
                    discoveredShapes.add(shapeType);
                    updateInfo(shapeType);

                    // 4개 모두 발견시
                    if (discoveredShapes.size === 4) {
                        engine.showFeedback("대단해요! 4가지 입체도형을 모두 탐험했어요!", "positive");
                        engine.enableNext();
                    }
                });
            });

            // 애니메이션 루프
            const animate = () => {
                animationFrameId = requestAnimationFrame(animate);
                controls.update();
                threeRenderer.render(threeScene, threeCamera);
            };
            animate();

            // 리사이즈 핸들러
            const handleResize = () => {
                if (!threeContainer) return;
                const w = threeContainer.clientWidth;
                const h = threeContainer.clientHeight;
                threeCamera.aspect = w / h;
                threeCamera.updateProjectionMatrix();
                threeRenderer.setSize(w, h);
            };
            window.addEventListener('resize', handleResize);

            // 정리 함수
            const cleanup = () => {
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }
                window.removeEventListener('resize', handleResize);
                if (currentMesh) {
                    currentMesh.geometry.dispose();
                    currentMesh.material.dispose();
                }
                if (controls) controls.dispose();
                if (threeRenderer) threeRenderer.dispose();
            };
            window.addEventListener('beforeunload', cleanup);
        }
    },
    quiz: [
        {
                "question": "정육면체의 면, 모서리, 꼭짓점 수는?",
                "options": [
                        "6면, 12모서리, 8꼭짓점",
                        "4면, 6모서리, 4꼭짓점",
                        "8면, 12모서리, 6꼭짓점"
                ],
                "answer": 0,
                "explanation": "면은 반대쪽끼리 3쌍으로 6개, 모서리는 위·아래·연결 부분 각 4개로 12개, 꼭짓점은 위아래 각 4개로 8개입니다."
        },
        {
                "question": "정육면체를 돌리면 전체 꼭짓점 수는?",
                "options": [
                        "보이는 만큼 줄어든다",
                        "항상 8개이다",
                        "면 수와 같아진다"
                ],
                "answer": 1,
                "explanation": "회전은 보이는 방향을 바꿀 뿐 도형 자체를 바꾸지 않습니다. 가려진 꼭짓점까지 모두 세면 8개입니다."
        }
]
};

Engine.init(shapesData);
