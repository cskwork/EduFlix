const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    
    // Game State
    targetValue: 0.5,
    tolerance: 0.05, // 허용 오차 범위

    init() {
        this.bindEvents();
        this.showScene(0);
        this.initCoreScene();
    },

    showScene(index) {
        // Hide all scenes
        document.querySelectorAll('.scene').forEach(s => {
            s.classList.remove('active');
        });

        // Show target scene
        const sceneId = `${this.scenes[index]}-scene`;
        document.getElementById(sceneId).classList.add('active');
        this.currentScene = index;

        // Initialize specific scene logic if needed
        if (this.scenes[index] === 'core') {
            this.resetCoreGame();
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

    bindEvents() {
        // Core Scene Inputs
        const denomInput = document.getElementById('denominator');
        const numerInput = document.getElementById('numerator');

        denomInput.addEventListener('input', () => this.updateCoreGame());
        numerInput.addEventListener('input', () => this.updateCoreGame());
    },

    // --- Core Scene Logic ---
    initCoreScene() {
        // Initial setup call handled in input listeners
    },

    resetCoreGame() {
        // Randomize target between 0.1 and 0.9
        // Using simple fractions for educational clarity: 1/2, 1/3, 1/4, 2/3, 3/4
        const targets = [0.5, 0.333, 0.25, 0.666, 0.75];
        this.targetValue = targets[Math.floor(Math.random() * targets.length)];
        
        // Update UI
        document.getElementById('target-decimal').innerText = this.targetValue.toFixed(2);
        document.getElementById('target-marker').style.bottom = `${this.targetValue * 100}%`;
        
        // Reset inputs
        document.getElementById('denominator').value = 2;
        document.getElementById('numerator').value = 1;
        
        document.getElementById('core-feedback').innerHTML = '<p>분모와 분자를 조절해서 정확히 맞춰보세요!</p>';
        document.getElementById('core-feedback').className = 'feedback-area';
        document.getElementById('check-btn').disabled = false;
        document.getElementById('check-btn').innerText = "발사!";

        this.updateCoreGame();
    },

    updateCoreGame() {
        const denom = parseInt(document.getElementById('denominator').value);
        let numer = parseInt(document.getElementById('numerator').value);

        // Logic constraint: Numerator shouldn't exceed Denominator for simplicity in this level (visuals)
        // But we allow improper fractions if selected, just clamp max of input
        const numerInput = document.getElementById('numerator');
        if (numer > denom * 2) {
            numer = denom * 2; 
            numerInput.value = numer;
        }

        // Update Text
        document.getElementById('denom-val').innerText = denom;
        document.getElementById('numer-val').innerText = numer;
        document.getElementById('current-fraction').innerText = `${numer}/${denom}`;

        // Calculate Value
        const value = numer / denom;
        
        // Update Visual Water
        const waterFill = document.getElementById('water-fill');
        waterFill.style.height = `${value * 100}%`;

        // Update Denominator Visual (Grid)
        const visualContainer = document.getElementById('denom-visual');
        visualContainer.style.gridTemplateColumns = `repeat(${denom}, 1fr)`;
        visualContainer.innerHTML = '';
        for(let i=0; i<denom; i++) {
            const cell = document.createElement('div');
            cell.className = 'denom-cell';
            if(i < numer) cell.classList.add('active');
            visualContainer.appendChild(cell);
        }
    },

    checkCoreAnswer() {
        const denom = parseInt(document.getElementById('denominator').value);
        const numer = parseInt(document.getElementById('numerator').value);
        const currentValue = numer / denom;

        const diff = Math.abs(currentValue - this.targetValue);

        const feedbackEl = document.getElementById('core-feedback');

        if (diff < 0.01) { // Perfect match (or very close due to float math)
            feedbackEl.innerHTML = '<p class="success-text">🎯 완벽해! 정확히 명중했습니다!</p>';
            feedbackEl.classList.add('success');
            document.getElementById('check-btn').disabled = true;
            document.getElementById('check-btn').innerText = "성공!";
            
            // Confetti effect simulation via CSS class or timeout
            setTimeout(() => this.nextScene(), 1500);
        } else if (diff < this.tolerance) {
            feedbackEl.innerHTML = '<p class="warning-text">👏 아주 가깝네요! 더 정밀하게 조절해 볼까요?</p>';
            feedbackEl.classList.add('warning');
        } else {
            feedbackEl.innerHTML = '<p class="error-text">❗ 빗나갔어요. 분모(자르는 수)를 바꿔보세요.</p>';
            feedbackEl.classList.add('error');
        }
    },

    // --- Quiz Scene Logic ---
    checkQuiz(isCorrect, message) {
        const feedbackEl = document.getElementById('quiz-feedback');
        const nextBtn = document.getElementById('next-quiz-btn');

        if (isCorrect) {
            feedbackEl.innerHTML = `<span class="success-text">${message}</span>`;
            feedbackEl.classList.add('success');
            nextBtn.style.display = 'inline-block';
            // Disable buttons
            document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
        } else {
            feedbackEl.innerHTML = `<span class="error-text">${message}</span>`;
            feedbackEl.classList.add('error');
        }
    }
};

// Start App
document.addEventListener('DOMContentLoaded', () => {
    ContentApp.init();
});
