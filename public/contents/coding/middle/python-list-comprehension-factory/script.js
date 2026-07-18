/* ========================================
   Inline EduFlix Engine
   ======================================== */
class Scene {
    constructor(id, element) {
        this.id = id;
        this.element = element;
        this.onEnter = null;
        this.onExit = null;
    }

    show() {
        this.element.classList.add('active');
        if (this.onEnter) this.onEnter();
    }

    hide() {
        this.element.classList.remove('active');
        if (this.onExit) this.onExit();
    }
}

class EduFlixEngine {
    constructor() {
        this.scenes = new Map();
        this.currentSceneId = null;
        this.data = {};
        this.container = document.getElementById('scene-container');
        this.currentQuizIndex = 0;
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'scene-container';
            document.body.appendChild(this.container);
        }
    }

    init(gameData) {
        this.data = gameData;
        this.createScenes();
        this.start();
    }

    escapeHtml(value) {
        return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    isImagePath(value) {
        return /^(?:\.{0,2}\/|assets\/|https?:\/\/|data:image\/)/i.test(value) || /\.(svg|png|jpe?g|gif|webp|avif)$/i.test(value);
    }

    getCharacterMarkup(character) {
        if (!character) return '';
        if (character.html) return character.html;
        if (!character.image) return '';
        const imageValue = String(character.image);
        if (this.isImagePath(imageValue)) {
            const altText = character.alt ? this.escapeHtml(character.alt) : '캐릭터';
            return `<img class="story-character-image" src="${this.escapeHtml(imageValue)}" alt="${altText}" />`;
        }
        return '';
    }

    createScenes() {
        this.createScene('hook', (scene) => {
            const { question, subText, visual } = this.data.hook;
            scene.innerHTML = `
                <div class="hook-content">
                    <div class="learning-objective">
                        <strong>학습 목표</strong>
                        <p>리스트 컴프리헨션의 작동 원리와 range() 함수의 특징을 이해하고, 코드의 결과값을 예측할 수 있습니다.</p>
                    </div>
                    <div class="mystery-boxes">
                        <div class="box"><svg class="lock-icon" viewBox="0 0 24 24" role="img" aria-label="잠긴 상자"><title>잠긴 상자</title><path d="M12 1C9.243 1 7 3.243 7 6v3H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V11a2 2 0 00-2-2h-1V6c0-2.757-2.243-5-5-5zm-3 8V6c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9z"/></svg></div>
                        <div class="box"><svg class="lock-icon" viewBox="0 0 24 24" role="img" aria-label="잠긴 상자"><title>잠긴 상자</title><path d="M12 1C9.243 1 7 3.243 7 6v3H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V11a2 2 0 00-2-2h-1V6c0-2.757-2.243-5-5-5zm-3 8V6c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9z"/></svg></div>
                        <div class="box"><svg class="lock-icon" viewBox="0 0 24 24" role="img" aria-label="잠긴 상자"><title>잠긴 상자</title><path d="M12 1C9.243 1 7 3.243 7 6v3H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V11a2 2 0 00-2-2h-1V6c0-2.757-2.243-5-5-5zm-3 8V6c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9z"/></svg></div>
                    </div>
                    <div class="question-box">
                        <h1 class="hook-question">${question}</h1>
                        ${subText ? `<p class="scene-text">${subText}</p>` : ''}
                    </div>
                    <div class="code-display">${visual.content}</div>
                    <button class="btn btn-primary-large" onclick="Engine.nextScene()">기계 조작법 배우기</button>
                </div>
            `;
        });

        this.createScene('story', (scene) => {
            const { character, situation } = this.data.story;
            scene.innerHTML = `
                <div class="story-stage">
                    <div class="robot-container">${this.getCharacterMarkup(character)}</div>
                    <div class="scene-text typing-effect">${situation}</div>
                    <button class="btn btn-primary-large animate-fade-in" onclick="Engine.nextScene()">공장 가동 시작하기</button>
                </div>
            `;
        });

        this.createScene('core', (scene) => {
            scene.innerHTML = `
                <h2 class="scene-title">${this.data.interaction.title || '체험하기'}</h2>
                <p class="scene-text">${this.data.interaction.instruction}</p>
                <div class="interactive-area" id="core-interactive-area"></div>
                <div class="feedback-box" id="core-feedback"></div>
                <button class="btn btn-primary-large hidden" id="core-next-btn" onclick="Engine.nextScene()">결과 확인하러 가기</button>
            `;
        }, () => { 
            if (this.data.interaction.onInit) this.data.interaction.onInit(document.getElementById('core-interactive-area'), this); 
        });

        this.createScene('quiz', (scene) => {
            scene.innerHTML = `
                <h2 class="scene-title">코드 점검 퀴즈!</h2>
                <div class="scene-text" id="quiz-question"></div>
                <div class="quiz-container" id="quiz-options"></div>
                <div id="quiz-feedback-area"></div>
                <button class="btn btn-primary-large hidden" id="quiz-next-btn" onclick="Engine.nextQuiz()">다음 문제</button>
            `;
        }, () => { 
            this.currentQuizIndex = 0; 
            this.startQuiz(); 
        });

        this.createScene('wrap', (scene) => {
            const recap = this.data.wrap.recap.map(item => `
                <div class="recap-item">
                    <div class="recap-icon">${item.step}</div>
                    <div><strong>${item.title}</strong><br>${item.desc}</div>
                </div>
            `).join('');

            scene.innerHTML = `
                <h1 class="scene-title">학습 완료!</h1>
                <div class="wrap-summary">
                    <p class="scene-text">${this.data.wrap.message}</p>
                    <div class="recap-grid">${recap}</div>
                </div>
                <div style="display:flex; gap:15px; flex-wrap:wrap; justify-content:center;">
                    <button class="btn btn-secondary-large" onclick="location.reload()">다시 학습하기</button>
                    <button class="btn btn-primary-large" onclick="window.parent.postMessage('close', '*')">학습 종료하기</button>
                </div>
            `;
        });
    }

    createScene(id, renderFn, onEnterFn) {
        let sceneEl = document.createElement('div');
        sceneEl.id = `scene-${id}`;
        sceneEl.className = `scene scene-${id}`;
        renderFn(sceneEl);
        this.container.appendChild(sceneEl);
        const scene = new Scene(id, sceneEl);
        if (onEnterFn) scene.onEnter = onEnterFn;
        this.scenes.set(id, scene);
    }

    switchScene(sceneId) {
        if (this.currentSceneId) this.scenes.get(this.currentSceneId).hide();
        if (this.scenes.has(sceneId)) {
            this.currentSceneId = sceneId;
            this.scenes.get(sceneId).show();
            
            // Progress Bar Update
            const order = ['hook', 'story', 'core', 'quiz', 'wrap'];
            const currentIndex = order.indexOf(sceneId);
            const progressPercent = ((currentIndex + 1) / order.length) * 100;
            const progressBar = document.getElementById('progress-bar');
            if (progressBar) {
                progressBar.style.width = `${progressPercent}%`;
            }
        }
    }

    nextScene() {
        const order = ['hook', 'story', 'core', 'quiz', 'wrap'];
        const currentIndex = order.indexOf(this.currentSceneId);
        if (currentIndex < order.length - 1) this.switchScene(order[currentIndex + 1]);
    }

    start() { this.switchScene('hook'); }

    showFeedback(msg, type = 'neutral') {
        const el = document.getElementById('core-feedback');
        if (el) {
            el.innerHTML = msg;
            el.className = `feedback-box feedback-${type}`;
        }
    }

    enableNext() {
        const btn = document.getElementById('core-next-btn');
        if (btn) {
            btn.classList.remove('hidden');
            btn.classList.add('animate-fade-in');
        }
    }

    startQuiz() {
        if (this.currentQuizIndex >= this.data.quiz.length) {
            this.nextScene(); // wrap으로 이동
            return;
        }

        const q = this.data.quiz[this.currentQuizIndex];
        document.getElementById('quiz-question').innerHTML = q.prompt;
        
        const optsContainer = document.getElementById('quiz-options');
        const feedbackArea = document.getElementById('quiz-feedback-area');
        const nextBtn = document.getElementById('quiz-next-btn');
        
        optsContainer.innerHTML = '';
        feedbackArea.innerHTML = '';
        nextBtn.classList.add('hidden');

        q.choices.forEach((opt) => {
            const btn = document.createElement('div');
            btn.className = 'quiz-option';
            btn.textContent = opt.text;
            btn.tabIndex = 0;
            btn.onclick = () => this.checkQuiz(opt.id === q.correctChoiceId, btn, q);
            btn.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.checkQuiz(opt.id === q.correctChoiceId, btn, q);
                }
            };
            optsContainer.appendChild(btn);
        });
    }

    checkQuiz(isCorrect, btnElement, q) {
        const feedbackArea = document.getElementById('quiz-feedback-area');
        
        if (isCorrect) {
            const opts = document.querySelectorAll('.quiz-option');
            opts.forEach(o => o.style.pointerEvents = 'none');
            btnElement.classList.add('correct');
            feedbackArea.innerHTML = `<div class="feedback-positive">${q.correctFeedback}</div>`;
            document.getElementById('quiz-next-btn').classList.remove('hidden');
        } else {
            btnElement.classList.add('incorrect');
            btnElement.style.pointerEvents = 'none'; // 오답 비활성화
            feedbackArea.innerHTML = `<div class="feedback-negative">${q.incorrectFeedback}</div><div class="quiz-hint">힌트: ${q.hint}</div>`;
        }
    }

    nextQuiz() {
        this.currentQuizIndex++;
        this.startQuiz();
    }
}

