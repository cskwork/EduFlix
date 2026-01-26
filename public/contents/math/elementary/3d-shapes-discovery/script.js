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
 * 입체도형 탐험대
 * 초등 3-4학년 대상 3D 입체도형 학습 콘텐츠
 */

const shapesData = {
    title: "입체도형 탐험대",
    hook: {
        question: "상자, 공, 캔... 우리 주변의 물건들은 어떤 모양으로 이루어져 있을까요?"
    },
    story: {
        character: { image: "assets/character.svg" },
        situation: "안녕! 나는 도형 박물관의 도슨트 '도형이'야!<br><br>오늘 박물관에 특별한 입체도형들이 전시됐어. 정육면체, 구, 원기둥, 삼각뿔!<br>이 도형들을 360도로 돌려보면서 면, 모서리, 꼭짓점이 몇 개인지 함께 알아보자!"
    },
    interaction: {
        title: "입체도형 관찰하기",
        instruction: "도형을 선택하고 마우스로 드래그해서 360도 돌려보세요!",
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
            question: "정육면체의 면, 모서리, 꼭짓점의 개수는 각각 몇 개일까요?",
            options: ["6면, 12모서리, 8꼭짓점", "4면, 6모서리, 4꼭짓점", "8면, 12모서리, 6꼭짓점", "6면, 8모서리, 12꼭짓점"],
            answer: 0
        }
    ]
};

Engine.init(shapesData);
