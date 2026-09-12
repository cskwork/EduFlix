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
        this.currentQuizIndex = 0;
        this.sceneOrder = ['hook', 'story', 'core', 'quiz', 'wrap'];
    }

    init(gameData) {
        this.data = gameData;
        this.createScenes();
        this.start();
    }

    escapeHtml(value) {
        return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    /* Q13: 진행도 막대 갱신 */
    updateProgressBar() {
        var currentIndex = this.sceneOrder.indexOf(this.currentSceneId);
        var percent = (currentIndex / (this.sceneOrder.length - 1)) * 100;

        var fill = document.getElementById('progress-fill');
        if (fill) fill.style.width = percent + '%';

        var container = document.getElementById('progress-bar-container');
        if (container) container.setAttribute('aria-valuenow', String(currentIndex + 1));

        var dots = document.querySelectorAll('.progress-dot');
        dots.forEach(function(dot, idx) {
            if (idx <= currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    createScenes() {
        this.createScene('hook', (scene) => {
            var self = this;
            var hookData = this.data.hook;
            var question = hookData.question;
            var subText = hookData.subText;
            scene.innerHTML =
                '<div class="hook-content">' +
                    '<div class="learning-objectives" role="region" aria-label="오늘의 학습 목표">' +
                        '<p class="lo-label">[오늘의 학습 목표]</p>' +
                        '<p class="lo-text">같은 가상 원금과 수익률에서 공제 시점이 복리 결과에 미치는 차이를 식으로 설명할 수 있습니다. 이 모형의 수치는 실제 IRP 세율·한도나 미래 수익을 뜻하지 않습니다.</p>' +
                    '</div>' +
                    '<div class="question-box">' +
                        '<h1 class="hook-question">' + question + '</h1>' +
                        (subText ? '<p class="hook-subtext">' + subText + '</p>' : '') +
                    '</div>' +
                    '<div class="hook-options">' +
                        '<button class="wallet-btn" id="btn-empty-wallet" tabindex="0" aria-label="텅 빈 지갑 클릭">' +
                            '<svg width="120" height="120" viewBox="0 0 100 100">' +
                                '<rect x="20" y="30" width="60" height="40" rx="5" fill="#8d6e63" stroke="#5d4037" stroke-width="2"/>' +
                                '<rect x="20" y="45" width="60" height="25" rx="2" fill="#d7ccc8"/>' +
                                '<circle cx="30" cy="20" r="3" fill="#bdbdbd" class="dust"/>' +
                                '<circle cx="70" cy="15" r="2" fill="#bdbdbd" class="dust"/>' +
                                '<text x="50" y="60" font-size="10" text-anchor="middle" fill="#5d4037">비어있음...</text>' +
                            '</svg>' +
                        '</button>' +
                        '<button class="wallet-btn" id="btn-rich-wallet" tabindex="0" aria-label="가득 찬 지갑 클릭">' +
                            '<svg width="120" height="120" viewBox="0 0 100 100">' +
                                '<rect x="15" y="25" width="70" height="50" rx="5" fill="#ffd700" stroke="#fbc02d" stroke-width="2"/>' +
                                '<rect x="15" y="40" width="70" height="35" rx="2" fill="#fff8e1"/>' +
                                '<circle cx="40" cy="35" r="8" fill="#ffca28" stroke="#f9a825" stroke-width="1"/>' +
                                '<text x="40" y="40" font-size="10" text-anchor="middle" fill="#5d4037">₩</text>' +
                                '<circle cx="60" cy="30" r="6" fill="#ffca28" stroke="#f9a825" stroke-width="1"/>' +
                                '<text x="60" y="34" font-size="8" text-anchor="middle" fill="#5d4037">₩</text>' +
                            '</svg>' +
                        '</button>' +
                    '</div>' +
                    '<div id="hook-feedback" class="feedback-area" style="min-height: 40px;"></div>' +
                    '<button class="btn btn-primary-large" id="hook-next-btn" tabindex="0" disabled onclick="Engine.nextScene()">미래로 떠나기</button>' +
                '</div>';
            if (this.data.hook.onInit) this.data.hook.onInit(scene);
            
            /* Q21: hook-next-btn 키보드 이벤트 핸들러 */
            const hookNextBtn = document.getElementById('hook-next-btn');
            if(hookNextBtn) {
                hookNextBtn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if(!hookNextBtn.disabled) hookNextBtn.click();
                    }
                });
            }
        });

        this.createScene('story', (scene) => {
            var storyData = this.data.story;
            var situation = storyData.situation;
            scene.innerHTML =
                '<div class="story-stage">' +
                    '<div class="story-character-image">' +
                        '<svg viewBox="0 0 200 200" width="100%" height="100%">' +
                            '<rect x="70" y="100" width="60" height="60" rx="10" fill="#64B5F6"/>' +
                            '<circle cx="100" cy="70" r="35" fill="#90CAF9"/>' +
                            '<circle cx="85" cy="70" r="5" fill="#333"/>' +
                            '<circle cx="115" cy="70" r="5" fill="#333"/>' +
                            '<path d="M85 85 Q100 95 115 85" stroke="#333" stroke-width="3" fill="none"/>' +
                            '<rect x="80" y="120" width="40" height="10" fill="#fff" opacity="0.5"/>' +
                            '<circle cx="100" cy="110" r="5" fill="#ffca28"/>' +
                        '</svg>' +
                    '</div>' +
                    '<div class="scene-text typing-effect">' + situation + '</div>' +
                '</div>' +
                '<button class="btn btn-primary-large animate-fade-in" id="story-next-btn" tabindex="0">IRP 머신 작동하기</button>';
            if (this.data.story.onInit) this.data.story.onInit(scene);
        });

        this.createScene('core', (scene) => {
            scene.innerHTML =
                '<h2 class="scene-title">IRP 시간 여행 시뮬레이터</h2>' +
                '<div class="scene-text">가상 원금 1,000만 원에 시작 시 한 번 추가한 금액을 두 모형에 똑같이 넣어요. 연 5%가 30년간 일정하고 이익의 10%를 공제한다고 가정합니다. 수수료·물가·손실은 반영하지 않으며 실제 수익은 보장되지 않아요.</div>' +
                '<div class="interactive-area" id="core-interactive-area"></div>';
        }, () => { if (this.data.interaction.onInit) this.data.interaction.onInit(document.getElementById('core-interactive-area'), this); },
        () => {
            if(window.cleanupCoreScene) window.cleanupCoreScene();
        });

        if (this.data.quiz) {
            this.createScene('quiz', (scene) => {
                scene.innerHTML = '<h2 class="scene-title">개념 확인 퀴즈</h2><div id="quiz-content"></div>';
            }, () => { this.startQuiz(); });
        }

        this.createScene('wrap', (scene) => {
            scene.innerHTML =
                '<h1 class="scene-title">은퇴 설계도 완성!</h1>' +
                '<div class="wrap-summary">' +
                    '<span class="wrap-badge">★ IRP 마스터 ★</span>' +
                    '<p class="scene-text">같은 원금·수익률·기간에서 공제 시점만 바꾸어 비교했습니다.</p>' +
                    '<h3>오늘의 학습</h3>' +
                    '<p>이 모형은 매년 공제하면 P × (1 + 0.05 × 0.9)³⁰, 마지막에 이익을 공제하면 P + (P × 1.05³⁰ − P) × 0.9로 계산해요. 수익률이 0%라면 두 결과가 왜 같은지 설명해 보세요.</p>' +
                '</div>' +
                '<div style="display:flex; gap:15px;">' +
                    '<button class="btn btn-secondary-large" id="wrap-restart-btn" tabindex="0">다시하기</button>' +
                    '<button class="btn btn-primary-large" id="wrap-home-btn" tabindex="0">홈으로</button>' +
                '</div>';

            const restartBtn = document.getElementById('wrap-restart-btn');
            const homeBtn = document.getElementById('wrap-home-btn');

            /* Q21: wrap 씬 버튼 키보드 및 마우스/터치 이벤트 핸들러 */
            if(restartBtn) {
                restartBtn.onclick = () => location.reload();
                restartBtn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        restartBtn.click();
                    }
                });
            }

            if(homeBtn) {
                /* 인라인 EduFlixEngine 런타임 계약: postMessage('close', '*') 리터럴 유지 */
                const closeAction = function() {
                    window.parent.postMessage('close', '*');
                };
                homeBtn.onclick = closeAction;
                homeBtn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        homeBtn.click();
                    }
                });
            }
        });
    }

    createScene(id, renderFn, onEnterFn, onExitFn) {
        let sceneEl = document.createElement('div');
        sceneEl.id = 'scene-' + id;
        sceneEl.className = 'scene scene-' + id;
        // onInit hooks look up their controls through document.getElementById.
        this.container.appendChild(sceneEl);
        renderFn(sceneEl);
        const scene = new Scene(id, sceneEl);
        if (onEnterFn) scene.onEnter = onEnterFn;
        if (onExitFn) scene.onExit = onExitFn;
        this.scenes.set(id, scene);
    }

    switchScene(sceneId) {
        if (this.currentSceneId && this.scenes.has(this.currentSceneId)) {
            this.scenes.get(this.currentSceneId).hide();
        }
        if (this.scenes.has(sceneId)) {
            this.currentSceneId = sceneId;
            this.scenes.get(sceneId).show();
            this.updateProgressBar();
        }
    }

    nextScene() {
        const order = ['hook', 'story', 'core', 'quiz', 'wrap'];
        const currentIndex = order.indexOf(this.currentSceneId);
        if (currentIndex < order.length - 1) this.switchScene(order[currentIndex + 1]);
    }

    start() { this.switchScene('hook'); }

    showFeedback(msg, type) {
        type = type || 'neutral';
        const ids = ['hook-feedback', 'core-feedback'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if(el) {
                el.innerHTML = msg;
                el.className = 'feedback-area feedback-' + type;
            }
        });
    }

    enableNext(sceneId) {
        if(sceneId === 'hook') {
            const btn = document.getElementById('hook-next-btn');
            if(btn) btn.disabled = false;
        } else if (sceneId === 'core') {
            const btn = document.getElementById('core-next-btn');
            if(btn) { btn.style.display = 'inline-block'; btn.classList.add('animate-fade-in'); }
        }
    }

    startQuiz() {
        this.currentQuizIndex = 0;
        this.renderQuiz();
    }

    renderQuiz() {
        const container = document.getElementById('quiz-content');
        if(!container) return;
        const q = this.data.quiz[this.currentQuizIndex];
        const qNum = this.currentQuizIndex + 1;
        const qTotal = this.data.quiz.length;

        let html = '<div class="scene-text" style="margin-bottom: 1rem;">문제 ' + qNum + ' / ' + qTotal + ': ' + q.prompt + '</div>';
        html += '<div class="quiz-container">';

        q.choices.forEach(choice => {
            html += '<button class="quiz-option" data-id="' + choice.id + '" tabindex="0">' + choice.text + '</button>';
        });

        html += '</div>';
        html += '<div id="quiz-feedback" class="feedback-area"></div>';

        container.innerHTML = html;

        /* Q21: 퀴즈 옵션 키보드 이벤트 핸들러 */
        document.querySelectorAll('#quiz-content .quiz-option').forEach(btn => {
            btn.onclick = () => this.checkQuiz(btn.dataset.id, q.correctChoiceId, btn);
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    btn.click();
                }
            });
        });
    }

    checkQuiz(selectedId, correctId, btnElement) {
        const q = this.data.quiz[this.currentQuizIndex];
        const opts = document.querySelectorAll('#quiz-content .quiz-option');
        const feedbackEl = document.getElementById('quiz-feedback');

        if (selectedId === correctId) {
            opts.forEach(o => o.disabled = true);
            btnElement.classList.add('correct');
            feedbackEl.innerHTML = '<p class="feedback-positive">정답입니다! ' + q.correctFeedback + '</p>';

            setTimeout(() => {
                this.currentQuizIndex++;
                if (this.currentQuizIndex < this.data.quiz.length) {
                    this.renderQuiz();
                } else {
                    this.nextScene();
                }
            }, 2500);
        } else {
            btnElement.classList.add('incorrect');
            btnElement.disabled = true;
            feedbackEl.innerHTML = '<p class="feedback-negative">틀렸습니다. ' + q.incorrectFeedback + '</p><p class="hint-text">힌트: ' + q.hint + '</p>';
        }
    }
}

