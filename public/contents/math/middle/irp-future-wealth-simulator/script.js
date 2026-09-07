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
                        '<p class="lo-text">IRP 계좌의 핵심 특징 3가지(퇴직금 의무 이전, 세액공제, 과세이연)를 찾고, 세금을 미루는 것이 장기적으로 자산에 미치는 마법(복리 효과)을 설명할 수 있습니다.</p>' +
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
                '<div class="scene-text">퇴직금을 넣고, 추가 납입으로 세액공제를 받은 뒤, 30년 뒤의 자산 탑을 비교해보세요!</div>' +
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
                    '<p class="scene-text">IRP의 3가지 마법(의무 이전, 세액공제, 과세이연)을 마스터했습니다!</p>' +
                    '<h3>오늘의 학습</h3>' +
                    '<p>미뤄둔 세금이 복리로 굴러가 장기적으로 엄청난 자산을 만듭니다.</p>' +
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

const irpData = {
    title: "시간 여행 자산 시뮬레이터",
    hook: {
        question: "30년 뒤 미래의 나의 지갑은 어떤 모습일까요?",
        subText: "두 지갑을 클릭하여 안을 확인해 보세요!",
        onInit: (scene) => {
            let checked = 0;
            const checkCompletion = () => {
                if(checked === 2) Engine.enableNext('hook');
            };

            const emptyWallet = document.getElementById('btn-empty-wallet');
            const richWallet = document.getElementById('btn-rich-wallet');

            emptyWallet.onclick = () => {
                Engine.showFeedback("아차, 텅 비어 있네요! 어떤 선택이 이런 결과를 만들었을까요?", "neutral");
                checked++; checkCompletion();
            };
            richWallet.onclick = () => {
                Engine.showFeedback("와, 엄청난 자산입니다! 이 지갑의 비밀을 알아보러 가요.", "positive");
                checked++; checkCompletion();
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
        situation: "안녕하세요! 시간 여행 가이드 로봇 포인터입니다.<br>제 옆에 있는 이 거대한 기계가 바로 IRP(개인형 퇴직연금) 머신입니다.<br>이 기계는 퇴직금을 모아 세금 혜택이라는 마법을 부여해 장기적으로 자산을 키워준답니다.<br><br><strong>IRP 머신을 작동시켜 볼까요?</strong>",
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
                    '<div class="status-grid">' +
                        '<button class="action-btn" id="btn-move-coin" tabindex="0">1. 퇴직금 IRP로 이동하기</button>' +
                        '<div class="slider-group">' +
                            '<label for="slider-contribution">2. 추가 납입액 (세액공제)</label>' +
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

            const genLabel = createTextSprite('일반 계좌', '#2196f3');
            genLabel.position.set(-3, 4.5, 0);
            tScene.add(genLabel);

            const irpLabel = createTextSprite('IRP 계좌', '#7C4DFF');
            irpLabel.position.set(3, 4.5, 0);
            tScene.add(irpLabel);

            // Assets (Coins Stacks)
            const assetMat = new THREE.MeshStandardMaterial({ color: 0xffc107, metalness: 0.5, roughness: 0.3 });
            const generalAsset = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.1, 32), assetMat);
            generalAsset.position.set(-3, 0.05, 0);
            generalAsset.scale.y = 0.1;
            tScene.add(generalAsset);

            const irpAsset = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.1, 32), assetMat);
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
                    Engine.showFeedback("퇴직금을 IRP로 의무 이전했습니다! (일반 계좌에도 가상으로 설정했습니다)", "positive");
                    slider.disabled = false;
                }, 1000);
            };

            slider.oninput = (e) => {
                const val = parseInt(e.target.value);
                document.getElementById('val-contribution').textContent = val + '만 원';

                targetIrpH = 1.0 + (val / 900) * 0.5;

                if(val === 900) {
                    Engine.showFeedback("최대 한도(900만 원) 납입! 세금 환급(세액공제) 코인을 받았습니다.", "positive");
                    btnTime.disabled = false;
                } else if (val > 0) {
                    Engine.showFeedback("세금을 돌려받는 '세액공제' 혜택이 적용되고 있습니다.", "neutral");
                    btnTime.disabled = false;
                } else {
                    Engine.showFeedback("슬라이더를 움직여 IRP에 추가 납입을 해보세요.", "neutral");
                    btnTime.disabled = true;
                }
            };

            btnTime.onclick = () => {
                if(phase !== 2) return;
                phase = 3;
                btnTime.disabled = true;
                slider.disabled = true;

                Engine.showFeedback("30년 시간 경과 중... 세금을 미뤄둔 IRP의 복리 마법!", "neutral");

                targetGenH = 2.5;
                targetIrpH = 7.5;

                setTimeout(() => {
                    Engine.showFeedback("와! IRP 계좌의 자산이 일반 계좌보다 훨씬 크게 자랐어요!", "positive");
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
            prompt: "IRP 계좌는 세금 혜택을 주는데, 세액공제를 받으면 세금을 어떻게 되는 것일까요?",
            choices: [
                { id: "A", text: "평생 세금을 완전히 면제받는다." },
                { id: "B", text: "세금의 일부를 영원히 국가가 부담해 준다." },
                { id: "C", text: "세금을 나중(연금 수령 시)으로 미뤄두는 것이다." }
            ],
            correctChoiceId: "C",
            correctFeedback: "IRP는 세금을 면제해주는 것이 아니라, 나중으로 미뤄주는 과세이연 효과를 줍니다.",
            incorrectFeedback: "세금이 완전히 사라지는 것은 아니랍니다.",
            hint: "30년 뒤 시뮬레이션에서 자산 탑이 커졌던 이유(복리)를 떠올려 보세요."
        },
        {
            prompt: "퇴직금을 받았을 때, IRP 계좌로 이전하지 않고 전액 현금으로 당장 빼서 쓰면 어떻게 될까요?",
            choices: [
                { id: "A", text: "퇴직소득세가 즉시 부과되어 세금 폭탄을 맞는다." },
                { id: "B", text: "국가에서 세금을 더 많이 돌려준다." },
                { id: "C", text: "아무런 세금도 내지 않는다." }
            ],
            correctChoiceId: "A",
            correctFeedback: "퇴직금을 바로 현금으로 받으면 거대한 퇴직소득세 벽돌을 즉시 맞게 됩니다.",
            incorrectFeedback: "아닙니다. 당장 빼면 오히려 세금이 더 많이 나갈 수 있어요.",
            hint: "IRP 머신을 이용하지 않으면, 거대한 세금 벽돌이 코인을 깎아먹게 됩니다."
        },
        {
            prompt: "IRP 계좌에 돈을 넣어 연말정산 때 세금을 돌려받고 싶습니다. 한도에 대해 올바른 설명은?",
            choices: [
                { id: "A", text: "무한히 넣는 대로 전액 세금을 돌려받는다." },
                { id: "B", text: "매년 정해진 한도(예: 900만 원)까지만 세액공제 혜택을 받을 수 있다." },
                { id: "C", text: "돈을 넣을수록 나중에 세금을 전혀 내지 않아도 된다." }
            ],
            correctChoiceId: "B",
            correctFeedback: "정확합니다! IRP 추가 납입에 따른 세액공제 한도는 연 900만 원입니다.",
            incorrectFeedback: "틀렸어요. 한도는 존재합니다.",
            hint: "슬라이더를 끝까지 올리려 하면 삐빅 소리가 나며 멈추던 게이지를 기억하나요?"
        }
    ]
};

Engine.init(irpData);