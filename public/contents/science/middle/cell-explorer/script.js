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
        instruction: "동물 세포의 핵·미토콘드리아·리보솜을 찾아 기능을 비교해 보세요. 그림은 크기와 개수를 단순화한 모형입니다. 식물 세포에도 이 소기관이 있습니다.",
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
                 mitochondria: { name: "미토콘드리아 (Mitochondria)", desc: "세포 호흡을 통해 양분의 화학 에너지를 세포가 쓰기 쉬운 ATP 형태로 전환해요." },
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
            answer: 1, explanation: "핵에는 DNA가 있으며 유전 정보의 발현을 통해 세포 활동을 조절합니다. 리보솜은 단백질을 합성합니다."
        },
        {
            question: "세포 호흡으로 ATP를 주로 생성하는 소기관은?",
            options: ["핵", "엽록체", "미토콘드리아", "액포"],
            answer: 2, explanation: "미토콘드리아는 양분의 에너지를 ATP로 전환합니다. 에너지를 무에서 만드는 것은 아닙니다."
        }
    ]
};

Engine.init(contentData);
