// 지진과 판구조론
const ScienceApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    boundaryType: 'convergent',
    discoveryMade: false,
    exploredBoundaries: new Set(),

    contentData: {
        title: '지진과 판구조론',
        gradeLevel: '중학교',
        domain: '지구과학',
        prerequisite: '지구의 구조',
        nextConcept: '화산과 지진파'
    },

    boundaryInfo: {
        convergent: {
            icon: '🏔️',
            title: '수렴형 경계',
            description: '두 판이 충돌하면 산맥이 형성되거나, 한 판이 다른 판 아래로 섭입해요.',
            example: '히말라야 산맥, 일본 해구'
        },
        divergent: {
            icon: '🌋',
            title: '발산형 경계',
            description: '두 판이 멀어지면서 새로운 지각이 만들어지고 화산이 생겨요.',
            example: '대서양 중앙 해령, 아이슬란드'
        },
        transform: {
            icon: '⚡',
            title: '변환형 경계',
            description: '두 판이 수평으로 어긋나 이동하며 쌓인 변형이 갑자기 풀릴 때 지진이 발생할 수 있어요. 이 경계에서는 보통 지각이 생성되거나 소멸하지 않습니다.',
            example: '산안드레아스 단층 (미국)'
        }
    },

    init() {
        this.bindEvents();
        this.showScene(0);
    },

    bindEvents() {
        // 추가 이벤트 바인딩이 필요하면 여기에
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
        this.setBoundaryType('convergent');
    },

    setBoundaryType(type) {
        this.boundaryType = type;
        
        // 버튼 상태 업데이트
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-type') === type);
        });

        // 결과 패널 업데이트
        const info = this.boundaryInfo[type];
        document.getElementById('result-icon').textContent = info.icon;
        document.getElementById('result-title').textContent = info.title;
        document.getElementById('result-description').textContent = info.description;
        document.getElementById('result-example').textContent = info.example;

        // 판 애니메이션
        this.animatePlates(type);
        
        // 발견 체크
        this.exploredBoundaries.add(type);
        if (!this.discoveryMade && this.exploredBoundaries.size === 3) {
            this.discoveryMade = true;
            setTimeout(() => {
                const discoveryMsg = document.getElementById('discovery-message');
                if (discoveryMsg) {
                    discoveryMsg.classList.remove('hidden');
                }
            }, 1000);
        }
    },

    animatePlates(type) {
        const plateA = document.getElementById('plate-a');
        const plateB = document.getElementById('plate-b');
        
        // 초기화
        plateA.style.transition = 'transform 0.5s ease';
        plateB.style.transition = 'transform 0.5s ease';

        switch (type) {
            case 'convergent':
                plateA.style.transform = 'translate(20px, 0)';
                plateB.style.transform = 'translate(-20px, 0)';
                break;
            case 'divergent':
                plateA.style.transform = 'translate(-20px, 0)';
                plateB.style.transform = 'translate(20px, 0)';
                break;
            case 'transform':
                plateA.style.transform = 'translate(0, 10px)';
                plateB.style.transform = 'translate(0, -10px)';
                break;
        }

        // 원래 위치로 복귀
        setTimeout(() => {
            plateA.style.transform = 'translate(0, 0)';
            plateB.style.transform = 'translate(0, 0)';
        }, 1500);
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
            feedbackText.textContent = '정답! 태평양 주변에는 섭입대를 비롯한 판 경계가 많습니다. 지진과 화산은 판의 움직임과 관련되지만, 모든 지진에 화산이 동반되는 것은 아닙니다.';
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
            feedbackText.textContent = '아쉬워요! 판의 경계와 지진/화산의 관계를 다시 생각해보세요.';
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
