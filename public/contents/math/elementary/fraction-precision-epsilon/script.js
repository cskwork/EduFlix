const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    epsilon: 0.1,
    target: 0.5,

    // Data
    contentData: {
        title: '오차 범위(Epsilon)의 마법',
        gradeLevel: '초등 5학년',
        subject: 'Math'
    },

    // Initialize
    init() {
        this.bindEvents();
        this.showScene(0);
    },

    // Scene switching
    showScene(index) {
        document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
        const sceneId = `${this.scenes[index]}-scene`;
        document.getElementById(sceneId).classList.add('active');
        this.currentScene = index;
        
        // Scene specific initialization
        const methodName = `init${this.capitalizeFirst(this.scenes[index])}Scene`;
        if (this[methodName]) {
            this[methodName]();
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

    // Scene Initializers
    initCoreScene() {
        this.drawRuler();
        const slider = document.getElementById('epsilon-slider');
        const display = document.getElementById('epsilon-display');
        
        // Reset slider event listener to avoid duplicates
        const newSlider = slider.cloneNode(true);
        slider.parentNode.replaceChild(newSlider, slider);
        
        newSlider.addEventListener('input', (e) => {
            this.epsilon = parseFloat(e.target.value);
            display.textContent = this.epsilon.toFixed(2);
            this.drawRuler();
        });

        document.getElementById('throw-btn').onclick = () => this.playGame();
    },

    initQuizScene() {
        document.getElementById('quiz-feedback').textContent = '';
        document.getElementById('quiz-feedback').className = 'feedback';
    },

    // Game Logic
    drawRuler() {
        const ruler = document.getElementById('ruler');
        ruler.innerHTML = ''; // Clear existing

        const width = ruler.clientWidth;
        const height = 60;
        const margin = 20;
        const drawWidth = width - (margin * 2);

        // Base Line
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", margin);
        line.setAttribute("y1", height / 2);
        line.setAttribute("x2", width - margin);
        line.setAttribute("y2", height / 2);
        line.setAttribute("stroke", "#333");
        line.setAttribute("stroke-width", "2");
        ruler.appendChild(line);

        // Target (0.5)
        const targetX = margin + (drawWidth * this.target);
        const targetCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        targetCircle.setAttribute("cx", targetX);
        targetCircle.setAttribute("cy", height / 2);
        targetCircle.setAttribute("r", "5");
        targetCircle.setAttribute("fill", "#D0021B");
        ruler.appendChild(targetCircle);

        // Epsilon Range (Safe Zone)
        const startX = margin + (drawWidth * (this.target - this.epsilon));
        const endX = margin + (drawWidth * (this.target + this.epsilon));
        
        // Clamp visuals
        const safeZone = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        safeZone.setAttribute("x", Math.max(margin, startX));
        safeZone.setAttribute("y", height/2 - 20);
        safeZone.setAttribute("width", Math.min(drawWidth, endX) - Math.max(margin, startX));
        safeZone.setAttribute("height", "40");
        safeZone.setAttribute("fill", "#7ED321");
        safeZone.setAttribute("fill-opacity", "0.3");
        safeZone.setAttribute("rx", "5");
        ruler.appendChild(safeZone);

        // Labels
        const targetText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        targetText.setAttribute("x", targetX);
        targetText.setAttribute("y", height - 5);
        targetText.setAttribute("text-anchor", "middle");
        targetText.setAttribute("font-size", "12");
        targetText.textContent = "1/2";
        ruler.appendChild(targetText);
    },

    playGame() {
        // Generate random hit between 0 and 1
        const hit = Math.round(Math.random() * 1000) / 1000;
        const difference = Math.abs(Math.round(this.target * 1000) - Math.round(hit * 1000)) / 1000;
        const isSuccess = difference <= this.epsilon;

        // Visual feedback
        const ruler = document.getElementById('ruler');
        const width = ruler.clientWidth;
        const height = 60;
        const margin = 20;
        const drawWidth = width - (margin * 2);
        const hitX = margin + (drawWidth * hit);

        const hitMarker = document.createElementNS("http://www.w3.org/2000/svg", "path");
        hitMarker.setAttribute("d", `M${hitX},${height/2 - 15} L${hitX-5},${height/2 - 25} L${hitX+5},${height/2 - 25} Z`);
        hitMarker.setAttribute("fill", isSuccess ? "#4A90D9" : "#F5A623");
        ruler.appendChild(hitMarker);

        const resultPanel = document.getElementById('result-panel');
        resultPanel.innerHTML = `
            <div class="result-value ${isSuccess ? 'success' : 'fail'}">
                ${isSuccess ? '🎉 성공!' : '❌ 실패!'}
            </div>
            <div class="result-details">
                던진 값: ${hit.toFixed(3)}<br>
                차이: |0.5 - ${hit.toFixed(3)}| = ${difference.toFixed(3)}<br>
                허용 오차: ${this.epsilon} <br>
                ${difference <= this.epsilon ? '차이가 허용 오차보다 작거나 같네요!' : '차이가 허용 오차보다 커요!'}
            </div>
        `;
    },

    checkAnswer(userSaidYes) {
        const target = 0.5;
        const hit = 0.53;
        const epsilon = 0.05;
        const diff = Math.abs(target - hit);
        const isHit = diff <= epsilon;

        const feedback = document.getElementById('quiz-feedback');
        
        if ((userSaidYes && isHit) || (!userSaidYes && !isHit)) {
            feedback.innerHTML = `<span class="success-text">정답입니다!</span><br>설명: |0.5 - 0.53| = 0.03이며, 0.03은 0.05보다 작으므로 적중입니다.`;
            feedback.style.color = "#7ED321";
        } else {
            feedback.innerHTML = `<span class="error-text">틀렸습니다.</span><br>설명: |0.5 - 0.53| = 0.03입니다. 0.03 ≤ 0.05이므로 조건을 만족합니다.`;
            feedback.style.color = "#D0021B";
        }
    },

    freeExplore() {
        this.showScene(3); // Go to Core scene
    },

    // Utilities
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    bindEvents() {
        // Common events if any
    }
};

// Start app
document.addEventListener('DOMContentLoaded', () => ContentApp.init());
