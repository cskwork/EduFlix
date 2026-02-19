const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    
    // Game State
    gameState: {
        targetNum: 3,
        targetDen: 4,
        currentNum: 1,
        currentDen: 4,
        deltaNum: 0,
        deltaDen: 4
    },

    init() {
        this.renderHookVisual();
        this.bindEvents();
    },

    // Scene Navigation
    showScene(index) {
        document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
        const sceneId = `${this.scenes[index]}-scene`;
        const sceneEl = document.getElementById(sceneId);
        if (sceneEl) {
            sceneEl.classList.add('active');
            this.currentScene = index;
            
            // Initialize specific scene logic
            if (this.scenes[index] === 'core') this.initCoreScene();
            if (this.scenes[index] === 'quiz') this.initQuizScene();
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

    // --- Visual Rendering Helpers ---
    renderHookVisual() {
        const svg = document.getElementById('hook-visual');
        svg.innerHTML = `
            <circle cx="200" cy="150" r="100" stroke="#ddd" stroke-width="20" fill="none"/>
            <path d="M 200 50 A 100 100 0 0 1 300 150" stroke="#4A90D9" stroke-width="20" fill="none" stroke-dasharray="628" stroke-dashoffset="157">
                <animate attributeName="stroke-dashoffset" values="628;157" dur="2s" fill="freeze" />
            </path>
            <text x="200" y="160" font-size="40" text-anchor="middle" fill="#333" font-weight="bold">?</text>
            <text x="200" y="280" font-size="20" text-anchor="middle" fill="#666">얼마나 더 채워야 할까요?</text>
        `;
    },

    // --- Core Scene Logic ---
    initCoreScene() {
        // Randomize values slightly for replayability (keep denominator same for this level)
        const den = 4;
        const target = 3; // 3/4
        const current = 1; // 1/4
        
        this.gameState = {
            targetNum: target,
            targetDen: den,
            currentNum: current,
            currentDen: den,
            deltaNum: 0,
            deltaDen: den
        };

        // UI Update
        document.getElementById('target-val').textContent = `${target}/${den}`;
        document.getElementById('target-bar').style.width = `${(target/den)*100}%`;
        
        document.getElementById('current-val').textContent = `${current}/${den}`;
        document.getElementById('current-bar').style.width = `${(current/den)*100}%`;

        // Reset Slider & Delta
        const slider = document.getElementById('delta-slider');
        slider.value = 0;
        slider.max = den; // Steps equal to denominator
        this.updateDeltaVisual(0);
        
        document.getElementById('core-feedback').textContent = '';
        document.getElementById('core-feedback').className = 'feedback-area';
        document.getElementById('core-submit').style.display = 'inline-block';
    },

    updateDeltaVisual(val) {
        const percent = (val / this.gameState.deltaDen) * 100;
        document.getElementById('delta-bar').style.width = `${percent}%`;
        document.getElementById('delta-val').textContent = val === 0 ? '?' : `${val}/${this.gameState.deltaDen}`;
        this.gameState.deltaNum = parseInt(val);
    },

    checkCore() {
        const target = this.gameState.targetNum;
        const current = this.gameState.currentNum;
        const correctDelta = target - current;
        const userDelta = this.gameState.deltaNum;

        const feedbackEl = document.getElementById('core-feedback');

        if (userDelta === correctDelta) {
            feedbackEl.textContent = "정확해요! 목표치에 도달했습니다! (Aha Moment!)";
            feedbackEl.classList.add('success');
            document.getElementById('core-submit').style.display = 'none';
            setTimeout(() => this.nextScene(), 1500);
        } else if (userDelta < correctDelta) {
            feedbackEl.textContent = "조금 더 부족해요! 에너지가 모자랍니다.";
            feedbackEl.classList.add('warning');
        } else {
            feedbackEl.textContent = "너무 많아요! 폭발합니다!";
            feedbackEl.classList.add('error');
        }
    },

    bindEvents() {
        const slider = document.getElementById('delta-slider');
        if (slider) {
            slider.addEventListener('input', (e) => {
                this.updateDeltaVisual(e.target.value);
            });
        }
    },

    // --- Quiz Scene Logic ---
    initQuizScene() {
        document.getElementById('quiz-feedback').textContent = '';
        document.querySelectorAll('.btn-option').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('correct', 'wrong');
        });
    },

    checkQuiz(selectedIndex, valueStr) {
        // Target: 1 (3/3) - Current: 2/3 = 1/3
        const correctStr = '1/3';
        const feedbackEl = document.getElementById('quiz-feedback');

        if (valueStr === correctStr) {
            feedbackEl.textContent = "정답! 3/3 - 2/3 = 1/3입니다.";
            feedbackEl.style.color = 'var(--success-color)';
            document.querySelectorAll('.btn-option')[1].classList.add('correct');
            setTimeout(() => this.nextScene(), 2000);
        } else {
            feedbackEl.textContent = "틀렸어요. 다시 생각해보세요! (전체에서 현재를 빼보세요)";
            feedbackEl.style.color = 'var(--error-color)';
            document.querySelectorAll('.btn-option').forEach((btn, idx) => {
                if (idx === selectedIndex - 1) btn.classList.add('wrong');
            });
        }
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => ContentApp.init());