window.Engine = new EduFlixEngine();

/* ========================================
   Content Code: 파이썬 리스트 컴프리헨션 공장
   ======================================== */

const listCompData = {
    title: "파이썬 복제 기계: 리스트 컴프리헨션 공장",
    hook: {
        question: "미스터리 상자를 여는 암호는 무엇을 의미할까요?",
        subText: "공장에 도착한 상자 위에 기묘한 설계도가 놓여 있습니다.",
        visual: {
            type: "code",
            content: "[x*2 for x in range(3)]"
        }
    },
    story: {
        character: {
            html: `<svg viewBox="0 0 100 100" width="100%" height="100%">
                <rect x="25" y="30" width="50" height="50" rx="15" fill="#4A90E2"/>
                <rect x="35" y="45" width="10" height="10" rx="2" fill="white"/>
                <rect x="55" y="45" width="10" height="10" rx="2" fill="white"/>
                <rect x="38" y="48" width="4" height="4" fill="#2D3436"/>
                <rect x="58" y="48" width="4" height="4" fill="#2D3436"/>
                <path d="M 40 65 Q 50 72 60 65" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/>
                <line x1="50" y1="30" x2="50" y2="20" stroke="#B2BEC3" stroke-width="3"/>
                <circle cx="50" cy="15" r="5" fill="#FF7675"/>
                <rect x="15" y="60" width="10" height="20" rx="4" fill="#4834B5"/>
                <rect x="75" y="60" width="10" height="20" rx="4" fill="#4834B5"/>
            </svg>`,
            alt: "파란색 로봇 안내자 코더"
        },
        situation: "반가워요! 저는 안내자 로봇 '코더'예요.<br>이 암호는 <strong>리스트 컴프리헨션(List Comprehension)</strong>이라는 자동화 기계 조종법이에요!<br>range(3)으로 원재료를 꺼내서 x*2로 변환한 뒤 리스트 상자에 담아준답니다."
    },
    interaction: {
        title: "리스트 컴프리헨션 공장",
        instruction: "range(3) 창고에서 숫자 카드를 끌어다 놓거나 클릭하여 변환 슬롯에 넣고, 레버를 당겨보세요!",
        onInit: (container, engine) => {
            let processedCount = 0;
            let currentSlotValue = null;
            
            container.innerHTML = `
                <div class="factory-grid">
                    <div class="machine-section">
                        <div class="section-label">range(3) 창고</div>
                        <div class="cards-pool" id="card-pool"></div>
                    </div>
                    
                    <div class="machine-section">
                        <div class="section-label">x*2 변환 슬롯</div>
                        <div class="slot-zone" id="drop-zone"></div>
                    </div>
                    
                    <div class="factory-controls">
                        <button class="btn btn-primary" id="lever-btn" disabled>기계 가동 (레버 당기기)</button>
                    </div>
                    
                    <div class="list-bracket-box">
                        <span class="bracket">[</span>
                        <div class="list-content" id="list-content"></div>
                        <span class="bracket">]</span>
                    </div>
                </div>
            `;

            const cardPool = container.querySelector('#card-pool');
            const dropZone = container.querySelector('#drop-zone');
            const leverBtn = container.querySelector('#lever-btn');
            const listContent = container.querySelector('#list-content');

            // 숫자 카드 생성
            const availableNumbers = [0, 1, 2, 3];
            availableNumbers.forEach(num => {
                const card = document.createElement('div');
                card.className = 'num-card';
                card.textContent = num;
                card.tabIndex = 0; // 키보드 접근성
                card.dataset.value = num;
                
                // 드래그 이벤트
                card.draggable = true;
                card.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', num);
                });

                // 클릭 및 키보드 이벤트 (접근성 및 모바일 지원)
                const selectCard = () => handleCardInput(num, card);
                card.onclick = selectCard;
                card.onkeydown = (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectCard();
                    }
                };

                cardPool.appendChild(card);
            });

            // 드롭존 이벤트
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('hover');
            });
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('hover');
            });
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('hover');
                const num = parseInt(e.dataTransfer.getData('text/plain'), 10);
                const card = cardPool.querySelector(`[data-value="${num}"]`);
                if (card && !card.classList.contains('used')) {
                    handleCardInput(num, card);
                }
            });

            function handleCardInput(num, cardElement) {
                if (currentSlotValue !== null) return; // 이미 슬롯에 값이 있음
                
                // 오개념 교정: 3을 넣었을 때
                if (num === 3) {
                    engine.showFeedback("기계가 멈췄어요! 파이썬의 range(3)는 0부터 시작해서 3 직전(0, 1, 2)까지의 숫자만 만들어요. 3은 사용할 수 없어요!", "negative");
                    
                    // 튕겨나가는 애니메이션
                    cardElement.style.animation = "shake 0.4s ease";
                    setTimeout(() => { cardElement.style.animation = ""; }, 400);
                    return;
                }

                // 정상 입력 처리
                currentSlotValue = num;
                cardElement.classList.add('used');
                
                dropZone.innerHTML = `<div class="num-card" style="cursor:default; background:var(--primary-light); color:white;">${num}</div>`;
                dropZone.classList.add('active');
                leverBtn.disabled = false;
                
                engine.showFeedback(`원재료 ${num}번이 들어갔어요. 레버를 당겨 변환 공식(x*2)을 적용해 보세요!`, "neutral");
            }

            // 레버 이벤트
            leverBtn.addEventListener('click', () => {
                if (currentSlotValue === null || processedCount >= 3) return;

                leverBtn.disabled = true;
                const originalVal = currentSlotValue;
                const transformedVal = originalVal * 2;

                // 변환 애니메이션 및 결과 출력
                engine.showFeedback(`톱니바퀴가 돌아갑니다! x*2 공식을 통과해 ${originalVal} * 2 = ${transformedVal}이 되었어요!`, "positive");

                setTimeout(() => {
                    // 리스트에 결과 추가
                    const resultCard = document.createElement('div');
                    resultCard.className = 'result-card';
                    resultCard.textContent = transformedVal;
                    listContent.appendChild(resultCard);

                    // 슬롯 초기화
                    dropZone.innerHTML = '';
                    dropZone.classList.remove('active');
                    currentSlotValue = null;
                    processedCount++;

                    if (processedCount === 3) {
                        engine.showFeedback("멋지게 리스트 [0, 2, 4]가 완성되었어요! 대괄호 상자 안에 잘 모였네요.", "positive");
                        // 다음 버튼 활성화
                        setTimeout(() => engine.enableNext(), 500);
                    } else {
                        engine.showFeedback("다음 원재료를 슬롯에 넣어주세요. (아직 3개를 다 만들지 못했어요)", "neutral");
                    }
                }, 600);
            });
        }
    },
    quiz: [
        {
            id: "Q1",
            prompt: "코드: <span style='color:#00CEC9; font-family:monospace;'>[x for x in range(3)]</span> 의 결과로 알맞은 것은?",
            choices: [
                { id: "A", text: "[1, 2, 3]" },
                { id: "B", text: "[0, 1, 2]" },
                { id: "C", text: "[0, 1, 2, 3]" },
                { id: "D", text: "[1, 2]" }
            ],
            correctChoiceId: "B",
            correctFeedback: "정답입니다! range(3)는 0부터 3직전까지(0, 1, 2)를 만들어내요.",
            incorrectFeedback: "앗, 틀렸어요! range(3)의 범위를 다시 생각해 보세요.",
            hint: "파이썬에서 숫자를 셀 때는 0부터 시작합니다."
        },
        {
            id: "Q2",
            prompt: "코드: <span style='color:#00CEC9; font-family:monospace;'>[x*2 for x in range(2)]</span> 의 결과로 알맞은 것은?",
            choices: [
                { id: "A", text: "[0, 2]" },
                { id: "B", text: "[2, 4]" },
                { id: "C", text: "[0, 1, 2]" },
                { id: "D", text: "[0, 2, 4]" }
            ],
            correctChoiceId: "A",
            correctFeedback: "정답입니다! range(2)로 0, 1이 나오고 각각 2를 곱해서 0, 2가 되었어요.",
            incorrectFeedback: "틀렸어요. range의 숫자를 먼저 확인하세요.",
            hint: "range(2)는 0과 1 두 개의 숫자를 만들어냅니다. 그것들을 각각 2배 해보세요."
        },
        {
            id: "Q3",
            prompt: "코드: <span style='color:#00CEC9; font-family:monospace;'>[x+3 for x in range(3)]</span> 의 결과로 알맞은 것은?",
            choices: [
                { id: "A", text: "[3, 4, 5]" },
                { id: "B", text: "[3, 6, 9]" },
                { id: "C", text: "[0, 1, 2]" },
                { id: "D", text: "[1, 2, 3]" }
            ],
            correctChoiceId: "A",
            correctFeedback: "정답입니다! 0, 1, 2에 각각 3을 더해서 [3, 4, 5]가 되었어요.",
            incorrectFeedback: "곱하기(*)가 아니라 더하기(+) 연산자네요. 숫자를 꼼꼼히 계산해 보세요.",
            hint: "range(3)으로 0, 1, 2를 만든 뒤, 각각에 3을 더해보세요."
        },
        {
            id: "Q4",
            prompt: "리스트 컴프리헨션 기계에서 코드를 읽고 실행되는 가장 알맞은 순서는 무엇인가요?",
            choices: [
                { id: "A", text: "왼쪽의 공식부터 계산한 뒤, 오른쪽의 for문으로 진행한다." },
                { id: "B", text: "오른쪽의 for문으로 원재료를 먼저 꺼낸 뒤, 왼쪽의 공식으로 변환한다." },
                { id: "C", text: "대괄호 기호 [ ]를 먼저 그리고 안의 숫자를 채운다." },
                { id: "D", text: "위에서 아래로 차례대로 읽는다." }
            ],
            correctChoiceId: "B",
            correctFeedback: "정확합니다! 리스트 컴프리헨션은 오른쪽 for문부터 실행되어 재료를 꺼낸 뒤 왼쪽 공식으로 변환됩니다.",
            incorrectFeedback: "코드를 읽는 방향에 대해 다시 생각해 보세요.",
            hint: "기계 작동 시 슬롯에 값을 넣기 위해 가장 먼저 실행된 부분을 떠올려 보세요."
        }
    ],
    wrap: {
        message: "우리가 만든 리스트 암호로 미스터리 상자가 열렸어요! 리스트 컴프리헨션의 3단계 작동 원리를 기억하세요.",
        recap: [
            { step: "1", title: "원재료 생성", desc: "range()로 숫자를 만듭니다." },
            { step: "2", title: "공식 변환", desc: "x*2 등 왼쪽 공식을 통과시킵니다." },
            { step: "3", title: "리스트 조립", desc: "대괄호 [ ] 안에 결과를 담습니다." }
        ]
    }
};

Engine.init(listCompData);