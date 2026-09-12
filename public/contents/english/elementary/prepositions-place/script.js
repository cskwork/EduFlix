// Prepositions of Place - Interactive Learning
const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    quizIndex: 0,
    quizScore: 0,
    selectedPrep: null,
    
    // 전치사 데이터
    prepositions: [
        { word: 'in', meaning: '안에', color: '#FF6B6B', example: 'The cat is in the box.' },
        { word: 'on', meaning: '위에', color: '#4ECDC4', example: 'The book is on the table.' },
        { word: 'under', meaning: '아래에', color: '#A29BFE', example: 'The dog is under the table.' },
        { word: 'next to', meaning: '옆에', color: '#FD79A8', example: 'The lamp is next to the bed.' },
        { word: 'between', meaning: '사이에', color: '#74B9FF', example: 'The cat is between the chairs.' }
    ],
    
    // 퀴즈 데이터
    quizData: [
        {
            scene: 'cat-box',
            question: 'Where is the cat?',
            answer: 'in',
            options: ['in', 'on', 'under', 'next to']
        },
        {
            scene: 'book-table',
            question: 'Where is the book?',
            answer: 'on',
            options: ['in', 'on', 'under', 'between']
        },
        {
            scene: 'dog-table',
            question: 'Where is the dog?',
            answer: 'under',
            options: ['on', 'under', 'in', 'next to']
        },
        {
            scene: 'lamp-bed',
            question: 'Where is the lamp?',
            answer: 'next to',
            options: ['in', 'on', 'next to', 'between']
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
    
    selectPreposition(index) {
        this.selectedPrep = index;
        const prep = this.prepositions[index];
        
        document.querySelectorAll('.prep-card').forEach((el, i) => {
            el.classList.toggle('active', i === index);
        });
        
        const exampleEl = document.getElementById('prep-example');
        if (exampleEl) {
            exampleEl.innerHTML = `<strong class="english-text">${prep.word}</strong>: ${prep.example}`;
            exampleEl.style.borderColor = prep.color;
        }
        
        this.playAudio(prep.example);
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
            <div class="quiz-room">
                ${this.getQuizSVG(quiz.scene)}
            </div>
            <p class="quiz-question">
                <span class="english-text">${quiz.question}</span><br>
                <span style="color: #888;">고양이/물건이 어디에 있나요?</span>
            </p>
            <div class="quiz-options">
                ${quiz.options.map(opt => `
                    <button class="quiz-btn english-text" onclick="ContentApp.checkQuizAnswer('${opt}')">${opt}</button>
                `).join('')}
            </div>
            <div id="quiz-feedback" class="quiz-feedback"></div>
            <div style="text-align: center; margin-top: 16px; color: #888;">${index + 1} / ${this.quizData.length}</div>
        `;
    },
    
    getQuizSVG(scene) {
        const svgs = {
            'cat-box': `
                <svg viewBox="0 0 300 200" style="width: 100%; height: 100%;">
                    <rect x="0" y="0" width="300" height="200" fill="#E8F4FC"/>
                    <rect x="0" y="150" width="300" height="50" fill="#DEB887"/>
                    <!-- Box -->
                    <rect x="100" y="80" width="100" height="70" fill="#CD853F" stroke="#8B4513" stroke-width="3"/>
                    <rect x="105" y="85" width="90" height="60" fill="#DEB887"/>
                    <!-- Cat in box -->
                    <ellipse cx="150" cy="95" rx="25" ry="20" fill="#FFA500"/>
                    <circle cx="140" cy="90" r="3" fill="#333"/>
                    <circle cx="160" cy="90" r="3" fill="#333"/>
                    <polygon points="135,80 140,90 130,90" fill="#FFA500"/>
                    <polygon points="165,80 160,90 170,90" fill="#FFA500"/>
                    <path d="M145 98 Q150 102 155 98" fill="none" stroke="#333" stroke-width="2"/>
                </svg>
            `,
            'book-table': `
                <svg viewBox="0 0 300 200" style="width: 100%; height: 100%;">
                    <rect x="0" y="0" width="300" height="200" fill="#E8F4FC"/>
                    <rect x="0" y="150" width="300" height="50" fill="#DEB887"/>
                    <!-- Table -->
                    <rect x="60" y="100" width="180" height="15" fill="#8B4513"/>
                    <rect x="70" y="115" width="10" height="50" fill="#8B4513"/>
                    <rect x="220" y="115" width="10" height="50" fill="#8B4513"/>
                    <!-- Book on table -->
                    <rect x="130" y="80" width="50" height="20" fill="#4169E1" rx="2"/>
                    <line x1="155" y1="82" x2="155" y2="98" stroke="#1E3A8A" stroke-width="2"/>
                </svg>
            `,
            'dog-table': `
                <svg viewBox="0 0 300 200" style="width: 100%; height: 100%;">
                    <rect x="0" y="0" width="300" height="200" fill="#E8F4FC"/>
                    <rect x="0" y="150" width="300" height="50" fill="#DEB887"/>
                    <!-- Table -->
                    <rect x="60" y="90" width="180" height="12" fill="#8B4513"/>
                    <rect x="70" y="102" width="10" height="55" fill="#8B4513"/>
                    <rect x="220" y="102" width="10" height="55" fill="#8B4513"/>
                    <!-- Dog under table -->
                    <ellipse cx="150" cy="140" rx="35" ry="20" fill="#D2691E"/>
                    <circle cx="125" cy="135" r="15" fill="#D2691E"/>
                    <circle cx="118" cy="132" r="3" fill="#333"/>
                    <circle cx="128" cy="132" r="3" fill="#333"/>
                    <ellipse cx="123" cy="140" rx="5" ry="3" fill="#333"/>
                    <ellipse cx="180" cy="145" rx="8" ry="5" fill="#D2691E"/>
                </svg>
            `,
            'lamp-bed': `
                <svg viewBox="0 0 300 200" style="width: 100%; height: 100%;">
                    <rect x="0" y="0" width="300" height="200" fill="#E8F4FC"/>
                    <rect x="0" y="150" width="300" height="50" fill="#DEB887"/>
                    <!-- Bed -->
                    <rect x="120" y="100" width="140" height="50" fill="#4A90D9"/>
                    <rect x="115" y="90" width="150" height="15" fill="#6CA6E0"/>
                    <rect x="250" y="80" width="20" height="70" fill="#8B4513"/>
                    <!-- Lamp next to bed -->
                    <rect x="55" y="130" width="30" height="25" fill="#8B4513"/>
                    <rect x="65" y="90" width="10" height="40" fill="#CD853F"/>
                    <polygon points="45,90 95,90 85,60 55,60" fill="#FFE4B5" stroke="#DEB887" stroke-width="2"/>
                </svg>
            `
        };
        return svgs[scene] || '';
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
        
        const prep = this.prepositions.find(p => p.word === quiz.answer);
        
        if (selected === quiz.answer) {
            this.quizScore++;
            feedback.textContent = `정답! ${prep.example} ${quiz.answer === "on" ? "on은 표면에 닿아 있는 관계입니다." : quiz.answer === "in" ? "in은 경계 안에 있는 관계입니다." : quiz.answer === "under" ? "under는 기준 물체보다 아래에 있음을 나타냅니다." : "next to는 바로 옆의 위치입니다."}`;
            feedback.className = 'quiz-feedback show correct';
        } else {
            feedback.textContent = `정답은 "${quiz.answer}" (${prep.meaning})이에요. 완전한 문장: ${prep.example}`;
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
