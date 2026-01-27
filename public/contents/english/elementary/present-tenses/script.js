// Present Simple vs Continuous Content App
const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    currentQuiz: 1,
    totalQuizzes: 4,
    correctAnswers: {
        1: 'play',
        2: 'am doing',
        3: 'goes',
        4: 'am watching'
    },
    sortedCount: 0,
    totalSentences: 6,

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
        this.storyText = "안녕! 나는 브이로그를 찍는 미나야. 매일 영상을 올리는데, 영어로 설명할 때 헷갈려! '나는 항상 밥을 먹어'랑 '나는 지금 밥을 먹고 있어'가 영어로는 어떻게 달라? 도와줘!";
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
        this.sortedCount = 0;
        this.updateScore();

        const cards = document.querySelectorAll('.sentence-card');
        const simpleDrop = document.getElementById('simple-drop');
        const continuousDrop = document.getElementById('continuous-drop');

        cards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', card.querySelector('.english-text').textContent);
                e.dataTransfer.setData('answer', card.dataset.answer);
                card.classList.add('dragging');
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });

            // 터치 지원
            card.addEventListener('touchstart', (e) => {
                this.draggedCard = card;
                card.classList.add('dragging');
            });

            card.addEventListener('touchend', (e) => {
                card.classList.remove('dragging');
                const touch = e.changedTouches[0];
                const dropElement = document.elementFromPoint(touch.clientX, touch.clientY);

                if (dropElement) {
                    if (dropElement.id === 'simple-drop' || dropElement.closest('#simple-drop')) {
                        this.handleDrop('simple', this.draggedCard);
                    } else if (dropElement.id === 'continuous-drop' || dropElement.closest('#continuous-drop')) {
                        this.handleDrop('continuous', this.draggedCard);
                    }
                }
            });
        });

        // 드롭존 이벤트
        [simpleDrop, continuousDrop].forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.classList.add('drag-over');
            });

            zone.addEventListener('dragleave', () => {
                zone.classList.remove('drag-over');
            });

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('drag-over');

                const answer = e.dataTransfer.getData('answer');
                const text = e.dataTransfer.getData('text/plain');
                const expectedAnswer = zone.id === 'simple-drop' ? 'simple' : 'continuous';

                // 드래그한 카드 찾기
                const cards = document.querySelectorAll('.sentence-card');
                let draggedCard = null;
                cards.forEach(card => {
                    if (card.querySelector('.english-text').textContent === text) {
                        draggedCard = card;
                    }
                });

                if (draggedCard) {
                    this.handleDrop(expectedAnswer, draggedCard);
                }
            });
        });
    },

    handleDrop(dropZoneType, card) {
        const correctAnswer = card.dataset.answer;
        const isCorrect = dropZoneType === correctAnswer;

        if (isCorrect) {
            card.classList.add('correct', 'used');
            this.sortedCount++;
            this.updateScore();

            // 드롭존에 문장 추가
            const dropZone = document.getElementById(`${dropZoneType}-drop`);
            const text = card.querySelector('.english-text').textContent;
            const sentenceEl = document.createElement('div');
            sentenceEl.className = 'dropped-sentence english-text';
            sentenceEl.textContent = text;
            dropZone.appendChild(sentenceEl);

            // placeholder 숨기기
            const placeholder = dropZone.querySelector('.placeholder');
            if (placeholder) placeholder.style.display = 'none';

            // 발견 메시지
            if (this.sortedCount >= 4) {
                document.getElementById('discovery').classList.remove('hidden');
            }

            this.playSound('correct');
        } else {
            card.classList.add('incorrect');
            setTimeout(() => card.classList.remove('incorrect'), 1000);
            this.playSound('incorrect');
        }
    },

    updateScore() {
        document.getElementById('correct-count').textContent = this.sortedCount;
    },

    playSound(type) {
        // 간단한 Web Audio API 피드백
        if (!window.AudioContext && !window.webkitAudioContext) return;

        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        if (type === 'correct') {
            oscillator.frequency.value = 523.25; // C5
            oscillator.type = 'sine';
        } else {
            oscillator.frequency.value = 220; // A3
            oscillator.type = 'square';
        }

        gainNode.gain.value = 0.1;
        oscillator.start();

        setTimeout(() => {
            oscillator.stop();
            audioCtx.close();
        }, 150);
    },

    // Quiz Scene
    checkAnswer(quizNum, answer) {
        const correct = this.correctAnswers[quizNum];
        const isCorrect = answer === correct;

        const buttons = document.querySelectorAll(`[data-quiz="${quizNum}"] .opt-btn`);
        buttons.forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === correct) {
                btn.classList.add('correct');
            } else if (btn.textContent === answer && !isCorrect) {
                btn.classList.add('incorrect');
            }
        });

        const feedback = document.getElementById('quiz-feedback');
        feedback.classList.remove('hidden', 'correct', 'incorrect');

        if (isCorrect) {
            feedback.classList.add('correct');
            let explanation = this.getExplanation(quizNum, correct);
            feedback.innerHTML = `<strong>Correct!</strong> ${explanation}`;
            this.playSound('correct');
        } else {
            feedback.classList.add('incorrect');
            feedback.innerHTML = `<strong>Not quite!</strong> 정답은 "${correct}"예요.`;
            this.playSound('incorrect');
        }

        setTimeout(() => {
            if (this.currentQuiz < this.totalQuizzes) {
                this.currentQuiz++;
                this.showQuiz(this.currentQuiz);
            } else {
                setTimeout(() => this.nextScene(), 1500);
            }
        }, 2500);
    },

    getExplanation(quizNum, answer) {
        const explanations = {
            1: '"usually"가 있으니까 습관! Simple Present를 써요.',
            2: '"right now"가 있으니까 지금 진행 중! Present Continuous를 써요.',
            3: '지구가 태양 주위를 도는 건 과학적 사실! Simple Present를 써요.',
            4: '지금 영화를 보고 있는 중이니까 Present Continuous를 써요.'
        };
        return explanations[quizNum] || '';
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
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                this.nextScene();
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => ContentApp.init());
