// Content App - Travel Plans: will vs going to
const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],

    // Core interaction data
    situations: [
        {
            number: 1,
            type: 'planned',
            context: '소연이가 금요일에 친구에게 말해요: "나 토요일에 새로운 도서관 갈 거야."',
            prefix: 'I',
            suffix: 'visit the new library on Saturday.',
            correctAnswer: 'going to',
            hint: '이미 계획한 일이에요. 금요일에 토요일 계획을 말하고 있어요!',
            explanation: '✓ 맞았어요! "going to"는 이미 계획한 미래를 나타내요. 소연이는 미리 생각해둔 계획을 말하고 있어요.'
        },
        {
            number: 2,
            type: 'spontaneous',
            context: '친구가 무거운 책을 들고 있어요. 소연이가 갑자기 말해요:',
            prefix: 'Oh! I',
            suffix: 'help you carry those books!',
            correctAnswer: 'will',
            hint: '지금 막 결정한 일이에요. 친구를 보고 바로 결정했어요!',
            explanation: '✓ 정확해요! "will"은 지금 순간 결정한 일을 나타내요. 소연이가 친구를 보고 즉석에서 결정했어요.'
        },
        {
            number: 3,
            type: 'planned',
            context: '소연이가 엄마에게 말해요: "저는 이번 달에 책 10권 읽기로 계획했어요."',
            prefix: 'I',
            suffix: 'read 10 books this month.',
            correctAnswer: 'going to',
            hint: '이미 세운 계획이에요. "계획했어요"라는 말이 힌트!',
            explanation: '✓ 훌륭해요! 이미 세운 계획이므로 "going to"를 사용해요.'
        },
        {
            number: 4,
            type: 'spontaneous',
            context: '도서관에서 전화벨이 울려요. 소연이가 말해요:',
            prefix: 'Wait! I',
            suffix: 'answer it!',
            correctAnswer: 'will',
            hint: '전화벨이 울리는 순간에 결정한 거예요!',
            explanation: '✓ 맞아요! 전화벨에 반응해서 즉시 결정한 일이므로 "will"을 써요.'
        },
        {
            number: 5,
            type: 'planned',
            context: '소연이가 일기에 써요: "다음 주에 해리포터 시리즈를 빌릴 거야. 벌써 메모해뒀어."',
            prefix: 'I',
            suffix: 'borrow the Harry Potter series next week.',
            correctAnswer: 'going to',
            hint: '벌써 메모해둔 계획이에요!',
            explanation: '✓ 완벽해요! 미리 메모해둔 계획이므로 "going to"가 맞아요.'
        },
        {
            number: 6,
            type: 'spontaneous',
            context: '친구가 "이 책 재미있어?"라고 물어봐요. 소연이가 갑자기:',
            prefix: 'Hmm... I',
            suffix: 'read it and tell you tomorrow!',
            correctAnswer: 'will',
            hint: '친구의 질문을 듣고 지금 결정한 거예요!',
            explanation: '✓ 정확해요! 친구의 질문에 즉석에서 결정한 약속이므로 "will"을 써요.'
        }
    ],

    currentSituation: 0,
    completedSituations: 0,

    // Quiz data
    quizQuestions: [
        {
            situation: '📱 친구가 갑자기 전화로 도움을 요청해요',
            description: '친구: "Can you help me with my homework?" / 당신: "Sure! ___"',
            question: 'I ___ come to your house right now.',
            options: [
                { text: "will", correct: true },
                { text: "am going to", correct: false }
            ],
            hint: '전화를 받고 즉시 결정한 일이에요!',
            explanation: '"will"이 정답이에요! 전화를 받고 그 순간에 결정한 일이므로 "will"을 사용해요.',
            icon: '📱'
        },
        {
            situation: '📅 이미 계획한 주말 활동에 대해 말하고 있어요',
            description: '엄마: "What are your weekend plans?" / 당신: ___',
            question: 'I ___ visit the bookstore on Saturday. I already told my friend.',
            options: [
                { text: "will", correct: false },
                { text: "am going to", correct: true }
            ],
            hint: '"already told"가 힌트예요. 이미 계획했어요!',
            explanation: '"am going to"가 정답이에요! 이미 친구에게 말한 계획이므로 "going to"를 사용해요.',
            icon: '📅'
        },
        {
            situation: '⚡ 친구가 갑자기 무언가를 떨어뜨렸어요',
            description: '친구가 책을 떨어뜨려요. 당신이 바로:',
            question: 'Oh! I ___ pick it up for you!',
            options: [
                { text: "will", correct: true },
                { text: "am going to", correct: false }
            ],
            hint: '떨어뜨리는 걸 보고 즉시 반응한 거예요!',
            explanation: '"will"이 정답이에요! 상황을 보고 즉석에서 결정한 제안이므로 "will"을 사용해요.',
            icon: '⚡'
        }
    ],

    currentQuiz: 0,
    quizScore: 0,

    // Initialize
    init() {
        console.log('ContentApp initialized');
        this.bindEvents();
        this.showScene(0);
    },

    // Scene navigation
    showScene(index) {
        document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
        const sceneId = `${this.scenes[index]}-scene`;
        const sceneElement = document.getElementById(sceneId);
        if (sceneElement) {
            sceneElement.classList.add('active');
            this.currentScene = index;

            // Initialize scene-specific logic
            const initMethod = `init${this.capitalizeFirst(this.scenes[index])}Scene`;
            if (typeof this[initMethod] === 'function') {
                this[initMethod]();
            }
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

    // Core Scene
    initCoreScene() {
        this.currentSituation = 0;
        this.completedSituations = 0;
        this.loadSituation();
        this.setupDragAndDrop();
    },

    loadSituation() {
        const situation = this.situations[this.currentSituation];

        // Update situation card
        document.querySelector('.situation-number').textContent = `상황 ${situation.number}`;

        const typeLabel = document.querySelector('.situation-type');
        if (situation.type === 'planned') {
            typeLabel.textContent = '📅 계획된 일';
            typeLabel.className = 'situation-type type-planned';
        } else {
            typeLabel.textContent = '⚡ 즉석 결정';
            typeLabel.className = 'situation-type type-spontaneous';
        }

        document.querySelector('.context-text').textContent = situation.context;
        document.querySelector('.part-fixed').textContent = situation.prefix + ' ';
        document.querySelector('.part-fixed-end').textContent = ' ' + situation.suffix;

        // Reset drop zone
        const dropZone = document.getElementById('drop-zone');
        dropZone.innerHTML = '<span class="placeholder">여기에 드래그</span>';
        dropZone.classList.remove('filled');
        dropZone.dataset.answer = '';

        // Reset word blocks
        document.querySelectorAll('.word-block').forEach(block => {
            block.classList.remove('used');
            block.draggable = true;
        });

        // Hide feedback and button
        document.getElementById('feedback').classList.remove('show', 'correct', 'incorrect');
        document.getElementById('btn-continue').style.display = 'none';

        // Hide hint
        document.getElementById('hint-content').classList.remove('show');
    },

    setupDragAndDrop() {
        const wordBlocks = document.querySelectorAll('.word-block');
        const dropZone = document.getElementById('drop-zone');

        // Word blocks drag events
        wordBlocks.forEach(word => {
            word.addEventListener('dragstart', (e) => {
                if (!word.classList.contains('used')) {
                    e.dataTransfer.setData('text/plain', word.dataset.answer);
                    word.classList.add('dragging');
                }
            });

            word.addEventListener('dragend', () => {
                word.classList.remove('dragging');
            });

            // Touch events for mobile
            word.addEventListener('touchstart', (e) => {
                if (!word.classList.contains('used')) {
                    word.classList.add('dragging');
                }
            });

            word.addEventListener('touchend', (e) => {
                word.classList.remove('dragging');
                const touch = e.changedTouches[0];
                const dropElement = document.elementFromPoint(touch.clientX, touch.clientY);
                if (dropElement && dropElement.closest('#drop-zone')) {
                    this.handleDrop(word.dataset.answer);
                }
            });
        });

        // Drop zone events
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
            const answer = e.dataTransfer.getData('text/plain');
            this.handleDrop(answer);
        });
    },

    handleDrop(answer) {
        const situation = this.situations[this.currentSituation];
        const dropZone = document.getElementById('drop-zone');
        const feedback = document.getElementById('feedback');

        // Update drop zone
        dropZone.innerHTML = `<span class="english-text">${answer}</span>`;
        dropZone.classList.add('filled');
        dropZone.dataset.answer = answer;

        // Mark word as used
        document.querySelectorAll('.word-block').forEach(block => {
            if (block.dataset.answer === answer) {
                block.classList.add('used');
                block.draggable = false;
            }
        });

        // Check answer
        const isCorrect = answer === situation.correctAnswer;

        if (isCorrect) {
            feedback.className = 'feedback show correct';
            feedback.textContent = situation.explanation;
            this.completedSituations++;
            this.updateProgress();

            // Show continue button
            setTimeout(() => {
                const btnContinue = document.getElementById('btn-continue');
                if (this.currentSituation < this.situations.length - 1) {
                    btnContinue.textContent = '다음 상황 →';
                } else {
                    btnContinue.textContent = '시각화 보러 가기 →';
                }
                btnContinue.style.display = 'block';
            }, 500);
        } else {
            feedback.className = 'feedback show incorrect';
            feedback.innerHTML = '❌ 다시 생각해보세요! 💡힌트를 확인해보세요.';

            // Allow retry
            setTimeout(() => {
                dropZone.innerHTML = '<span class="placeholder">여기에 드래그</span>';
                dropZone.classList.remove('filled');
                document.querySelectorAll('.word-block').forEach(block => {
                    block.classList.remove('used');
                    block.draggable = true;
                });
            }, 1500);
        }
    },

    updateProgress() {
        const progress = (this.completedSituations / this.situations.length) * 100;
        document.getElementById('progress-fill').style.width = progress + '%';
        document.getElementById('progress-text').textContent =
            `${this.completedSituations}/${this.situations.length}`;
    },

    nextSituation() {
        if (this.currentSituation < this.situations.length - 1) {
            this.currentSituation++;
            this.loadSituation();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            this.nextScene();
        }
    },

    showHint() {
        const situation = this.situations[this.currentSituation];
        const hintContent = document.getElementById('hint-content');
        hintContent.textContent = situation.hint;
        hintContent.classList.toggle('show');
    },

    // Quiz Scene
    initQuizScene() {
        this.currentQuiz = 0;
        this.quizScore = 0;
        this.loadQuiz();
    },

    loadQuiz() {
        const quiz = this.quizQuestions[this.currentQuiz];

        // Update progress
        document.getElementById('quiz-progress-text').textContent =
            `문제 ${this.currentQuiz + 1}/${this.quizQuestions.length}`;

        // Update situation
        document.querySelector('.situation-icon').textContent = quiz.icon;
        document.querySelector('.situation-desc').textContent = quiz.description;

        // Update question
        document.querySelector('.question-text').textContent = quiz.question;

        // Generate options
        const optionsContainer = document.querySelector('.quiz-options');
        optionsContainer.innerHTML = '';

        quiz.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'quiz-option';
            optionDiv.innerHTML = `<span class="english-text">${option.text}</span>`;
            optionDiv.dataset.correct = option.correct;
            optionDiv.addEventListener('click', () => this.handleQuizAnswer(optionDiv, option.correct));
            optionsContainer.appendChild(optionDiv);
        });

        // Reset feedback
        document.getElementById('quiz-feedback').classList.remove('show', 'correct', 'incorrect');
        document.getElementById('quiz-hint-content').classList.remove('show');
        document.getElementById('btn-quiz-next').style.display = 'none';
    },

    handleQuizAnswer(optionElement, isCorrect) {
        // Disable all options
        document.querySelectorAll('.quiz-option').forEach(opt => {
            opt.classList.add('disabled');
            opt.style.pointerEvents = 'none';
        });

        const quiz = this.quizQuestions[this.currentQuiz];
        const feedback = document.getElementById('quiz-feedback');

        if (isCorrect) {
            optionElement.classList.add('correct');
            feedback.className = 'quiz-feedback show correct';
            feedback.textContent = '✓ ' + quiz.explanation;
            this.quizScore++;

            // Show next button
            setTimeout(() => {
                const btnNext = document.getElementById('btn-quiz-next');
                if (this.currentQuiz < this.quizQuestions.length - 1) {
                    btnNext.textContent = '다음 문제 →';
                } else {
                    btnNext.textContent = '완료하기 →';
                }
                btnNext.style.display = 'block';
            }, 500);
        } else {
            optionElement.classList.add('incorrect');
            feedback.className = 'quiz-feedback show incorrect';
            feedback.textContent = '❌ 아쉬워요! 힌트를 확인하고 다시 시도해보세요.';

            // Allow retry
            setTimeout(() => {
                document.querySelectorAll('.quiz-option').forEach(opt => {
                    opt.classList.remove('disabled', 'incorrect');
                    opt.style.pointerEvents = 'auto';
                });
                feedback.classList.remove('show');
            }, 2000);
        }
    },

    nextQuiz() {
        if (this.currentQuiz < this.quizQuestions.length - 1) {
            this.currentQuiz++;
            this.loadQuiz();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            this.nextScene();
        }
    },

    showQuizHint() {
        const quiz = this.quizQuestions[this.currentQuiz];
        const hintContent = document.getElementById('quiz-hint-content');
        hintContent.textContent = quiz.hint;
        hintContent.classList.toggle('show');
    },

    // Wrap Scene
    retry() {
        this.currentScene = 0;
        this.currentSituation = 0;
        this.completedSituations = 0;
        this.currentQuiz = 0;
        this.quizScore = 0;
        this.showScene(0);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    freeExplore() {
        alert('🎮 자유 연습 모드는 곧 추가될 예정입니다!\n\n이 모드에서는:\n✓ 원하는 상황을 선택해서 연습\n✓ 나만의 문장 만들기\n✓ 실시간 발음 연습\n\n기대해주세요!');
    },

    bindEvents() {
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') {
                // Next scene shortcut (for development)
            }
        });
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ContentApp.init();
});

// Prevent accidental navigation
window.addEventListener('beforeunload', (e) => {
    if (ContentApp.currentScene > 0 && ContentApp.currentScene < ContentApp.scenes.length - 1) {
        e.preventDefault();
        e.returnValue = '';
    }
});
