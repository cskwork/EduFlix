// 뉴턴의 운동 법칙
const ScienceApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    
    // 물리 시뮬레이션 변수
    boxPosition: 50,
    boxVelocity: 0,
    force: 0,
    friction: false,
    isAnimating: false,
    animationId: null,
    discoveredLaws: [false, false, false],

    contentData: {
        title: '뉴턴의 운동 법칙',
        gradeLevel: '중학교',
        domain: '물리',
        prerequisite: '힘과 운동',
        nextConcept: '중력과 마찰력'
    },

    init() {
        this.bindEvents();
        this.showScene(0);
    },

    bindEvents() {
        const forceSlider = document.getElementById('force-slider');
        if (forceSlider) {
            forceSlider.addEventListener('input', (e) => this.updateForce(e.target.value));
        }
    },

    showScene(index) {
        // 애니메이션 정지
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
            this.isAnimating = false;
        }
        
        document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
        const sceneId = `${this.scenes[index]}-scene`;
        document.getElementById(sceneId).classList.add('active');
        this.currentScene = index;
        
        const progress = ((index + 1) / this.scenes.length) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;

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

    initCoreScene() {
        this.resetSimulation();
    },

    updateForce(value) {
        this.force = parseInt(value);
        document.getElementById('force-value').textContent = `${this.force} N`;
        
        // 힘 화살표 표시
        const forceArrow = document.getElementById('force-arrow');
        if (this.force > 0) {
            forceArrow.classList.remove('hidden');
            const arrowLength = 30 + this.force * 3;
            document.getElementById('force-line').setAttribute('x2', 110 + arrowLength);
            document.getElementById('force-head').setAttribute('points', 
                `${105 + arrowLength},120 ${115 + arrowLength},125 ${105 + arrowLength},130`);
        } else {
            forceArrow.classList.add('hidden');
        }
    },

    setFriction(hasFriction) {
        this.friction = hasFriction;
        
        // 버튼 상태 업데이트
        document.getElementById('friction-off').classList.toggle('active', !hasFriction);
        document.getElementById('friction-on').classList.toggle('active', hasFriction);
        
        // 마찰 표시
        const frictionMarks = document.getElementById('friction-marks');
        if (hasFriction) {
            frictionMarks.classList.remove('hidden');
        } else {
            frictionMarks.classList.add('hidden');
        }
    },

    applyForce() {
        if (this.isAnimating) return;
        
        const mass = 1; // kg
        // Acceleration is read from the live force each frame.
        const frictionCoef = this.friction ? 2 : 0;
        
        this.isAnimating = true;
        
        // 가속도 법칙 발견
        if (this.force > 5 && !this.discoveredLaws[1]) {
            this.discoveredLaws[1] = true;
            this.updateLawCard(1);
        }
        
        const animate = () => {
            // 가속도 계산
            let netAccel = this.force / mass;
            
            // 마찰력 적용
            if (this.friction && this.boxVelocity > 0) {
                netAccel -= frictionCoef;
            }
            
            // 속도 업데이트
            this.boxVelocity += netAccel * 0.05;
            if (this.friction && this.boxVelocity < 0) this.boxVelocity = 0;
            
            // 위치 업데이트
            this.boxPosition += this.boxVelocity * 2;
            
            // 경계 체크
            if (this.boxPosition > 380) {
                this.boxPosition = 380;
                this.boxVelocity = 0;
            }
            
            // 렌더링
            this.renderBox();
            
            // 관성 법칙 발견: 힘 없이 계속 움직일 때
            if (this.force === 0 && this.boxVelocity > 1 && !this.friction && !this.discoveredLaws[0]) {
                this.discoveredLaws[0] = true;
                this.updateLawCard(0);
                this.showDiscovery();
            }
            
            // 마찰로 멈출 때까지 또는 계속 움직일 때
            if (this.boxVelocity > 0.1 || this.force > 0) {
                this.animationId = requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
                this.boxVelocity = 0;
                this.renderBox();
            }
        };
        
        // 힘을 가하는 동안만 가속
        setTimeout(() => {
            this.force = 0;
            document.getElementById('force-slider').value = 0;
            this.updateForce(0);
        }, 500);
        
        animate();
    },

    renderBox() {
        const box = document.getElementById('box');
        box.setAttribute('transform', `translate(${this.boxPosition}, 0)`);
        
        // 속도 표시
        document.getElementById('velocity-value').textContent = this.boxVelocity.toFixed(1);
        
        // 힘 화살표 위치 업데이트
        const forceLine = document.getElementById('force-line');
        const forceHead = document.getElementById('force-head');
        const forceLabel = document.getElementById('force-label');
        
        if (this.force > 0) {
            const arrowLength = 30 + this.force * 3;
            forceLine.setAttribute('x1', this.boxPosition + 60);
            forceLine.setAttribute('x2', this.boxPosition + 60 + arrowLength);
            forceHead.setAttribute('points', 
                `${this.boxPosition + 55 + arrowLength},120 ${this.boxPosition + 65 + arrowLength},125 ${this.boxPosition + 55 + arrowLength},130`);
            forceLabel.setAttribute('x', this.boxPosition + 60 + arrowLength/2);
        }
    },

    resetSimulation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.boxPosition = 50;
        this.boxVelocity = 0;
        this.force = 0;
        this.isAnimating = false;
        
        document.getElementById('force-slider').value = 0;
        this.updateForce(0);
        this.renderBox();
    },

    updateLawCard(index) {
        const cardId = `law${index + 1}-card`;
        const card = document.getElementById(cardId);
        if (card) {
            card.classList.add('discovered');
            card.querySelector('.check-mark').classList.remove('hidden');
        }
    },

    showDiscovery() {
        const discoveryMsg = document.getElementById('discovery-message');
        if (discoveryMsg) {
            discoveryMsg.classList.remove('hidden');
        }
    },

    checkAnswer(button) {
        const isCorrect = button.getAttribute('data-correct') === 'true';
        const options = document.querySelectorAll('.quiz-option');
        const feedback = document.getElementById('quiz-feedback');
        const feedbackText = feedback.querySelector('.feedback-text');
        const feedbackIcon = feedback.querySelector('.feedback-icon');
        const retryBtn = document.getElementById('retry-btn');
        const nextBtn = document.getElementById('quiz-next-btn');

        options.forEach(opt => opt.classList.add('disabled'));

        if (isCorrect) {
            button.classList.add('correct');
            feedback.classList.remove('hidden', 'error');
            feedback.classList.add('success');
            feedbackIcon.textContent = '🎉';
            feedbackText.textContent = '정답! 급정거할 때 차는 멈추지만, 우리 몸은 관성 때문에 계속 앞으로 가려고 해요. 안전벨트가 이것을 막아주는 거예요!';
            nextBtn.classList.remove('hidden');
            retryBtn.classList.add('hidden');
        } else {
            button.classList.add('incorrect');
            options.forEach(opt => {
                if (opt.getAttribute('data-correct') === 'true') {
                    opt.classList.add('correct');
                }
            });
            feedback.classList.remove('hidden', 'success');
            feedback.classList.add('error');
            feedbackIcon.textContent = '🤔';
            feedbackText.textContent = '안전벨트가 몸에 힘을 가해 자동차와 함께 속도를 줄입니다. 합력이 0일 때는 속도가 유지되며, 작용·반작용은 서로 다른 물체에 작용합니다.';
            retryBtn.classList.remove('hidden');
            nextBtn.classList.remove('hidden');
        }
    },

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

document.addEventListener('DOMContentLoaded', () => ScienceApp.init());
