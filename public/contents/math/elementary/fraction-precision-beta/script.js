const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    
    // Game State
    gameInterval: null,
    gameValue: 0,
    gameDirection: 1,
    isGameRunning: false,

    init() {
        this.bindEvents();
        this.generateFineTicks();
        this.showScene(0);
    },

    bindEvents() {
        // Drag interaction for Stage 1
        const handle = document.getElementById('drag-handle-1');
        const track = document.getElementById('gauge-track-1');
        let isDragging = false;

        handle.addEventListener('mousedown', () => isDragging = true);
        handle.addEventListener('touchstart', () => isDragging = true);
        
        window.addEventListener('mouseup', () => isDragging = false);
        window.addEventListener('touchend', () => isDragging = false);

        const updateDrag = (e) => {
            if (!isDragging) return;
            const rect = track.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            let x = clientX - rect.left;
            let percent = (x / rect.width) * 100;
            
            if (percent < 0) percent = 0;
            if (percent > 100) percent = 100;

            this.updateStage1Gauge(percent);
        };

        track.addEventListener('mousemove', updateDrag);
        track.addEventListener('touchmove', updateDrag);
    },

    generateFineTicks() {
        const container = document.getElementById('fine-ticks');
        for(let i=0; i<=20; i++) {
            const tick = document.createElement('div');
            tick.className = 'fine-tick';
            tick.style.left = (i * 5) + '%';
            container.appendChild(tick);
        }
    },

    showScene(index) {
        document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
        const sceneId = `${this.scenes[index]}-scene`;
        document.getElementById(sceneId).classList.add('active');
        this.currentScene = index;

        if (this.scenes[index] === 'visualize') {
            this.initVisualize();
        }
        if (this.scenes[index] === 'core') {
            this.resetCoreScene();
        }
    },

    nextScene() {
        if (this.currentScene < this.scenes.length - 1) {
            this.showScene(this.currentScene + 1);
        }
    },

    resetContent() {
        this.showScene(0);
    },

    // --- Core Scene Logic ---

    resetCoreScene() {
        document.getElementById('core-stage-1').classList.remove('hidden');
        document.getElementById('core-stage-2').classList.add('hidden');
        document.getElementById('game-feedback').innerHTML = '';
        this.updateStage1Gauge(0);
        this.stopGameLoop();
        document.getElementById('start-btn').classList.remove('hidden');
        document.getElementById('stop-btn').classList.add('hidden');
    },

    updateStage1Gauge(percent) {
        document.getElementById('gauge-fill-1').style.width = percent + '%';
        document.getElementById('drag-handle-1').style.left = percent + '%';
        
        // Calculate approximate fraction (out of 5)
        let numerator = Math.round((percent / 100) * 5);
        if (numerator > 5) numerator = 5;
        document.getElementById('current-numerator').innerText = numerator;
    },

    startGameMode() {
        document.getElementById('core-stage-1').classList.add('hidden');
        document.getElementById('core-stage-2').classList.remove('hidden');
    },

    runGame() {
        if (this.isGameRunning) return;
        this.isGameRunning = true;
        document.getElementById('start-btn').classList.add('hidden');
        document.getElementById('stop-btn').classList.remove('hidden');
        document.getElementById('game-feedback').innerHTML = '';

        this.gameValue = 0;
        this.gameDirection = 1;

        const updateLoop = () => {
            if (!this.isGameRunning) return;

            this.gameValue += 1.5 * this.gameDirection;
            if (this.gameValue >= 100) {
                this.gameValue = 100;
                this.gameDirection = -1;
            } else if (this.gameValue <= 0) {
                this.gameValue = 0;
                this.gameDirection = 1;
            }

            document.getElementById('game-cursor').style.left = this.gameValue + '%';
            document.getElementById('game-value').innerText = Math.floor(this.gameValue);
            document.getElementById('gauge-fill-2').style.width = this.gameValue + '%';
            
            this.gameInterval = requestAnimationFrame(updateLoop);
        };
        this.gameInterval = requestAnimationFrame(updateLoop);
    },

    stopGame() {
        if (!this.isGameRunning) return;
        this.isGameRunning = false;
        cancelAnimationFrame(this.gameInterval);

        const finalValue = Math.floor(this.gameValue);
        const targetValue = 80; // 4/5 of 100
        const diff = Math.abs(finalValue - targetValue);

        const feedbackEl = document.getElementById('game-feedback');
        
        if (diff === 0) {
            feedbackEl.innerHTML = `<span class="success">🎉 완벽해요! 정확히 80/100 (4/5)를 맞췄습니다!</span>`;
            setTimeout(() => this.nextScene(), 2000);
        } else if (diff <= 5) {
            feedbackEl.innerHTML = `<span class="warning">⚠️ 아깝네요! ${diff} 차이나요. 4/5는 100개 중 80개입니다.</span>`;
            document.getElementById('stop-btn').classList.add('hidden');
            document.getElementById('start-btn').classList.remove('hidden');
            document.getElementById('start-btn').innerText = '다시 도전';
        } else {
            feedbackEl.innerHTML = `<span class="error">❌ 틀렸습니다. 힌트: 분모 5를 100으로 만드려면 20을 곱해야 해요.</span>`;
            document.getElementById('stop-btn').classList.add('hidden');
            document.getElementById('start-btn').classList.remove('hidden');
            document.getElementById('start-btn').innerText = '다시 도전';
        }
    },

    stopGameLoop() {
        this.isGameRunning = false;
        cancelAnimationFrame(this.gameInterval);
    },

    // --- Visualize Scene Logic ---

    initVisualize() {
        const container = document.getElementById('block-100');
        container.innerHTML = '';
        // Create 100 blocks
        for(let i=0; i<100; i++) {
            const div = document.createElement('div');
            // First 80 are filled (4/5 = 80/100)
            if (i < 80) {
                div.className = 'mini-block filled';
            } else {
                div.className = 'mini-block';
            }
            container.appendChild(div);
        }
    },

    // --- Quiz Scene Logic ---

    checkQuiz() {
        const input = document.getElementById('quiz-input');
        const val = input.value.trim() === "" ? NaN : Number(input.value);
        const feedback = document.getElementById('quiz-feedback');
        const liquid = document.getElementById('quiz-liquid');
        const retryBtn = document.querySelector('.retry-btn');

        // Target: 3/4 of 40ml = 30ml
        const target = 30;

        // Visual feedback first
        let heightPct = (val / 40) * 100;
        if (heightPct > 100) heightPct = 100;
        liquid.style.height = heightPct + '%';

        if (!Number.isFinite(val) || val < 0 || val > 40) {
            feedback.innerHTML = '<span class="error">숫자를 입력해주세요.</span>';
            return;
        }

        if (val === target) {
            feedback.innerHTML = '<span class="success">정답! 40ml의 3/4는 30ml가 맞습니다.</span>';
            liquid.style.backgroundColor = '#7ED321';
            retryBtn.classList.add('hidden');
            setTimeout(() => this.nextScene(), 2000);
        } else {
            feedback.innerHTML = `<span class="error">틀렸습니다. 40ml의 3/4를 계산해보세요. (힌트: 40 ÷ 4 × 3)</span>`;
            liquid.style.backgroundColor = '#D0021B';
            retryBtn.classList.remove('hidden');
        }
    },

    resetQuiz() {
        document.getElementById('quiz-input').value = '';
        document.getElementById('quiz-liquid').style.height = '0%';
        document.getElementById('quiz-feedback').innerHTML = '';
        document.querySelector('.retry-btn').classList.add('hidden');
    }
};

document.addEventListener('DOMContentLoaded', () => ContentApp.init());
