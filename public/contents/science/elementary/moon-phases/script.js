// 달의 위상 변화
const ScienceApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    currentDay: 0,
    discoveryMade: false,

    contentData: {
        title: '달의 위상 변화',
        gradeLevel: '초등 5-6학년',
        domain: '지구과학/천문',
        prerequisite: '지구와 달, 빛과 그림자',
        nextConcept: '일식과 월식'
    },

    phaseNames: {
        0: '삭 (New Moon)',
        3: '초승달',
        7: '상현달 (First Quarter)',
        11: '상현망간',
        15: '보름달 (Full Moon)',
        18: '하현망간',
        22: '하현달 (Last Quarter)',
        26: '그믐달',
        29: '삭 (New Moon)'
    },

    init() {
        this.bindEvents();
        this.showScene(0);
    },

    bindEvents() {
        const orbitSlider = document.getElementById('orbit-slider');
        if (orbitSlider) {
            orbitSlider.addEventListener('input', (e) => this.updateMoonPhase(parseInt(e.target.value)));
        }
    },

    showScene(index) {
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
        this.updateMoonPhase(0);
    },

    updateMoonPhase(day) {
        this.currentDay = day;
        
        // 일 표시 업데이트
        document.getElementById('day-value').textContent = `${day}일`;
        
        // 궤도 회전 (0~360도)
        const angle = (day / 29.5) * 360;
        const moonOrbit = document.getElementById('moon-orbit');
        if (moonOrbit) {
            moonOrbit.setAttribute('transform', `rotate(${angle}, 200, 200)`);
        }
        
        // 달의 밝은 부분 계산 및 표시
        this.updatePhaseView(day);
        
        // 위상 이름 업데이트
        let phaseName = '달';
        for (const [d, name] of Object.entries(this.phaseNames)) {
            if (day >= parseInt(d)) {
                phaseName = name;
            }
        }
        document.getElementById('phase-name').textContent = phaseName.split(' ')[0];
        
        // 위상 아이템 활성화
        document.querySelectorAll('.phase-item').forEach(item => {
            const itemDay = parseInt(item.getAttribute('data-day'));
            item.classList.toggle('active', Math.abs(day - itemDay) < 4);
        });
        
        // 발견 체크
        this.checkDiscovery(day);
    },

    updatePhaseView(day) {
        const phaseView = document.getElementById('lit-portion');
        if (!phaseView) return;
        
        // 위상에 따른 밝은 부분 경로 계산
        // 0일: 삭 (안 보임), 7일: 상현 (오른쪽 반), 15일: 보름 (전체), 22일: 하현 (왼쪽 반)
        const phase = (day / 29.5) * 2 * Math.PI;
        const illumination = (1 - Math.cos(phase)) / 2; // 0 ~ 1
        
        let path;
        if (day < 1 || day > 28) {
            // 삭 - 거의 안 보임
            path = 'M50,10 A40,40 0 0,1 50,90 A40,40 0 0,1 50,10';
            phaseView.setAttribute('fill', '#333');
        } else if (day < 15) {
            // 상현 방향 (오른쪽이 밝아짐)
            const curve = 40 * (1 - 2 * illumination);
            path = `M50,10 A40,40 0 0,1 50,90 A${Math.abs(curve)},40 0 0,${curve > 0 ? 1 : 0} 50,10`;
            phaseView.setAttribute('fill', '#F5F5DC');
        } else {
            // 하현 방향 (왼쪽부터 어두워짐)
            const curve = 40 * (2 * (illumination - 0.5));
            path = `M50,10 A40,40 0 0,0 50,90 A${Math.abs(curve)},40 0 0,${curve > 0 ? 0 : 1} 50,10`;
            phaseView.setAttribute('fill', '#F5F5DC');
        }
        
        phaseView.setAttribute('d', path);
    },

    checkDiscovery(day) {
        if (!this.discoveryMade && (day > 10 && day < 20)) {
            this.discoveryMade = true;
            setTimeout(() => {
                const discoveryMsg = document.getElementById('discovery-message');
                if (discoveryMsg) {
                    discoveryMsg.classList.remove('hidden');
                }
            }, 500);
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
            feedbackText.textContent = '정답! 보름달일 때는 태양-지구-달 순서로 일렬이 되어서, 태양빛이 달의 지구 쪽 면 전체를 비추게 돼요!';
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
            feedbackText.textContent = '아쉬워요! 보름달이 되려면 달이 지구 반대편에 있어야 해요. 다시 생각해볼까요?';
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
