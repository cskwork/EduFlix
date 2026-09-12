// Modal Can/Can't Content App
const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    currentQuiz: 1,
    totalQuizzes: 4,
    correctAnswers: {
        1: "can't",
        2: 'Can',
        3: 'can',
        4: 'can'
    },
    abilityAnswers: {
        1: 'can',
        2: "can't",
        3: 'can',
        4: "can't"
    },
    currentCard: 1,
    totalCards: 4,

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
        this.storyText = "안녕! 나는 탤런트 쇼에 나갈 지우야! 영어로 내 재능을 소개해야 하는데... '나는 노래할 수 있어'랑 '나는 춤 못 춰'를 영어로 어떻게 말해? can이랑 can't를 배우고 싶어!";
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

    // Core Scene - 능력 게임
    checkAbility(cardNum, answer) {
        const correct = this.abilityAnswers[cardNum];
        const isCorrect = answer === correct;

        const answerEl = document.getElementById(`answer-${cardNum}`);
        const buttons = document.querySelectorAll(`[data-card="${cardNum}"] button`);

        buttons.forEach(btn => btn.disabled = true);

        if (isCorrect) {
            answerEl.textContent = answer;
            answerEl.classList.add('correct');
            this.playSound('correct');
            this.speak(this.getFullSentence(cardNum, answer));
        } else {
            answerEl.textContent = answer;
            answerEl.classList.add('incorrect');
            this.playSound('incorrect');

            // 정답 보여주기
            setTimeout(() => {
                answerEl.textContent = correct;
                answerEl.classList.remove('incorrect');
                answerEl.classList.add('correct');
            }, 1500);
        }

        // 다음 카드로
        setTimeout(() => {
            if (this.currentCard < this.totalCards) {
                this.currentCard++;
                this.showCard(this.currentCard);
            } else {
                // 모든 카드 완료
                document.getElementById('discovery').classList.remove('hidden');
                document.getElementById('core-next-btn').classList.remove('hidden');
            }
        }, 2000);
    },

    getFullSentence(cardNum, answer) {
        const sentences = {
            1: `She ${answer} play the piano.`,
            2: `He ${answer} ride a bike.`,
            3: `They ${answer} swim very fast.`,
            4: `Tom ${answer} read Korean.`
        };
        return sentences[cardNum];
    },

    showCard(num) {
        document.querySelectorAll('.game-card').forEach(c => c.classList.remove('active'));
        const card = document.querySelector(`[data-card="${num}"]`);
        if (card) {
            card.classList.add('active');
        }
        document.getElementById('progress-count').textContent = num;
    },

    playSound(type) {
        if (!window.AudioContext && !window.webkitAudioContext) return;

        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        if (type === 'correct') {
            oscillator.frequency.value = 659.25; // E5
            oscillator.type = 'sine';
        } else {
            oscillator.frequency.value = 196; // G3
            oscillator.type = 'square';
        }

        gainNode.gain.value = 0.1;
        oscillator.start();

        setTimeout(() => {
            oscillator.stop();
            audioCtx.close();
        }, 150);
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
            let explanation = this.getExplanation(quizNum);
            feedback.innerHTML = `<strong>Excellent!</strong> ${explanation}`;
            this.playSound('correct');
        } else {
            feedback.classList.add('incorrect');
            feedback.innerHTML = `<strong>Try again!</strong> 정답은 "${correct}"예요. ${this.getExplanation(quizNum)}`;
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

    getExplanation(quizNum) {
        const explanations = {
            1: "아기는 아직 걸을 수 없어요 (6개월). can't가 맞아요!",
            2: "의문문은 Can으로 시작해요. Can you ~?",
            3: "he/she도 can은 그대로! cans 아니에요.",
            4: "Yes, I can. / No, I can't. 짧게 대답해요!"
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
