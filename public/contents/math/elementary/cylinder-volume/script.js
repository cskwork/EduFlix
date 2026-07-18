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
        this.quizIndex = 0;
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'scene-container';
            document.body.appendChild(this.container);
        }
    }

    init(gameData) {
        this.data = gameData;
        this.createProgressBar();
        this.createScenes();
        this.start();
    }

    /* Q13: Progress Bar creation */
    createProgressBar() {
        var bar = document.createElement('div');
        bar.className = 'progress-bar-container';
        bar.setAttribute('role', 'progressbar');
        bar.setAttribute('aria-label', '학습 진행 상태');
        bar.innerHTML =
            '<div class="progress-track">' +
                '<div class="progress-fill" id="progress-fill" style="width: 20%"></div>' +
            '</div>' +
            '<span class="progress-label" id="progress-label" aria-live="polite">1 / 5</span>';
        this.container.appendChild(bar);
    }

    updateProgress(sceneId) {
        var order = ['hook', 'story', 'core', 'quiz', 'wrap'];
        var idx = order.indexOf(sceneId);
        if (idx === -1) return;
        var percent = ((idx + 1) / order.length) * 100;
        var fill = document.getElementById('progress-fill');
        var label = document.getElementById('progress-label');
        if (fill) fill.style.width = percent + '%';
        if (label) label.textContent = (idx + 1) + ' / ' + order.length;
    }

    escapeHtml(value) {
        return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    isImagePath(value) {
        return /^(?:\.{0,2}\/|assets\/|https?:\/\/|data:image\/)/i.test(value) || /\.(svg|png|jpe?g|gif|webp|avif)$/i.test(value);
    }

    /* Q06: Named tutor character "수학 탐험가 드롭" as inline SVG (no emoji) */
    getCharacterMarkup(character) {
        var defaultSVG =
            '<svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="수학 탐험가 드롭">' +
                '<title>수학 탐험가 드롭</title>' +
                '<path d="M50,12 C50,12 18,58 18,86 C18,110 32,122 50,122 C68,122 82,110 82,86 C82,58 50,12 50,12 Z" fill="#4D96FF" stroke="#2962FF" stroke-width="2"/>' +
                '<ellipse cx="37" cy="70" rx="8" ry="14" fill="rgba(255,255,255,0.2)"/>' +
                '<circle cx="39" cy="82" r="6" fill="#fff"/>' +
                '<circle cx="40" cy="83" r="3.5" fill="#1A237E"/>' +
                '<circle cx="61" cy="82" r="6" fill="#fff"/>' +
                '<circle cx="62" cy="83" r="3.5" fill="#1A237E"/>' +
                '<path d="M41,94 Q50,102 59,94" stroke="#1A237E" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
                '<circle cx="30" cy="90" r="4" fill="rgba(255,105,180,0.35)"/>' +
                '<circle cx="70" cy="90" r="4" fill="rgba(255,105,180,0.35)"/>' +
                '<path d="M22,28 Q50,6 78,28 L75,33 Q50,14 25,33 Z" fill="#FFD54F" stroke="#F9A825" stroke-width="1.5"/>' +
                '<rect x="35" y="27" width="30" height="5" rx="2.5" fill="#F9A825"/>' +
            '</svg>';

        if (!character || !character.image) {
            return '<div class="story-character-svg">' + defaultSVG + '</div>';
        }
        var imageValue = String(character.image);
        if (this.isImagePath(imageValue)) {
            var altText = character.alt ? this.escapeHtml(character.alt) : '캐릭터';
            return '<img class="story-character-image" src="' + this.escapeHtml(imageValue) + '" alt="' + altText + '" />';
        }
        if (imageValue.trim().startsWith('<svg')) {
            return '<div class="story-character-svg">' + imageValue + '</div>';
        }
        return '<div class="story-character-svg">' + defaultSVG + '</div>';
    }

    createScenes() {
        /* Hook scene - Q04: learning objective, Q20: SVG accessibility */
        this.createScene('hook', (scene) => {
            var d = this.data.hook;
            var html = '<div class="hook-content">';
            html += '<div class="question-box">';
            html += '<h1 class="hook-question">' + d.question + '</h1>';
            if (d.subText) html += '<p class="hook-subtext">' + d.subText + '</p>';
            html += '</div>';
            if (d.learningObjective) {
                html += '<div class="learning-objective-box" role="status">';
                html += '<div class="learning-objective-label">학습 목표</div>';
                html += '<div class="learning-objective-text">' + d.learningObjective + '</div>';
                html += '</div>';
            }
            if (d.visual) html += '<div class="hook-visual">' + d.visual.content + '</div>';
            html += '<button class="btn btn-primary-large" onclick="Engine.nextScene()">탐험 시작하기</button>';
            html += '</div>';
            scene.innerHTML = html;
            if (d.onInit) d.onInit(scene);
        });

        /* Story scene - Q06: tutor character "드롭" */
        this.createScene('story', (scene) => {
            var d = this.data.story;
            var html = '<div class="story-stage">';
            html += this.getCharacterMarkup(d.character);
            html += '<span class="story-character-name">수학 탐험가 드롭</span>';
            html += '</div>';
            html += '<div class="scene-text typing-effect">' + d.situation + '</div>';
            html += '<button class="btn btn-primary-large animate-fade-in" onclick="Engine.nextScene()">직접 조작하기</button>';
            scene.innerHTML = html;
        });

        /* Core scene - diagram-circle-anatomy asset reference */
        this.createScene('core', (scene) => {
            scene.innerHTML =
                '<h2 class="scene-title">' + (this.data.interaction.title || '체험하기') + '</h2>' +
                '<div class="scene-text">' + this.data.interaction.instruction + '</div>' +
                '<img src="../../../diagrams/diagram-circle-anatomy-parts-20260125.svg" alt="원의 중심과 반지름을 보여주는 해부도" class="diagram-reference" />' +
                '<div class="interactive-area" id="core-interactive-area"></div>' +
                '<div id="core-feedback" class="core-feedback"></div>' +
                '<button class="btn btn-primary-large animate-fade-in" id="core-next-btn" style="display:none; margin-top:0.8rem;" onclick="Engine.nextScene()">문제 풀러 가기</button>';
        }, () => {
            if (this.data.interaction.onInit) this.data.interaction.onInit(document.getElementById('core-interactive-area'), this);
        });

        /* Quiz scene - diagram-circle-anatomy asset reference */
        if (this.data.quiz) {
            this.createScene('quiz', (scene) => {
                scene.innerHTML =
                    '<h2 class="scene-title">개념 점검 퀴즈!</h2>' +
                    '<img src="../../../diagrams/diagram-circle-anatomy-parts-20260125.svg" alt="원의 중심과 반지름 참고 도면" class="diagram-reference diagram-quiz" />' +
                    '<div class="scene-text" id="quiz-question"></div>' +
                    '<div class="quiz-container" id="quiz-options"></div>' +
                    '<div class="quiz-feedback" id="quiz-feedback"></div>' +
                    '<div class="quiz-hint" id="quiz-hint"></div>';
            }, () => {
                this.quizIndex = 0;
                this.startQuiz();
            });
        }

        /* Wrap scene - icon-trophy asset reference, bg-math-formulas via CSS */
        /* Q21 & LLM 심사 수정: inline event escaping 제거, addEventListener로 postMessage 바인딩 */
        this.createScene('wrap', (scene) => {
            scene.innerHTML =
                '<div class="wrap-trophy">' +
                    '<img src="../../../icons/icon-trophy-achievement-cute-20260124.svg" alt="수학 탐험가 완료 배지" class="trophy-icon" />' +
                '</div>' +
                '<h1 class="scene-title">탐험 완료!</h1>' +
                '<div class="wrap-summary">' +
                    '<p class="scene-text">오늘 배운 핵심 공식</p>' +
                    '<h3>원기둥의 부피</h3>' +
                    '<span class="formula-highlight">부피 = 밑면적 × 높이<br>(π × r × r × h)</span>' +
                    '<p style="color:#666; font-size:0.95rem;">일상 속 원기둥 모양 물건들의 부피도 계산해 보세요!</p>' +
                '</div>' +
                '<div style="display:flex; gap:15px;">' +
                    '<button class="btn btn-secondary-large" id="wrap-restart-btn">다시 학습하기</button>' +
                    '<button class="btn btn-primary-large" id="wrap-finish-btn">학습 완료</button>' +
                '</div>';
            
            var restartBtn = scene.querySelector('#wrap-restart-btn');
            if (restartBtn) {
                restartBtn.addEventListener('click', function() {
                    location.reload();
                });
            }

            var finishBtn = scene.querySelector('#wrap-finish-btn');
            if (finishBtn) {
                finishBtn.addEventListener('click', function() {
                    window.parent.postMessage('close', '*');
                });
            }
        });
    }

    createScene(id, renderFn, onEnterFn) {
        var sceneEl = document.createElement('div');
        sceneEl.id = 'scene-' + id;
        sceneEl.className = 'scene scene-' + id;
        renderFn(sceneEl);
        this.container.appendChild(sceneEl);
        var scene = new Scene(id, sceneEl);
        if (onEnterFn) scene.onEnter = onEnterFn;
        this.scenes.set(id, scene);
    }

    switchScene(sceneId) {
        if (this.currentSceneId) this.scenes.get(this.currentSceneId).hide();
        if (this.scenes.has(sceneId)) {
            this.currentSceneId = sceneId;
            this.scenes.get(sceneId).show();
            this.updateProgress(sceneId);
        }
    }

    nextScene() {
        var order = ['hook', 'story', 'core', 'quiz', 'wrap'];
        var currentIndex = order.indexOf(this.currentSceneId);
        if (currentIndex < order.length - 1) this.switchScene(order[currentIndex + 1]);
    }

    start() { this.switchScene('hook'); }

    showFeedback(msg, type) {
        type = type || 'neutral';
        var el = document.getElementById('core-feedback');
        if (el) {
            el.innerHTML = msg;
            el.style.color = type === 'positive' ? '#2E7D32' : (type === 'negative' ? '#C62828' : '#555');
        }
    }

    enableNext() {
        var btn = document.getElementById('core-next-btn');
        if (btn) { btn.style.display = 'inline-flex'; btn.classList.add('animate-fade-in'); }
    }

    startQuiz() {
        var self = this;
        var q = this.data.quiz[this.quizIndex];
        var qEl = document.getElementById('quiz-question');
        qEl.textContent = '[문제 ' + (this.quizIndex + 1) + '] ' + q.question;

        var optsContainer = document.getElementById('quiz-options');
        optsContainer.innerHTML = '';

        var feedbackEl = document.getElementById('quiz-feedback');
        var hintEl = document.getElementById('quiz-hint');
        feedbackEl.textContent = '';
        hintEl.textContent = '';

        q.options.forEach(function(opt, idx) {
            var btn = document.createElement('button');
            btn.className = 'quiz-option';
            btn.textContent = opt;
            btn.onclick = function() { self.checkQuiz(idx, q.answer, btn); };
            optsContainer.appendChild(btn);
        });
    }

    checkQuiz(selectedIdx, correctIdx, btnElement) {
        var self = this;
        var q = this.data.quiz[this.quizIndex];
        var opts = document.querySelectorAll('.quiz-option');
        var feedbackEl = document.getElementById('quiz-feedback');
        var hintEl = document.getElementById('quiz-hint');

        if (selectedIdx === correctIdx) {
            opts.forEach(function(o) { o.style.pointerEvents = 'none'; });
            btnElement.classList.add('correct');
            feedbackEl.innerHTML = q.correctFeedback || '정답입니다!';
            feedbackEl.style.color = '#2E7D32';
            hintEl.textContent = '';

            setTimeout(function() {
                self.quizIndex++;
                if (self.quizIndex < self.data.quiz.length) {
                    self.startQuiz();
                } else {
                    self.nextScene();
                }
            }, 1500);
        } else {
            opts.forEach(function(o) { o.style.pointerEvents = 'none'; });
            btnElement.classList.add('incorrect');
            feedbackEl.innerHTML = q.incorrectFeedback || '오답입니다.';
            feedbackEl.style.color = '#C62828';
            hintEl.textContent = '힌트: ' + q.hint;

            setTimeout(function() {
                opts.forEach(function(o) {
                    o.style.pointerEvents = 'auto';
                    o.classList.remove('incorrect');
                });
                feedbackEl.textContent = '';
                hintEl.textContent = '다시 선택해 보세요.';
            }, 2000);
        }
    }
}

