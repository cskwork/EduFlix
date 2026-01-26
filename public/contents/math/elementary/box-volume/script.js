/**
 * 직육면체의 부피 - 인터랙티브 수학 콘텐츠
 * 초등 6학년 수학
 */

const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],

    // 상자 치수 (Core Scene용)
    boxWidth: 4,  // 가로 (칸 수)
    boxHeight: 3, // 세로 (칸 수)
    boxDepth: 2,  // 높이 (층 수)
    currentLayer: 0,
    cubesPerLayer: 0,
    totalCubes: 0,

    /**
     * 앱 초기화
     */
    init() {
        this.cubesPerLayer = this.boxWidth * this.boxHeight;
        this.updateProgress();
        this.initHookScene();
        this.bindEvents();
    },

    /**
     * 다음 씬으로 이동
     */
    nextScene() {
        if (this.currentScene < this.scenes.length - 1) {
            this.changeScene(this.currentScene + 1);
        }
    },

    /**
     * 씬 전환
     */
    changeScene(index) {
        // 현재 씬 숨기기
        document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));

        // 인덱스 업데이트
        this.currentScene = index;
        this.updateProgress();

        // 새 씬 표시
        const sceneName = this.scenes[index];
        const sceneEl = document.getElementById(`${sceneName}-scene`);

        if (sceneEl) {
            sceneEl.classList.add('active');

            // 씬별 초기화 함수 호출
            const initFn = this[`init${this.capitalize(sceneName)}Scene`];
            if (initFn) initFn.call(this);
        }
    },

    /**
     * 진행률 바 업데이트
     */
    updateProgress() {
        const pct = ((this.currentScene + 1) / this.scenes.length) * 100;
        document.getElementById('progress-bar').style.width = `${pct}%`;
    },

    /**
     * 문자열 첫 글자 대문자화
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // ============================================
    // Scene Logic
    // ============================================

    /**
     * Hook Scene 초기화
     */
    initHookScene() {
        // 3D 박스 애니메이션은 CSS로 처리됨
        // 추가 인터랙션이 필요하면 여기에 추가
    },

    /**
     * Anchor Scene 초기화 - 직사각형 넓이 복습
     */
    initAnchorScene() {
        const gridContainer = document.getElementById('area-grid');
        if (!gridContainer) return;

        gridContainer.innerHTML = '';

        const width = 4;
        const height = 3;
        const total = width * height;

        // 그리드 셀 생성
        for (let i = 0; i < total; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.textContent = i + 1;
            gridContainer.appendChild(cell);

            // 순차적으로 채우기 애니메이션
            setTimeout(() => {
                cell.classList.add('filled');
            }, i * 100);
        }
    },

    /**
     * Story Scene 초기화 - 타자 효과
     */
    initStoryScene() {
        const text = "안녕하세요, 저는 택배 기사 서준이에요! 오늘 이 상자에 작은 물건을 담아 보내야 하는데... 상자 안에 1cm짜리 작은 큐브를 몇 개나 넣을 수 있을지 궁금해요. 도와주실 수 있나요?";
        const el = document.getElementById('typewriter-text');
        if (!el) return;

        el.textContent = '';
        let i = 0;

        const type = () => {
            if (i < text.length) {
                el.textContent += text.charAt(i);
                i++;
                setTimeout(type, 35);
            }
        };
        type();
    },

    /**
     * Core Scene 초기화 - 큐브 쌓기 인터랙션
     */
    initCoreScene() {
        // 상태 초기화
        this.currentLayer = 0;
        this.totalCubes = 0;

        // UI 초기화
        const cubesContainer = document.getElementById('cubes-container');
        if (cubesContainer) {
            cubesContainer.innerHTML = '';
        }

        this.updateCoreUI();

        // 버튼 활성화
        const addBtn = document.getElementById('add-layer-btn');
        if (addBtn) {
            addBtn.disabled = false;
        }

        // 피드백 및 다음 버튼 숨기기
        const feedback = document.getElementById('core-feedback');
        const nextBtn = document.getElementById('core-next-btn');
        if (feedback) feedback.classList.add('hidden');
        if (nextBtn) nextBtn.classList.add('hidden');
    },

    /**
     * 한 층 큐브 추가
     */
    addLayer() {
        if (this.currentLayer >= this.boxDepth) return;

        const container = document.getElementById('cubes-container');
        if (!container) return;

        const cubeSize = 30; // 큐브 크기 (px)
        const layerIndex = this.currentLayer;

        // 큐브 생성 (가로 x 세로 개)
        for (let row = 0; row < this.boxHeight; row++) {
            for (let col = 0; col < this.boxWidth; col++) {
                const cube = this.createStackedCube(col, row, layerIndex, cubeSize);
                container.appendChild(cube);

                // 순차적 애니메이션
                const delay = (row * this.boxWidth + col) * 30;
                setTimeout(() => {
                    cube.style.opacity = '1';
                    cube.style.transform = `
                        translateX(${col * cubeSize}px)
                        translateY(${row * cubeSize}px)
                        translateZ(${layerIndex * cubeSize}px)
                    `;
                }, delay);
            }
        }

        // 카운터 업데이트
        this.currentLayer++;
        this.totalCubes += this.cubesPerLayer;
        this.updateCoreUI();

        // 완료 체크
        if (this.currentLayer >= this.boxDepth) {
            setTimeout(() => {
                this.onCoreComplete();
            }, this.cubesPerLayer * 30 + 300);
        }
    },

    /**
     * 쌓을 큐브 DOM 요소 생성
     */
    createStackedCube(col, row, layer, size) {
        const cube = document.createElement('div');
        cube.className = `stacked-cube layer-${layer}`;
        cube.style.width = `${size}px`;
        cube.style.height = `${size}px`;
        cube.style.opacity = '0';
        cube.style.transform = `
            translateX(${col * size}px)
            translateY(${row * size}px)
            translateZ(${(layer + 1) * size + 50}px)
        `;

        // 6면 생성
        const faces = ['front', 'back', 'left', 'right', 'top', 'bottom'];
        faces.forEach(face => {
            const faceEl = document.createElement('div');
            faceEl.className = `c-face c-${face}`;
            cube.appendChild(faceEl);
        });

        return cube;
    },

    /**
     * Core Scene UI 업데이트
     */
    updateCoreUI() {
        const layerEl = document.getElementById('current-layer');
        const layerCountEl = document.getElementById('layer-count');
        const totalCountEl = document.getElementById('total-count');

        if (layerEl) layerEl.textContent = this.currentLayer;
        if (layerCountEl) layerCountEl.textContent = this.cubesPerLayer;
        if (totalCountEl) totalCountEl.textContent = this.totalCubes;
    },

    /**
     * Core Scene 완료 처리
     */
    onCoreComplete() {
        // 버튼 비활성화
        const addBtn = document.getElementById('add-layer-btn');
        if (addBtn) {
            addBtn.disabled = true;
        }

        // 피드백 표시
        const feedback = document.getElementById('core-feedback');
        if (feedback) {
            feedback.classList.remove('hidden');
        }

        // 다음 버튼 표시
        setTimeout(() => {
            const nextBtn = document.getElementById('core-next-btn');
            if (nextBtn) {
                nextBtn.classList.remove('hidden');
            }
        }, 1000);
    },

    /**
     * Visualize Scene 초기화
     */
    initVisualizeScene() {
        // 공식 도출 애니메이션 (CSS로 처리 가능)
        // 추가 인터랙션 필요시 여기에 구현
    },

    /**
     * Quiz Scene 초기화
     */
    initQuizScene() {
        // 피드백 초기화
        const feedback = document.getElementById('quiz-feedback');
        if (feedback) {
            feedback.classList.add('hidden');
            feedback.classList.remove('success', 'error');
        }

        // 버튼 스타일 초기화
        document.querySelectorAll('.opt-btn').forEach(btn => {
            btn.classList.remove('correct', 'wrong');
            btn.disabled = false;
        });
    },

    /**
     * 퀴즈 정답 확인
     */
    checkAnswer(val) {
        const correctAnswer = 60; // 5 x 3 x 4 = 60
        const feedback = document.getElementById('quiz-feedback');
        const buttons = document.querySelectorAll('.opt-btn');

        // 모든 버튼 비활성화
        buttons.forEach(btn => btn.disabled = true);

        if (val === correctAnswer) {
            // 정답
            event.target.classList.add('correct');
            if (feedback) {
                feedback.textContent = '정답입니다! 5 x 3 x 4 = 60cm^3';
                feedback.classList.remove('hidden', 'error');
                feedback.classList.add('success');
            }

            // 다음 씬으로
            setTimeout(() => {
                this.nextScene();
            }, 1500);
        } else {
            // 오답
            event.target.classList.add('wrong');
            if (feedback) {
                feedback.textContent = '다시 생각해보세요! 가로 x 세로 x 높이 = ?';
                feedback.classList.remove('hidden', 'success');
                feedback.classList.add('error');
            }

            // 재시도 가능하게
            setTimeout(() => {
                buttons.forEach(btn => {
                    btn.disabled = false;
                    btn.classList.remove('wrong');
                });
                if (feedback) feedback.classList.add('hidden');
            }, 1500);
        }
    },

    /**
     * Wrap Scene 초기화
     */
    initWrapScene() {
        // 트로피 애니메이션은 CSS로 처리됨
    },

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 키보드 네비게이션 (선택적)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                // 현재 씬에 따라 다음 액션 결정
                // (간단한 데모에서는 비활성화)
            }
        });
    }
};

// 앱 시작
document.addEventListener('DOMContentLoaded', () => {
    ContentApp.init();
});
