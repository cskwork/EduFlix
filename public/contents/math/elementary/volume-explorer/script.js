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
 * 부피 탐험가
 * 초등 5-6학년 대상 부피 학습 콘텐츠
 */

const volumeData = {
    objective: "단위 정육면체의 개수로 직육면체의 부피를 구해요.",
    workedExample: "가로 4cm, 세로 3cm인 한 층에는 1cm³ 큐브 12개가 들어갑니다. 높이 2cm이면 두 층이므로 12×2=24cm³입니다. 길이를 더하는 것이 아니라 각 층의 개수를 곱합니다.",
    reflection: "같은 24cm³를 만드는 서로 다른 상자 크기 두 가지를 찾아보세요. 부피가 같아도 모양은 같지 않은 이유를 말하세요.",
    title: "부피 탐험가",
    hook: {
        question: "택배 상자 안에 물건을 가득 채우려면, 상자 크기를 어떻게 알 수 있을까요?",
        subText: "상자 안에 작은 큐브를 쌓아볼까요?",
        visual: {
            type: "svg",
            content: `
                <svg viewBox="0 0 400 200" class="hook-svg">
                    <!-- 상자 외형 -->
                    <g transform="translate(100, 30)">
                        <!-- 뒷면 -->
                        <rect x="30" y="10" width="120" height="100" fill="#D7CCC8" stroke="#8D6E63" stroke-width="2"/>
                        <!-- 옆면 -->
                        <polygon points="30,10 0,40 0,140 30,110" fill="#BCAAA4" stroke="#8D6E63" stroke-width="2"/>
                        <!-- 밑면 -->
                        <polygon points="0,140 30,110 150,110 120,140" fill="#A1887F" stroke="#8D6E63" stroke-width="2"/>

                        <!-- 단위 큐브들 (3x3x2) -->
                        <g fill="#64B5F6" stroke="#1976D2" stroke-width="1">
                            <!-- 첫번째 층 -->
                            <rect x="35" y="75" width="25" height="25"/>
                            <rect x="65" y="75" width="25" height="25"/>
                            <rect x="95" y="75" width="25" height="25"/>
                            <rect x="125" y="75" width="25" height="25"/>
                            <!-- 두번째 층 -->
                            <rect x="35" y="45" width="25" height="25"/>
                            <rect x="65" y="45" width="25" height="25"/>
                            <rect x="95" y="45" width="25" height="25" fill="#90CAF9"/>
                            <rect x="125" y="45" width="25" height="25" fill="#90CAF9"/>
                        </g>
                    </g>
                    <!-- 공식 -->
                    <text x="300" y="100" text-anchor="middle" font-size="16" fill="#333" font-weight="bold">가로 x 세로 x 높이</text>
                    <text x="300" y="130" text-anchor="middle" font-size="20" fill="#2196F3" font-weight="bold">= 부피</text>
                </svg>
            `
        }
    },
    story: {
        character: { image: "assets/character.svg" },
        situation: "안녕! 나는 택배기사 '배달이'야!<br><br>오늘 특별한 미션이 있어. 상자 안에 단위 큐브(1cm x 1cm x 1cm)를 빈틈없이 채워야 해!<br>가로, 세로, 높이를 조절하면서 부피의 비밀을 함께 찾아보자!"
    },
    interaction: {
        title: "상자 채우기",
        instruction: "서로 다른 크기로 상자를 3번 채우면 다음 단계가 열립니다. 가로4·세로3·높이2에서 24개를 확인하고, 높이만4로 바꾸어 48개를 예상하세요. 마지막에는 가로2·세로3·높이4를 만들어 24개가 되는지 비교하세요.",
        onInit: (container, engine) => {
            let width = 3, height = 2, depth = 3;
            let cubes = [];
            let isAnimating = false;
            let discoveryCount = 0;

            container.innerHTML = `
                <div class="three-container" id="three-canvas"></div>
                <div class="control-panel">
                    <div class="slider-group">
                        <div class="slider-row">
                            <span class="slider-label width">가로</span>
                            <input type="range" id="width-slider" min="1" max="5" value="3">
                            <span class="slider-value" id="width-value">3</span>
                        </div>
                        <div class="slider-row">
                            <span class="slider-label height">세로</span>
                            <input type="range" id="height-slider" min="1" max="5" value="2">
                            <span class="slider-value" id="height-value">2</span>
                        </div>
                        <div class="slider-row">
                            <span class="slider-label depth">높이</span>
                            <input type="range" id="depth-slider" min="1" max="5" value="3">
                            <span class="slider-value" id="depth-value">3</span>
                        </div>
                    </div>
                    <div class="volume-display">
                        <div class="volume-formula">
                            <span style="color:#E91E63">가로</span> x
                            <span style="color:#4CAF50">세로</span> x
                            <span style="color:#2196F3">높이</span> = 부피
                        </div>
                        <div class="volume-value" id="volume-result">18</div>
                        <div class="volume-unit">cm³ (단위 큐브 개수)</div>
                    </div>
                </div>
                <button class="fill-btn" id="fill-btn">상자 채우기!</button>
                <p class="hint-text">드래그해서 상자를 돌려볼 수 있어요!</p>
            `;

            // Three.js 초기화
            const threeContainer = document.getElementById('three-canvas');
            const w = threeContainer.clientWidth;
            const h = threeContainer.clientHeight;

            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x1a3a32);

            const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
            camera.position.set(8, 6, 10);

            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(w, h);
            renderer.setPixelRatio(window.devicePixelRatio);
            threeContainer.appendChild(renderer.domElement);

            const controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.enableZoom = false;

            // 조명
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(10, 15, 10);
            scene.add(directionalLight);

            // 상자 외곽선
            let boxHelper;
            const updateBoxOutline = () => {
                if (boxHelper) scene.remove(boxHelper);

                const boxGeom = new THREE.BoxGeometry(width, depth, height);
                const edges = new THREE.EdgesGeometry(boxGeom);
                boxHelper = new THREE.LineSegments(
                    edges,
                    new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 })
                );
                boxHelper.position.set(width / 2 - 0.5, depth / 2 - 0.5, height / 2 - 0.5);
                scene.add(boxHelper);
            };

            // 단위 큐브 생성
            const createUnitCube = (x, y, z, delay) => {
                const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
                const hue = (x + y + z) * 0.1;
                const material = new THREE.MeshPhongMaterial({
                    color: new THREE.Color().setHSL(hue % 1, 0.7, 0.5),
                    transparent: true,
                    opacity: 0
                });

                const cube = new THREE.Mesh(geometry, material);
                cube.position.set(x, y, z);
                cube.scale.set(0, 0, 0);
                scene.add(cube);
                cubes.push(cube);

                // 애니메이션
                setTimeout(() => {
                    const animateCube = () => {
                        if (cube.scale.x < 1) {
                            cube.scale.x += 0.1;
                            cube.scale.y += 0.1;
                            cube.scale.z += 0.1;
                            cube.material.opacity = Math.min(1, cube.material.opacity + 0.1);
                            requestAnimationFrame(animateCube);
                        } else {
                            cube.scale.set(1, 1, 1);
                            cube.material.opacity = 1;
                        }
                    };
                    animateCube();
                }, delay);
            };

            // 모든 큐브 제거
            const clearCubes = () => {
                cubes.forEach(cube => scene.remove(cube));
                cubes = [];
            };

            // 상자 채우기 애니메이션
            const fillBox = () => {
                if (isAnimating) return;
                isAnimating = true;

                const btn = document.getElementById('fill-btn');
                btn.disabled = true;
                btn.textContent = '채우는 중...';

                clearCubes();

                let delay = 0;
                const delayStep = 50;

                for (let x = 0; x < width; x++) {
                    for (let z = 0; z < height; z++) {
                        for (let y = 0; y < depth; y++) {
                            createUnitCube(x, y, z, delay);
                            delay += delayStep;
                        }
                    }
                }

                // 완료 후
                setTimeout(() => {
                    isAnimating = false;
                    btn.disabled = false;
                    btn.textContent = '다시 채우기';
                    discoveryCount++;

                    if (discoveryCount >= 3) {
                        engine.showFeedback("훌륭해요! 부피 = 가로 x 세로 x 높이 라는 것을 발견했어요!", "positive");
                        engine.enableNext();
                    }
                }, delay + 500);
            };

            // 부피 업데이트
            const updateVolume = () => {
                const volume = width * height * depth;
                document.getElementById('volume-result').textContent = volume;
                updateBoxOutline();
                clearCubes();
            };

            // 슬라이더 이벤트
            document.getElementById('width-slider').addEventListener('input', (e) => {
                width = parseInt(e.target.value);
                document.getElementById('width-value').textContent = width;
                updateVolume();
            });

            document.getElementById('height-slider').addEventListener('input', (e) => {
                height = parseInt(e.target.value);
                document.getElementById('height-value').textContent = height;
                updateVolume();
            });

            document.getElementById('depth-slider').addEventListener('input', (e) => {
                depth = parseInt(e.target.value);
                document.getElementById('depth-value').textContent = depth;
                updateVolume();
            });

            document.getElementById('fill-btn').addEventListener('click', fillBox);

            // 초기화
            updateBoxOutline();

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
                "question": "가로 4cm, 세로 3cm, 높이 2cm인 직육면체의 부피는?",
                "options": [
                        "24 cm³",
                        "18 cm³",
                        "20 cm³",
                        "12 cm³"
                ],
                "answer": 0,
                "explanation": "한 층에 4×3=12개의 1cm³ 큐브가 있고 두 층이므로 24cm³입니다."
        },
        {
                "question": "가로와 세로를 유지하고 높이만 2배로 하면 부피는?",
                "options": [
                        "그대로",
                        "2배",
                        "4배"
                ],
                "answer": 1,
                "explanation": "층마다 큐브 수는 같고 층의 수만 2배가 되므로 전체 부피도 2배입니다."
        }
]
};

Engine.init(volumeData);
