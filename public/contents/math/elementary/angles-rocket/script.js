const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    targetAngle: 60,

    // Initialize
    init() {
        this.bindEvents();
        // Hook scene is active by default via HTML
        this.initHookScene();
    },

    bindEvents() {
        // Slider in Core Scene
        const slider = document.getElementById('angle-slider');
        if(slider) {
            slider.addEventListener('input', (e) => this.handleCoreSlider(e));
        }

        // Slider in Quiz Scene
        const quizSlider = document.getElementById('quiz-slider');
        if(quizSlider) {
            quizSlider.addEventListener('input', (e) => this.handleQuizSlider(e));
        }
    },

    // Scene Navigation
    showScene(index) {
        // Validation: Don't allow skipping Core Scene interaction
        if (index === 4 && this.currentScene === 3) { // trying to go from core to visualize
            // Optional: enforce interaction in core scene before enabling next
        }

        document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
        const sceneId = `${this.scenes[index]}-scene`;
        const sceneEl = document.getElementById(sceneId);
        if(sceneEl) sceneEl.classList.add('active');
        
        this.currentScene = index;
        
        // Initialize specific scene logic
        const initMethodName = `init${this.capitalizeFirst(this.scenes[index])}Scene`;
        if (this[initMethodName]) {
            this[initMethodName]();
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

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // --- Scene Specific Logic ---

    initHookScene() {
        console.log('Hook Scene Initialized');
        // Start any animations if needed
    },

    initAnchorScene() {
        console.log('Anchor Scene Initialized');
    },

    initStoryScene() {
        console.log('Story Scene Initialized');
    },

    initCoreScene() {
        console.log('Core Scene Initialized');
        // Reset slider
        const slider = document.getElementById('angle-slider');
        if(slider) {
            slider.value = 0;
            this.handleCoreSlider({target: slider});
        }
        document.getElementById('core-next-btn').disabled = true;
    },

    handleCoreSlider(e) {
        const val = parseInt(e.target.value);
        const rocket = document.getElementById('rocket-group');
        const display = document.getElementById('angle-value');
        const arc = document.getElementById('angle-arc');
        const nextBtn = document.getElementById('core-next-btn');

        // Rotate Rocket (Visual: rotate counter-clockwise relative to base)
        // Base is pointing UP (0 deg in our SVG visual logic? No, let's make base point UP)
        // In SVG rocket: Pointing UP. Slider 0 = Pointing UP. Slider 90 = Pointing LEFT (or RIGHT?)
        // Let's align with standard protractor. Base is Right (0). Rocket points UP (90).
        // Let's make it intuitive: 0 deg = Straight Up. 90 deg = Horizontal Right.
        // Rocket SVG points up. 
        // Transform: rotate(val deg).
        // However, standard protractor starts from right (0). 
        // Let's stick to the visual: 
        // Rocket sits on the center. 
        // Slider 0 -> Rocket points UP. 
        // Slider 90 -> Rocket points RIGHT. 
        
        if(rocket) rocket.style.transform = `rotate(${val}deg)`;
        if(display) display.innerText = val;

        // Draw Arc (SVG Path calculation)
        // Start point: (200, 20) -> Top center of semi-circle
        // End point: Based on angle.
        // Protractor center is (200, 200). Radius 180.
        // 0 degrees = Up (x=200, y=20).
        // Angle theta from top. 
        // x = 200 + 180 * sin(theta * PI / 180)
        // y = 200 - 180 * cos(theta * PI / 180)
        const rad = val * Math.PI / 180;
        const x = 200 + 180 * Math.sin(rad);
        const y = 200 - 180 * Math.cos(rad);
        
        if(arc) {
            const d = `M200 200 L200 20 A 180 180 0 0 1 ${x} ${y} Z`;
            arc.setAttribute('d', d);
        }

        // Enable next button if user interacted (> 10 degrees)
        if(val > 10 && nextBtn) {
            nextBtn.disabled = false;
        }
    },

    initVisualizeScene() {
        console.log('Visualize Scene Initialized');
    },

    initQuizScene() {
        console.log('Quiz Scene Initialized');
        const slider = document.getElementById('quiz-slider');
        const feedback = document.getElementById('quiz-feedback');
        if(slider) {
            slider.value = 0;
            this.handleQuizSlider({target: slider});
        }
        if(feedback) {
            feedback.innerHTML = '';
            feedback.className = 'feedback';
        }
    },

    handleQuizSlider(e) {
        const val = parseInt(e.target.value);
        const rocket = document.getElementById('quiz-rocket');
        const display = document.getElementById('quiz-angle-display');

        // Quiz Logic: Planet is at 60 degrees.
        // Rocket base logic: 0 = Up.
        if(rocket) rocket.style.transform = `translateX(-50%) rotate(${val}deg)`;
        if(display) display.innerText = val;
    },

    checkQuiz() {
        const val = parseInt(document.getElementById('quiz-slider').value);
        const feedback = document.getElementById('quiz-feedback');
        const tolerance = 5; // +/- 5 degrees allowed

        if (val >= this.targetAngle - tolerance && val <= this.targetAngle + tolerance) {
            feedback.innerHTML = '정답! 성공적으로 발사되었습니다! 🚀';
            feedback.className = 'feedback success';
            setTimeout(() => {
                this.nextScene();
            }, 1500);
        } else {
            let hint = '';
            if (val < this.targetAngle) hint = '각도를 좀 더 키워보세요!';
            else hint = '각도를 좀 줄여보세요!';
            feedback.innerHTML = `틀렸습니다. ${hint}`;
            feedback.className = 'feedback error';
        }
    },

    initWrapScene() {
        console.log('Wrap Scene Initialized');
    }
};

// Start app
document.addEventListener('DOMContentLoaded', () => ContentApp.init());