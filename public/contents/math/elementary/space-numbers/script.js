const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    coreStage: 0,
    quizAnswered: false,

    init() {
        this.bindEvents();
        this.updateProgress();
        this.showScene(0);
    },

    bindEvents() {
        document.getElementById('btn-next').addEventListener('click', () => this.nextScene());
        document.getElementById('btn-prev').addEventListener('click', () => this.prevScene());
        
        // Hook scene click to start
        document.getElementById('hook-scene').addEventListener('click', () => {
            if(this.currentScene === 0) this.nextScene();
        });
    },

    showScene(index) {
        if (index < 0 || index >= this.scenes.length) return;
        
        document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
        const sceneId = `${this.scenes[index]}-scene`;
        document.getElementById(sceneId).classList.add('active');
        
        this.currentScene = index;
        this.updateProgress();

        // Initialize Scene Logic
        const methodName = `init${this.capitalizeFirst(this.scenes[index])}Scene`;
        if (this[methodName]) this[methodName]();
    },

    nextScene() {
        // Prevent skipping Core interaction unless completed
        if (this.currentScene === 3 && this.coreStage < 3) {
            this.showFeedback('core-feedback', '미션을 먼저 완료해주세요!', '#FF6B6B');
            return;
        }
        if (this.currentScene < this.scenes.length - 1) {
            this.showScene(this.currentScene + 1);
        }
    },

    prevScene() {
        if (this.currentScene > 0) {
            this.showScene(this.currentScene - 1);
        }
    },

    restart() {
        this.coreStage = 0;
        this.quizAnswered = false;
        this.showScene(0);
    },

    updateProgress() {
        const percent = ((this.currentScene + 1) / this.scenes.length) * 100;
        document.getElementById('progress-fill').style.width = `${percent}%`;
        document.getElementById('scene-indicator').innerText = `${this.currentScene + 1}/${this.scenes.length}`;
    },

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // --- Scene Specific Logic ---

    initCoreScene() {
        this.coreStage = 0;
        this.renderCoreLevel();
    },

    renderCoreLevel() {
        const container = document.getElementById('planets-container');
        const missionText = document.getElementById('mission-text');
        container.innerHTML = '';
        container.dataset.answered = 'false';
        
        let planets = [];
        let mission = '';
        let correctIndex = 0;

        if (this.coreStage === 0) {
            // Level 1: Size Comparison (Big)
            mission = '가상 탐사 거리입니다. 가장 <strong>멀리 간</strong> 기록은? 그림 크기 대신 km 수를 비교해요.';
            planets = [
                { size: 60, color: '#FF6B6B', label: 'A · 12,050 km' },
                { size: 100, color: '#4A90D9', label: 'B · 12,500 km' },
                { size: 80, color: '#F5A623', label: 'C · 12,005 km' }
            ];
            correctIndex = 1;
        } else if (this.coreStage === 1) {
            // Level 2: Size Comparison (Small)
            mission = '같은 단위로 쓴 가상 탐사 거리 중 가장 <strong>작은 수</strong>를 고르세요.';
            planets = [
                { size: 90, color: '#9013FE', label: 'D · 31,200 km' },
                { size: 50, color: '#50E3C2', label: 'E · 30,120 km' },
                { size: 70, color: '#BD10E0', label: 'F · 30,210 km' }
            ];
            correctIndex = 1;
        } else if (this.coreStage === 2) {
            // Level 3: Counting (Most stars)
            mission = '별 1개는 관측 기록 1,000개를 뜻해요. 기록이 가장 많은 기지를 고르세요.';
            planets = [
                { size: 80, color: '#B8E986', label: 'G', stars: 2 },
                { size: 80, color: '#417505', label: 'H', stars: 5 },
                { size: 80, color: '#7ED321', label: 'I', stars: 3 }
            ];
            correctIndex = 1;
        } else {
            // Completed
            missionText.innerHTML = '<strong>미션 완료!</strong> 정말 잘했어요!';
            document.getElementById('core-feedback').innerText = '다음으로 넘어갈 수 있어요!';
            document.getElementById('core-feedback').style.color = '#7ED321';
            return;
        }

        missionText.innerHTML = mission;

        planets.forEach((p, index) => {
            const pDiv = document.createElement('div');
            pDiv.className = 'planet';
            
            // SVG Planet
            let starShapes = '';
            if(p.stars) {
                for(let i=0; i<p.stars; i++) {
                    let angle = (i / p.stars) * Math.PI * 2;
                    let sx = 50 + Math.cos(angle) * 30; // relative to 100x100 viewbox center (50) + radius offset? No, let's keep simple around planet
                    let sy = 50 + Math.sin(angle) * 30;
                    // Actually, let's just put stars above the planet in SVG or separate. 
                    // Let's put them in the SVG for simplicity.
                    starShapes += `<polygon points="${sx},${sy-5} ${sx-3},${sy+3} ${sx+3},${sy+3}" fill="yellow" transform="translate(${Math.cos(angle)*p.size}, ${Math.sin(angle)*p.size})" />`; 
                    // Coordinate math is tricky dynamically in simple string, let's simplify.
                }
            }
            // Better star generation logic
            let starsSvg = '';
            if(p.stars) {
                 for(let i=0; i<p.stars; i++) {
                    // Randomly scatter small stars around the planet center in the SVG 100x100 viewbox context
                    // But planet size varies. Let's assume viewbox is dynamic or fixed.
                    // Simple approach: Just draw the planet and put text for stars.
                 }
            }

            // Simplified SVG Planet
            const svg = `<svg width="${p.size}" height="${p.size}" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50" fill="${p.color}" opacity="0.9"/>
                <circle cx="35" cy="35" r="10" fill="rgba(255,255,255,0.2)"/>
            </svg>`;
            
            let starText = '';
            if(p.stars) {
                // Show stars as text or separate SVG elements floating
                const starIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="yellow" style="position:absolute; top:${-20 - Math.random()*10}px; left:${Math.random()*p.size - 5}px"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
                let starsHtml = '';
                for(let i=0; i<p.stars; i++) starsHtml += starIcon.replace(/top:[^;]+;/, "top:-25px;").replace(/left:[^;]+px/, `left:${i * 18}px`);
                pDiv.innerHTML += starsHtml;
            }

            pDiv.innerHTML += svg;
            pDiv.innerHTML += `<span class="planet-label">${p.label}</span>`;

            pDiv.onclick = () => {
                if (container.dataset.answered === 'true') return;
                if (index === correctIndex) {
                    container.dataset.answered = 'true';
                    const reasons = ['12,500은 백의 자리 5가 0보다 커요.', '30,120은 30,210보다 백의 자리가 작아요.', '별 5개 × 1,000 = 관측 기록 5,000개예요.'];
                    this.showFeedback('core-feedback', reasons[this.coreStage], '#7ED321');
                    pDiv.style.transform = 'scale(1.2)';
                    setTimeout(() => {
                        this.coreStage++;
                        this.renderCoreLevel();
                    }, 1000);
                } else {
                    this.showFeedback('core-feedback', '다시 한번 생각해봐요! 🤔', '#FF6B6B');
                    pDiv.style.animation = 'shake 0.5s';
                    setTimeout(() => pDiv.style.animation = '', 500);
                }
            };

            container.appendChild(pDiv);
        });
    },

    initQuizScene() {
        if(this.quizAnswered) return;
        
        const qContainer = document.getElementById('quiz-question');
        const oContainer = document.getElementById('quiz-options');
        const fContainer = document.getElementById('quiz-feedback');
        
        qContainer.innerText = 'A는 125,000 km, B는 152,000 km를 갔어요. 어느 우주선이 더 멀리 갔나요?';
        oContainer.innerHTML = '';
        fContainer.innerText = '';

        // Create visual rockets
        const createRocketOption = (length, label, isCorrect) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-btn';
            btn.style.height = '80px';
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'flex-start';
            btn.style.padding = '0 20px';
            btn.style.gap = '10px';
            
            const svgRocket = `<svg width="30" height="30" viewBox="0 0 100 100"><path d="M50 0 L60 40 L90 50 L60 60 L70 100 L50 80 L30 100 L40 60 L10 50 L40 40 Z" fill="${isCorrect ? '#7ED321' : '#4A90D9'}"/></svg>`;
            const trail = `<div style="background:white; height:10px; width:${length}px; border-radius:5px; margin-right:10px;"></div>`;
            
            btn.innerHTML = `${svgRocket} ${trail}<span>${label}</span>`;
            
            btn.onclick = () => {
                if(isCorrect) {
                    btn.classList.add('correct');
                    fContainer.innerText = '152,000 > 125,000이에요. 만의 자리 5와 2를 비교했어요. 거리는 27,000 km 차이예요.';
                    fContainer.style.color = '#7ED321';
                    this.quizAnswered = true;
                } else {
                    btn.classList.add('wrong');
                    fContainer.innerText = '아니요, 더 긴 쪽을 찾아봐요!';
                    fContainer.style.color = '#FF6B6B';
                }
            };
            return btn;
        };

        oContainer.appendChild(createRocketOption(50, 'A', false));
        oContainer.appendChild(createRocketOption(150, 'B', true));
    },

    showFeedback(elementId, text, color) {
        const el = document.getElementById(elementId);
        if(el) {
            el.innerText = text;
            el.style.color = color;
            // Reset animation if needed
            el.style.animation = 'none';
            el.offsetHeight; /* trigger reflow */
            el.style.animation = 'fadeIn 0.3s';
        }
    }
};

// Global styles for shake animation
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  50% { transform: translateX(10px); }
  75% { transform: translateX(-10px); }
  100% { transform: translateX(0); }
}`;
document.head.appendChild(styleSheet);

// Start App
document.addEventListener('DOMContentLoaded', () => ContentApp.init());