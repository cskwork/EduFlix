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
 * 확률: 동전 던지기
 */

const probabilityData = {
    title: "확률의 세계",
    hook: {
        question: "동전을 10번 던지면 앞면이 딱 5번 나올까요?",
        subText: "반반이니까 꼭 5번 나와야 하지 않나요?",
        visual: {
            type: "svg",
            content: `
                <svg viewBox="0 0 400 200" class="hook-svg">
                    <!-- 동전들 -->
                    <g class="coin-flip-1">
                        <circle cx="80" cy="100" r="35" fill="#FFD700" stroke="#DAA520" stroke-width="3"/>
                        <text x="80" y="108" text-anchor="middle" font-size="24" font-weight="bold" fill="#8B4513">H</text>
                    </g>
                    <g class="coin-flip-2">
                        <circle cx="160" cy="100" r="35" fill="#C0C0C0" stroke="#808080" stroke-width="3"/>
                        <text x="160" y="108" text-anchor="middle" font-size="24" font-weight="bold" fill="#333">T</text>
                    </g>
                    <g class="coin-flip-3">
                        <circle cx="240" cy="100" r="35" fill="#FFD700" stroke="#DAA520" stroke-width="3"/>
                        <text x="240" y="108" text-anchor="middle" font-size="24" font-weight="bold" fill="#8B4513">H</text>
                    </g>
                    <g class="coin-flip-4">
                        <circle cx="320" cy="100" r="35" fill="#FFD700" stroke="#DAA520" stroke-width="3"/>
                        <text x="320" y="108" text-anchor="middle" font-size="24" font-weight="bold" fill="#8B4513">H</text>
                    </g>
                    <!-- 물음표 -->
                    <text x="200" y="180" text-anchor="middle" font-size="20" fill="#2196F3" font-weight="bold">1/2 확률이면 정확히 반반?</text>
                    <!-- 애니메이션 동전 -->
                    <circle cx="200" cy="40" r="20" fill="#FFD700" class="bounce-coin"/>
                </svg>
            `
        }
    },
    story: {
        character: { image: "assets/character.svg" },
        situation: "축구 경기 시작 전 심판이 동전을 던집니다.<br>'앞면이 나오면 이쪽 골대, 뒷면이면 저쪽 골대!'<br>정말 반반의 확률일까요?"
    },
    interaction: {
        title: "동전 던지기 실험",
        instruction: "동전을 클릭해서 던져보세요! 100번 던지기를 눌러 대수의 법칙을 확인해보세요.",
        onInit: (container, engine) => {
            let heads = 0;
            let tails = 0;
            let total = 0;
            
            container.innerHTML = `
                <div class="coin-container">
                    <div class="coin" id="coin">H</div>
                    <div class="controls">
                        <button class="btn btn-primary" id="flip-btn">1번 던지기</button>
                        <button class="btn btn-secondary" id="flip-100-btn">100번 던지기</button>
                    </div>
                </div>
                <div class="stats-panel">
                    <div class="stat-row">
                        <span>앞면 (Heads)</span>
                        <span id="heads-count">0</span>
                    </div>
                     <div class="bar-container">
                        <div class="bar-fill" id="heads-bar" style="background: #e74c3c"></div>
                    </div>
                    <div class="stat-row">
                        <span>뒷면 (Tails)</span>
                        <span id="tails-count">0</span>
                    </div>
                     <div class="bar-container">
                        <div class="bar-fill" id="tails-bar" style="background: #3498db"></div>
                    </div>
                    <div style="text-align:center; margin-top:10px; font-weight:bold" id="ratio-text">
                        앞면 비율: 0%
                    </div>
                </div>
                <div style="text-align:center; margin-top:20px;">
                    <button class="btn btn-primary" id="finish-btn" disabled>실험 완료</button>
                </div>
            `;
            
            const coin = container.querySelector('#coin');
            const headsCount = container.querySelector('#heads-count');
            const tailsCount = container.querySelector('#tails-count');
            const headsBar = container.querySelector('#heads-bar');
            const tailsBar = container.querySelector('#tails-bar');
            const ratioText = container.querySelector('#ratio-text');
            const finishBtn = container.querySelector('#finish-btn');
            
            const updateStats = () => {
                headsCount.textContent = heads;
                tailsCount.textContent = tails;
                
                const headsPct = total === 0 ? 0 : (heads / total * 100);
                const tailsPct = total === 0 ? 0 : (tails / total * 100);
                
                headsBar.style.width = `${headsPct}%`;
                tailsBar.style.width = `${tailsPct}%`;
                
                ratioText.textContent = `앞면 비율: ${headsPct.toFixed(1)}% (시도: ${total}회)`;
                
                if (total >= 10) {
                    finishBtn.disabled = false;
                }
            };
            
            const flip = (times = 1) => {
                if (times === 1) {
                    coin.classList.remove('flip');
                    void coin.offsetWidth; // trigger reflow
                    coin.classList.add('flip');
                    
                    setTimeout(() => {
                        const isHeads = Math.random() < 0.5;
                        if(isHeads) { heads++; coin.textContent = "H"; }
                        else { tails++; coin.textContent = "T"; }
                        total++;
                        updateStats();
                    }, 250); // Halfway through animation
                } else {
                    // Fast flip
                    let tempHeads = 0;
                    for(let i=0; i<times; i++) {
                         if(Math.random() < 0.5) tempHeads++;
                    }
                    heads += tempHeads;
                    tails += (times - tempHeads);
                    total += times;
                    updateStats();
                    engine.showFeedback(`${times}번 던졌습니다! 비율이 50%에 가까워지나요?`, "neutral");
                }
            };
            
            container.querySelector('#flip-btn').onclick = () => flip(1);
            container.querySelector('#flip-100-btn').onclick = () => flip(100);
            
            coin.onclick = () => flip(1);
            
            finishBtn.onclick = () => {
                engine.showFeedback("많이 던질수록 50%에 가까워진다는 사실! 이것이 큰 수의 법칙입니다.", "positive");
                engine.enableNext();
            };
        }
    },
    quiz: [
        {
            question: "동전을 던져 앞면이 나올 확률은 1/2입니다. 그렇다면 동전을 4번 던지면 반드시 앞면이 2번 나올까요?",
            options: ["그렇다", "아니다", "알 수 없다"],
            answer: 1 // 아니다
        }
    ]
};

Engine.init(probabilityData);
