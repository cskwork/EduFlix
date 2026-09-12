const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    simState: { 
        num1: 1.5, 
        num2: 2.4,
        isAnimating: false 
    },

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
            if (sceneName === 'wrap') this.createStarConfetti(80);
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
        const text = "\"이번 탐험을 위해 특별한 우주 사과 1.5kg이 필요해.\nkg당 2,400원이라는데...\n소수점이 있는 계산, 자연수처럼 할 수 없을까?\"";
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
        this.simState.isAnimating = false;
        document.getElementById('fuel-fill').style.width = '0%';
        document.getElementById('calc-display').innerHTML = '시뮬레이션 대기 중...';
        const feedback = document.getElementById('feedback-area');
        feedback.classList.remove('active');
        document.getElementById('core-start-btn').disabled = false;
        document.getElementById('core-next-btn').classList.add('hidden');
    },

    runCoreSimulation() {
        if (this.simState.isAnimating) return;
        const first = Number(document.getElementById('factor-1').value);
        const second = Number(document.getElementById('factor-2').value);
        if (![first, second].every(n => Number.isFinite(n) && n >= 0.1 && n <= 9.9 && Math.abs(n * 10 - Math.round(n * 10)) < 1e-8)) {
            document.getElementById('calc-display').textContent = '0.1부터 9.9까지 소수 첫째 자리 수를 입력하세요.';
            return;
        }
        const left = Math.round(first * 10), right = Math.round(second * 10);
        const integerProduct = left * right;
        const product = integerProduct / 100;
        this.simState.isAnimating = true;
        
        const btn = document.getElementById('core-start-btn');
        btn.disabled = true;
        
        const display = document.getElementById('calc-display');
        const fuel = document.getElementById('fuel-fill');
        const feedback = document.getElementById('feedback-area');
        
        // Step 1
        display.innerHTML = `${first}와 ${second}를 각각 10배: ${left} × ${right}`;
        fuel.style.width = '30%';
        
        setTimeout(() => {
            // Step 2
            display.innerHTML = `자연수 계산: ${left} × ${right} = <span class="calc-highlight" style="color:#0ea5e9;">${integerProduct}</span>`;
            fuel.style.width = '60%';
            
            setTimeout(() => {
                // Step 3
                display.innerHTML = `각 수를 10배 했으므로 곱은 100배. 이제 100으로 나눕니다.`;
                fuel.style.width = '85%';
                
                setTimeout(() => {
                    // Final
                    display.innerHTML = `${integerProduct} ÷ 100 = <span class="calc-highlight">${product}</span>`;
                    fuel.style.width = '100%';
                    fuel.style.boxShadow = 'inset 0 2px 5px rgba(255,255,255,0.3), 0 0 20px #f43f5e';
                    
                    feedback.innerHTML = `${first} × ${second} = ${product}. 한 수만 바꾸고 결과를 비교하세요. 처음 식량 문제의 2,400원/kg은 2.4천 원/kg이므로 3.6천 원=3,600원입니다.`;
                    feedback.classList.add('active');
                    document.getElementById('core-next-btn').classList.remove('hidden');
                    
                    this.createStarConfetti(30);
                    this.simState.isAnimating = false;
                    btn.disabled = false;
                }, 1500);
            }, 1500);
        }, 1500);
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

        const isCorrect = answer === '0.96';

        buttons.forEach(btn => {
            if (btn.textContent === answer) {
                btn.classList.add(isCorrect ? 'correct' : 'wrong');
            }
            if (btn.textContent === '0.96' && !isCorrect) {
                setTimeout(() => btn.classList.add('correct'), 1000);
            }
        });

        feedbackEl.style.display = 'block';

        if (isCorrect) {
            feedbackEl.className = 'quiz-feedback success';
            feedbackEl.innerHTML = '🚀 완벽해요! 0.8 x 1.2 = 0.96 (총 2자리 이동) 🚀';
            this.createStarConfetti(50);
            const next = document.createElement('button');
            next.className = 'btn-primary'; next.textContent = '해설을 읽었어요 · 정리하기';
            next.onclick = () => this.nextScene(); feedbackEl.appendChild(next);
        } else {
            feedbackEl.className = 'quiz-feedback error';
            feedbackEl.innerHTML = '8×12=96이고 두 수를 각각 10배 했으므로 96÷100=0.96입니다. 1.2의 0.8배는 1.2보다 작아야 한다는 점으로도 확인하세요.';
            setTimeout(() => {
                this.initQuizScene(); 
            }, 3000);
        }
    },

    createStarConfetti(amount = 50) {
        let container = document.getElementById('confetti-container');
        if(!container) {
            container = document.createElement('div');
            container.id = 'confetti-container';
            document.body.appendChild(container);
        }
        
        const colors = ['#8b5cf6', '#a855f7', '#06b6d4', '#f43f5e', '#ffffff'];
        for(let i=0; i<amount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = (Math.random() * 100) + 'vw';
            confetti.style.bottom = '-20px'; // Because animation is floatUp
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            confetti.style.animationDelay = (Math.random() * 0.5) + 's';
            
            // Randomize size slightly
            const size = Math.random() * 6 + 4;
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';
            
            container.appendChild(confetti);
            setTimeout(() => confetti.remove(), 4500);
        }
    },

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.target instanceof window.HTMLElement && e.target.matches('input, textarea, select')) return;
            if (e.key === 'ArrowRight') this.nextScene();
            if (e.key === 'ArrowLeft') this.prevScene();
        });
    }
};

window.ContentApp = ContentApp;

document.addEventListener('DOMContentLoaded', () => {
    ContentApp.init();
});
