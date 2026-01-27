const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    
    // State for Core Scene
    coreState: {
        currentTime: 'afternoon', // morning, afternoon, evening
        discovered: { morning: false, afternoon: false, evening: false }
    },

    // State for Quiz Scene
    quizState: {
        currentQuestionIndex: 0,
        questions: [
            {
                id: 1,
                time: 'morning',
                visual: 'sun',
                question: '해가 떴어요. 친구를 만났습니다. 뭐라고 할까요?',
                options: ['Good morning', 'Good afternoon', 'Good evening'],
                answer: 'Good morning'
            },
            {
                id: 2,
                time: 'afternoon',
                visual: 'sun-high',
                question: '학교 점심시간이에요. 친구를 만났습니다.',
                options: ['Good morning', 'Good afternoon', 'Good evening'],
                answer: 'Good afternoon'
            },
            {
                id: 3,
                time: 'evening',
                visual: 'moon',
                question: '해가 지고 달이 떴어요. 이럴 땐 뭐라고 할까요?',
                options: ['Good morning', 'Good afternoon', 'Good evening'],
                answer: 'Good evening'
            }
        ]
    },

    // SVG Strings
    svgs: {
        sun: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="#FFD700" stroke="#FFA500" stroke-width="5"/><path d="M50,10 L50,0 M50,90 L50,100 M10,50 L0,50 M90,50 L100,50 M22,22 L15,15 M78,78 L85,85 M22,78 L15,85 M78,22 L85,15" stroke="#FFD700" stroke-width="8" stroke-linecap="round"/></svg>`,
        sunHigh: `<svg viewBox="0 0 100 100"><circle cx="50" cy="40" r="25" fill="#F5A623" stroke="#E67E22" stroke-width="5"/><path d="M50,5 L50,0 M50,75 L50,80 M15,40 L5,40 M85,40 L95,40 M25,15 L20,10 M75,15 L80,10" stroke="#F5A623" stroke-width="6" stroke-linecap="round"/></svg>`,
        moon: `<svg viewBox="0 0 100 100"><path d="M50,20 A30,30 0 1,1 50,80 A24,24 0 1,0 50,20 Z" fill="#F4F6F7" stroke="#BDC3C7" stroke-width="2"/></svg>`
    },

    init() {
        this.bindEvents();
        this.showScene(0);
    },

    showScene(index) {
        document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
        const sceneId = `${this.scenes[index]}-scene`;
        const sceneEl = document.getElementById(sceneId);
        if(sceneEl) sceneEl.classList.add('active');
        this.currentScene = index;
        
        // Initialize specific scene logic
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

    restart() {
        this.showScene(0);
    },

    bindEvents() {
        const slider = document.getElementById('time-slider');
        if(slider) {
            slider.addEventListener('input', (e) => this.handleTimeChange(e.target.value));
        }
    },

    // --- Core Scene Logic ---
    initCoreScene() {
        this.handleTimeChange(50); // Start at afternoon
        document.getElementById('feedback-msg').textContent = '';
    },

    handleTimeChange(val) {
        const sky = document.getElementById('sky-container');
        const celestial = document.getElementById('celestial-body');
        const msg = document.getElementById('feedback-msg');
        
        msg.textContent = ''; // Clear feedback on slide

        if (val < 35) {
            // Morning
            this.coreState.currentTime = 'morning';
            sky.style.background = 'linear-gradient(to bottom, #87CEEB, #E0F7FA)';
            celestial.innerHTML = this.svgs.sun;
            celestial.style.top = '60px';
        } else if (val < 70) {
            // Afternoon
            this.coreState.currentTime = 'afternoon';
            sky.style.background = 'linear-gradient(to bottom, #4FC3F7, #FFF176)';
            celestial.innerHTML = this.svgs.sunHigh;
            celestial.style.top = '20px';
        } else {
            // Evening
            this.coreState.currentTime = 'evening';
            sky.style.background = 'linear-gradient(to bottom, #2C3E50, #4CA1AF)';
            celestial.innerHTML = this.svgs.moon;
            celestial.style.top = '30px';
        }
    },

    checkGreeting(greeting) {
        const msg = document.getElementById('feedback-msg');
        const correctMap = {
            'morning': 'Good morning',
            'afternoon': 'Good afternoon',
            'evening': 'Good evening'
        };

        const currentCorrect = correctMap[this.coreState.currentTime];

        if (greeting === currentCorrect) {
            msg.textContent = "정답이야! " + greeting + "! 🌟";
            msg.className = "feedback-msg correct";
            this.coreState.discovered[this.coreState.currentTime] = true;
            
            // If all discovered, maybe show a next button automatically? (Optional, keeping manual for now)
            setTimeout(() => {
                if (Object.values(this.coreState.discovered).every(Boolean)) {
                    msg.textContent += " 모든 인사를 배웠어요! 다음으로 가볼까요?";
                    // Auto advance hint could go here
                }
            }, 1500);
        } else {
            let hint = "";
            if(this.coreState.currentTime === 'morning') hint = "해가 막 떴어요.";
            if(this.coreState.currentTime === 'afternoon') hint = "해가 중천에 떠요.";
            if(this.coreState.currentTime === 'evening') hint = "하늘이 어두워요.";
            
            msg.textContent = "다시 생각해볼까요? (힌트: " + hint + ")";
            msg.className = "feedback-msg wrong";
        }
    },

    // --- Quiz Scene Logic ---
    initQuizScene() {
        this.quizState.currentQuestionIndex = 0;
        this.renderQuizQuestion();
    },

    renderQuizQuestion() {
        const q = this.quizState.questions[this.quizState.currentQuestionIndex];
        const visualContainer = document.getElementById('quiz-visual');
        const questionContainer = document.getElementById('quiz-question');
        const optionsContainer = document.getElementById('quiz-options');
        const feedback = document.getElementById('quiz-feedback');
        const nextBtn = document.getElementById('next-quiz-btn');

        // Set Visual
        if (q.visual === 'sun') {
            visualContainer.style.background = '#87CEEB';
            visualContainer.innerHTML = this.svgs.sun;
        } else if (q.visual === 'sun-high') {
            visualContainer.style.background = '#FFD700';
            visualContainer.innerHTML = this.svgs.sunHigh;
        } else {
            visualContainer.style.background = '#2C3E50';
            visualContainer.innerHTML = this.svgs.moon;
        }

        // Set Text
        questionContainer.innerHTML = `<p>${q.question}</p>`;

        // Set Options
        optionsContainer.innerHTML = '';
        q.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option-btn';
            btn.textContent = opt;
            btn.onclick = () => this.checkQuizAnswer(opt, q.answer);
            optionsContainer.appendChild(btn);
        });

        // Reset UI
        feedback.textContent = '';
        feedback.className = 'feedback-msg';
        nextBtn.classList.add('hidden');
    },

    checkQuizAnswer(selected, correct) {
        const feedback = document.getElementById('quiz-feedback');
        const options = document.querySelectorAll('.quiz-option-btn');
        
        // Disable buttons
        options.forEach(btn => btn.disabled = true);

        if (selected === correct) {
            feedback.textContent = "정답! 대단해! 🎉";
            feedback.className = "feedback-msg correct";
            document.getElementById('next-quiz-btn').classList.remove('hidden');
        } else {
            feedback.textContent = `틀렸어요. 정답은 ${correct}입니다.`;
            feedback.className = "feedback-msg wrong";
            setTimeout(() => {
                document.getElementById('next-quiz-btn').classList.remove('hidden');
            }, 1500);
        }
    },

    nextQuiz() {
        if (this.quizState.currentQuestionIndex < this.quizState.questions.length - 1) {
            this.quizState.currentQuestionIndex++;
            this.renderQuizQuestion();
        } else {
            this.nextScene(); // Go to Wrap Scene
        }
    },

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
};

// Start app
document.addEventListener('DOMContentLoaded', () => ContentApp.init());