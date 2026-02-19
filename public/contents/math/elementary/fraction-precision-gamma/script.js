const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    
    // Core Game State
    gameState: {
        targetNum: 1,
        targetDenom: 2,
        userNum: 1,
        userDenom: 2,
        quizTargetNum: 1,
        quizTargetDenom: 4,
        quizUserNum: 1,
        quizUserDenom: 4
    },

    // Initialization
    init() {
        this.bindEvents();
        this.showScene(0);
        this.initAnchorVisuals();
        this.generateNewCoreTarget();
    },

    // Scene Management
    showScene(index) {
        document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
        const sceneId = `${this.scenes[index]}-scene`;
        document.getElementById(sceneId).classList.add('active');
        this.currentScene = index;

        // Scene specific inits
        if (this.scenes[index] === 'core') {
            this.resetCoreState();
        } else if (this.scenes[index] === 'visualize') {
            this.renderVisualizeScene();
        } else if (this.scenes[index] === 'quiz') {
            this.initQuiz();
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

    // --- Scene 2: Anchor Visuals ---
    initAnchorVisuals() {
        const container = document.getElementById('anchor-pizza');
        // Simple CSS pizza representation
        let html = '<div class="pizza">';
        // 4 slices
        for(let i=0; i<4; i++) {
            html += `<div class="slice" style="transform: rotate(${i*90}deg) skewY(-45deg)"></div>`;
        }
        html += '</div>';
        container.innerHTML = html;
    },

    // --- Scene 4: Core Interaction ---
    generateNewCoreTarget() {
        // Generate random fractions between 1/2 and 7/8
        const denominators = [2, 3, 4, 5, 6, 8];
        const den = denominators[Math.floor(Math.random() * denominators.length)];
        const num = Math.floor(Math.random() * (den - 1)) + 1;
        
        this.gameState.targetNum = num;
        this.gameState.targetDenom = den;
        
        // Update UI
        document.getElementById('target-num').textContent = num;
        document.getElementById('target-denom').textContent = den;
        document.getElementById('target-bar').style.width = `${(num/den)*100}%`;
    },

    resetCoreState() {
        // Reset user input to 1/1
        this.gameState.userNum = 1;
        this.gameState.userDenom = 1;
        this.updateCoreUI();
        
        // Generate a new target for replayability if needed, or keep same
        // For this experience, let's keep the target generated in init or generate new
        this.generateNewCoreTarget();
        
        const feedback = document.getElementById('core-feedback');
        feedback.className = 'feedback-area';
        feedback.innerHTML = '';
        document.getElementById('check-core-btn').style.display = 'block';
    },

    adjustNum(delta) {
        let newVal = this.gameState.userNum + delta;
        if (newVal < 1) newVal = 1;
        if (newVal > this.gameState.userDenom) newVal = this.gameState.userDenom; // Cannot exceed denominator
        this.gameState.userNum = newVal;
        this.updateCoreUI();
    },

    adjustDenom(delta) {
        let newVal = this.gameState.userDenom + delta;
        if (newVal < 1) newVal = 1;
        if (newVal > 12) newVal = 12; // Limit max size
        
        this.gameState.userDenom = newVal;
        // Adjust numerator if it exceeds new denominator
        if (this.gameState.userNum > newVal) {
            this.gameState.userNum = newVal;
        }
        this.updateCoreUI();
    },

    updateCoreUI() {
        const { userNum, userDenom } = this.gameState;
        document.getElementById('current-num').textContent = userNum;
        document.getElementById('current-denom').textContent = userDenom;
        
        const percentage = (userNum / userDenom) * 100;
        document.getElementById('user-bar').style.width = `${percentage}%`;
    },

    checkCoreAnswer() {
        const { userNum, userDenom, targetNum, targetDenom } = this.gameState;
        
        // Check equivalence: a/b == c/d => a*d == b*c
        const isEquivalent = (userNum * targetDenom) === (userDenom * targetNum);
        
        const feedback = document.getElementById('core-feedback');
        
        if (isEquivalent) {
            feedback.innerHTML = '<div class="success-msg"><strong>성공!</strong> 에너지 레벨이 일치합니다.</div>';
            feedback.classList.add('success');
            document.getElementById('check-core-btn').style.display = 'none';
            
            // Trigger success animation on bar
            document.getElementById('user-bar').style.backgroundColor = '#4ade80';
            
            setTimeout(() => {
                this.nextScene();
            }, 1500);
        } else {
            feedback.innerHTML = '<div class="error-msg"><strong>실패!</strong> 에너지 불일치. 다시 조정해보세요.</div>';
            feedback.classList.add('error');
            document.getElementById('user-bar').style.backgroundColor = '#f87171';
        }
    },

    // --- Scene 5: Visualize ---
    renderVisualizeScene() {
        const createBlocks = (num, denom, id) => {
            const container = document.getElementById(id);
            container.innerHTML = '';
            const blockSize = 100 / denom;
            
            for (let i = 0; i < denom; i++) {
                const block = document.createElement('div');
                block.className = 'block';
                block.style.width = `calc(${blockSize}% - 2px)`;
                block.style.height = '40px';
                block.style.display = 'inline-block';
                block.style.marginRight = '2px';
                block.style.backgroundColor = (i < num) ? '#4A90D9' : '#e2e8f0';
                block.style.borderRadius = '4px';
                container.appendChild(block);
            }
        };

        createBlocks(1, 2, 'vis-blocks-1');
        createBlocks(2, 4, 'vis-blocks-2');
    },

    // --- Scene 6: Quiz ---
    initQuiz() {
        // Generate a quiz target (e.g., 1/4)
        const targets = [
            {n:1, d:4}, {n:1, d:3}, {n:2, d:3}, {n:3, d:4}
        ];
        const t = targets[Math.floor(Math.random() * targets.length)];
        this.gameState.quizTargetNum = t.n;
        this.gameState.quizTargetDenom = t.d;
        
        document.getElementById('quiz-target-text').textContent = `${t.n}/${t.d}`;
        document.getElementById('quiz-feedback-msg').textContent = '';
        
        // Reset slider
        this.updateQuizSlider(4);
    },

    updateQuizSlider(val) {
        const denom = parseInt(val);
        this.gameState.quizUserDenom = denom;
        document.getElementById('quiz-slider-val').textContent = denom;
        
        // Reset blocks
        this.gameState.quizUserNum = 0;
        this.renderQuizBlocks();
    },

    renderQuizBlocks() {
        const container = document.getElementById('quiz-blocks-area');
        container.innerHTML = '';
        const { quizUserNum, quizUserDenom } = this.gameState;
        
        for(let i=0; i<quizUserDenom; i++) {
            const block = document.createElement('div');
            block.className = `quiz-block ${i < quizUserNum ? 'active' : ''}`;
            block.onclick = () => this.toggleQuizBlock(i);
            container.appendChild(block);
        }
    },

    toggleQuizBlock(index) {
        // Logic: if clicking the last active one, deactivate it (reduce num)
        // if clicking an inactive one, activate it and everything before (set num to index+1)
        const { quizUserDenom } = this.gameState;
        
        if (index === this.gameState.quizUserNum - 1) {
            this.gameState.quizUserNum--;
        } else if (index >= this.gameState.quizUserNum) {
            this.gameState.quizUserNum = index + 1;
        }
        
        this.renderQuizBlocks();
    },

    checkQuizAnswer() {
        const { quizUserNum, quizUserDenom, quizTargetNum, quizTargetDenom } = this.gameState;
        
        if (quizUserNum === 0) {
            document.getElementById('quiz-feedback-msg').innerHTML = '<span class="error">최소 1개 이상 선택해야 합니다.</span>';
            return;
        }

        const isEquivalent = (quizUserNum * quizTargetDenom) === (quizUserDenom * quizTargetNum);
        const msgEl = document.getElementById('quiz-feedback-msg');
        
        if (isEquivalent) {
            msgEl.innerHTML = '<span class="success">정답입니다! 등분수를 찾아내셨네요.</span>';
            setTimeout(() => this.nextScene(), 2000);
        } else {
            msgEl.innerHTML = '<span class="error">틀렸습니다. 다시 생각해보세요.</span>';
        }
    },

    resetQuiz() {
        this.gameState.quizUserNum = 0;
        this.renderQuizBlocks();
        document.getElementById('quiz-feedback-msg').textContent = '';
    },

    // --- Wrap Scene ---
    resetExploration() {
        this.showScene(0);
    },

    freeExplore() {
        alert("자유 탐색 모드: 코어 씬으로 이동하여 자유롭게 분수를 실험해보세요.");
        this.showScene(3);
        document.getElementById('core-feedback').innerHTML = '<div class="info-msg">자유 모드입니다. 다양한 분수를 만들어보세요.</div>';
        document.getElementById('check-core-btn').style.display = 'none';
    },

    bindEvents() {
        // General event handling if needed
    }
};

// Start App
document.addEventListener('DOMContentLoaded', () => ContentApp.init());
