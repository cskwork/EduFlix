const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],

    init() {
        this.renderNavDots();
        this.bindEvents();
        setTimeout(() => this.changeScene(0), 100);
    },

    changeScene(index) {
        document.querySelectorAll('.scene').forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });

        this.currentScene = index;
        this.updateNavDots();

        const sceneName = this.scenes[index];
        const sceneEl = document.getElementById(`${sceneName}-scene`);

        if (sceneEl) {
            sceneEl.style.display = 'flex';
            setTimeout(() => sceneEl.classList.add('active'), 50);

            if (sceneName === 'story') this.initStoryScene();
            if (sceneName === 'core') this.initCoreScene();
            if (sceneName === 'quiz') this.initQuizScene();
            if (sceneName === 'wrap') this.createConfetti(60);
        }
    },

    nextScene() {
        if (this.currentScene < this.scenes.length - 1) {
            this.changeScene(this.currentScene + 1);
        }
    },

    prevScene() {
        if (this.currentScene > 0) {
            this.changeScene(this.currentScene - 1);
        }
    },

    renderNavDots() {
        const nav = document.getElementById('nav-dots');
        if (!nav) return;
        nav.innerHTML = '';
        this.scenes.forEach((_, idx) => {
            const dot = document.createElement('div');
            dot.className = 'dot';
            dot.onclick = () => this.changeScene(idx);
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

    initStoryScene() {
        const text = "\"안녕! 나는 이 분수 공장의 공장장 뚜룹이다 삐리릭!\\n최상급 우주선 부품을 만들려면 컨베이어 벨트에 에너지를 주입해야 해.\\n에너지는 (1/2)과 (1/3)을 더해야 만들어진다 삐리릭!\"";
        const el = document.getElementById('typewriter-text');
        if (!el) return;

        el.innerHTML = '';
        let i = 0;

        const type = () => {
            if (i < text.length) {
                if (text.charAt(i) === '\n') el.innerHTML += '<br><br>';
                else el.innerHTML += text.charAt(i);
                i++;
                setTimeout(type, 35);
            }
        };
        type();
    },

    initCoreScene() {
        const pipe = document.querySelector('.pipe-middle');
        const feedback = document.getElementById('machine-feedback');
        const nextBtn = document.getElementById('core-next-btn');
        const outPipe = document.getElementById('pipe-out');
        const machineBtn = document.getElementById('machine-btn');
        
        pipe.classList.remove('flow');
        feedback.className = 'machine-feedback';
        feedback.innerHTML = '대기 중...';
        outPipe.innerHTML = '?';
        outPipe.style.background = '#334155';
        outPipe.style.boxShadow = 'inset 0 0 10px rgba(0,0,0,0.5)';
        nextBtn.classList.add('hidden');
        machineBtn.disabled = false;
    },

    runMachine() {
        const pipe = document.querySelector('.pipe-middle');
        const feedback = document.getElementById('machine-feedback');
        const nextBtn = document.getElementById('core-next-btn');
        const outPipe = document.getElementById('pipe-out');
        const machineBtn = document.getElementById('machine-btn');

        if(machineBtn.disabled) return;
        machineBtn.disabled = true;

        feedback.innerHTML = '에너지 주입 중... (통분 진행)';
        
        setTimeout(() => {
            pipe.classList.add('flow');
            
            setTimeout(() => {
                feedback.innerHTML = '결합 완료! 5/6 에너지 생성!';
                feedback.classList.add('active');
                
                outPipe.innerHTML = '5/6';
                outPipe.style.background = 'var(--primary)';
                outPipe.style.color = '#fff';
                outPipe.style.boxShadow = 'var(--glow-green)';
                
                this.createConfetti(20);
                nextBtn.classList.remove('hidden');
            }, 2000);
            
        }, 500);
    },

    initQuizScene() {
        const options = document.querySelectorAll('.opt-btn');
        options.forEach(btn => {
            btn.classList.remove('correct', 'wrong');
            btn.disabled = false;
        });
        const feedback = document.getElementById('quiz-feedback');
        feedback.style.display = 'none';
        feedback.className = 'quiz-feedback';
    },

    checkAnswer(answer) {
        const feedbackEl = document.getElementById('quiz-feedback');
        const buttons = document.querySelectorAll('.opt-btn');

        buttons.forEach(btn => btn.disabled = true);

        // 2/3 * 3/4 = 6/12
        const isCorrect = answer === '6/12';

        buttons.forEach(btn => {
            if (btn.textContent.includes(answer)) {
                btn.classList.add(isCorrect ? 'correct' : 'wrong');
            }
            if (btn.textContent.includes('6/12') && !isCorrect) {
                setTimeout(() => btn.classList.add('correct'), 1000);
            }
        });

        feedbackEl.style.display = 'block';

        if (isCorrect) {
            feedbackEl.className = 'quiz-feedback correct';
            feedbackEl.style.color = '#86efac';
            feedbackEl.style.textShadow = 'var(--glow-green)';
            feedbackEl.innerHTML = '⚙️ 정답입니다! 위아래로 척척! 6/12 (1/2) ⚙️';
            this.createConfetti(40);
            setTimeout(() => this.nextScene(), 2500);
        } else {
            feedbackEl.className = 'quiz-feedback wrong';
            feedbackEl.style.color = '#fca5a5';
            feedbackEl.style.textShadow = 'var(--glow-red)';
            feedbackEl.innerHTML = '💥 삐빅! 분수 곱셈은 분자는 분자끼리, 분모는 분모끼리 곱해야 합니다!';
            setTimeout(() => {
                this.initQuizScene(); 
            }, 3000);
        }
    },

    createConfetti(amount = 40) {
        let container = document.getElementById('confetti-container');
        if(!container) {
            container = document.createElement('div');
            container.id = 'confetti-container';
            document.body.appendChild(container);
        }
        
        const gears = ['⚙️', '🔩', '🔧', '✨'];
        for(let i=0; i<amount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-gear';
            confetti.style.left = (Math.random() * 100) + 'vw';
            confetti.innerHTML = gears[Math.floor(Math.random() * gears.length)];
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            confetti.style.animationDelay = (Math.random() * 0.5) + 's';
            
            container.appendChild(confetti);
            setTimeout(() => confetti.remove(), 4500);
        }
    },

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') this.nextScene();
            if (e.key === 'ArrowLeft') this.prevScene();
        });
    }
};

window.ContentApp = ContentApp;

document.addEventListener('DOMContentLoaded', () => {
    ContentApp.init();
});
