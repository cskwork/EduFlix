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
        this.quizIndex = this.quizIndex || 0;
        const q = this.data.quiz[this.quizIndex];
        document.getElementById('quiz-question').textContent = q.question;
        const optsContainer = document.getElementById('quiz-options');
        optsContainer.innerHTML = '';
        q.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option';
            btn.textContent = opt;
            btn.onclick = () => this.checkQuiz(idx, q.answer, btn);
            optsContainer.appendChild(btn);
        });
    }

    checkQuiz(selectedIdx, correctIdx, btnElement) {
        const opts = document.querySelectorAll('.quiz-option');
        opts.forEach(o => { o.disabled = true; });
        btnElement.classList.add(selectedIdx === correctIdx ? 'correct' : 'incorrect');
        opts[correctIdx].classList.add('correct');
        const q = this.data.quiz[this.quizIndex];
        const feedback = document.createElement('p');
        feedback.className = 'scene-text';
        feedback.setAttribute('role', 'status');
        feedback.textContent = (selectedIdx === correctIdx ? '정답입니다. ' : '정답을 확인하세요. ') + q.explanation;
        const next = document.createElement('button');
        next.className = 'btn btn-primary-large';
        next.textContent = this.quizIndex + 1 < this.data.quiz.length ? '다음 문항' : '학습 정리';
        next.onclick = () => { this.quizIndex++; feedback.remove(); next.remove(); if (this.quizIndex < this.data.quiz.length) this.startQuiz(); else this.nextScene(); };
        document.getElementById('quiz-options').after(feedback, next);
    }

}

window.Engine = new EduFlixEngine();

/* ========================================
   Content Code
   ======================================== */
/**
 * 화학 반응 시뮬레이터 (Recreated with Shared Engine)
 */

