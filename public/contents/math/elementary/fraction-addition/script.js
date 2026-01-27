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
        feedback.textContent = '';
        feedback.className = 'feedback-box';
        document.querySelector('.fraction-lab').classList.remove('merged');
    },

    transformFractions() {
        if (this.isTransformed) return;
        this.isTransformed = true;

        const f1 = document.getElementById('f1').querySelector('.bar-container');
        const f2 = document.getElementById('f2').querySelector('.bar-container');
        const label1 = document.querySelector('#f1 .label');
        const label2 = document.querySelector('#f2 .label');
        const feedback = document.getElementById('feedback-area');

        // Apply classes to trigger CSS changes (conceptually)
        // Here we manually replace innerHTML to animate splitting visually
        
        // 1/2 -> 3/6
        f1.innerHTML = '<div class="bar active-1"></div><div class="bar active-1"></div><div class="bar active-1"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div>';
        f1.classList.add('sixths');
        label1.textContent = '3/6';

        // 1/3 -> 2/6
        f2.innerHTML = '<div class="bar active-2"></div><div class="bar active-2"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div>';
        f2.classList.add('sixths');
        label2.textContent = '2/6';

        const transformBtn = document.getElementById('transform-btn');
        const mergeBtn = document.getElementById('merge-btn');

        transformBtn.disabled = true;
        transformBtn.classList.add('disabled');
        
        // Slight delay before enabling merge for UX
        setTimeout(() => {
            mergeBtn.disabled = false;
            mergeBtn.classList.remove('disabled');
            feedback.innerHTML = "통분 완료! 조각 크기가 모두 1/6로 같아졌어요.";
        }, 500);
    },

    mergeFractions() {
        if (this.isMerged) return;
        this.isMerged = true;
        
        const feedback = document.getElementById('feedback-area');
        const f2 = document.getElementById('f2'); // Hide the second block visually or conceptually merge
        
        // Animation simulation
        f2.style.opacity = '0.5';
        document.querySelector('.fraction-lab').classList.add('merged');
        
        // Change labels to show result
        setTimeout(() => {
            feedback.innerHTML = "분자끼리 더하기: 3 + 2 = 5<br>결과: <strong>5/6</strong>";
            feedback.style.background = '#e8f5e9'; // Light green
            
            // Visual update on bars (optional visual merge)
            const f1Bars = document.querySelectorAll('#f1 .bar');
            f1Bars.forEach(b => b.classList.remove('active-1'));
            // Highlight first 5
            for(let i=0; i<5; i++) {
                f1Bars[i].style.background = '#F5A623'; // Accent color
            }
            
            // Update label to result
            document.querySelector('#f1 .label').textContent = '5/6';
        }, 800);
    },

    // --- Quiz Logic ---
    resetQuiz() {
        const options = document.querySelectorAll('.option-btn');
        options.forEach(btn => {
            btn.disabled = false;
            btn.style.background = 'white';
            btn.style.borderColor = 'var(--primary-color)';
        });
        document.getElementById('quiz-feedback').innerHTML = '';
        document.getElementById('quiz-next').style.display = 'none';
    },

    checkAnswer(btn, isCorrect) {
        const options = document.querySelectorAll('.option-btn');
        options.forEach(b => b.disabled = true);
        
        const feedback = document.getElementById('quiz-feedback');
        
        if (isCorrect) {
            btn.style.background = 'var(--success-color)';
            btn.style.color = 'white';
            btn.style.borderColor = 'var(--success-color)';
            feedback.innerHTML = '<span class="correct">정답! 2/5 = 4/10, 4/10 + 1/10 = 5/10 = 1/2 이에요.</span>';
            document.getElementById('quiz-next').style.display = 'inline-block';
        } else {
            btn.style.background = 'var(--error-color)';
            btn.style.color = 'white';
            btn.style.borderColor = 'var(--error-color)';
            feedback.innerHTML = '<span class="incorrect">틀렸어요. 분모를 먼저 통분해보세요 (공통분모 10).</span>';
            
            // Allow retry after delay
            setTimeout(() => {
                options.forEach(b => {
                    if(b !== btn) b.disabled = false;
                });
                btn.style.opacity = '0.5';
            }, 1500);
        }
    },

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    bindEvents() {
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') this.nextScene();
            if (e.key === 'ArrowLeft') this.prevScene();
        });
    }
};

// Start app
document.addEventListener('DOMContentLoaded', () => ContentApp.init());