window.Engine = new EduFlixEngine();

/* ========================================
   Content Code
   ======================================== */

function calculateModelComparison(principal, rate, years, deductionRate) {
    if (![principal, rate, years, deductionRate].every(Number.isFinite) || principal < 0 || rate < 0 || !Number.isInteger(years) || years < 0 || deductionRate < 0 || deductionRate > 1) {
        throw new RangeError('Invalid model assumptions');
    }
    return {
        principal,
        annual: principal * Math.pow(1 + rate * (1 - deductionRate), years),
        deferred: principal + (principal * Math.pow(1 + rate, years) - principal) * (1 - deductionRate)
    };
}

const irpData = {
    title: "시간 여행 자산 시뮬레이터",
    hook: {
        question: "30년 뒤 미래의 나의 지갑은 어떤 모습일까요?",
        subText: "두 지갑을 클릭하여 안을 확인해 보세요!",
        onInit: (scene) => {
            const checked = new Set();
            const checkCompletion = () => {
                if(checked.size === 2) Engine.enableNext('hook');
            };

            const emptyWallet = document.getElementById('btn-empty-wallet');
            const richWallet = document.getElementById('btn-rich-wallet');

            emptyWallet.onclick = () => {
                Engine.showFeedback("이 지갑은 이야기 속 그림이에요. 실제 자산은 여러 조건에 따라 달라져요.", "neutral");
                checked.add("empty"); checkCompletion();
            };
            richWallet.onclick = () => {
                Engine.showFeedback("이번에는 같은 가상 원금을 두 모형에 넣어 계산 조건의 영향을 살펴봐요.", "positive");
                checked.add("rich"); checkCompletion();
            };

            /* Q21: tabindex 요소에 대한 키보드 이벤트 핸들러 */
            [emptyWallet, richWallet].forEach(btn => {
                btn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        btn.click();
                    }
                });
            });
        }
    },
    story: {
        situation: "안녕하세요! 시간 여행 가이드 로봇 포인터입니다.<br>제 옆에 있는 이 거대한 기계가 바로 IRP(개인형 퇴직연금) 머신입니다.<br>IRP에서 다루는 과세 시점을 계기로, 공제를 미루면 계산 결과가 어떻게 달라지는지 가상 모형으로 비교해요. 세액공제는 낼 세액을 줄이는 개념이고, 과세이연은 과세 시점을 미루는 개념이므로 서로 달라요. 실제 제도의 적용 조건은 이 모형에서 다루지 않아요.<br><br><strong>IRP 머신을 작동시켜 볼까요?</strong>",
        onInit: (scene) => {
            const btn = document.getElementById('story-next-btn');
            btn.onclick = () => Engine.nextScene();
            /* Q21: 키보드 이벤트 핸들러 */
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    btn.click();
                }
            });
        }
    },
    interaction: {
        title: "3D 자산 시뮬레이터",
        instruction: "1) 퇴직금 이동 -> 2) 세액공제 슬라이더 -> 3) 시간 이동 순서대로 조작하세요.",
        onInit: (container, engine) => {
            container.innerHTML =
                '<div class="three-container" id="three-canvas"></div>' +
                '<div class="control-panel">' +
                    '<p id="model-result" role="status">같은 가상 원금을 넣고 결과를 비교해 보세요.</p>' +
                    '<div class="status-grid">' +
                        '<button class="action-btn" id="btn-move-coin" tabindex="0">1. 두 모형에 가상 원금 넣기</button>' +
                        '<div class="slider-group">' +
                            '<label for="slider-contribution">2. 시작 시 한 번 추가 (두 모형 동일)</label>' +
                            '<input type="range" id="slider-contribution" min="0" max="900" value="0" step="100" disabled tabindex="0" aria-label="추가 납입액 슬라이더">' +
                            '<span class="slider-value" id="val-contribution">0만 원</span>' +
                        '</div>' +
                        '<button class="action-btn" id="btn-time-forward" tabindex="0" disabled>3. 30년 후로 시간 이동!</button>' +
                    '</div>' +
                    '<div id="core-feedback" class="feedback-area"></div>' +
                '</div>' +
                '<div style="margin-top: 15px; width:100%; text-align:center;">' +
                    '<button class="btn btn-primary-large" id="core-next-btn" tabindex="0" style="display:none;" onclick="Engine.nextScene()">결과 확인하기</button>' +
                '</div>';

            // Three.js Setup
            const threeContainer = document.getElementById('three-canvas');
            const w = threeContainer.clientWidth;
            const h = threeContainer.clientHeight;

            const tScene = new THREE.Scene();
            tScene.background = new THREE.Color(0xe1f5fe);

            const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
            camera.position.set(0, 5, 12);

            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(w, h);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            threeContainer.appendChild(renderer.domElement);

            const controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.target.set(0, 1.5, 0);

            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            tScene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(5, 10, 7);
            tScene.add(directionalLight);

            // Floor
            const floor = new THREE.Mesh(
                new THREE.PlaneGeometry(30, 30),
                new THREE.MeshStandardMaterial({ color: 0xffffff })
            );
            floor.rotation.x = -Math.PI / 2;
            tScene.add(floor);

            // Account Tubes
            const tubeMat = new THREE.MeshStandardMaterial({ color: 0x64B5F6, transparent: true, opacity: 0.2 });

            const generalTube = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 4, 32), tubeMat);
            generalTube.position.set(-3, 2, 0);
            tScene.add(generalTube);

            const irpTube = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 4, 32), new THREE.MeshStandardMaterial({ color: 0x7C4DFF, transparent: true, opacity: 0.2 }));
            irpTube.position.set(3, 2, 0);
            tScene.add(irpTube);

            // Labels
            const createTextSprite = (text, color) => {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                context.font = 'Bold 40px Arial';
                context.fillStyle = color;
                context.textAlign = 'center';
                context.fillText(text, canvas.width / 2, canvas.height / 2);

                const texture = new THREE.CanvasTexture(canvas);
                const material = new THREE.SpriteMaterial({ map: texture });
                const sprite = new THREE.Sprite(material);
                sprite.scale.set(4, 2, 1);
                return sprite;
            };

            const genLabel = createTextSprite('매년 공제 모형', '#2196f3');
            genLabel.position.set(-3, 4.5, 0);
            tScene.add(genLabel);

            const irpLabel = createTextSprite('마지막 공제 모형', '#7C4DFF');
            irpLabel.position.set(3, 4.5, 0);
            tScene.add(irpLabel);

            // Assets (Coins Stacks)
            const assetMat = new THREE.MeshStandardMaterial({ color: 0xffc107, metalness: 0.5, roughness: 0.3 });
            const generalAsset = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 1, 32), assetMat);
            generalAsset.position.set(-3, 0.05, 0);
            generalAsset.scale.y = 0.1;
            tScene.add(generalAsset);

            const irpAsset = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 1, 32), assetMat);
            irpAsset.position.set(3, 0.05, 0);
            irpAsset.scale.y = 0.1;
            tScene.add(irpAsset);

            // Floating Coin
            const coin = new THREE.Mesh(
                new THREE.CylinderGeometry(0.8, 0.8, 0.2, 32),
                new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 })
            );
            coin.position.set(0, 4, 0);
            tScene.add(coin);

            // Animation State
            let targetGenH = 0.1;
            let targetIrpH = 0.1;
            let phase = 1;

            let animationId;
            const animate = () => {
                animationId = requestAnimationFrame(animate);

                if(coin.visible) {
                    coin.rotation.y += 0.03;
                    coin.position.y = 4 + Math.sin(Date.now() * 0.003) * 0.3;
                }

                generalAsset.scale.y += (targetGenH - generalAsset.scale.y) * 0.1;
                generalAsset.position.y = generalAsset.scale.y * 0.5;

                irpAsset.scale.y += (targetIrpH - irpAsset.scale.y) * 0.1;
                irpAsset.position.y = irpAsset.scale.y * 0.5;

                controls.update();
                renderer.render(tScene, camera);
            };
            animate();

            window.cleanupCoreScene = () => {
                cancelAnimationFrame(animationId);
                renderer.dispose();
                if (renderer.domElement.parentNode === threeContainer) {
                    threeContainer.removeChild(renderer.domElement);
                }
            };

            // Interactions
            const btnMove = document.getElementById('btn-move-coin');
            const slider = document.getElementById('slider-contribution');
            const btnTime = document.getElementById('btn-time-forward');

            btnMove.onclick = () => {
                if(phase !== 1) return;
                phase = 2;
                btnMove.disabled = true;
                coin.visible = false;

                targetIrpH = 1.0;
                targetGenH = 1.0;

                setTimeout(() => {
                    Engine.showFeedback("두 모형에 같은 가상 원금 1,000만 원을 넣었어요. 추가 금액이 0이어도 비교할 수 있어요.", "positive");
                    slider.disabled = false;
                    btnTime.disabled = false;
                }, 1000);
            };

            slider.oninput = (e) => {
                const val = parseInt(e.target.value);
                document.getElementById('val-contribution').textContent = val + '만 원';

                targetIrpH = targetGenH = (1000 + val) / 1000;

                if(val === 900) {
                    Engine.showFeedback("연습용 슬라이더의 최대값 900만 원을 두 모형에 더했어요. 법정 한도를 뜻하지 않아요.", "positive");
                    btnTime.disabled = false;
                } else if (val > 0) {
                    Engine.showFeedback("추가한 가상 금액도 두 모형에서 같은 기간 동안 계산해요.", "neutral");
                    btnTime.disabled = false;
                } else {
                    Engine.showFeedback("추가 납입 없이 가상 원금 1,000만 원으로 비교해요.", "neutral");
                    btnTime.disabled = false;
                }
            };

            btnTime.onclick = () => {
                if(phase !== 2) return;
                phase = 3;
                btnTime.disabled = true;
                slider.disabled = true;

                Engine.showFeedback("같은 조건으로 30년 복리 계산 중입니다. 결과는 가정에 따라 달라져요.", "neutral");

                const result = calculateModelComparison(1000 + Number(slider.value), 0.05, 30, 0.1);
                targetGenH = result.annual / 1000;
                targetIrpH = result.deferred / 1000;
                document.getElementById("model-result").textContent = `원금 ${result.principal.toLocaleString()}만 원 · 매년 공제 ${result.annual.toFixed(1)}만 원 · 마지막 공제 ${result.deferred.toFixed(1)}만 원 · 차이 ${(result.deferred - result.annual).toFixed(1)}만 원`;

                setTimeout(() => {
                    Engine.showFeedback("가상 계산이 끝났어요. 두 모형의 차이를 확인하고, 공제 시점이 달라지면 재투자되는 이익이 어떻게 달라지는지 설명해 보세요.", "positive");
                    Engine.enableNext('core');
                }, 2000);
            };

            /* Q21: tabindex를 가진 조작 요소들에 대한 키보드 이벤트 핸들러 */
            [btnMove, btnTime].forEach(btn => {
                btn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (!btn.disabled) btn.click();
                    }
                });
            });

            /* Q21: 슬라이더 방향키 조작 지원 */
            slider.addEventListener('keydown', (e) => {
                if (slider.disabled) return;
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    var val = parseInt(slider.value);
                    var stepVal = parseInt(slider.step) || 100;
                    if (e.key === 'ArrowLeft') {
                        val = Math.max(parseInt(slider.min), val - stepVal);
                    } else {
                        val = Math.min(parseInt(slider.max), val + stepVal);
                    }
                    slider.value = val;
                    slider.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });

            /* Q21: core-next-btn 키보드 이벤트 핸들러 */
            const coreNextBtn = document.getElementById('core-next-btn');
            if(coreNextBtn) {
                coreNextBtn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if(coreNextBtn.style.display !== 'none') coreNextBtn.click();
                    }
                });
            }

            // Resize handler
            const onResize = () => {
                const newW = threeContainer.clientWidth;
                const newH = threeContainer.clientHeight;
                camera.aspect = newW / newH;
                camera.updateProjectionMatrix();
                renderer.setSize(newW, newH);
            };
            window.addEventListener('resize', onResize);
        }
    },
    quiz: [
        {
            prompt: "가상 원금 100만 원이 연 5%로 2년간 복리 증가하면 공제 전 금액은?",
            choices: [{ id: "A", text: "110만 원" }, { id: "B", text: "110.25만 원" }, { id: "C", text: "105만 원" }],
            correctChoiceId: "B",
            correctFeedback: "100 × 1.05 × 1.05 = 110.25만 원입니다. 둘째 해에는 첫해 이익도 함께 증가해요.",
            incorrectFeedback: "복리는 두 번째 해에 원금과 첫해 이익을 함께 계산해요.",
            hint: "첫해 105만 원에 다시 1.05를 곱해 보세요."
        },
        {
            prompt: "공제 시점의 영향만 비교하려면 무엇을 같게 해야 할까요?",
            choices: [{ id: "A", text: "원금, 납입 시점, 수익률, 기간, 공제율" }, { id: "B", text: "탑의 색깔만" }, { id: "C", text: "한쪽에 넣는 돈을 더 크게" }],
            correctChoiceId: "A",
            correctFeedback: "다른 조건을 같게 해야 공제 시점 때문에 생긴 차이를 비교할 수 있어요.",
            incorrectFeedback: "원금이나 수익률도 바꾸면 무엇 때문에 차이가 났는지 알기 어려워요.",
            hint: "비교하려는 조건 하나만 다르게 두세요."
        },
        {
            prompt: "이 가상 계산으로 알 수 있는 것은 무엇인가요?",
            choices: [{ id: "A", text: "실제 IRP의 30년 뒤 수익을 보장한다." }, { id: "B", text: "정해 둔 가정 아래 복리 결과의 차이를 계산한다." }, { id: "C", text: "실제 세금과 수수료가 모두 반영되어 있다." }],
            correctChoiceId: "B",
            correctFeedback: "수익률·수수료·제도 조건은 실제와 다를 수 있어요. 이 결과는 가정에 따른 수학 모형입니다.",
            incorrectFeedback: "이 활동의 5%와 10%는 가상 수치이며 실제 수익이나 세율을 뜻하지 않아요.",
            hint: "모형의 가정과 현실을 구분하세요."
        }
    ]
};

Engine.init(irpData);