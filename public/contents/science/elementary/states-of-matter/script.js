// 물질의 상태 변화 - 분자의 비밀
const ScienceApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    molecules: [],
    animationId: null,
    temperature: 25,
    discoveryMade: false,

    // 콘텐츠 데이터
    contentData: {
        title: '물질의 상태 변화',
        gradeLevel: '초등 5-6학년',
        domain: '화학',
        prerequisite: '물질의 세 가지 상태',
        nextConcept: '열에너지와 온도'
    },

    // 초기화
    init() {
        this.bindEvents();
        this.showScene(0);
        this.startHookAnimation();
    },

    // 이벤트 바인딩
    bindEvents() {
        const tempSlider = document.getElementById('temp-slider');
        if (tempSlider) {
            tempSlider.addEventListener('input', (e) => this.updateTemperature(e.target.value));
        }
    },

    // 씬 전환
    showScene(index) {
        document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
        const sceneId = `${this.scenes[index]}-scene`;
        document.getElementById(sceneId).classList.add('active');
        this.currentScene = index;
        
        // 진행 바 업데이트
        const progress = ((index + 1) / this.scenes.length) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;

        // 씬별 초기화
        if (this.scenes[index] === 'core') {
            this.initCoreScene();
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

    // Hook 애니메이션
    startHookAnimation() {
        // 수증기가 올라가는 애니메이션은 CSS로 처리됨
    },

    // Core 씬 초기화
    initCoreScene() {
        this.createMolecules();
        this.startMoleculeAnimation();
    },

    // 분자 생성
    createMolecules() {
        const container = document.getElementById('molecules');
        if (!container) return;
        
        container.innerHTML = '';
        this.molecules = [];

        const numMolecules = 20;
        for (let i = 0; i < numMolecules; i++) {
            const molecule = {
                x: 50 + Math.random() * 200,
                y: 50 + Math.random() * 175,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                radius: 8
            };
            this.molecules.push(molecule);

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('r', molecule.radius);
            circle.setAttribute('fill', '#2874A6');
            circle.classList.add('molecule');
            container.appendChild(circle);
        }

        this.updateTemperature(25);
    },

    // 분자 애니메이션
    startMoleculeAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        const animate = () => {
            this.updateMolecules();
            this.renderMolecules();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    },

    // 분자 위치 업데이트
    updateMolecules() {
        const speedMultiplier = this.getSpeedMultiplier();
        const bounds = { minX: 35, maxX: 265, minY: 35, maxY: 215 };

        this.molecules.forEach(mol => {
            // 속도에 따른 움직임
            mol.x += mol.vx * speedMultiplier;
            mol.y += mol.vy * speedMultiplier;

            // 벽 충돌
            if (mol.x < bounds.minX || mol.x > bounds.maxX) {
                mol.vx *= -1;
                mol.x = Math.max(bounds.minX, Math.min(bounds.maxX, mol.x));
            }
            if (mol.y < bounds.minY || mol.y > bounds.maxY) {
                mol.vy *= -1;
                mol.y = Math.max(bounds.minY, Math.min(bounds.maxY, mol.y));
            }

            // 상태에 따른 위치 조정
            if (this.temperature < 0) {
                // 고체: 격자 형태로 정렬 시도
                const targetY = 180;
                mol.y += (targetY - mol.y) * 0.02;
            }
        });
    },

    // 분자 렌더링
    renderMolecules() {
        const container = document.getElementById('molecules');
        if (!container) return;

        const circles = container.querySelectorAll('circle');
        this.molecules.forEach((mol, i) => {
            if (circles[i]) {
                circles[i].setAttribute('cx', mol.x);
                circles[i].setAttribute('cy', mol.y);
                
                // 온도에 따른 색상 변경
                const color = this.getMoleculeColor();
                circles[i].setAttribute('fill', color);
            }
        });
    },

    // 속도 배율 계산
    getSpeedMultiplier() {
        if (this.temperature < 0) return 0.3;
        if (this.temperature < 100) return 0.5 + (this.temperature / 100) * 1.5;
        return 2.5 + ((this.temperature - 100) / 20) * 1;
    },

    // 분자 색상
    getMoleculeColor() {
        if (this.temperature < 0) return '#AED6F1';  // 얼음색
        if (this.temperature < 100) return '#2874A6'; // 물색
        return '#5DADE2'; // 수증기색
    },

    // 온도 업데이트
    updateTemperature(value) {
        this.temperature = parseInt(value);
        
        // 온도 표시 업데이트
        const tempValue = document.getElementById('temp-value');
        if (tempValue) {
            tempValue.textContent = `${this.temperature}°C`;
            tempValue.style.color = this.getTemperatureColor();
        }

        // 상태 표시 업데이트
        const stateIndicator = document.getElementById('state-indicator');
        if (stateIndicator) {
            stateIndicator.textContent = this.getStateName();
            stateIndicator.style.background = this.getStateColor();
        }

        // 속도 바 업데이트
        const speedFill = document.getElementById('speed-fill');
        if (speedFill) {
            const speedPercent = Math.min(100, (this.getSpeedMultiplier() / 3) * 100);
            speedFill.style.width = `${speedPercent}%`;
        }

        // 간격 표시 업데이트
        const spacingValue = document.getElementById('spacing-value');
        if (spacingValue) {
            spacingValue.textContent = this.getSpacingText();
        }

        // 발견 메시지 표시
        this.checkDiscovery();
    },

    // 온도 색상
    getTemperatureColor() {
        if (this.temperature < 0) return '#3498DB';
        if (this.temperature < 50) return '#F5A623';
        return '#E74C3C';
    },

    // 상태 이름
    getStateName() {
        if (this.temperature < 0) return '고체 상태 (얼음)';
        if (this.temperature < 100) return '액체 상태 (물)';
        return '기체 상태 (수증기)';
    },

    // 상태 색상
    getStateColor() {
        if (this.temperature < 0) return '#AED6F1';
        if (this.temperature < 100) return '#4A90D9';
        return '#85C1E9';
    },

    // 간격 텍스트
    getSpacingText() {
        if (this.temperature < 0) return '매우 좁음';
        if (this.temperature < 50) return '보통';
        if (this.temperature < 100) return '넓음';
        return '매우 넓음';
    },

    // 발견 체크
    checkDiscovery() {
        if (!this.discoveryMade && (this.temperature > 100 || this.temperature < -10)) {
            this.discoveryMade = true;
            const discoveryMsg = document.getElementById('discovery-message');
            if (discoveryMsg) {
                discoveryMsg.classList.remove('hidden');
            }
        }
    },

    // 퀴즈 정답 확인
    checkAnswer(button) {
        const isCorrect = button.getAttribute('data-correct') === 'true';
        const options = document.querySelectorAll('.quiz-option');
        const feedback = document.getElementById('quiz-feedback');
        const feedbackText = feedback.querySelector('.feedback-text');
        const feedbackIcon = feedback.querySelector('.feedback-icon');
        const retryBtn = document.getElementById('retry-btn');
        const nextBtn = document.getElementById('quiz-next-btn');

        // 모든 옵션 비활성화
        options.forEach(opt => opt.classList.add('disabled'));

        // 정답/오답 표시
        if (isCorrect) {
            button.classList.add('correct');
            feedback.classList.remove('hidden', 'error');
            feedback.classList.add('success');
            feedbackIcon.textContent = '🎉';
            feedbackText.textContent = '정답! 뚜껑을 닫으면 열이 빠져나가지 못해서 물 분자들이 더 빨리 움직이게 되고, 그래서 더 빨리 끓어요!';
            nextBtn.classList.remove('hidden');
            retryBtn.classList.add('hidden');
        } else {
            button.classList.add('incorrect');
            // 정답 옵션 표시
            options.forEach(opt => {
                if (opt.getAttribute('data-correct') === 'true') {
                    opt.classList.add('correct');
                }
            });
            feedback.classList.remove('hidden', 'success');
            feedback.classList.add('error');
            feedbackIcon.textContent = '🤔';
            feedbackText.textContent = '아쉬워요! 열이 빠져나가지 못하면 분자들이 더 빨리 움직여서 빨리 끓는 거예요. 다시 한번 생각해볼까요?';
            retryBtn.classList.remove('hidden');
            nextBtn.classList.remove('hidden');
        }
    },

    // 퀴즈 재시도
    retryQuiz() {
        const options = document.querySelectorAll('.quiz-option');
        const feedback = document.getElementById('quiz-feedback');
        const nextBtn = document.getElementById('quiz-next-btn');

        options.forEach(opt => {
            opt.classList.remove('disabled', 'correct', 'incorrect');
        });
        feedback.classList.add('hidden');
        nextBtn.classList.add('hidden');
    }
};

// 앱 시작
document.addEventListener('DOMContentLoaded', () => ScienceApp.init());