const contentData = {
    title: "화학 반응 시뮬레이터",
    hook: {
        question: "같은 양의 산과 염기를 섞으면 pH가 어떻게 달라질까요?"
    },
    story: {
        character: { image: "assets/character.svg" },
        situation: "화학자는 미지의 용액을 연구하고 있습니다.<br>안전하게 실험하여 용액의 성질을 밝혀내세요!"
    },
    interaction: {
        title: "중화 반응 실험",
        instruction: "25°C 물 50mL에 0.1mol/L HCl과 NaOH를 10mL씩 넣는 모형입니다. 두 용액을 모두 넣어 몰수가 같아지는 때를 찾으세요. 실제 실험은 교사 지도하에 보안경을 착용합니다. H⁺ + OH⁻ → H₂O이며 기체는 생기지 않습니다.",
        onInit: (container, engine) => {
             container.innerHTML = `
                <div class="lab-bench">
                    <div class="reaction-info">pH: <span id="ph-val">7.0</span> <span id="status-text">(중성)</span></div>
                    
                    <div class="shelf">
                        <div class="reagent acid" data-type="acid" data-strength="1">
                            <div class="reagent-cap"></div>
                            <div class="reagent-bottle">HCl</div>
                        </div>
                         <div class="reagent base" data-type="base" data-strength="1">
                            <div class="reagent-cap"></div>
                            <div class="reagent-bottle">NaOH</div>
                        </div>
                        <div class="reagent indicator" data-type="indicator">
                            <div class="reagent-cap"></div>
                            <div class="reagent-bottle">지시약</div>
                        </div>
                    </div>
                    
                    <div class="beaker">
                        <div class="liquid" id="liquid"></div>
                        <div class="bubbles" id="bubbles"></div>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <button class="btn btn-secondary" id="reset-btn">비커 비우기</button>
                </div>
             `;
             
             const liquid = container.querySelector('#liquid');
             const bubbles = container.querySelector('#bubbles');
             const phVal = container.querySelector('#ph-val');
             const statusText = container.querySelector('#status-text');
             
             let ph = 7.0;
             let hasIndicator = false;
             let volume = 50; // mL
             let acidMoles = 0, baseMoles = 0;
             
             const updateVisuals = () => {
                 // Color based on pH and Indicator
                 let color = "#aadaff"; // Water default
                 
                 if (hasIndicator) {
                     // Universal indicator approx colors
                     if (ph < 3) color = "#ff0000";
                     else if (ph < 5) color = "#ff9900";
                     else if (ph < 7) color = "#ffff00";
                     else if (ph == 7) color = "#00ff00";
                     else if (ph < 9) color = "#00ffff";
                     else if (ph < 11) color = "#0000ff";
                     else color = "#8b00ff";
                 } else {
                     // Without indicator, maybe slight tint?
                     if (ph < 2) color = "#fff0f0"; // Slight acid tint
                     if (ph > 12) color = "#f0f0ff"; // Slight base tint
                 }
                 
                 liquid.style.backgroundColor = color;
                 liquid.style.height = volume + "%";
                 
                 phVal.textContent = ph.toFixed(1);
                 
                 let status = "중성";
                 if (ph < 7) status = "산성";
                 if (ph > 7) status = "염기성";
                 statusText.textContent = `(${status})`;
                 statusText.style.color = (ph < 7) ? "red" : (ph > 7 ? "blue" : "green");
                 
                 // Bubble animation if reaction happened (simplification: generic bubble toggle)
             };
             
             const addReagent = (type) => {
                 if (type !== 'indicator' && volume >= 90) {
                     engine.showFeedback("비커가 가득 찼습니다!", "negative");
                     return;
                 }
                 
                 volume += 10;
                 
                 if (type === 'acid') {
                     // Decrease pH
                     // Proper calculation is complex (-log[H+]), simplified here:
                     acidMoles += 0.001;
                     
                     // Reaction visual
                     if (ph > 7) { // Neutralizing
                         showReaction();
                     }
                 } else if (type === 'base') {
                     baseMoles += 0.001;
                     if (ph < 7) { // Neutralizing
                         showReaction();
                     }
                 } else if (type === 'indicator') {
                     hasIndicator = true;
                     volume -= 10; // Indicator volume negligible
                 }
                 
                 const excess = (acidMoles - baseMoles) / (volume / 1000);
                 // Solve [H+] - [OH-] = excess with Kw = 1e-14 at 25°C.
                 const h = excess >= 0 ? (excess + Math.sqrt(excess * excess + 4e-14)) / 2 : 2e-14 / (-excess + Math.sqrt(excess * excess + 4e-14));
                 ph = -Math.log10(h);
                 
                 updateVisuals();
                 
                 // Check Goal (Neutralize)
                 if (hasIndicator && acidMoles > 0 && baseMoles > 0 && Math.abs(acidMoles - baseMoles) < 1e-10) {
                     engine.showFeedback("같은 몰수의 HCl과 NaOH가 중화되었습니다. 이 강산·강염기 모형은 25°C에서 pH 7입니다. 약산·약염기는 같지 않을 수 있습니다.", "positive");
                     engine.enableNext();
                 }
             };
             
             const showReaction = () => {
                 bubbles.style.display = 'none';
                 engine.showFeedback('수소 이온과 수산화 이온이 반응하여 물이 됩니다. 이 반응에는 기체 거품이 생기지 않습니다.', 'neutral');
             };

             container.querySelectorAll('.reagent').forEach(el => {
                 el.onclick = () => addReagent(el.dataset.type);
             });
             
             container.querySelector('#reset-btn').onclick = () => {
                 ph = 7.0;
                 acidMoles = 0; baseMoles = 0;
                 document.getElementById('core-next-btn').style.display = 'none';
                 hasIndicator = false;
                 volume = 50;
                 updateVisuals();
                 engine.showFeedback("비커를 비웠습니다.", "neutral");
             };
             
             updateVisuals();
        }
    },
    quiz: [
        {
            question: "25°C에서 산성 수용액의 pH는?",
            options: ["7보다 작다", "7이다", "7보다 크다", "14이다"],
            answer: 0, explanation: "25°C에서 중성인 물의 pH는 7이며, 산성 수용액의 pH는 7보다 작습니다. pH는 수소 이온 농도의 로그 척도입니다."
        },
        {
            question: "산성과 염기성이 만나 물과 염이 생성되는 반응은?",
            options: ["산화 반응", "중화 반응", "연소 반응", "분해 반응"],
            answer: 1, explanation: "HCl과 NaOH의 중화에서는 물과 염이 생깁니다. 두 시약만의 반응으로 기체가 발생하지 않습니다."
        }
    ]
};

Engine.init(contentData);
