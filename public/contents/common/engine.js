/**
 * EduFlix Core Engine
 * Manages Scene transitions and common game state
 */

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
        this.data = {}; // Game data
        this.container = document.getElementById('scene-container');
        if (!this.container) {
            console.error('Scene container (#scene-container) not found!');
            // Fallback create
            this.container = document.createElement('div');
            this.container.id = 'scene-container';
            document.getElementById('main-content').appendChild(this.container);
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
            return '<div class="story-character-emoji">🏃</div>';
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
                       <!-- Character rendering here -->
                       ${characterMarkup}
                    </div>
                </div>
                <div class="scene-text typing-effect">${situation}</div>
                <button class="btn btn-primary-large animate-fade-in" style="opacity:0; animation-delay: 2s;" onclick="Engine.nextScene()">다음</button>
            `;
        });

        // 3. Core Scenes (Interaction)
        // This is usually custom per content, but we provide a wrapper
        this.createScene('core', (scene) => {
            scene.innerHTML = `
                <h2 class="scene-title">${this.data.interaction.title || '체험하기'}</h2>
                <div class="scene-text">${this.data.interaction.instruction}</div>
                <div class="interactive-area" id="core-interactive-area"></div>
                <div id="core-feedback" class="scene-text" style="height: 50px;"></div>
                <button class="btn btn-primary-large" id="core-next-btn" style="display:none;" onclick="Engine.nextScene()">다음</button>
            `;
        }, () => {
             // On Enter: Initialize core interaction if defined
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
                <h1 class="scene-title">완료!</h1>
                <div class="wrap-summary">
                    <p class="scene-text">오늘 배운 내용</p>
                    <h3>${this.data.title}</h3>
                </div>
                <div style="display:flex; gap: 20px;">
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

    // Interaction Helpers
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

    // Quiz Logic
    startQuiz() {
        const q = this.data.quiz[0]; // Simple 1 question support for now, can extend
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
        opts.forEach(o => o.style.pointerEvents = 'none'); // Lock

        if (selectedIdx === correctIdx) {
            btnElement.classList.add('correct');
            this.showFeedback("정답입니다!", 'positive');
            setTimeout(() => this.nextScene(), 1500);
        } else {
            btnElement.classList.add('incorrect');
            // Highlight correct
            opts[correctIdx].classList.add('correct');
            setTimeout(() => this.nextScene(), 2000); // Move on anyway or retry?
        }
    }
}

// Global Singleton
window.Engine = new EduFlixEngine();
