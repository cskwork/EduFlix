// Word Families - Interactive Vocabulary Learning
const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    quizIndex: 0,
    quizScore: 0,
    currentWord: 0,
    
    // 단어 데이터
    wordData: [
        { verb: 'create', noun: 'creation', suffix: '-tion', meaning: { verb: '창조하다', noun: '창조, 창작물' } },
        { verb: 'educate', noun: 'education', suffix: '-tion', meaning: { verb: '교육하다', noun: '교육' } },
        { verb: 'celebrate', noun: 'celebration', suffix: '-tion', meaning: { verb: '축하하다', noun: '축하, 기념행사' } },
        { verb: 'decide', noun: 'decision', suffix: '-sion', meaning: { verb: '결정하다', noun: '결정' } },
        { verb: 'explode', noun: 'explosion', suffix: '-sion', meaning: { verb: '폭발하다', noun: '폭발' } },
        { verb: 'discuss', noun: 'discussion', suffix: '-sion', meaning: { verb: '토론하다', noun: '토론' } }
    ],
    
    // 퀴즈 데이터
    quizData: [
        {
            context: '학교 발표 시간',
            sentence: 'The ______ (educate) system in Korea is very competitive.',
            answer: 'education',
            options: ['educate', 'education', 'educator', 'educating']
        },
        {
            context: '앱 리뷰 작성',
            sentence: 'This game needs better ______ (explain) of the rules.',
            answer: 'explanation',
            options: ['explain', 'explanation', 'explainer', 'explaining']
        },
        {
            context: '과학 수업',
            sentence: 'Air ______ (pollute) is a serious problem.',
            answer: 'pollution',
            options: ['pollute', 'pollution', 'polluter', 'polluting']
        },
        {
            context: '팀 회의',
            sentence: 'We had a long ______ (discuss) about the project.',
            answer: 'discussion',
            options: ['discuss', 'discussion', 'discussing', 'discussed']
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
        if (sceneEl) sceneEl.classList.add('active');
        
        this.currentScene = index;
        this.updateProgress();
        
        if (this.scenes[index] === 'core') this.initCoreScene();
        if (this.scenes[index] === 'quiz') this.initQuizScene();
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
        this.currentWord = 0;
        this.updateMachine();
    },
    
    updateMachine() {
        const word = this.wordData[this.currentWord];
        const inputEl = document.getElementById('input-word');
        const outputEl = document.getElementById('output-word');
        const suffixEl = document.getElementById('suffix-display');
        
        if (inputEl) inputEl.textContent = word.verb;
        if (outputEl) outputEl.textContent = word.noun;
        if (suffixEl) suffixEl.textContent = word.suffix;
    },
    
    nextWord() {
        this.currentWord = (this.currentWord + 1) % this.wordData.length;
        this.updateMachine();
    },
    
    prevWord() {
        this.currentWord = (this.currentWord - 1 + this.wordData.length) % this.wordData.length;
        this.updateMachine();
    },
    
    selectWord(index) {
        this.currentWord = index;
        this.updateMachine();
        
        document.querySelectorAll('.word-selector').forEach((el, i) => {
            el.classList.toggle('active', i === index);
        });
    },
    
    playAudio(text) {
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.85;
            speechSynthesis.speak(utterance);
        }
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
                <div class="quiz-context">
                    <div class="quiz-context-icon">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                            <circle cx="12" cy="12" r="10"/>
                        </svg>
                    </div>
                    <span>${quiz.context}</span>
                </div>
                <p class="quiz-sentence english-text">${quiz.sentence}</p>
                <div class="quiz-options">
                    ${quiz.options.map((opt, i) => `
                        <button class="quiz-btn english-text" onclick="ContentApp.checkQuizAnswer('${opt}')">${opt}</button>
                    `).join('')}
                </div>
            </div>
            <div id="quiz-feedback" class="quiz-feedback"></div>
            <div class="quiz-progress" style="text-align: center; margin-top: 16px; color: #888;">${index + 1} / ${this.quizData.length}</div>
        `;
    },
    
    checkQuizAnswer(selected) {
        const quiz = this.quizData[this.quizIndex];
        const feedback = document.getElementById('quiz-feedback');
        const buttons = document.querySelectorAll('.quiz-btn');
        
        buttons.forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === quiz.answer) {
                btn.classList.add('correct');
            } else if (btn.textContent === selected) {
                btn.classList.add('incorrect');
            }
        });
        
        if (selected === quiz.answer) {
            this.quizScore++;
            feedback.textContent = '정답! ' + quiz.answer + '는 명사형이에요.';
            feedback.className = 'quiz-feedback show correct';
            this.playAudio(quiz.answer);
        } else {
            feedback.textContent = '정답은 ' + quiz.answer + '이에요. 동사에서 명사로 바뀌었어요.';
            feedback.className = 'quiz-feedback show incorrect';
        }
        
        setTimeout(() => {
            if (this.quizIndex < this.quizData.length - 1) {
                this.quizIndex++;
                this.showQuiz(this.quizIndex);
            } else {
                this.nextScene();
            }
        }, 2000);
    },
    
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') this.nextScene();
            if (e.key === 'ArrowLeft') this.prevScene();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => ContentApp.init());
