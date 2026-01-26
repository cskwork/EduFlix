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
 * 3D 좌표계: 드론 파일럿
 * 중등 1-2학년 대상 3D 좌표계 학습 콘텐츠
 */

const droneData = {
    title: "3D 좌표계: 드론 파일럿",
    hook: {
        question: "드론이 3D 공간을 자유롭게 날아다니려면 어떤 정보가 필요할까요?",
        subText: "가로, 세로... 그리고 뭐가 더 필요할까요?",
        visual: {
            type: "svg",
            content: `
                <svg viewBox="0 0 400 250" class="hook-svg">
                    <!-- 3D 좌표축 -->
                    <g transform="translate(150, 150)">
                        <!-- X축 (빨강) -->
                        <line x1="0" y1="0" x2="120" y2="60" stroke="#E91E63" stroke-width="3"/>
                        <polygon points="120,60 110,55 110,65" fill="#E91E63"/>
                        <text x="130" y="70" font-size="16" fill="#E91E63" font-weight="bold">x</text>
                        <!-- Y축 (초록) -->
                        <line x1="0" y1="0" x2="0" y2="-100" stroke="#4CAF50" stroke-width="3"/>
                        <polygon points="0,-100 -5,-90 5,-90" fill="#4CAF50"/>
                        <text x="10" y="-90" font-size="16" fill="#4CAF50" font-weight="bold">y</text>
                        <!-- Z축 (파랑) -->
                        <line x1="0" y1="0" x2="-80" y2="40" stroke="#2196F3" stroke-width="3"/>
                        <polygon points="-80,40 -70,35 -70,45" fill="#2196F3"/>
                        <text x="-95" y="50" font-size="16" fill="#2196F3" font-weight="bold">z</text>
                        <!-- 원점 -->
                        <circle cx="0" cy="0" r="5" fill="#333"/>
                        <text x="10" y="15" font-size="12" fill="rgba(255, 255, 255, 0.7)">O</text>
                    </g>
                    <!-- 드론 -->
                    <g class="drone-fly" transform="translate(280, 80)">
                        <rect x="-20" y="-5" width="40" height="10" fill="#333" rx="3"/>
                        <rect x="-30" y="-3" width="60" height="6" fill="#666" rx="2"/>
                        <circle cx="-25" cy="-8" r="8" fill="#90CAF9" opacity="0.7"/>
                        <circle cx="25" cy="-8" r="8" fill="#90CAF9" opacity="0.7"/>
                        <circle cx="0" cy="8" r="4" fill="#4CAF50"/>
                    </g>
                    <!-- 좌표 표시 -->
                    <text x="280" y="110" text-anchor="middle" font-size="14" fill="#FF5722">(3, 4, 2)</text>
                    <!-- 점선 경로 -->
                    <path d="M150,150 L280,80" stroke="#FF9800" stroke-width="2" stroke-dasharray="5,3"/>
                </svg>
            `
        }
    },
    story: {
        character: { image: "assets/character.svg" },
        situation: "안녕! 나는 드론 파일럿 '하늘이'야!<br><br>오늘 특별한 배달 미션이 있어. 드론을 목표 지점까지 정확하게 보내야 해!<br>3D 공간에서는 x, y, z 세 개의 좌표가 필요하다는 걸 함께 알아보자!"
    },
    interaction: {
        title: "드론 비행 시뮬레이션",
        instruction: "x, y, z 좌표를 입력하고 '비행!' 버튼을 눌러 드론을 목표 지점으로 보내세요!",
        onInit: (container, engine) => {
            // 미션 목표
            const missions = [
                { x: 3, y: 2, z: 4, name: "창고 A" },
                { x: -2, y: 3, z: 2, name: "창고 B" },
                { x: 4, y: -1, z: 3, name: "창고 C" }
            ];
            let currentMission = 0;
            let dronePos = { x: 0, y: 0, z: 0 };
            let isFlying = false;

            container.innerHTML = `
                <div class="three-container" id="three-canvas"></div>
                <div class="control-panel">
                    <div class="coordinate-input">
                        <span class="coord-separator">(</span>
                        <div class="coord-group">
                            <span class="coord-label x">x:</span>
                            <input type="number" class="coord-input" id="input-x" value="0" min="-5" max="5">
                        </div>
                        <span class="coord-separator">,</span>
                        <div class="coord-group">
                            <span class="coord-label y">y:</span>
                            <input type="number" class="coord-input" id="input-y" value="0" min="-5" max="5">
                        </div>
                        <span class="coord-separator">,</span>
                        <div class="coord-group">
                            <span class="coord-label z">z:</span>
                            <input type="number" class="coord-input" id="input-z" value="0" min="-5" max="5">
                        </div>
                        <span class="coord-separator">)</span>
                    </div>
                    <button class="fly-btn" id="fly-btn">비행!</button>
                    <div class="position-display">
                        <div class="pos-item x">
                            <div class="pos-value" id="pos-x">0</div>
                            <div class="pos-label">X 좌표</div>
                        </div>
                        <div class="pos-item y">
                            <div class="pos-value" id="pos-y">0</div>
                            <div class="pos-label">Y 좌표</div>
                        </div>
                        <div class="pos-item z">
                            <div class="pos-value" id="pos-z">0</div>
                            <div class="pos-label">Z 좌표</div>
                        </div>
                    </div>
                </div>
                <div class="mission-panel" id="mission-panel">
                    <div class="mission-title">미션 ${currentMission + 1}</div>
                    <div class="mission-target">목표: <span id="target-name">${missions[0].name}</span>
                        (<span style="color:#E91E63">${missions[0].x}</span>,
                         <span style="color:#4CAF50">${missions[0].y}</span>,
                         <span style="color:#2196F3">${missions[0].z}</span>)</div>
                </div>
                <p class="hint-text">드래그해서 3D 공간을 둘러보세요!</p>
                <div class="success-message" id="success-msg">미션 완료!</div>
            `;

            // Three.js 초기화
            const threeContainer = document.getElementById('three-canvas');
            const w = threeContainer.clientWidth;
            const h = threeContainer.clientHeight;

            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x0f0c29);

            const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
            camera.position.set(12, 10, 12);

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

            // 좌표축 생성
            const axisLength = 6;

            // X축 (빨강)
            const xAxisGeom = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-axisLength, 0, 0),
                new THREE.Vector3(axisLength, 0, 0)
            ]);
            const xAxis = new THREE.Line(xAxisGeom, new THREE.LineBasicMaterial({ color: 0xE91E63, linewidth: 2 }));
            scene.add(xAxis);

            // Y축 (초록)
            const yAxisGeom = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, -axisLength, 0),
                new THREE.Vector3(0, axisLength, 0)
            ]);
            const yAxis = new THREE.Line(yAxisGeom, new THREE.LineBasicMaterial({ color: 0x4CAF50, linewidth: 2 }));
            scene.add(yAxis);

            // Z축 (파랑)
            const zAxisGeom = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, -axisLength),
                new THREE.Vector3(0, 0, axisLength)
            ]);
            const zAxis = new THREE.Line(zAxisGeom, new THREE.LineBasicMaterial({ color: 0x2196F3, linewidth: 2 }));
            scene.add(zAxis);

            // 그리드
            const gridHelper = new THREE.GridHelper(12, 12, 0x444444, 0x222222);
            gridHelper.rotation.x = 0;
            scene.add(gridHelper);

            // 드론 생성
            const createDrone = () => {
                const droneGroup = new THREE.Group();

                // 본체
                const bodyGeom = new THREE.BoxGeometry(0.6, 0.15, 0.6);
                const bodyMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
                const body = new THREE.Mesh(bodyGeom, bodyMat);
                droneGroup.add(body);

                // 프로펠러 암
                const armGeom = new THREE.BoxGeometry(1.2, 0.05, 0.08);
                const armMat = new THREE.MeshPhongMaterial({ color: 0x666666 });
                const arm1 = new THREE.Mesh(armGeom, armMat);
                const arm2 = new THREE.Mesh(armGeom, armMat);
                arm2.rotation.y = Math.PI / 2;
                droneGroup.add(arm1, arm2);

                // 프로펠러
                const propGeom = new THREE.CircleGeometry(0.2, 16);
                const propMat = new THREE.MeshBasicMaterial({ color: 0x64B5F6, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
                const positions = [
                    [0.5, 0.1, 0.5], [-0.5, 0.1, 0.5],
                    [0.5, 0.1, -0.5], [-0.5, 0.1, -0.5]
                ];
                positions.forEach(pos => {
                    const prop = new THREE.Mesh(propGeom, propMat);
                    prop.position.set(...pos);
                    prop.rotation.x = -Math.PI / 2;
                    droneGroup.add(prop);
                });

                // LED
                const ledGeom = new THREE.SphereGeometry(0.05, 8, 8);
                const ledMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
                const led = new THREE.Mesh(ledGeom, ledMat);
                led.position.set(0, -0.1, 0.25);
                droneGroup.add(led);

                return droneGroup;
            };

            const drone = createDrone();
            scene.add(drone);

            // 목표 마커
            const targetMarker = new THREE.Mesh(
                new THREE.SphereGeometry(0.3, 16, 16),
                new THREE.MeshBasicMaterial({ color: 0xFFC107, transparent: true, opacity: 0.7 })
            );
            const mission = missions[currentMission];
            targetMarker.position.set(mission.x, mission.y, mission.z);
            scene.add(targetMarker);

            // 목표 링
            const ringGeom = new THREE.RingGeometry(0.4, 0.6, 32);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0xFFC107, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.position.copy(targetMarker.position);
            scene.add(ring);

            // 경로 라인
            let pathLine = null;

            const updatePath = (from, to) => {
                if (pathLine) scene.remove(pathLine);

                const points = [
                    new THREE.Vector3(from.x, from.y, from.z),
                    new THREE.Vector3(to.x, from.y, from.z),
                    new THREE.Vector3(to.x, to.y, from.z),
                    new THREE.Vector3(to.x, to.y, to.z)
                ];

                const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
                pathLine = new THREE.Line(lineGeom, new THREE.LineDashedMaterial({
                    color: 0xffffff,
                    dashSize: 0.2,
                    gapSize: 0.1
                }));
                pathLine.computeLineDistances();
                scene.add(pathLine);
            };

            // UI 업데이트
            const updatePositionDisplay = () => {
                document.getElementById('pos-x').textContent = dronePos.x.toFixed(1);
                document.getElementById('pos-y').textContent = dronePos.y.toFixed(1);
                document.getElementById('pos-z').textContent = dronePos.z.toFixed(1);
            };

            // 비행 애니메이션
            const flyTo = (targetX, targetY, targetZ) => {
                if (isFlying) return;
                isFlying = true;

                const btn = document.getElementById('fly-btn');
                btn.disabled = true;
                btn.textContent = '비행 중...';

                const startPos = { ...dronePos };
                const endPos = { x: targetX, y: targetY, z: targetZ };
                const duration = 2000;
                const startTime = Date.now();

                updatePath(startPos, endPos);

                const animateFlight = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);

                    // Easing
                    const eased = 1 - Math.pow(1 - progress, 3);

                    dronePos.x = startPos.x + (endPos.x - startPos.x) * eased;
                    dronePos.y = startPos.y + (endPos.y - startPos.y) * eased;
                    dronePos.z = startPos.z + (endPos.z - startPos.z) * eased;

                    drone.position.set(dronePos.x, dronePos.y, dronePos.z);
                    updatePositionDisplay();

                    if (progress < 1) {
                        requestAnimationFrame(animateFlight);
                    } else {
                        isFlying = false;
                        btn.disabled = false;
                        btn.textContent = '비행!';

                        // 미션 체크
                        const mission = missions[currentMission];
                        if (Math.abs(dronePos.x - mission.x) < 0.1 &&
                            Math.abs(dronePos.y - mission.y) < 0.1 &&
                            Math.abs(dronePos.z - mission.z) < 0.1) {

                            const successMsg = document.getElementById('success-msg');
                            successMsg.classList.add('show');

                            setTimeout(() => {
                                successMsg.classList.remove('show');
                                currentMission++;

                                if (currentMission >= missions.length) {
                                    engine.showFeedback("모든 미션 완료! 3D 좌표계를 마스터했어요!", "positive");
                                    engine.enableNext();
                                } else {
                                    const nextMission = missions[currentMission];
                                    document.querySelector('.mission-title').textContent = `미션 ${currentMission + 1}`;
                                    document.getElementById('target-name').textContent = nextMission.name;
                                    document.querySelector('.mission-target').innerHTML =
                                        `목표: <span id="target-name">${nextMission.name}</span>
                                        (<span style="color:#E91E63">${nextMission.x}</span>,
                                         <span style="color:#4CAF50">${nextMission.y}</span>,
                                         <span style="color:#2196F3">${nextMission.z}</span>)`;

                                    targetMarker.position.set(nextMission.x, nextMission.y, nextMission.z);
                                    ring.position.copy(targetMarker.position);
                                }
                            }, 1500);
                        }
                    }
                };
                animateFlight();
            };

            // 버튼 이벤트
            document.getElementById('fly-btn').addEventListener('click', () => {
                const x = parseFloat(document.getElementById('input-x').value) || 0;
                const y = parseFloat(document.getElementById('input-y').value) || 0;
                const z = parseFloat(document.getElementById('input-z').value) || 0;

                // 범위 제한
                const clampedX = Math.max(-5, Math.min(5, x));
                const clampedY = Math.max(-5, Math.min(5, y));
                const clampedZ = Math.max(-5, Math.min(5, z));

                flyTo(clampedX, clampedY, clampedZ);
            });

            // 프로펠러 회전 애니메이션
            let propAngle = 0;

            // 애니메이션 루프
            const animate = () => {
                requestAnimationFrame(animate);
                controls.update();

                // 프로펠러 회전 효과 (Y축 흔들림)
                propAngle += 0.3;
                drone.children.forEach((child, i) => {
                    if (i >= 3 && i <= 6) {
                        child.rotation.z = propAngle;
                    }
                });

                // 타겟 링 회전
                ring.rotation.x += 0.02;
                ring.rotation.y += 0.01;

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
            question: "3D 공간에서 점 A(2, 3, 5)는 어떤 축을 따라 5만큼 떨어져 있나요?",
            options: ["z축", "x축", "y축", "원점"],
            answer: 0
        }
    ]
};

Engine.init(droneData);
