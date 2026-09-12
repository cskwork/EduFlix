// Content App - Travel Plans: Will vs Going to
const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],

    // Content Data
    contentData: {
        title: 'Travel Plans: Will vs Going to',
        gradeLevel: 'Elementary Grade 6',
        domain: 'grammar',

        // Core interaction sentences
        sentences: [
            {
                id: 1,
                context: '📅 You planned last week',
                sentence: "I'm going to visit the panda exhibit.",
                korean: '나 판다관 볼 거야. (지난주에 계획함)',
                category: 'planned',
                explanation: '이미 계획했으므로 "going to"를 사용해요.'
            },
            {
                id: 2,
                context: '💡 You just decided now',
                sentence: "I will buy this zoo map.",
                korean: '이 동물원 지도 살래. (지금 결정)',
                category: 'spontaneous',
                explanation: '지금 즉석에서 결정했으므로 "will"을 사용해요.'
            },
            {
                id: 3,
                context: '📅 You bought tickets yesterday',
                sentence: "We're going to see the lion show at 3pm.",
                korean: '우리 3시에 사자쇼 볼 거야. (어제 티켓 구매)',
                category: 'planned',
                explanation: '미리 티켓을 샀으므로 "going to"를 사용해요.'
            },
            {
                id: 4,
                context: '💡 Friend asks right now',
                sentence: "Yes, I will join you for lunch!",
                korean: '응, 너랑 점심 먹을게! (지금 결정)',
                category: 'spontaneous',
                explanation: '친구 제안에 지금 답하므로 "will"을 사용해요.'
            },
            {
                id: 5,
                context: '📅 You prepared food this morning',
                sentence: "I'm going to feed the giraffes.",
                korean: '나 기린한테 먹이 줄 거야. (아침에 준비함)',
                category: 'planned',
                explanation: '먹이를 미리 준비했으므로 "going to"를 사용해요.'
            },
            {
                id: 6,
                context: '💡 You see a gift shop',
                sentence: "I will get a souvenir for my sister.",
                korean: '여동생한테 기념품 사줄래. (지금 봤음)',
                category: 'spontaneous',
                explanation: '선물가게를 보고 지금 결정했으므로 "will"을 사용해요.'
            }
        ],

        // Quiz questions
        quizQuestions: [
            {
                id: 1,
                context: '🎫 At the zoo entrance',
                situation: 'Your friend asks: "Do you want to go to the zoo tomorrow?"',
                korean: '친구가 물어봐요: "내일 동물원 갈래?"',
                task: 'You already bought tickets last week. What do you say?',
                options: [
                    {
                        text: "Yes, I will go to the zoo tomorrow.",
                        isCorrect: false,
                        feedback: '❌ "Will"은 지금 결정할 때 써요. 하지만 이미 티켓을 샀어요!'
                    },
                    {
                        text: "Yes, I'm going to go to the zoo tomorrow.",
                        isCorrect: true,
                        feedback: '✅ Perfect! 지난주에 이미 계획했으므로 "going to"가 맞아요!'
                    },
                    {
                        text: "Yes, I go to the zoo tomorrow.",
                        isCorrect: false,
                        feedback: '이 상황은 이미 세운 개인 계획이므로 be going to가 자연스럽습니다. 단순 현재형도 정해진 시간표에는 미래 의미로 쓰일 수 있습니다.'
                    }
                ],
                hint: '언제 티켓을 샀나요? 이미 계획된 일이에요!'
            },
            {
                id: 2,
                context: '🦁 During the zoo visit',
                situation: 'You see a cute penguin toy at the gift shop.',
                korean: '선물가게에서 귀여운 펭귄 인형을 봤어요.',
                task: 'You suddenly want to buy it. What do you say?',
                options: [
                    {
                        text: "I'm going to buy this penguin toy.",
                        isCorrect: false,
                        feedback: '❌ "Going to"는 미리 계획한 일에 써요. 하지만 방금 봤어요!'
                    },
                    {
                        text: "I will buy this penguin toy.",
                        isCorrect: true,
                        feedback: '✅ Excellent! 지금 막 결정했으므로 "will"이 맞아요!'
                    },
                    {
                        text: "I buy this penguin toy.",
                        isCorrect: false,
                        feedback: '❌ 현재형이 아니라 미래 표현이 필요해요.'
                    }
                ],
                hint: '방금 본 순간에 결정했어요. 즉석 결정이에요!'
            },
            {
                id: 3,
                context: '🍕 Lunchtime at the zoo',
                situation: 'Your parents made a restaurant reservation this morning.',
                korean: '부모님이 오늘 아침에 식당 예약을 했어요.',
                task: 'What does your family say about lunch plans?',
                options: [
                    {
                        text: "We will have lunch at the zoo restaurant.",
                        isCorrect: false,
                        feedback: '❌ "Will"은 즉석 결정에 써요. 하지만 이미 예약했어요!'
                    },
                    {
                        text: "We have lunch at the zoo restaurant.",
                        isCorrect: false,
                        feedback: '이 상황에서는 미리 예약한 계획을 나타내는 be going to가 가장 알맞습니다. 영어의 미래 표현은 한 가지 시제로만 결정되지 않습니다.'
                    },
                    {
                        text: "We're going to have lunch at the zoo restaurant.",
                        isCorrect: true,
                        feedback: '✅ Perfect! 오늘 아침에 예약했으므로 "going to"가 맞아요!'
                    }
                ],
                hint: '언제 예약했나요? 오늘 아침에 이미 계획했어요!'
            }
        ]
    },

    // State
    userAnswers: {},
    currentQuizQuestion: 0,
    quizScore: 0,

    // Initialize
    init() {
        this.bindEvents();
        this.showScene(0);
    },

    // Scene Management
    showScene(index) {
        // Hide all scenes
        document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));

        // Show current scene
        const sceneId = `${this.scenes[index]}-scene`;
        const sceneElement = document.getElementById(sceneId);
        if (sceneElement) {
            sceneElement.classList.add('active');
        }

        this.currentScene = index;

        // Initialize scene-specific content
        const initMethod = `init${this.capitalizeFirst(this.scenes[index])}Scene`;
        if (typeof this[initMethod] === 'function') {
            this[initMethod]();
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

    // Scene Initializers
    initHookScene() {
        console.log('Hook scene initialized');
    },

    initAnchorScene() {
        console.log('Anchor scene initialized');
    },

    initStoryScene() {
        console.log('Story scene initialized');
    },

    initCoreScene() {
        this.renderSentenceCards();
        this.initDragDrop();
    },

    initVisualizeScene() {
        console.log('Visualize scene initialized');
    },

    initQuizScene() {
        this.currentQuizQuestion = 0;
        this.quizScore = 0;
        this.renderQuizQuestion();
    },

    initWrapScene() {
        console.log('Wrap scene initialized');
    },

    // Core Scene - Sentence Cards
    renderSentenceCards() {
        const container = document.getElementById('sentence-cards');
        container.innerHTML = '';

        this.contentData.sentences.forEach(sentence => {
            const card = document.createElement('div');
            card.className = 'sentence-card';
            card.draggable = true;
            card.dataset.id = sentence.id;
            card.dataset.category = sentence.category;

            card.innerHTML = `
                <div class="card-context">${sentence.context}</div>
                <div class="card-sentence english-text">${sentence.sentence}</div>
                <div class="card-korean">${sentence.korean}</div>
            `;

            card.addEventListener('dragstart', this.handleDragStart.bind(this));
            card.addEventListener('dragend', this.handleDragEnd.bind(this));

            container.appendChild(card);
        });
    },

    // Drag and Drop
    initDragDrop() {
        const dropZones = document.querySelectorAll('.drop-zone');

        dropZones.forEach(zone => {
            zone.addEventListener('dragover', this.handleDragOver.bind(this));
            zone.addEventListener('dragleave', this.handleDragLeave.bind(this));
            zone.addEventListener('drop', this.handleDrop.bind(this));
        });
    },

    handleDragStart(e) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.innerHTML);
        e.dataTransfer.setData('cardId', e.target.dataset.id);
        e.target.style.opacity = '0.4';
    },

    handleDragEnd(e) {
        e.target.style.opacity = '1';
    },

    handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.classList.add('drag-over');
        return false;
    },

    handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    },

    handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        e.preventDefault();

        e.currentTarget.classList.remove('drag-over');

        const cardId = e.dataTransfer.getData('cardId');
        const targetCategory = e.currentTarget.dataset.category;
        const cardElement = document.querySelector(`[data-id="${cardId}"]`);

        if (cardElement && !cardElement.classList.contains('placed')) {
            // Clone the card
            const clonedCard = cardElement.cloneNode(true);
            clonedCard.draggable = false;
            clonedCard.classList.add('placed');

            // Remove drop hint if exists
            const dropHint = e.currentTarget.querySelector('.drop-hint');
            if (dropHint) {
                dropHint.remove();
            }

            // Add to drop zone
            e.currentTarget.appendChild(clonedCard);

            // Hide original card
            cardElement.style.display = 'none';

            // Store user answer
            this.userAnswers[cardId] = targetCategory;

            // Check if all cards are placed
            if (Object.keys(this.userAnswers).length === this.contentData.sentences.length) {
                document.querySelector('.btn-check').style.display = 'inline-block';
            }
        }

        return false;
    },

    // Check Answers
    checkAnswers() {
        let correctCount = 0;
        const totalCount = this.contentData.sentences.length;

        this.contentData.sentences.forEach(sentence => {
            const userAnswer = this.userAnswers[sentence.id];
            const cardInZone = document.querySelector(`.drop-zone[data-category="${userAnswer}"] [data-id="${sentence.id}"]`);

            if (userAnswer === sentence.category) {
                correctCount++;
                if (cardInZone) {
                    cardInZone.classList.add('correct');
                }
            } else {
                if (cardInZone) {
                    cardInZone.classList.add('incorrect');
                }
            }
        });

        // Show feedback
        const feedbackArea = document.getElementById('feedback-area');
        feedbackArea.classList.add('show-feedback');

        if (correctCount === totalCount) {
            feedbackArea.className = 'feedback-area show-feedback success';
            feedbackArea.innerHTML = `
                <h3>🎉 Perfect! 모두 맞았어요!</h3>
                <p>Will과 Going to의 차이를 완벽하게 이해했어요!</p>
                <p><strong>${correctCount}/${totalCount}</strong> 정답</p>
            `;
            document.querySelector('.btn-next').style.display = 'inline-block';
        } else {
            feedbackArea.className = 'feedback-area show-feedback error';
            feedbackArea.innerHTML = `
                <h3>💪 조금 더 연습해봐요!</h3>
                <p><strong>${correctCount}/${totalCount}</strong> 정답</p>
                <p>힌트: 언제 결정했는지 생각해보세요!</p>
            `;
        }

        document.querySelector('.btn-check').style.display = 'none';
    },

    // Toggle Hint
    toggleHint() {
        const hintBox = document.getElementById('hint-box');
        if (hintBox.style.display === 'none') {
            hintBox.style.display = 'block';
        } else {
            hintBox.style.display = 'none';
        }
    },

    // Quiz Scene
    renderQuizQuestion() {
        const questionData = this.contentData.quizQuestions[this.currentQuizQuestion];
        const questionContainer = document.getElementById('quiz-question');

        questionContainer.innerHTML = `
            <div class="question-context">
                <h3>${questionData.context}</h3>
                <p class="question-situation english-text">${questionData.situation}</p>
                <p class="korean-translation">${questionData.korean}</p>
            </div>
            <p class="question-task">${questionData.task}</p>
            <div class="answer-options">
                ${questionData.options.map((option, index) => `
                    <div class="answer-option" data-index="${index}">
                        <span class="english-text">${option.text}</span>
                    </div>
                `).join('')}
            </div>
        `;

        // Update progress
        document.getElementById('current-question').textContent = this.currentQuizQuestion + 1;
        const progressPercent = ((this.currentQuizQuestion + 1) / this.contentData.quizQuestions.length) * 100;
        document.getElementById('progress-fill').style.width = `${progressPercent}%`;

        // Add click handlers
        document.querySelectorAll('.answer-option').forEach(option => {
            option.addEventListener('click', (e) => {
                // Remove previous selection
                document.querySelectorAll('.answer-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                // Select current
                e.currentTarget.classList.add('selected');
            });
        });

        // Reset feedback
        document.getElementById('quiz-feedback').innerHTML = '';
        document.getElementById('quiz-feedback').className = 'quiz-feedback';
        document.querySelector('.btn-next-quiz').style.display = 'none';
    },

    submitQuizAnswer() {
        const selectedOption = document.querySelector('.answer-option.selected');
        if (!selectedOption) {
            alert('답을 선택해주세요!');
            return;
        }

        const selectedIndex = parseInt(selectedOption.dataset.index);
        const questionData = this.contentData.quizQuestions[this.currentQuizQuestion];
        const selectedAnswer = questionData.options[selectedIndex];
        const feedbackContainer = document.getElementById('quiz-feedback');

        // Disable further selection
        document.querySelectorAll('.answer-option').forEach(opt => {
            opt.style.pointerEvents = 'none';
        });

        if (selectedAnswer.isCorrect) {
            this.quizScore++;
            selectedOption.classList.add('correct-answer');
            feedbackContainer.className = 'quiz-feedback correct';
            feedbackContainer.innerHTML = `
                <h3>🎉 정답이에요!</h3>
                <p>${selectedAnswer.feedback}</p>
            `;
        } else {
            selectedOption.classList.add('wrong-answer');
            // Show correct answer
            const correctIndex = questionData.options.findIndex(opt => opt.isCorrect);
            document.querySelector(`.answer-option[data-index="${correctIndex}"]`).classList.add('correct-answer');

            feedbackContainer.className = 'quiz-feedback incorrect';
            feedbackContainer.innerHTML = `
                <h3>💪 다시 한번 생각해봐요!</h3>
                <p>${selectedAnswer.feedback}</p>
            `;
        }

        // Show next button
        document.querySelector('.btn-submit').style.display = 'none';
        document.querySelector('.btn-hint').style.display = 'none';

        if (this.currentQuizQuestion < this.contentData.quizQuestions.length - 1) {
            document.querySelector('.btn-next-quiz').style.display = 'inline-block';
        } else {
            // Last question - show results and move to wrap
            setTimeout(() => {
                alert(`퀴즈 완료! ${this.quizScore}/${this.contentData.quizQuestions.length} 정답!`);
                this.nextScene();
            }, 2000);
        }
    },

    showQuizHint() {
        const questionData = this.contentData.quizQuestions[this.currentQuizQuestion];
        alert(`💡 힌트: ${questionData.hint}`);
    },

    nextQuiz() {
        this.currentQuizQuestion++;
        this.renderQuizQuestion();

        // Reset button visibility
        document.querySelector('.btn-submit').style.display = 'inline-block';
        document.querySelector('.btn-hint').style.display = 'inline-block';
        document.querySelector('.btn-next-quiz').style.display = 'none';
    },

    // Wrap Scene Actions
    restart() {
        this.userAnswers = {};
        this.currentQuizQuestion = 0;
        this.quizScore = 0;
        this.showScene(0);
    },

    practiceMode() {
        alert('자유 연습 모드는 개발 중입니다! 🚧');
        // In a full implementation, this would open a free practice interface
    },

    // Audio playback
    playAudio(text, lang = 'en-US') {
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            utterance.rate = 0.9;
            utterance.pitch = 1;
            speechSynthesis.speak(utterance);
        }
    },

    // Event binding
    bindEvents() {
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') {
                this.nextScene();
            } else if (e.key === 'ArrowLeft') {
                this.prevScene();
            }
        });
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ContentApp.init();
});

// Export for use in HTML onclick handlers
window.ContentApp = ContentApp;