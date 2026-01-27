// 광합성 - 식물의 비밀 공장
const ScienceApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    discoveryMade: false,
    
    // 광합성 변수
    lightLevel: 50,
    waterLevel: 50,
    co2Level: 50,

    // 콘텐츠 데이터
    contentData: {
        title: '광합성',
        gradeLevel: '중학교 1학년',
        domain: '생물',
        prerequisite: '식물의 구조',
        nextConcept: '식물의 호흡'
    },

    // 초기화
    init() {
        this.bindEvents();
        this.showScene(0);
    },

    // 이벤트 바인딩
    bindEvents() {
        const lightSlider = document.getElementById('light-slider');
        const waterSlider = document.getElementById('water-slider');
        const co2Slider = document.getElementById('co2-slider');

        if (lightSlider) {
            lightSlider.addEventListener('input', (e) => this.updateLight(e.target.value));
        }
        if (waterSlider) {
            waterSlider.addEventListener('input', (e) => this.updateWater(e.target.value));
        }
        if (co2Slider) {
            co2Slider.addEventListener('input', (e) => this.updateCO2(e.target.value));
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

    // Core 씬 초기화
    initCoreScene() {
        this.updatePhotosynthesis();
    },

    // 빛 레벨 업데이트
    updateLight(value) {
        this.lightLevel = parseInt(value);
        document.getElementById('light-value').textContent = `${this.lightLevel}%`;
        
        // 시각적 업데이트
        const lightInput = document.getElementById('light-input');
        if (lightInput) {
            const circle = lightInput.querySelector('circle');
            if (circle) {
                circle.setAttribute('opacity', 0.3 + (this.lightLevel / 100) * 0.7);
                circle.setAttribute('r', 15 + (this.lightLevel / 100) * 15);
            }
        }
        
        this.updatePhotosynthesis();
    },

    // 물 레벨 업데이트
    updateWater(value) {
        this.waterLevel = parseInt(value);
        document.getElementById('water-value').textContent = `${this.waterLevel}%`;
        
        // 시각적 업데이트
        const waterInput = document.getElementById('water-input');
        if (waterInput) {
            const circle = waterInput.querySelector('circle');
            if (circle) {
                circle.setAttribute('opacity', 0.3 + (this.waterLevel / 100) * 0.7);
                circle.setAttribute('r', 12 + (this.waterLevel / 100) * 12);
            }
        }
        
        this.updatePhotosynthesis();
    },

    // CO2 레벨 업데이트
    updateCO2(value) {
        this.co2Level = parseInt(value);
        document.getElementById('co2-value').textContent = `${this.co2Level}%`;
        
        // 시각적 업데이트
        const co2Input = document.getElementById('co2-input');
        if (co2Input) {
            const circle = co2Input.querySelector('circle');
            if (circle) {
                circle.setAttribute('opacity', 0.3 + (this.co2Level / 100) * 0.7);
                circle.setAttribute('r', 12 + (this.co2Level / 100) * 12);
            }
        }
        
        this.updatePhotosynthesis();
    },

    // 광합성 결과 계산 및 표시
    updatePhotosynthesis() {
        // 광합성 효율은 가장 낮은 요소에 의해 제한됨 (리비히의 최소량의 법칙)
        const minLevel = Math.min(this.lightLevel, this.waterLevel, this.co2Level);
        
        // 포도당과 산소 생성량
        const glucoseProduction = minLevel;
        const oxygenProduction = minLevel * 0.9;

        // 미터 업데이트
        const glucoseMeter = document.getElementById('glucose-meter');
        const oxygenMeter = document.getElementById('oxygen-meter');
        const glucoseValue = document.getElementById('glucose-value');
        const oxygenValue = document.getElementById('oxygen-value');

        if (glucoseMeter) glucoseMeter.style.width = `${glucoseProduction}%`;
        if (oxygenMeter) oxygenMeter.style.width = `${oxygenProduction}%`;
        if (glucoseValue) glucoseValue.textContent = Math.round(glucoseProduction);
        if (oxygenValue) oxygenValue.textContent = Math.round(oxygenProduction);

        // 출력 시각화
        const glucoseOutput = document.getElementById('glucose-output');
        const oxygenOutput = document.getElementById('oxygen-output');

        if (glucoseOutput) {
            if (glucoseProduction > 30) {
                glucoseOutput.classList.remove('hidden');
                glucoseOutput.classList.add('visible');
            } else {
                glucoseOutput.classList.add('hidden');
                glucoseOutput.classList.remove('visible');
            }
        }

        if (oxygenOutput) {
            if (oxygenProduction > 30) {
                oxygenOutput.classList.remove('hidden');
                oxygenOutput.classList.add('visible');
            } else {
                oxygenOutput.classList.add('hidden');
                oxygenOutput.classList.remove('visible');
            }
        }

        // 엽록체 색상 변화
        const chloroplast = document.getElementById('chloroplast');
        if (chloroplast) {
            const greenIntensity = 102 + Math.round((minLevel / 100) * 50);
            chloroplast.setAttribute('fill', `rgb(${greenIntensity - 50}, ${greenIntensity + 50}, ${greenIntensity - 40})`);
        }

        // 발견 메시지
        this.checkDiscovery();
    },

    // 발견 체크
    checkDiscovery() {
        if (!this.discoveryMade && 
            this.lightLevel > 70 && 
            this.waterLevel > 70 && 
            this.co2Level > 70) {
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
            feedbackText.textContent = '정답! 식물이 광합성을 통해 산소를 만들어내기 때문에 숲 속 공기가 상쾌해요. 특히 낮에 햇빛을 받으면 광합성이 활발해져서 더 많은 산소가 나와요!';
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
            feedbackText.textContent = '아쉬워요! 식물이 광합성으로 산소를 만들어내서 공기가 상쾌한 거예요. 다시 생각해볼까요?';
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
