const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    isTransformed: false,
    isMerged: false,

    contentData: {
        title: '분수의 덧셈',
        gradeLevel: '초등학교 5학년'
    },

    init() {
        this.bindEvents();
        this.renderNavDots();
        this.showScene(0);
    },

    showScene(index) {
        document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
        const sceneId = `${this.scenes[index]}-scene`;
        const sceneEl = document.getElementById(sceneId);
        if(sceneEl) sceneEl.classList.add('active');
        
        this.currentScene = index;
        this.updateNavDots();
        
        // Scene specific init logic
        if (this.scenes[index] === 'core') {
            this.resetCoreScene();
        }
        if (this.scenes[index] === 'quiz') {
            this.resetQuiz();
        }
        if (this.scenes[index] === 'wrap') {
            this.createConfetti();
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

    renderNavDots() {
        const nav = document.querySelector('.nav-dots');
        if (!nav) return;
        nav.innerHTML = '';
        this.scenes.forEach((_, idx) => {
            const dot = document.createElement('div');
            dot.className = 'dot';
            dot.onclick = () => this.showScene(idx);
            nav.appendChild(dot);
        });
    },

    updateNavDots() {
        const dots = document.querySelectorAll('.dot');
        dots.forEach((dot, idx) => {
            if (idx === this.currentScene) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    },

    // --- Core Scene Logic ---
    resetCoreScene() {
        this.isTransformed = false;
        this.isMerged = false;
        
        const f1 = document.getElementById('f1').querySelector('.bar-container');
        const f2 = document.getElementById('f2').querySelector('.bar-container');
        const label1 = document.querySelector('#f1 .label');
        const label2 = document.querySelector('#f2 .label');
        
        // Reset DOM elements
        f1.className = 'bar-container';
        f2.className = 'bar-container';
        f1.innerHTML = '<div class="bar half"></div><div class="bar half active"></div>';
        f2.innerHTML = '<div class="bar third active"></div><div class="bar third"></div><div class="bar third"></div>';
        
        label1.textContent = '1/2';
        label2.textContent = '1/3';

        const transformBtn = document.getElementById('transform-btn');
        const mergeBtn = document.getElementById('merge-btn');
        const feedback = document.getElementById('feedback-area');

        transformBtn.disabled = false;
        transformBtn.classList.remove('disabled');
        mergeBtn.disabled = true;
        mergeBtn.classList.add('disabled');
        feedback.innerHTML = '';
        feedback.className = 'feedback-box';
    },

    transformFractions() {
        if (this.isTransformed) return;
        this.isTransformed = true;

        const f1 = document.getElementById('f1').querySelector('.bar-container');
        const f2 = document.getElementById('f2').querySelector('.bar-container');
        const label1 = document.querySelector('#f1 .label');
        const label2 = document.querySelector('#f2 .label');
        const feedback = document.getElementById('feedback-area');

        // Animation split logic
        f1.innerHTML = '<div class="bar active-1"></div><div class="bar active-1"></div><div class="bar active-1"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div>';
        f1.classList.add('sixths');
        label1.textContent = '3/6';

        f2.innerHTML = '<div class="bar active-2"></div><div class="bar active-2"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div>';
        f2.classList.add('sixths');
        label2.textContent = '2/6';

        const transformBtn = document.getElementById('transform-btn');
        const mergeBtn = document.getElementById('merge-btn');

        transformBtn.disabled = true;
        transformBtn.classList.add('disabled');
        
        // Delightful delay
        setTimeout(() => {
            mergeBtn.disabled = false;
            mergeBtn.classList.remove('disabled');
            feedback.innerHTML = "✨ 통분 완료! 조각 크기가 모두 1/6로 같아졌어요! ✨";
            feedback.classList.add('show');
            this.createConfetti(15);
        }, 600);
    },

    mergeFractions() {
        if (this.isMerged) return;
        this.isMerged = true;
        
        const feedback = document.getElementById('feedback-area');
        const f2 = document.getElementById('f2');
        
        f2.style.transform = 'scale(0.8)';
        f2.style.opacity = '0.3';
        
        feedback.classList.remove('show');
        
        setTimeout(() => {
            feedback.innerHTML = "분자끼리 더하기: 3 + 2 = 5<br>🍕 하프앤하프 피자 완성! 결과: <strong>5/6</strong>";
            feedback.classList.add('show');
            
            const f1Bars = document.querySelectorAll('#f1 .bar');
            f1Bars.forEach(b => b.classList.remove('active-1'));
            for(let i=0; i<5; i++) {
                f1Bars[i].style.backgroundColor = '#fb923c';
            }
            
            document.querySelector('#f1 .label').textContent = '5/6';
            this.createConfetti(30);
        }, 500);
    },

    // --- Quiz Logic ---
    resetQuiz() {
        const options = document.querySelectorAll('.option-btn');
        options.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('correct-ans', 'wrong-ans');
            btn.style.opacity = '1';
        });
        const feedback = document.getElementById('quiz-feedback');
        feedback.innerHTML = '';
        feedback.className = 'feedback-msg';
        document.getElementById('quiz-next').style.display = 'none';
    },

    checkAnswer(btn, isCorrect) {
        const options = document.querySelectorAll('.option-btn');
        options.forEach(b => b.disabled = true); // lock out
        
        const feedback = document.getElementById('quiz-feedback');
        feedback.className = 'feedback-msg';
        
        if (isCorrect) {
            btn.classList.add('correct-ans');
            feedback.classList.add('correct');
            feedback.innerHTML = '🎉 정답! 2/5 = 4/10, 4/10 + 1/10 = 5/10 = 1/2 이에요. 🎉';
            document.getElementById('quiz-next').style.display = 'inline-block';
            this.createConfetti(50);
        } else {
            btn.classList.add('wrong-ans');
            feedback.classList.add('incorrect');
            feedback.innerHTML = '💡 틀렸어요. 분모를 먼저 통분해보세요 (공통분모 10).';
            
            setTimeout(() => {
                options.forEach(b => {
                    if(b !== btn) {
                        b.disabled = false;
                        b.classList.remove('wrong-ans');
                    }
                });
                btn.style.opacity = '0.4';
                feedback.innerHTML = '';
                feedback.classList.remove('incorrect');
            }, 2000);
        }
    },

    createConfetti(amount = 50) {
        let container = document.getElementById('confetti-container');
        if(!container) {
            container = document.createElement('div');
            container.id = 'confetti-container';
            document.body.appendChild(container);
        }
        
        const colors = ['#f97316', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];
        for(let i=0; i<amount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = (Math.random() * 100) + 'vw';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
            confetti.style.animationDelay = (Math.random() * 0.5) + 's';
            container.appendChild(confetti);
            setTimeout(() => confetti.remove(), 4000);
        }
    },

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') this.nextScene();
            if (e.key === 'ArrowLeft') this.prevScene();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => ContentApp.init());