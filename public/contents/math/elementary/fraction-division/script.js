const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],

    coreState: {
        slices: [
            { id: 1, placed: false, plate: null },
            { id: 2, placed: false, plate: null },
            { id: 3, placed: false, plate: null }
        ],
        plate1Count: 0,
        plate2Count: 0
    },

    init() {
        this.renderNavDots();
        this.bindEvents();
        setTimeout(() => this.changeScene(0), 100);
    },

    changeScene(index) {
        document.querySelectorAll('.scene').forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });

        this.currentScene = index;
        this.updateNavDots();

        const sceneName = this.scenes[index];
        const sceneEl = document.getElementById(`${sceneName}-scene`);

        if (sceneEl) {
            sceneEl.style.display = 'flex';
            setTimeout(() => sceneEl.classList.add('active'), 50);

            // Init specific logic
            if (sceneName === 'story') this.initStoryScene();
            if (sceneName === 'core') this.initCoreScene();
            if (sceneName === 'quiz') this.initQuizScene();
            if (sceneName === 'wrap') this.createConfetti(80);
        }
    },

    nextScene() {
        if (this.currentScene < this.scenes.length - 1) {
            this.changeScene(this.currentScene + 1);
        }
    },

    prevScene() {
        if (this.currentScene > 0) {
            this.changeScene(this.currentScene - 1);
        }
    },

    renderNavDots() {
        let nav = document.querySelector('.nav-dots');
        if (!nav) {
            nav = document.createElement('div');
            nav.className = 'nav-dots';
            document.getElementById('app').appendChild(nav);
        }
        nav.innerHTML = '';
        this.scenes.forEach((_, idx) => {
            const dot = document.createElement('div');
            dot.className = 'dot';
            dot.onclick = () => this.changeScene(idx);
            nav.appendChild(dot);
        });
    },

    updateNavDots() {
        const dots = document.querySelectorAll('.dot');
        dots.forEach((dot, idx) => {
            if (idx === this.currentScene) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    },

    initStoryScene() {
        const text = "\"으하하! 나는 바다를 누비는 해적 선장 '잭'이다! 🏴‍☠️\\n우리가 어렵게 구한 전설의 황금 피자가 딱 3/4판 남았군.\\n나의 충직한 선원 2명이 이 남은 피자를 똑같이 나누어 먹어야 한다는데, 각자 얼마나 먹을 수 있는 거지?\"";
        const el = document.getElementById('typewriter-text');
        if (!el) return;

        el.innerHTML = '';
        let i = 0;

        const type = () => {
            if (i < text.length) {
                if (text.charAt(i) === '\n') {
                    el.innerHTML += '<br>';
                } else {
                    el.innerHTML += text.charAt(i);
                }
                i++;
                setTimeout(type, 30);
            }
        };
        type();
    },

    initCoreScene() {
        this.resetCore();
        this.setupDragAndDrop();
    },

    resetCore() {
        this.coreState = {
            slices: [
                { id: 1, placed: false, plate: null },
                { id: 2, placed: false, plate: null },
                { id: 3, placed: false, plate: null }
            ],
            plate1Count: 0,
            plate2Count: 0
        };

        const slices = document.querySelectorAll('.pizza-slice');
        slices.forEach(slice => {
            slice.classList.remove('placed', 'dragging');
            slice.style.transform = '';
            slice.style.opacity = '1';
            slice.style.pointerEvents = 'all';
        });

        document.getElementById('plate-1-slices').innerHTML = '';
        document.getElementById('plate-2-slices').innerHTML = '';
        document.getElementById('plate-1-fraction').textContent = '0/4';
        document.getElementById('plate-2-fraction').textContent = '0/4';

        const feedbackArea = document.getElementById('feedback-area');
        feedbackArea.classList.remove('active');
        document.getElementById('core-next-btn').classList.add('hidden');
    },

    setupDragAndDrop() {
        const slices = document.querySelectorAll('.pizza-slice');
        const plates = document.querySelectorAll('.plate');

        let currentSlice = null;
        let isDragging = false;
        let dragStartPos = { x: 0, y: 0 };
        let currentPos = { x: 0, y: 0 };

        const getEventPos = (e) => {
            if (e.touches && e.touches.length > 0) {
                return { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
            return { x: e.clientX, y: e.clientY };
        };

        const onDragStart = (e) => {
            const slice = e.target.closest('.pizza-slice');
            if (!slice || slice.classList.contains('placed')) return;

            e.preventDefault();
            currentSlice = slice;
            isDragging = true;
            dragStartPos = getEventPos(e);
            currentPos = { x: 0, y: 0 };
            
            slice.classList.add('dragging');
        };

        const onDragMove = (e) => {
            if (!isDragging || !currentSlice) return;
            e.preventDefault();

            const pos = getEventPos(e);
            currentPos.x = pos.x - dragStartPos.x;
            currentPos.y = pos.y - dragStartPos.y;

            currentSlice.style.transform = `translate(${currentPos.x}px, ${currentPos.y}px) scale(1.1)`;

            plates.forEach(plate => {
                const rect = plate.getBoundingClientRect();
                if (pos.x >= rect.left && pos.x <= rect.right &&
                    pos.y >= rect.top && pos.y <= rect.bottom) {
                    plate.classList.add('drag-over');
                } else {
                    plate.classList.remove('drag-over');
                }
            });
        };

        const onDragEnd = (e) => {
            if (!isDragging || !currentSlice) return;

            const pos = getEventPos(e.changedTouches ? e.changedTouches[0] : e);
            let placed = false;

            plates.forEach(plate => {
                plate.classList.remove('drag-over');
                const rect = plate.getBoundingClientRect();

                if (pos.x >= rect.left && pos.x <= rect.right &&
                    pos.y >= rect.top && pos.y <= rect.bottom) {

                    const plateId = parseInt(plate.dataset.plate);
                    const sliceId = parseInt(currentSlice.dataset.slice);

                    this.placeSlice(sliceId, plateId);
                    placed = true;
                }
            });

            if (!placed) {
                currentSlice.style.transform = '';
            }

            currentSlice.classList.remove('dragging');
            currentSlice = null;
            isDragging = false;

            this.checkCoreCompletion();
        };

        // Remove old event listeners via cloning if they exist
        const oldPizzaSvg = document.getElementById('pizza-svg');
        const newPizzaSvg = oldPizzaSvg.cloneNode(true);
        oldPizzaSvg.parentNode.replaceChild(newPizzaSvg, oldPizzaSvg);

        const newSlices = document.querySelectorAll('.pizza-slice');
        newSlices.forEach(slice => {
            slice.addEventListener('mousedown', onDragStart);
            slice.addEventListener('touchstart', onDragStart, { passive: false });
        });

        // Ensure global listeners are only attached once
        if(!window.isDragBound) {
            document.addEventListener('mousemove', onDragMove);
            document.addEventListener('touchmove', onDragMove, { passive: false });
            document.addEventListener('mouseup', onDragEnd);
            document.addEventListener('touchend', onDragEnd);
            window.isDragBound = true;
        }
    },

    placeSlice(sliceId, plateId) {
        const sliceState = this.coreState.slices.find(s => s.id === sliceId);
        if (sliceState.placed) return;

        sliceState.placed = true;
        sliceState.plate = plateId;

        const sliceEl = document.getElementById(`slice-${sliceId}`);
        sliceEl.classList.add('placed');

        const plateSlices = document.getElementById(`plate-${plateId}-slices`);
        const miniSlice = document.createElement('div');
        miniSlice.className = 'mini-slice';
        plateSlices.appendChild(miniSlice);

        if (plateId === 1) {
            this.coreState.plate1Count++;
            document.getElementById('plate-1-fraction').textContent = `${this.coreState.plate1Count}/4`;
        } else {
            this.coreState.plate2Count++;
            document.getElementById('plate-2-fraction').textContent = `${this.coreState.plate2Count}/4`;
        }
        
        // Pop effect
        const plateEl = document.getElementById(`plate-${plateId}`);
        plateEl.style.transform = 'scale(1.1)';
        setTimeout(() => plateEl.style.transform = '', 200);
    },

    checkCoreCompletion() {
        const allPlaced = this.coreState.slices.every(s => s.placed);

        if (allPlaced) {
            const feedbackArea = document.getElementById('feedback-area');
            const feedbackText = document.getElementById('feedback-text');

            const p1 = this.coreState.plate1Count;
            const p2 = this.coreState.plate2Count;

            if (p1 === p2) {
                // Impossible to split 3 evenly
                feedbackText.innerHTML = '앗! 3조각을 2명이 똑같이 나눌 수 없네요. 🤔<br>그래서 <b>"분수 곱하기"</b> 계산이 필요해요!';
            } else {
                feedbackText.innerHTML = `앗! 한 명이 더 많이 가져갔네요 (${p1}개 vs ${p2}개). 🏴‍☠️<br>공평하게 나누려면 <b>"분수 곱하기"</b> 계산이 필요해요!`;
            }

            feedbackArea.classList.add('active');
            document.getElementById('core-next-btn').classList.remove('hidden');
            this.createConfetti(15);
        }
    },

    initQuizScene() {
        const options = document.querySelectorAll('.opt-btn');
        options.forEach(btn => {
            btn.classList.remove('correct', 'wrong');
            btn.disabled = false;
        });
        const feedback = document.getElementById('quiz-feedback');
        feedback.innerHTML = '';
        feedback.className = 'quiz-feedback hidden';
    },

    checkAnswer(answer) {
        const feedbackEl = document.getElementById('quiz-feedback');
        const buttons = document.querySelectorAll('.opt-btn');

        buttons.forEach(btn => btn.disabled = true);

        const isCorrect = answer === '2/12';

        buttons.forEach(btn => {
            if (btn.textContent === answer) {
                btn.classList.add(isCorrect ? 'correct' : 'wrong');
            }
            if (btn.textContent === '2/12' && !isCorrect) {
                // Highlight correct answer if they got it wrong
                setTimeout(() => btn.classList.add('correct'), 1000);
            }
        });

        feedbackEl.classList.remove('hidden', 'success', 'error');

        if (isCorrect) {
            feedbackEl.classList.add('success');
            feedbackEl.innerHTML = '🎉 정답입니다! 2/3 x 1/4 = 2/12 (= 1/6) 🎉';
            this.createConfetti(50);
            setTimeout(() => this.nextScene(), 2500);
        } else {
            feedbackEl.classList.add('error');
            feedbackEl.innerHTML = '💡 아쉬워요! 2/3 x 1/4 = 2/12 예요. 분자끼리, 분모끼리 곱하세요!';
            setTimeout(() => {
                this.initQuizScene(); // reset
            }, 3000);
        }
    },

    createConfetti(amount = 50) {
        let container = document.getElementById('confetti-container');
        if(!container) {
            container = document.createElement('div');
            container.id = 'confetti-container';
            document.body.appendChild(container);
        }
        
        // Pirate colors
        const colors = ['#f59e0b', '#d97706', '#fbbf24', '#1e3a8a', '#3b82f6'];
        for(let i=0; i<amount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = (Math.random() * 100) + 'vw';
            confetti.style.top = '-20px'; // Start above screen
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
            confetti.style.animationDelay = (Math.random() * 0.5) + 's';
            container.appendChild(confetti);
            setTimeout(() => confetti.remove(), 4000);
        }
    },

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') this.nextScene();
            if (e.key === 'ArrowLeft') this.prevScene();
        });
    }
};

window.ContentApp = ContentApp;

document.addEventListener('DOMContentLoaded', () => {
    ContentApp.init();
});
