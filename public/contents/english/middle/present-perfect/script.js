// Present Perfect Tense - Interactive Learning
const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    quizIndex: 0,
    quizScore: 0,
    
    // 콘텐츠 데이터
    contentData: {
        title: 'Present Perfect Tense',
        gradeLevel: 'Middle School 7-8',
        domain: 'grammar',
        targetLanguage: [
            'have/has + past participle',
            'I have visited Korea.',
            'She has lived here for 5 years.',
            'Have you ever eaten sushi?'
        ]
    },
    
    // 퀴즈 데이터
    quizData: [
        {
            context: '친구에게 한국 여행 경험을 묻고 싶어요.',
            sentence: '______ you ever ______ to Korea?',
            blanks: ['Have', 'been'],
            options: [
                { text: 'Have ... been', correct: true },
                { text: 'Did ... go', correct: false },
                { text: 'Are ... going', correct: false }
            ],
            feedback: {
                correct: '정답! "Have you ever been to...?" 는 경험을 물을 때 사용해요.',
                incorrect: '경험을 물을 때는 현재완료 "Have you ever + 과거분사...?"를 사용해요.'
            }
        },
        {
            context: '5년 전부터 지금까지 서울에 살고 있어요.',
            sentence: 'I ______ ______ in Seoul for 5 years.',
            blanks: ['have', 'lived'],
            options: [
                { text: 'have lived', correct: true },
                { text: 'am living', correct: false },
                { text: 'lived', correct: false }
            ],
            feedback: {
                correct: '정답! 과거부터 지금까지 계속되는 상황은 현재완료를 써요.',
                incorrect: '"for + 기간"과 함께 과거부터 현재까지를 나타낼 때는 현재완료를 사용해요.'
            }
        },
        {
            context: '방금 숙제를 끝냈어요!',
            sentence: 'I ______ just ______ my homework!',
            blanks: ['have', 'finished'],
            options: [
                { text: 'have ... finished', correct: true },
                { text: 'am ... finishing', correct: false },
                { text: 'was ... finished', correct: false }
            ],
            feedback: {
                correct: '정답! "just"와 함께 방금 완료된 일을 표현해요.',
                incorrect: '"just"는 방금 완료된 일을 표현할 때 현재완료와 함께 사용해요.'
            }
        }
    ],
    
    // 초기화
    init() {
        this.bindEvents();
        this.showScene(0);
        this.startTypewriter();
    },
    
    // 씬 전환
    showScene(index) {
        document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
        const sceneId = `${this.scenes[index]}-scene`;
        const sceneEl = document.getElementById(sceneId);
        if (sceneEl) {
            sceneEl.classList.add('active');
        }
        this.currentScene = index;
        this.updateProgress();
        
        // 씬별 초기화
        if (this.scenes[index] === 'core') {
            this.initCoreScene();
        } else if (this.scenes[index] === 'quiz') {
            this.initQuizScene();
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
    
    updateProgress() {
        const progress = ((this.currentScene + 1) / this.scenes.length) * 100;
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    },
    
    // 타자기 효과
    startTypewriter() {
        const textEl = document.getElementById('story-text');
        if (!textEl) return;
        
        const text = textEl.getAttribute('data-text');
        if (!text) return;
        
        textEl.textContent = '';
        let i = 0;
        
        const type = () => {
            if (i < text.length) {
                textEl.textContent += text.charAt(i);
                i++;
                setTimeout(type, 40);
            }
        };
        
        // 스토리 씬이 활성화될 때 실행
        setTimeout(type, 500);
    },
    
    // Core Scene 초기화
    initCoreScene() {
        this.setupDragDrop();
    },
    
    // 드래그 앤 드롭 설정
    setupDragDrop() {
        const words = document.querySelectorAll('.word-block[draggable="true"]');
        const slots = document.querySelectorAll('.drop-slot');
        
        words.forEach(word => {
            word.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', word.textContent.trim());
                e.dataTransfer.setData('word-type', word.dataset.type || '');
                word.classList.add('dragging');
            });
            
            word.addEventListener('dragend', () => {
                word.classList.remove('dragging');
            });
            
            // 터치 지원
            word.addEventListener('touchstart', (e) => {
                word.classList.add('dragging');
            });
            
            word.addEventListener('touchend', (e) => {
                word.classList.remove('dragging');
            });
        });
        
        slots.forEach(slot => {
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                slot.classList.add('highlight');
            });
            
            slot.addEventListener('dragleave', () => {
                slot.classList.remove('highlight');
            });
            
            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.classList.remove('highlight');
                
                const wordText = e.dataTransfer.getData('text/plain');
                const wordType = e.dataTransfer.getData('word-type');
                const expectedType = slot.dataset.expects;
                
                slot.textContent = wordText;
                slot.classList.add('filled');
                
                // 정답 확인
                if (expectedType && wordType === expectedType) {
                    slot.classList.add('correct');
                    this.markWordAsUsed(wordText);
                    this.checkAllSlotsFilled();
                } else if (expectedType) {
                    slot.classList.add('incorrect');
                    setTimeout(() => {
                        slot.textContent = '';
                        slot.classList.remove('filled', 'incorrect');
                    }, 1000);
                }
            });
        });
    },
    
    markWordAsUsed(text) {
        const words = document.querySelectorAll('.word-block');
        words.forEach(word => {
            if (word.textContent.trim() === text) {
                word.classList.add('used');
                word.setAttribute('draggable', 'false');
            }
        });
    },
    
    checkAllSlotsFilled() {
        const slots = document.querySelectorAll('.drop-slot');
        const allCorrect = Array.from(slots).every(slot => slot.classList.contains('correct'));
        
        if (allCorrect) {
            const discoveryBox = document.querySelector('.discovery-box');
            if (discoveryBox) {
                discoveryBox.classList.add('show');
            }
        }
    },
    
    // Quiz Scene 초기화
    initQuizScene() {
        this.quizIndex = 0;
        this.quizScore = 0;
        this.showQuiz(0);
    },
    
    showQuiz(index) {
        const quizItems = document.querySelectorAll('.quiz-item');
        quizItems.forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
        
        const progressText = document.getElementById('quiz-progress-text');
        if (progressText) {
            progressText.textContent = `${index + 1} / ${this.quizData.length}`;
        }
        
        // 피드백 숨기기
        const feedback = document.getElementById('quiz-feedback');
        if (feedback) {
            feedback.classList.remove('show', 'correct', 'incorrect');
        }
    },
    
    checkQuizAnswer(quizIndex, optionIndex) {
        const quiz = this.quizData[quizIndex];
        const option = quiz.options[optionIndex];
        const feedback = document.getElementById('quiz-feedback');
        
        // 모든 옵션 버튼 비활성화
        const buttons = document.querySelectorAll(`.quiz-item[data-quiz="${quizIndex}"] .quiz-option`);
        buttons.forEach((btn, i) => {
            btn.disabled = true;
            if (quiz.options[i].correct) {
                btn.classList.add('correct');
            } else if (i === optionIndex) {
                btn.classList.add('incorrect');
            }
        });
        
        // 피드백 표시
        if (feedback) {
            feedback.textContent = option.correct ? quiz.feedback.correct : quiz.feedback.incorrect;
            feedback.classList.add('show', option.correct ? 'correct' : 'incorrect');
        }
        
        if (option.correct) {
            this.quizScore++;
        }
        
        // 다음 문제 또는 완료
        setTimeout(() => {
            if (quizIndex < this.quizData.length - 1) {
                this.quizIndex++;
                this.showQuiz(this.quizIndex);
                // 버튼 다시 활성화
                const nextButtons = document.querySelectorAll(`.quiz-item[data-quiz="${this.quizIndex}"] .quiz-option`);
                nextButtons.forEach(btn => btn.disabled = false);
            } else {
                this.nextScene();
            }
        }, 2000);
    },
    
    // 발음 재생
    playAudio(text, lang = 'en-US') {
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            utterance.rate = 0.9;
            speechSynthesis.speak(utterance);
        }
    },
    
    // 이벤트 바인딩
    bindEvents() {
        // 키보드 네비게이션
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') {
                this.nextScene();
            } else if (e.key === 'ArrowLeft') {
                this.prevScene();
            }
        });
    }
};

// 앱 시작
document.addEventListener('DOMContentLoaded', () => ContentApp.init());
