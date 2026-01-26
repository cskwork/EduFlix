/**
 * 피자로 배우는 분수 - 독립형 스크립트
 */

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
            console.error('Scene container (#scene-container) not found!');
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
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    isImagePath(value) {
        return /^(?:\.{0,2}\/|assets\/|https?:\/\/|data:image\/)/i.test(value) ||
            /\.(svg|png|jpe?g|gif|webp|avif)$/i.test(value);
    }

    getCharacterMarkup(character) {
        if (!character || !character.image) {
            return '<div class="story-character-emoji">🍕</div>';
        }

        const imageValue = String(character.image);
        if (this.isImagePath(imageValue)) {
            const altText = character.alt ? this.escapeHtml(character.alt) : '캐릭터';
            return `<img class="story-character-image" src="${this.escapeHtml(imageValue)}" alt="${altText}" />`;
        }

        return `<div class="story-character-emoji">${this.escapeHtml(imageValue)}</div>`;
    }

    createScenes() {
        // 1. Hook Scene
        this.createScene('hook', (scene) => {
            scene.innerHTML = `
                <h1 class="hook-question">${this.data.hook.question}</h1>
                <button class="btn btn-primary-large" onclick="Engine.nextScene()">시작하기</button>
            `;
        });

        // 2. Story Scene
        this.createScene('story', (scene) => {
            const { character, situation } = this.data.story;
            const characterMarkup = this.getCharacterMarkup(character);
            scene.innerHTML = `
                <div class="story-stage" id="story-stage">
                    <div class="story-character" id="story-char">
                       ${characterMarkup}
                    </div>
                </div>
                <div class="scene-text typing-effect">${situation}</div>
                <button class="btn btn-primary-large animate-fade-in" style="opacity:0; animation-delay: 1s;" onclick="Engine.nextScene()">다음</button>
            `;
        });

        // 3. Core Scene (Interaction)
        this.createScene('core', (scene) => {
            scene.innerHTML = `
                <h2 class="scene-title">${this.data.interaction.title || '체험하기'}</h2>
                <div class="scene-text">${this.data.interaction.instruction}</div>
                <div class="interactive-area" id="core-interactive-area"></div>
                <div id="core-feedback" class="scene-text" style="min-height: 2em;"></div>
                <button class="btn btn-primary-large" id="core-next-btn" style="display:none;" onclick="Engine.nextScene()">다음</button>
            `;
        }, () => {
             if (this.data.interaction.onInit) {
                 this.data.interaction.onInit(document.getElementById('core-interactive-area'), this);
             }
        });

        // 4. Quiz Scene
        if (this.data.quiz) {
            this.createScene('quiz', (scene) => {
                scene.innerHTML = `
                    <h2 class="scene-title">퀴즈!</h2>
                    <div class="scene-text" id="quiz-question"></div>
                    <div class="quiz-container" id="quiz-options"></div>
                `;
            }, () => {
                this.startQuiz();
            });
        }

        // 5. Wrap Scene
        this.createScene('wrap', (scene) => {
             scene.innerHTML = `
                <h1 class="scene-title">🎉 완료!</h1>
                <div class="wrap-summary">
                    <p class="scene-text">오늘 배운 내용</p>
                    <h3>${this.data.title}</h3>
                </div>
                <div style="display:flex; gap: 15px;">
                    <button class="btn btn-secondary-large" onclick="location.reload()">다시하기</button>
                    <button class="btn btn-primary-large" onclick="window.parent.postMessage('close', '*')">홈으로</button>
                </div>
            `;
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
        if (this.currentSceneId) {
            this.scenes.get(this.currentSceneId).hide();
        }
        
        if (this.scenes.has(sceneId)) {
            this.currentSceneId = sceneId;
            this.scenes.get(sceneId).show();
        } else {
            console.error(`Scene ${sceneId} does not exist`);
        }
    }

    nextScene() {
        const order = ['hook', 'story', 'core', 'quiz', 'wrap'];
        const currentIndex = order.indexOf(this.currentSceneId);
        if (currentIndex < order.length - 1) {
            this.switchScene(order[currentIndex + 1]);
        }
    }

    start() {
        this.switchScene('hook');
    }

    showFeedback(msg, type='neutral') {
        const el = document.getElementById('core-feedback');
        if(el) {
            el.innerHTML = msg;
            el.className = `scene-text feedback-${type}`;
        }
    }
    
    enableNext() {
        const btn = document.getElementById('core-next-btn');
        if(btn) {
            btn.style.display = 'inline-block';
            btn.classList.add('animate-fade-in');
        }
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
            this.showFeedback("정답입니다!", 'positive');
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
   Content Data - 피자로 배우는 분수
   ======================================== */
const pizzaContentData = {
    title: "피자로 배우는 분수",
    hook: {
        question: "피자를 똑같이 나누려면 어떻게 해야 할까?"
    },
    story: {
        character: { image: "assets/character.svg" }, 
        situation: "피자 가게 사장님이 고민에 빠졌어요.<br>손님들이 '내 조각이 더 작잖아!'라고 화를 냈거든요.<br>여러분이 사장님을 도와 피자를 똑같이 나눠주세요!"
    },
    interaction: {
        title: "피자 나누기 연습",
        instruction: "피자를 클릭해서 4조각으로 똑같이 나눠보세요!",
        onInit: (container, engine) => {
            let currentSlices = 1;
            const targetSlices = 4;
            
            container.innerHTML = `
                <div class="pizza-container">
                    <div class="pizza" id="pizza-target"></div>
                </div>
                <div class="fraction-display">
                    <span id="current-slice-count">1</span>조각
                </div>
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button class="btn btn-secondary" id="reset-slice-btn">다시 하기</button>
                    <button class="btn btn-primary" id="check-slice-btn">확인</button>
                </div>
            `;
            
            const pizza = container.querySelector('#pizza-target');
            const countDisplay = container.querySelector('#current-slice-count');
            const checkBtn = container.querySelector('#check-slice-btn');
            const resetBtn = container.querySelector('#reset-slice-btn');

            const render = () => {
                pizza.innerHTML = '';
                const sliceAngle = 360 / currentSlices;
                for (let i = 0; i < currentSlices; i++) {
                    const slice = document.createElement('div');
                    slice.className = 'pizza-slice';
                    const rotation = i * sliceAngle;
                    
                    if (currentSlices > 1) {
                         slice.style.transform = `rotate(${rotation}deg)`;
                         slice.style.height = '50%';
                         slice.style.width = '2px';
                         slice.style.background = 'rgba(139, 69, 19, 0.5)';
                         slice.style.transformOrigin = 'bottom center';
                         slice.style.position = 'absolute';
                         slice.style.top = '0';
                         slice.style.left = '50%';
                    }
                    pizza.appendChild(slice);
                }
                
                pizza.style.background = `repeating-conic-gradient(
                    from 0deg,
                    #f5d0a9 0deg ${360/currentSlices - 2}deg,
                    #e6a15c ${360/currentSlices - 2}deg ${360/currentSlices}deg
                )`;
                
                countDisplay.textContent = currentSlices;
            };

            pizza.onclick = () => {
                if(currentSlices < 12) {
                    currentSlices++;
                    render();
                } else {
                    engine.showFeedback("너무 조각이 많아요!", "neutral");
                }
            };

            resetBtn.onclick = () => {
                currentSlices = 1;
                render();
                engine.showFeedback("", "neutral");
            };

            checkBtn.onclick = () => {
                if (currentSlices === targetSlices) {
                    engine.showFeedback("성공! 똑같이 4조각으로 나눠졌네요.", "positive");
                    engine.enableNext();
                    checkBtn.disabled = true;
                    pizza.style.pointerEvents = 'none';
                } else {
                     engine.showFeedback(`${targetSlices}조각이 아니에요. 다시 해보세요!`, "negative");
                }
            };
            
            render();
        }
    },
    quiz: [
        {
            question: "친구가 2명 더 와서 총 8명이 되었습니다. 피자를 몇 조각으로 나눠야 할까요?",
            options: ["4조각", "6조각", "8조각", "12조각"],
            answer: 2
        }
    ]
};

Engine.init(pizzaContentData);
