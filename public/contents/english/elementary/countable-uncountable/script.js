// Countable vs Uncountable - Interactive Learning
const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    quizIndex: 0,
    quizScore: 0,
    sortedItems: { countable: [], uncountable: [] },
    
    // 단어 데이터
    words: [
        { word: 'apple', type: 'countable', meaning: '사과' },
        { word: 'book', type: 'countable', meaning: '책' },
        { word: 'dog', type: 'countable', meaning: '개' },
        { word: 'chair', type: 'countable', meaning: '의자' },
        { word: 'water', type: 'uncountable', meaning: '물' },
        { word: 'milk', type: 'uncountable', meaning: '우유' },
        { word: 'rice', type: 'uncountable', meaning: '쌀/밥' },
        { word: 'money', type: 'uncountable', meaning: '돈' }
    ],
    
    // 퀴즈 데이터
    quizData: [
        {
            sentence: 'I need ______ water.',
            answer: 'some',
            options: ['a', 'an', 'some', 'two'],
            explanation: '이 문장의 water는 물질을 나타내므로 some water가 알맞아요. Water is important처럼 some 없이도 쓰며, a bottle of water로 용기를 셀 수 있어요.'
        },
        {
            sentence: 'There are three ______ on the table.',
            answer: 'apples',
            options: ['apple', 'apples', 'an apple', 'some apple'],
            explanation: 'apple은 셀 수 있어서 복수형 "apples"를 써요.'
        },
        {
            sentence: 'Can I have ______ egg?',
            answer: 'an',
            options: ['a', 'an', 'some', 'many'],
            explanation: 'egg는 단수 가산명사이며 첫 발음이 모음 소리 /e/이므로 an egg라고 해요. 글자가 아니라 소리를 기준으로 고릅니다.'
        },
        {
            sentence: 'We need ______ for the recipe.',
            answer: 'some rice',
            options: ['a rice', 'rices', 'some rice', 'many rice'],
            explanation: 'rice는 셀 수 없어서 "some rice"라고 해요.'
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
        this.sortedItems = { countable: [], uncountable: [] };
        this.renderSortGame();
    },
    
    renderSortGame() {
        const poolEl = document.getElementById('word-pool');
        if (!poolEl) return;
        
        const unsortedWords = this.words.filter(w => 
            !this.sortedItems.countable.includes(w.word) && 
            !this.sortedItems.uncountable.includes(w.word)
        );
        
        poolEl.innerHTML = unsortedWords.map(w => `
            <div class="word-item english-text" onclick="ContentApp.sortWord('${w.word}')" data-word="${w.word}">
                ${w.word}
            </div>
        `).join('');
        
        document.getElementById('countable-items').innerHTML = 
            this.sortedItems.countable.map(w => {
                const wordData = this.words.find(x => x.word === w);
                const isCorrect = wordData && wordData.type === 'countable';
                return `<span class="sorted-item english-text ${isCorrect ? 'correct' : 'incorrect'}">${w}</span>`;
            }).join('');
            
        document.getElementById('uncountable-items').innerHTML = 
            this.sortedItems.uncountable.map(w => {
                const wordData = this.words.find(x => x.word === w);
                const isCorrect = wordData && wordData.type === 'uncountable';
                return `<span class="sorted-item english-text ${isCorrect ? 'correct' : 'incorrect'}">${w}</span>`;
            }).join('');
    },
    
    sortWord(word) {
        const wordData = this.words.find(w => w.word === word);
        if (!wordData) return;
        
        // 간단한 모달로 선택
        const choice = confirm(`"${word}"은(는) 셀 수 있는 명사일까요?\n\nOK = 셀 수 있음 (Countable)\nCancel = 셀 수 없음 (Uncountable)`);
        
        if (choice) {
            this.sortedItems.countable.push(word);
        } else {
            this.sortedItems.uncountable.push(word);
        }
        
        this.renderSortGame();
        
        // 모두 분류했는지 확인
        if (this.sortedItems.countable.length + this.sortedItems.uncountable.length === this.words.length) {
            const correct = this.words.filter(w => 
                (w.type === 'countable' && this.sortedItems.countable.includes(w.word)) ||
                (w.type === 'uncountable' && this.sortedItems.uncountable.includes(w.word))
            ).length;
            
            setTimeout(() => {
                alert(`분류 완료! ${correct}/${this.words.length}개 정답!`);
            }, 500);
        }
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
    
    // Quiz
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
                <p class="quiz-sentence english-text">${quiz.sentence}</p>
                <div class="quiz-options">
                    ${quiz.options.map(opt => `
                        <button class="quiz-btn english-text" onclick="ContentApp.checkQuizAnswer('${opt}')">${opt}</button>
                    `).join('')}
                </div>
            </div>
            <div id="quiz-feedback" class="quiz-feedback"></div>
            <div style="text-align: center; margin-top: 16px; color: #888;">${index + 1} / ${this.quizData.length}</div>
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
            feedback.textContent = '정답! ' + quiz.explanation;
            feedback.className = 'quiz-feedback show correct';
        } else {
            feedback.textContent = quiz.explanation;
            feedback.className = 'quiz-feedback show incorrect';
        }
        
        setTimeout(() => {
            if (this.quizIndex < this.quizData.length - 1) {
                this.quizIndex++;
                this.showQuiz(this.quizIndex);
            } else {
                this.nextScene();
            }
        }, 2500);
    },
    
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') this.nextScene();
            if (e.key === 'ArrowLeft') this.prevScene();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => ContentApp.init());