window.Engine = new EduFlixEngine();

/* ========================================
   Content Code: 원기둥의 부피
   ======================================== */

var cylinderVolumeData = {
    title: "원기둥의 부피",
    hook: {
        question: "어떤 물통에 더 많은 주스가 들어갈까요?",
        subText: "크기만 봐서는 알 수 없습니다! 공간의 들이(부피)를 계산해 봅시다.",
        /* Q04: Student-friendly learning objective */
        learningObjective: "나는 원기둥의 부피를 계산할 수 있습니다.",
        visual: {
            type: "svg",
            /* Q20: role="img", <title>, aria-label for screen reader accessibility */
            content: [
                '<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="가늘고 긴 원기둥 통과 굵고 짧은 원기둥 통에 보라색 주스가 담긴 비교 그림">',
                    '<title>두 개의 다른 크기 원기둥 물통 비교</title>',
                    '<g transform="translate(70, 20)">',
                        '<ellipse cx="30" cy="150" rx="30" ry="10" fill="rgba(77, 150, 255, 0.2)" stroke="#4D96FF" stroke-width="2"/>',
                        '<rect x="0" y="20" width="60" height="130" fill="rgba(77, 150, 255, 0.1)" stroke="#4D96FF" stroke-width="2"/>',
                        '<ellipse cx="30" cy="20" rx="30" ry="10" fill="rgba(255,255,255,0.5)" stroke="#4D96FF" stroke-width="2"/>',
                        '<rect x="0" y="70" width="60" height="80" fill="rgba(186, 104, 200, 0.4)"/>',
                        '<ellipse cx="30" cy="70" rx="30" ry="10" fill="rgba(186, 104, 200, 0.6)"/>',
                        '<text x="30" y="180" font-size="14" text-anchor="middle" fill="#333" font-weight="bold">A (가늘고 긴 통)</text>',
                    '</g>',
                    '<g transform="translate(230, 50)">',
                        '<ellipse cx="50" cy="100" rx="50" ry="15" fill="rgba(255, 107, 107, 0.2)" stroke="#FF6B6B" stroke-width="2"/>',
                        '<rect x="0" y="15" width="100" height="85" fill="rgba(255, 107, 107, 0.1)" stroke="#FF6B6B" stroke-width="2"/>',
                        '<ellipse cx="50" cy="15" rx="50" ry="15" fill="rgba(255,255,255,0.5)" stroke="#FF6B6B" stroke-width="2"/>',
                        '<rect x="0" y="50" width="100" height="50" fill="rgba(186, 104, 200, 0.4)"/>',
                        '<ellipse cx="50" cy="50" rx="50" ry="15" fill="rgba(186, 104, 200, 0.6)"/>',
                        '<text x="50" y="135" font-size="14" text-anchor="middle" fill="#333" font-weight="bold">B (굵고 짧은 통)</text>',
                    '</g>',
                '</svg>'
            ].join('')
        }
    },
    story: {
        /* Q06: Named tutor character with inline SVG (no emoji) */
        character: {
            image: [
                '<svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="수학 탐험가 드롭 캐릭터">',
                    '<title>수학 탐험가 드롭</title>',
                    '<path d="M50,12 C50,12 18,58 18,86 C18,110 32,122 50,122 C68,122 82,110 82,86 C82,58 50,12 50,12 Z" fill="#4D96FF" stroke="#2962FF" stroke-width="2"/>',
                    '<ellipse cx="37" cy="70" rx="8" ry="14" fill="rgba(255,255,255,0.2)"/>',
                    '<circle cx="39" cy="82" r="6" fill="#fff"/>',
                    '<circle cx="40" cy="83" r="3.5" fill="#1A237E"/>',
                    '<circle cx="61" cy="82" r="6" fill="#fff"/>',
                    '<circle cx="62" cy="83" r="3.5" fill="#1A237E"/>',
                    '<path d="M41,94 Q50,102 59,94" stroke="#1A237E" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
                    '<circle cx="30" cy="90" r="4" fill="rgba(255,105,180,0.35)"/>',
                    '<circle cx="70" cy="90" r="4" fill="rgba(255,105,180,0.35)"/>',
                    '<path d="M22,28 Q50,6 78,28 L75,33 Q50,14 25,33 Z" fill="#FFD54F" stroke="#F9A825" stroke-width="1.5"/>',
                    '<rect x="35" y="27" width="30" height="5" rx="2.5" fill="#F9A825"/>',
                '</svg>'
            ].join(''),
            alt: "수학 탐험가 드롭"
        },
        situation: "안녕! 나는 수학 탐험가 <strong>드롭</strong>이야!<br><br>원기둥 모양의 통에 얼마나 많은 물이 들어갈지 궁금하지 않아요?<br>원기둥을 아주 얇은 <strong>원판(동전)들이 무수히 쌓인 형태</strong>로 상상해 봅시다.<br><br>원판 하나의 넓이는 <strong>밑면적</strong>이고, 그것이 <strong>높이</strong>만큼 쌓인 것이 바로 <strong>부피</strong>랍니다!"
    },
    interaction: {
        title: "원기둥 부피 탐구",
        instruction: "마우스로 드래그하여 원기둥을 돌려보고, 슬라이더를 움직여 크기를 바꿔보세요! (키보드 방향키로도 회전할 수 있어요.)",
        onInit: function(container, engine) {
            var radius = 3;
            var height = 5;
            var isCalculated = false;
            var animId = null;

            container.innerHTML =
                '<div class="three-container" id="three-canvas"></div>' +
                '<div class="control-panel">' +
                    '<div class="slider-group">' +
                        '<div class="slider-item">' +
                            '<span class="slider-label">반지름 (r)</span>' +
                            '<input type="range" id="slider-radius" min="1" max="5" value="3" step="1" aria-label="반지름 조절 슬라이더 (1~5cm)"/>' +
                            '<span class="slider-value"><span id="val-radius">3</span> cm</span>' +
                        '</div>' +
                        '<div class="slider-item">' +
                            '<span class="slider-label">높이 (h)</span>' +
                            '<input type="range" id="slider-height" min="1" max="8" value="5" step="1" aria-label="높이 조절 슬라이더 (1~8cm)"/>' +
                            '<span class="slider-value"><span id="val-height">5</span> cm</span>' +
                        '</div>' +
                    '</div>' +
                    '<button id="calc-btn" class="btn btn-primary-large" style="width: 100%;">부피 계산하기</button>' +
                    '<div class="volume-display" id="volume-display">' +
                        '<div class="volume-title">계산 결과</div>' +
                        '<div class="volume-formula">' +
                            '밑면적: <span id="base-area"></span> cm²<br>' +
                            '부피 = 밑면적 × 높이<br>' +
                            '= <span id="formula-text"></span>' +
                        '</div>' +
                        '<div class="volume-result"><span id="result-volume"></span> cm³</div>' +
                    '</div>' +
                '</div>';

            var threeContainer = document.getElementById('three-canvas');

            var scene = new THREE.Scene();
            scene.background = new THREE.Color(0xE8F0FE);

            var camera = new THREE.PerspectiveCamera(50, threeContainer.clientWidth / threeContainer.clientHeight, 0.1, 1000);
            camera.position.set(10, 8, 10);

            var renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            threeContainer.appendChild(renderer.domElement);

            var controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.minDistance = 5;
            controls.maxDistance = 30;

            var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambientLight);

            var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(10, 20, 10);
            scene.add(directionalLight);

            var grid = new THREE.GridHelper(20, 20, 0xbbbbbb, 0xdddddd);
            scene.add(grid);

            var cylinderMesh;
            var baseCircleMesh;

            function createCylinder() {
                if (cylinderMesh) scene.remove(cylinderMesh);
                if (baseCircleMesh) scene.remove(baseCircleMesh);

                var geom = new THREE.CylinderGeometry(radius, radius, height, 32);
                var mat = new THREE.MeshPhongMaterial({
                    color: 0x4D96FF,
                    transparent: true,
                    opacity: 0.7,
                    shininess: 100
                });
                cylinderMesh = new THREE.Mesh(geom, mat);
                cylinderMesh.position.y = height / 2;
                scene.add(cylinderMesh);

                var baseGeom = new THREE.RingGeometry(radius - 0.05, radius, 32);
                var baseMat = new THREE.MeshBasicMaterial({ color: 0xFF6B6B, side: THREE.DoubleSide });
                baseCircleMesh = new THREE.Mesh(baseGeom, baseMat);
                baseCircleMesh.rotation.x = -Math.PI / 2;
                baseCircleMesh.position.y = 0.01;
                scene.add(baseCircleMesh);
            }

            createCylinder();

            var coreSceneEl = document.getElementById('scene-core');

            function animate() {
                if (!coreSceneEl || !coreSceneEl.classList.contains('active')) {
                    animId = null;
                    return;
                }
                animId = requestAnimationFrame(animate);
                controls.update();
                renderer.render(scene, camera);
            }
            animate();

            function handleResize() {
                var w = threeContainer.clientWidth;
                var h = threeContainer.clientHeight;
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
                renderer.setSize(w, h);
            }
            window.addEventListener('resize', handleResize);

            /* Slider Events */
            var sliderRadius = document.getElementById('slider-radius');
            sliderRadius.addEventListener('input', function(e) {
                radius = parseInt(e.target.value);
                document.getElementById('val-radius').textContent = radius;
                createCylinder();
                document.getElementById('volume-display').classList.remove('show');
                isCalculated = false;
                engine.showFeedback("원기둥의 크기가 변했어요! 다시 계산해 보세요.", "neutral");
            });

            var sliderHeight = document.getElementById('slider-height');
            sliderHeight.addEventListener('input', function(e) {
                height = parseInt(e.target.value);
                document.getElementById('val-height').textContent = height;
                createCylinder();
                document.getElementById('volume-display').classList.remove('show');
                isCalculated = false;
                engine.showFeedback("원기둥의 높이가 변했어요! 다시 계산해 보세요.", "neutral");
            });

            /* Calculate Button Event */
            document.getElementById('calc-btn').addEventListener('click', function() {
                var baseArea = (radius * radius * 3.14).toFixed(2);
                var volume = (radius * radius * 3.14 * height).toFixed(2);

                document.getElementById('base-area').textContent = radius + ' × ' + radius + ' × 3.14 = ' + baseArea;
                document.getElementById('formula-text').textContent = baseArea + ' × ' + height;
                document.getElementById('result-volume').textContent = volume;

                document.getElementById('volume-display').classList.add('show');

                if (!isCalculated) {
                    engine.showFeedback("훌륭해요! 부피를 정확히 계산했습니다. 단위는 cm³(세제곱센티미터)예요.", "positive");
                    engine.enableNext();
                    isCalculated = true;
                }
            });

            /* Q21: Keyboard accessibility for 3D object rotation */
            renderer.domElement.setAttribute('tabindex', '0');
            renderer.domElement.setAttribute('role', 'application');
            renderer.domElement.setAttribute('aria-label', '원기둥 3D 모델 - 방향키로 회전할 수 있습니다');

            renderer.domElement.addEventListener('keydown', function(e) {
                var step = 0.2;
                var offset = new THREE.Vector3().copy(camera.position).sub(controls.target);
                var spherical = new THREE.Spherical().setFromVector3(offset);
                var handled = true;

                switch (e.key) {
                    case 'ArrowLeft':
                        spherical.theta += step;
                        break;
                    case 'ArrowRight':
                        spherical.theta -= step;
                        break;
                    case 'ArrowUp':
                        spherical.phi = Math.max(0.3, spherical.phi - step);
                        break;
                    case 'ArrowDown':
                        spherical.phi = Math.min(Math.PI - 0.3, spherical.phi + step);
                        break;
                    default:
                        handled = false;
                }

                if (handled) {
                    offset.setFromSpherical(spherical);
                    camera.position.copy(controls.target).add(offset);
                    camera.lookAt(controls.target);
                    controls.update();
                    e.preventDefault();
                }
            });
        }
    },
    quiz: [
        {
            question: "반지름이 3cm이고 높이가 10cm인 원기둥의 부피는 몇 cm³인가요? (원주율은 3.14로 계산합니다)",
            options: ["94.2 cm³", "282.6 cm³", "188.4 cm³", "31.4 cm²"],
            answer: 1,
            hint: "원의 넓이(3 × 3 × 3.14)를 먼저 구한 후, 높이(10)를 곱하세요. 단위도 주의!",
            correctFeedback: "정답입니다! 3 × 3 × 3.14 × 10 = 282.6으로 정확히 계산하셨네요.",
            incorrectFeedback: "틀렸어요. 밑면의 넓이(반지름 × 반지름 × 원주율)에 높이를 곱했는지 확인해 보세요."
        },
        {
            question: "원기둥의 부피를 구하는 공식으로 올바른 것은 무엇인가요?",
            options: ["(밑면의 둘레) × 높이", "(밑면의 넓이) × 높이", "(반지름) × 높이 × 2", "(밑면의 넓이) × 높이 × 높이"],
            answer: 1,
            hint: "우리가 배운 얇은 원판들이 쌓여서 부피가 된 것을 떠올려 보세요. 원판 하나의 크기는 밑면의 넓이였습니다.",
            correctFeedback: "정답입니다! 직육면체의 부피처럼 원기둥의 부피도 '밑면적 × 높이'로 구할 수 있어요.",
            incorrectFeedback: "아쉬워요. 부피는 공간을 차지하는 양이며, 밑면의 '넓이'와 '높이'가 필요합니다."
        },
        {
            question: "반지름이 5cm이고 높이가 5cm인 원기둥의 부피는 몇 cm³인가요? (원주율 3.14)",
            options: ["78.5 cm³", "392.5 cm³", "31.4 cm²", "157 cm³"],
            answer: 1,
            hint: "반지름의 제곱(r × r)은 곱하기 2(2r)와 다릅니다. 5 × 5를 먼저 계산해 보세요.",
            correctFeedback: "정확합니다! 5 × 5 × 3.14 × 5 = 392.5 cm³ 입니다.",
            incorrectFeedback: "아쉬워요. 반지름을 2로 곱하는 대신 제곱(× 자기 자신)을 했는지 확인해 보세요."
        }
    ]
};

Engine.init(cylinderVolumeData);