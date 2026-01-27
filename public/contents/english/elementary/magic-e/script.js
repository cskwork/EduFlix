// Magic E - Interactive Phonics Learning
const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    quizIndex: 0,
    quizScore: 0,
    currentWordPair: 0,
    
    // 콘텐츠 데이터
    contentData: {
        title: 'Magic E',
        gradeLevel: 'Elementary 2-3',
        domain: 'phonics',
        targetLanguage: ['cap → cape', 'bit → bite', 'hop → hope', 'cut → cute']
    },
    
    // 단어 쌍 데이터
    wordPairs: [
        { without: 'cap', with: 'cape', vowel: 'a', meaning: { without: '모자', with: '망토' } },
        { without: 'bit', with: 'bite', vowel: 'i', meaning: { without: '조금', with: '물다' } },
        { without: 'hop', with: 'hope', vowel: 'o', meaning: { without: '깡충', with: '희망' } },
        { without: 'cut', with: 'cute', vowel: 'u', meaning: { without: '자르다', with: '귀여운' } },
        { without: 'tap', with: 'tape', vowel: 'a', meaning: { without: '톡톡', with: '테이프' } },
        { without: 'pin', with: 'pine', vowel: 'i', meaning: { without: '핀', with: '소나무' } }
    ],
    
    // 퀴즈 데이터
    quizData: [
        {
            image: 'kite',
            question: '하늘을 나는 연 그림이에요. 올바른 단어는?',
            options: ['kit', 'kite'],
            correct: 1
        },
        {
            image: 'cube',
            question: '정육면체 그림이에요. 올바른 단어는?',
            options: ['cub', 'cube'],
            correct: 1
        },
        {
            image: 'note',
            question: '음표 그림이에요. 올바른 단어는?',
            options: ['not', 'note'],
            correct: 1
        },
        {
            image: 'cape',
            question: '슈퍼히어로의 망토예요. 올바른 단어는?',
            options: ['cap', 'cape'],
            correct: 1
        }
    ],
    
    init() {
        this.bindEvents();
        this.showScene(0);
    },
    
    showScene(index) {
        document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
        const sceneId = `${this.scenes[index]}-scene`;
        const sceneEl = document.getElementById(sceneId);
        if (sceneEl) {
            sceneEl.classList.add('active');
        }
        this.currentScene = index;
        this.updateProgress();
        
        if (this.scenes[index] === 'core') {
            this.initCoreScene();
        } else if (this.scenes[index] === 'quiz') {
            this.initQuizScene();
        }
    },
    
    nextScene() {
        if (this.currentScene < this.scenes.length - 1) {
            this.showScene(this.currentScene + 1);
        }
    },
    
    prevScene() {
        if (this.currentScene > 0) {
            this.showScene(this.currentScene - 1);
        }
    },
    
    updateProgress() {
        const progress = ((this.currentScene + 1) / this.scenes.length) * 100;
        document.getElementById('progress-bar').style.width = `${progress}%`;
    },
    
    // Core Scene
    initCoreScene() {
        this.currentWordPair = 0;
        this.updateWordMachine();
    },
    
    updateWordMachine() {
        const pair = this.wordPairs[this.currentWordPair];
        const display = document.getElementById('machine-word');
        if (display) {
            display.innerHTML = pair.without;
            display.classList.remove('with-magic');
        }
    },
    
    toggleMagicE() {
        const pair = this.wordPairs[this.currentWordPair];
        const display = document.getElementById('machine-word');
        const hasMagic = display.classList.contains('with-magic');
        
        if (hasMagic) {
            display.innerHTML = pair.without;
            display.classList.remove('with-magic');
            this.playAudio(pair.without);
        } else {
            display.innerHTML = pair.with.slice(0, -1) + `<span class="magic-e">e</span>`;
            display.classList.add('with-magic');
            this.playAudio(pair.with);
        }
        
        // 발견 박스 표시
        setTimeout(() => {
            const discovery = document.getElementById('discovery-box');
            if (discovery) discovery.classList.add('show');
        }, 1500);
    },
    
    nextWord() {
        this.currentWordPair = (this.currentWordPair + 1) % this.wordPairs.length;
        this.updateWordMachine();
    },
    
    prevWord() {
        this.currentWordPair = (this.currentWordPair - 1 + this.wordPairs.length) % this.wordPairs.length;
        this.updateWordMachine();
    },
    
    selectWordPair(index) {
        this.currentWordPair = index;
        this.updateWordMachine();
        
        document.querySelectorAll('.word-pair').forEach((el, i) => {
            el.classList.toggle('active', i === index);
        });
    },
    
    // 발음 재생
    playAudio(text) {
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.7;
            speechSynthesis.speak(utterance);
        }
    },
    
    playWordWithE() {
        const pair = this.wordPairs[this.currentWordPair];
        this.playAudio(pair.with);
    },
    
    playWordWithoutE() {
        const pair = this.wordPairs[this.currentWordPair];
        this.playAudio(pair.without);
    },
    
    // Quiz Scene
    initQuizScene() {
        this.quizIndex = 0;
        this.quizScore = 0;
        this.showQuiz(0);
    },
    
    showQuiz(index) {
        const container = document.getElementById('quiz-container');
        if (!container) return;
        
        const quiz = this.quizData[index];
        
        container.innerHTML = `
            <div class="quiz-card">
                <div class="quiz-image-container">
                    ${this.getQuizSVG(quiz.image)}
                </div>
                <p class="quiz-question">${quiz.question}</p>
                <div class="quiz-options">
                    ${quiz.options.map((opt, i) => `
                        <button class="quiz-btn english-text" onclick="ContentApp.checkQuizAnswer(${i})">${opt}</button>
                    `).join('')}
                </div>
            </div>
            <div class="quiz-progress">${index + 1} / ${this.quizData.length}</div>
        `;
    },
    
    getQuizSVG(type) {
        const svgs = {
            kite: `<svg viewBox="0 0 100 100" width="120" height="120">
                <polygon points="50,10 90,50 50,90 10,50" fill="#FF5722" stroke="#E64A19" stroke-width="2"/>
                <line x1="50" y1="10" x2="50" y2="90" stroke="#E64A19" stroke-width="2"/>
                <line x1="10" y1="50" x2="90" y2="50" stroke="#E64A19" stroke-width="2"/>
                <path d="M50 90 Q60 110 50 130 Q40 110 50 90" fill="none" stroke="#795548" stroke-width="2"/>
            </svg>`,
            cube: `<svg viewBox="0 0 100 100" width="120" height="120">
                <polygon points="50,15 85,35 85,70 50,90 15,70 15,35" fill="#2196F3" stroke="#1565C0" stroke-width="2"/>
                <polygon points="50,15 85,35 50,55 15,35" fill="#64B5F6"/>
                <line x1="50" y1="55" x2="50" y2="90" stroke="#1565C0" stroke-width="2"/>
            </svg>`,
            note: `<svg viewBox="0 0 100 100" width="120" height="120">
                <ellipse cx="35" cy="70" rx="15" ry="12" fill="#333"/>
                <rect x="48" y="20" width="4" height="50" fill="#333"/>
                <path d="M52 20 Q70 25 70 40 Q70 55 52 45" fill="#333"/>
            </svg>`,
            cape: `<svg viewBox="0 0 100 100" width="120" height="120">
                <path d="M30 20 Q50 25 70 20 L80 90 Q50 100 20 90 Z" fill="#F44336" stroke="#C62828" stroke-width="2"/>
                <ellipse cx="50" cy="22" rx="8" ry="5" fill="#FFD700"/>
            </svg>`
        };
        return svgs[type] || '';
    },
    
    checkQuizAnswer(optionIndex) {
        const quiz = this.quizData[this.quizIndex];
        const buttons = document.querySelectorAll('.quiz-btn');
        
        buttons.forEach((btn, i) => {
            btn.disabled = true;
            if (i === quiz.correct) {
                btn.classList.add('correct');
            } else if (i === optionIndex) {
                btn.classList.add('incorrect');
            }
        });
        
        if (optionIndex === quiz.correct) {
            this.quizScore++;
            this.playAudio(quiz.options[quiz.correct]);
        }
        
        setTimeout(() => {
            if (this.quizIndex < this.quizData.length - 1) {
                this.quizIndex++;
                this.showQuiz(this.quizIndex);
            } else {
                this.nextScene();
            }
        }, 1500);
    },
    
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') this.nextScene();
            if (e.key === 'ArrowLeft') this.prevScene();
            if (e.key === ' ' && this.currentScene === 3) {
                e.preventDefault();
                this.toggleMagicE();
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => ContentApp.init());
