// Comparative Adjectives Content App
const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    currentQuiz: 1,
    totalQuizzes: 3,
    correctAnswers: { 1: 'taller', 2: 'more beautiful', 3: 'better' },
    transformCount: 0,

    init() {
        this.bindEvents();
        this.showScene(0);
        this.initStoryTypewriter();
    },

    showScene(index) {
        document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
        const sceneId = `${this.scenes[index]}-scene`;
        document.getElementById(sceneId).classList.add('active');
        this.currentScene = index;
        this.updateProgress();

        // 씬별 초기화
        if (this.scenes[index] === 'story') {
            this.startTypewriter();
        } else if (this.scenes[index] === 'core') {
            this.initDragDrop();
        }
    },

    nextScene() {
        if (this.currentScene < this.scenes.length - 1) {
            this.showScene(this.currentScene + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    },

    updateProgress() {
        const progress = ((this.currentScene + 1) / this.scenes.length) * 100;
        document.getElementById('progress-bar').style.width = `${progress}%`;
    },

    // Story Scene 타자 효과
    initStoryTypewriter() {
        this.storyText = "안녕! 나는 게임 유튜버 Alex야. 새 게임 리뷰를 쓰고 있는데, 영어로 비교하는 표현이 헷갈려! 'strong'은 'stronger'인데, 'beautiful'은 왜 'beautifuler'가 아니지? 도와줄 수 있어?";
        this.typewriterIndex = 0;
    },

    startTypewriter() {
        const textEl = document.getElementById('typewriter-text');
        if (!textEl) return;
        textEl.textContent = '';
        this.typewriterIndex = 0;
        this.typeText(textEl);
    },

    typeText(element) {
        if (this.typewriterIndex < this.storyText.length) {
            element.textContent += this.storyText.charAt(this.typewriterIndex);
            this.typewriterIndex++;
            setTimeout(() => this.typeText(element), 30);
        }
    },

    // Core Scene 드래그 앤 드롭
    initDragDrop() {
        this.transformCount = 0;

        // 탭 전환
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                const tab = e.target.dataset.tab;
                document.getElementById('short-words').classList.toggle('hidden', tab !== 'short');
                document.getElementById('long-words').classList.toggle('hidden', tab !== 'long');
            });
        });

        // 드래그 이벤트
        this.setupDragEvents('source-short', 'drop-short', 'result-short', 'short');
        this.setupDragEvents('source-long', 'drop-long', 'result-long', 'long');
    },

    setupDragEvents(sourceId, dropId, resultId, type) {
        const sourceContainer = document.getElementById(sourceId);
        const dropZone = document.getElementById(dropId);
        const resultZone = document.getElementById(resultId);

        if (!sourceContainer || !dropZone || !resultZone) return;

        const words = sourceContainer.querySelectorAll('.draggable');

        words.forEach(word => {
            word.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', word.dataset.word);
                e.dataTransfer.setData('type', type);
                word.classList.add('dragging');
            });

            word.addEventListener('dragend', () => {
                word.classList.remove('dragging');
            });

            // 터치 지원
            word.addEventListener('touchstart', (e) => {
                this.draggedWord = word.dataset.word;
                this.dragType = type;
                word.classList.add('dragging');
            });

            word.addEventListener('touchend', (e) => {
                word.classList.remove('dragging');
                const touch = e.changedTouches[0];
                const dropElement = document.elementFromPoint(touch.clientX, touch.clientY);
                if (dropElement && (dropElement.id === dropId || dropElement.closest(`#${dropId}`))) {
                    this.handleDrop(this.draggedWord, type, dropZone, resultZone, word);
                }
            });
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const word = e.dataTransfer.getData('text/plain');
            const dragType = e.dataTransfer.getData('type');

            if (dragType === type) {
                const draggedEl = sourceContainer.querySelector(`[data-word="${word}"]`);
                this.handleDrop(word, type, dropZone, resultZone, draggedEl);
            }
        });
    },

    handleDrop(word, type, dropZone, resultZone, sourceEl) {
        // 드롭존에 단어 표시
        dropZone.innerHTML = `<span class="dropped-word">${word}</span>`;

        // 결과 계산
        const result = this.getComparative(word, type);
        resultZone.querySelector('.result-word').textContent = result;

        // 소스 단어 비활성화
        if (sourceEl) {
            sourceEl.classList.add('used');
        }

        // 변환 카운트
        this.transformCount++;

        // 3개 이상 변환하면 발견 메시지 표시
        if (this.transformCount >= 3) {
            document.getElementById('discovery').classList.remove('hidden');
        }

        // 오디오 피드백 (Web Speech API)
        this.speak(result);
    },

    getComparative(word, type) {
        const comparatives = {
            // Short words
            'tall': 'taller',
            'fast': 'faster',
            'big': 'bigger',
            'happy': 'happier',
            // Long words
            'beautiful': 'more beautiful',
            'interesting': 'more interesting',
            'expensive': 'more expensive'
        };
        return comparatives[word] || word + 'er';
    },

    speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            speechSynthesis.speak(utterance);
        }
    },

    // Quiz Scene
    checkAnswer(quizNum, answer) {
        const correct = this.correctAnswers[quizNum];
        const isCorrect = answer === correct;

        // 버튼 스타일링
        const buttons = document.querySelectorAll(`[data-quiz="${quizNum}"] .opt-btn`);
        buttons.forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === correct) {
                btn.classList.add('correct');
            } else if (btn.textContent === answer && !isCorrect) {
                btn.classList.add('incorrect');
            }
        });

        // 피드백
        const feedback = document.getElementById('quiz-feedback');
        const reason = { 1: 'tall은 보통 -er를 붙여 taller로 만듭니다.', 2: 'beautiful은 more beautiful로 비교합니다. more와 -er를 함께 쓰지 않습니다.', 3: 'good의 비교급은 불규칙형 better입니다.' }[quizNum];
        feedback.classList.remove('hidden', 'correct', 'incorrect');

        if (isCorrect) {
            feedback.classList.add('correct');
            feedback.innerHTML = `<strong>Excellent!</strong> "${correct}"가 정답이에요! ${reason}`;
            this.speak(`Correct! ${correct}`);
        } else {
            feedback.classList.add('incorrect');
            feedback.innerHTML = `<strong>Try again!</strong> 정답은 "${correct}"예요. ${reason}`;
        }

        // 다음 퀴즈로 이동
        setTimeout(() => {
            if (this.currentQuiz < this.totalQuizzes) {
                this.currentQuiz++;
                this.showQuiz(this.currentQuiz);
            } else {
                // 모든 퀴즈 완료
                setTimeout(() => this.nextScene(), 1500);
            }
        }, 2000);
    },

    showQuiz(num) {
        document.querySelectorAll('.quiz-item').forEach(q => q.classList.remove('active'));
        const quizItem = document.querySelector(`[data-quiz="${num}"]`);
        if (quizItem) {
            quizItem.classList.add('active');
        }
        document.getElementById('quiz-feedback').classList.add('hidden');
        document.getElementById('quiz-progress-text').textContent = `${num} / ${this.totalQuizzes}`;
    },

    bindEvents() {
        // 키보드 네비게이션
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                this.nextScene();
            }
        });
    }
};

// 앱 시작
document.addEventListener('DOMContentLoaded', () => ContentApp.init());
