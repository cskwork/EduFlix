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
 * 일차함수와 기울기
 */

const slopeData = {
    title: "일차함수와 기울기",
    hook: {
        question: "스키장의 가파른 정도를 숫자로 어떻게 나타낼까요?",
        subText: "겨울에 스키장 가본 적 있나요?",
        visual: {
            type: "svg",
            content: `
                <svg viewBox="0 0 400 250" class="ski-slope-svg">
                    <!-- 배경: 하늘 그라데이션 -->
                    <defs>
                        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#87CEEB"/>
                            <stop offset="100%" style="stop-color:#E0F4FF"/>
                        </linearGradient>
                        <linearGradient id="snowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#FFFFFF"/>
                            <stop offset="100%" style="stop-color:#E8E8E8"/>
                        </linearGradient>
                    </defs>
                    <rect width="400" height="250" fill="url(#skyGradient)"/>

                    <!-- 완만한 슬로프 (왼쪽) -->
                    <polygon points="20,220 180,220 20,160" fill="url(#snowGradient)" stroke="#B0BEC5" stroke-width="2"/>
                    <text x="60" y="200" font-size="12" fill="#666">완만</text>

                    <!-- 가파른 슬로프 (오른쪽) -->
                    <polygon points="220,220 380,220 220,80" fill="url(#snowGradient)" stroke="#B0BEC5" stroke-width="2"/>
                    <text x="260" y="160" font-size="12" fill="#666">가파름</text>

                    <!-- 스키어 1 (완만한 슬로프) -->
                    <g class="skier skier-slow">
                        <circle cx="0" cy="0" r="8" fill="#FF5722"/>
                        <line x1="0" y1="8" x2="0" y2="20" stroke="#333" stroke-width="2"/>
                        <line x1="-6" y1="20" x2="6" y2="20" stroke="#333" stroke-width="3"/>
                    </g>

                    <!-- 스키어 2 (가파른 슬로프) -->
                    <g class="skier skier-fast">
                        <circle cx="0" cy="0" r="8" fill="#2196F3"/>
                        <line x1="0" y1="8" x2="0" y2="20" stroke="#333" stroke-width="2"/>
                        <line x1="-6" y1="20" x2="6" y2="20" stroke="#333" stroke-width="3"/>
                    </g>

                    <!-- 기울기 표시선 -->
                    <line x1="20" y1="160" x2="180" y2="220" stroke="#FF9800" stroke-width="2" stroke-dasharray="5,3"/>
                    <line x1="220" y1="80" x2="380" y2="220" stroke="#FF9800" stroke-width="2" stroke-dasharray="5,3"/>

                    <!-- 레이블 -->
                    <text x="100" y="245" font-size="14" fill="#333" text-anchor="middle" font-weight="bold">기울기 = ?</text>
                    <text x="300" y="245" font-size="14" fill="#333" text-anchor="middle" font-weight="bold">기울기 = ?</text>
                </svg>
            `
        }
    },
    story: {
        character: { image: "assets/character.svg" },
        situation: "스키장 설계자가 슬로프를 만들고 있어요.<br>너무 가파르면 위험하고, 너무 완만하면 재미가 없죠.<br>기울기를 조절해 적당한 슬로프를 만들어주세요!"
    },
    interaction: {
        title: "기울기 실험실",
        instruction: "파란 점을 드래그하여 직선의 기울기를 바꿔보세요.",
        onInit: (container, engine) => {
            // Config
            const w = 500;
            const h = 400;
            const originX = w / 2;
            const originY = h / 2;
            const scale = 40; // px per unit
            
            // State
            let p2 = { x: 2, y: 3 }; // Target point coordinates (units)
            
            container.innerHTML = `
                <div class="slope-container">
                    <svg class="slope-svg" id="slope-svg" viewBox="0 0 500 400">
                        <g id="grid-group"></g>
                        <!-- Axes -->
                        <line x1="0" y1="${originY}" x2="${w}" y2="${originY}" class="axis" />
                        <line x1="${originX}" y1="0" x2="${originX}" y2="${h}" class="axis" />
                        
                        <!-- Visualization -->
                        <path id="rise-run-path" class="rise-run-line" fill="none" />
                        <line id="main-line" class="slope-line" />
                        
                        <!-- Control Point -->
                        <circle id="control-point" r="8" class="control-point" />
                        <circle cx="${originX}" cy="${originY}" r="4" fill="#333" />
                        
                        <!-- Text Labels -->
                        <text id="rise-text" fill="#FF9800" font-size="12" font-weight="bold"></text>
                        <text id="run-text" fill="#FF9800" font-size="12" font-weight="bold"></text>
                    </svg>
                    <div class="info-box">
                       기울기(a) = <span style="color:#FF9800">세로증가량</span> / <span style="color:#FF9800">가로증가량</span>
                    </div>
                </div>
                <div class="formula-display">
                    y = <span id="slope-val" style="color:#2196F3">1.5</span>x
                </div>
                <div style="text-align: center; margin-top: 10px;">
                     <button class="btn btn-primary" id="check-slope-btn">확인</button>
                </div>
            `;
            
            const svg = container.querySelector('#slope-svg');
            const gridGroup = container.querySelector('#grid-group');
            const mainLine = container.querySelector('#main-line');
            const riseRunPath = container.querySelector('#rise-run-path');
            const controlPoint = container.querySelector('#control-point');
            const slopeVal = container.querySelector('#slope-val');
            const riseText = container.querySelector('#rise-text');
            const runText = container.querySelector('#run-text');
            const checkBtn = container.querySelector('#check-slope-btn');

            // Draw Grid
            let gridHtml = '';
            for(let x=0; x<=w; x+=scale) {
                gridHtml += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" class="grid-line" />`;
            }
            for(let y=0; y<=h; y+=scale) {
                gridHtml += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" class="grid-line" />`;
            }
            gridGroup.innerHTML = gridHtml;

            const updateView = () => {
                const px = originX + p2.x * scale;
                const py = originY - p2.y * scale;
                
                // Line from far left to far right
                // y = ax => slope = p2.y / p2.x
                const slope = p2.x === 0 ? 999 : p2.y / p2.x;
                
                // Calculate endpoints for drawing line across screen
                // y - 0 = m(x - 0) => y = mx
                // At x = -originX (screen 0), y = m*(-originX/scale) * scale ?
                // Just project far out
                const farX1 = -10;
                const farY1 = slope * farX1;
                const farX2 = 10;
                const farY2 = slope * farX2;
                
                mainLine.setAttribute('x1', originX + farX1 * scale);
                mainLine.setAttribute('y1', originY - farY1 * scale);
                mainLine.setAttribute('x2', originX + farX2 * scale);
                mainLine.setAttribute('y2', originY - farY2 * scale);
                
                // Control Point
                controlPoint.setAttribute('cx', px);
                controlPoint.setAttribute('cy', py);
                
                // Rise/Run Triangle
                // (0,0) -> (x,0) -> (x,y)
                const pointXAxis = { x: px, y: originY };
                riseRunPath.setAttribute('d', `M${originX},${originY} L${px},${originY} L${px},${py}`);
                
                // Labels
                runText.setAttribute('x', originX + (p2.x*scale)/2);
                runText.setAttribute('y', originY + 15);
                runText.textContent = p2.x;
                
                riseText.setAttribute('x', px + 5);
                riseText.setAttribute('y', originY - (p2.y*scale)/2);
                riseText.textContent = p2.y;
                
                // Value
                slopeVal.textContent = slope.toFixed(1);
            };

            // 드래그 인터랙션 (마우스 + 터치 지원)
            let isDragging = false;
            
            const getPos = (e) => {
                const rect = svg.getBoundingClientRect();
                // viewBox 스케일 보정
                const scaleX = w / rect.width;
                const scaleY = h / rect.height;
                if (e.touches && e.touches.length > 0) {
                    return {
                        x: (e.touches[0].clientX - rect.left) * scaleX,
                        y: (e.touches[0].clientY - rect.top) * scaleY
                    };
                }
                return {
                    x: (e.clientX - rect.left) * scaleX,
                    y: (e.clientY - rect.top) * scaleY
                };
            };

            const onDragStart = (e) => {
                isDragging = true;
                e.preventDefault();
            };

            const onDragMove = (e) => {
                if (!isDragging) return;
                e.preventDefault();
                const pos = getPos(e);
                
                // 좌표 단위로 변환
                let ux = Math.round((pos.x - originX) / scale);
                let uy = Math.round((originY - pos.y) / scale);
                
                // (0,0) 방지
                if (ux === 0 && uy === 0) ux = 1;
                
                p2 = { x: ux, y: uy };
                updateView();
            };

            const onDragEnd = () => {
                isDragging = false;
            };

            controlPoint.addEventListener('mousedown', onDragStart);
            controlPoint.addEventListener('touchstart', onDragStart, { passive: false });
            svg.addEventListener('mousemove', onDragMove);
            svg.addEventListener('touchmove', onDragMove, { passive: false });
            window.addEventListener('mouseup', onDragEnd);
            window.addEventListener('touchend', onDragEnd);

            updateView();
            
            checkBtn.onclick = () => {
                engine.showFeedback("기울기(a)는 y증가량 / x증가량 입니다. 스키장의 경사도와 같죠!", "positive");
                engine.enableNext();
            };
        }
    },
    quiz: [
        {
            question: "일차함수 y = 2x + 1의 기울기는 얼마일까요?",
            options: ["1", "2", "3", "4"],
            answer: 1
        }
    ]
};

Engine.init(slopeData);
