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
 * 세포 탐험 (Recreated with Shared Engine)
 */

const contentData = {
    title: "세포 탐험",
    hook: {
        question: "우리 몸은 무엇으로 이루어져 있을까요?"
    },
    story: {
        character: { image: "assets/character.svg" },
        situation: "현미경으로 마이크로 세계를 들여다보세요.<br>세포 친구들이 각자의 역할을 소개하고 싶어 해요!"
    },
    interaction: {
        title: "세포 관찰하기",
        instruction: "세포 소기관을 클릭하여 이름과 하는 일을 알아보세요.",
        onInit: (container, engine) => {
             container.innerHTML = `
                <div class="cell-container">
                    <div class="cell">
                        <div class="organelle nucleus" data-id="nucleus" title="핵"></div>
                        <div class="organelle mitochondria mito-1" data-id="mitochondria" title="미토콘드리아"></div>
                        <div class="organelle mitochondria mito-2" data-id="mitochondria" title="미토콘드리아"></div>
                        <!-- Random Ribosomes -->
                        ${Array.from({length: 10}).map(() => {
                            const top = Math.random() * 80 + 10;
                            const left = Math.random() * 80 + 10;
                            return `<div class="organelle ribosome" style="top:${top}%; left:${left}%" data-id="ribosome"></div>`;
                        }).join('')}
                    </div>
                </div>
                <div class="info-box" id="cell-info-box">
                    <h3 id="organelle-name"></h3>
                    <p id="organelle-desc"></p>
                </div>
             `;
             
             const infoBox = container.querySelector('#cell-info-box');
             const nameEl = container.querySelector('#organelle-name');
             const descEl = container.querySelector('#organelle-desc');
             
             const infoData = {
                 nucleus: { name: "핵 (Nucleus)", desc: "세포의 생명 활동을 조절하는 사령탑입니다. DNA가 들어있어요." },
                 mitochondria: { name: "미토콘드리아 (Mitochondria)", desc: "세포의 발전소입니다. 에너지를 만들어요." },
                 ribosome: { name: "리보솜 (Ribosome)", desc: "단백질을 만드는 작은 공장입니다." }
             };
             
             const explored = new Set();
             
             container.querySelectorAll('.organelle').forEach(el => {
                 el.onclick = (e) => {
                     e.stopPropagation();
                     const id = el.dataset.id;
                     const data = infoData[id];
                     
                     nameEl.textContent = data.name;
                     descEl.textContent = data.desc;
                     infoBox.classList.add('active');
                     
                     if (!explored.has(id)) {
                         explored.add(id);
                         if(explored.size === 3) {
                             engine.enableNext();
                             engine.showFeedback("주요 소기관을 모두 찾았습니다!", "positive");
                         }
                     }
                 };
             });
             
             // Click outside closes info
             container.querySelector('.cell').onclick = () => {
                 infoBox.classList.remove('active');
             };
        }
    },
    quiz: [
        {
            question: "세포의 생명 활동을 조절하는 곳은?",
            options: ["미토콘드리아", "핵", "리보솜", "세포막"],
            answer: 1
        },
        {
            question: "에너지를 만드는 세포 소기관은?",
            options: ["핵", "엽록체", "미토콘드리아", "액포"],
            answer: 2
        }
    ]
};

Engine.init(contentData);
