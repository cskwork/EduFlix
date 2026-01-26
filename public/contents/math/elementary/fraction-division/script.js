// Three.js 전역 객체 참조
const THREE = window.THREE;

// 콘텐츠 앱 메인 객체
const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],

    // Core Scene 상태 관리
    coreState: {
        slices: [
            { id: 1, placed: false, plate: null },
            { id: 2, placed: false, plate: null },
            { id: 3, placed: false, plate: null }
        ],
        plate1Count: 0,
        plate2Count: 0
    },

    // Three.js 관련
    threeScene: null,
    threeCamera: null,
    threeRenderer: null,
    pizzaModel: null,

    // 초기화
    init() {
        this.updateProgress();
        this.initHookScene();
        this.bindEvents();
    },

    // 다음 Scene으로 이동
    nextScene() {
        if (this.currentScene < this.scenes.length - 1) {
            this.changeScene(this.currentScene + 1);
        }
    },

    // Scene 전환
    changeScene(index) {
        // 현재 Scene 숨기기
        document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));

        // 인덱스 업데이트
        this.currentScene = index;
        this.updateProgress();

        // 새 Scene 표시
        const sceneName = this.scenes[index];
        const sceneEl = document.getElementById(`${sceneName}-scene`);

        if (sceneEl) {
            sceneEl.classList.add('active');

            // Scene별 초기화 함수 호출
            const initFn = this[`init${this.capitalize(sceneName)}Scene`];
            if (initFn) initFn.call(this);
        }
    },

    // 진행 바 업데이트
    updateProgress() {
        const pct = ((this.currentScene + 1) / this.scenes.length) * 100;
        document.getElementById('progress-bar').style.width = `${pct}%`;
    },

    // 문자열 첫 글자 대문자화
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // ===== Scene 초기화 함수들 =====

    // Hook Scene: Three.js 3D 모델 로딩
    initHookScene() {
        const container = document.getElementById('hook-3d-container');
        if (!container || this.threeRenderer) return;
        if (!THREE || !THREE.GLTFLoader || !THREE.OrbitControls) {
            console.warn('Three.js 로드가 필요합니다.');
            return;
        }

        // Scene 설정
        this.threeScene = new THREE.Scene();
        this.threeScene.background = new THREE.Color(0xFFF8E1);

        // 카메라 설정
        const width = container.clientWidth;
        const height = container.clientHeight;
        this.threeCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.threeCamera.position.set(0, 2, 4);

        // 렌더러 설정
        this.threeRenderer = new THREE.WebGLRenderer({ antialias: true });
        this.threeRenderer.setSize(width, height);
        this.threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(this.threeRenderer.domElement);

        // 조명 설정
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.threeScene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        this.threeScene.add(directionalLight);

        // OrbitControls (터치/마우스 조작)
        const controls = new THREE.OrbitControls(this.threeCamera, this.threeRenderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = false;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 2;

        // GLB 모델 로딩
        const loader = new THREE.GLTFLoader();
        loader.load(
            '../../3d/3d-elementary-fraction-half-orange-20260125.glb',
            (gltf) => {
                this.pizzaModel = gltf.scene;
                this.pizzaModel.scale.set(1.5, 1.5, 1.5);
                this.pizzaModel.position.y = 0;
                this.threeScene.add(this.pizzaModel);
            },
            undefined,
            (error) => {
                console.error('3D 모델 로딩 실패:', error);
                // 대체 geometry 생성
                this.createFallbackPizza();
            }
        );

        // 애니메이션 루프
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            this.threeRenderer.render(this.threeScene, this.threeCamera);
        };
        animate();

        // 리사이즈 핸들러
        window.addEventListener('resize', () => {
            if (!container) return;
            const w = container.clientWidth;
            const h = container.clientHeight;
            this.threeCamera.aspect = w / h;
            this.threeCamera.updateProjectionMatrix();
            this.threeRenderer.setSize(w, h);
        });
    },

    // 3D 모델 로딩 실패시 대체 피자 생성
    createFallbackPizza() {
        const group = new THREE.Group();

        // 피자 베이스 (3/4 원)
        const pizzaGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.15, 32, 1, false, 0, Math.PI * 1.5);
        const pizzaMaterial = new THREE.MeshStandardMaterial({ color: 0xFFB74D });
        const pizza = new THREE.Mesh(pizzaGeometry, pizzaMaterial);
        pizza.rotation.x = Math.PI / 2;
        group.add(pizza);

        // 토핑 (페퍼로니)
        const toppingGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16);
        const toppingMaterial = new THREE.MeshStandardMaterial({ color: 0xD32F2F });

        const toppingPositions = [
            [-0.5, 0.1, -0.3],
            [0.3, 0.1, -0.5],
            [-0.3, 0.1, 0.4],
            [0.5, 0.1, 0.2]
        ];

        toppingPositions.forEach(pos => {
            const topping = new THREE.Mesh(toppingGeometry, toppingMaterial);
            topping.position.set(...pos);
            group.add(topping);
        });

        this.pizzaModel = group;
        this.threeScene.add(group);
    },

    // Anchor Scene 초기화
    initAnchorScene() {
        // 애니메이션은 CSS에서 처리
    },

    // Story Scene 초기화: 타자기 효과
    initStoryScene() {
        const text = "안녕하세요, 쿡왕 민수입니다! 오늘 먹방 촬영을 하다가 피자가 3/4만 남았어요. 친구 한 명이 왔는데, 둘이서 똑같이 나눠 먹으려면 각자 얼마나 먹을 수 있을까요?";
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

    // Core Scene 초기화: 드래그 인터랙션
    initCoreScene() {
        this.resetCore();
        this.setupDragAndDrop();
    },

    // Core Scene 리셋
    resetCore() {
        // 상태 초기화
        this.coreState = {
            slices: [
                { id: 1, placed: false, plate: null },
                { id: 2, placed: false, plate: null },
                { id: 3, placed: false, plate: null }
            ],
            plate1Count: 0,
            plate2Count: 0
        };

        // UI 리셋
        document.querySelectorAll('.pizza-slice').forEach(slice => {
            slice.classList.remove('placed', 'dragging');
            slice.style.transform = '';
        });

        document.getElementById('plate-1-slices').innerHTML = '';
        document.getElementById('plate-2-slices').innerHTML = '';
        document.getElementById('plate-1-fraction').textContent = '0/4';
        document.getElementById('plate-2-fraction').textContent = '0/4';

        document.getElementById('feedback-area').classList.add('hidden');
        document.getElementById('core-next-btn').classList.add('hidden');
    },

    // 드래그 앤 드롭 설정
    setupDragAndDrop() {
        const slices = document.querySelectorAll('.pizza-slice');
        const plates = document.querySelectorAll('.plate');

        // 드래그 시작 위치 저장
        let dragStartPos = { x: 0, y: 0 };
        let currentSlice = null;
        let isDragging = false;

        // 터치/마우스 이벤트 통합 핸들러
        const getEventPos = (e) => {
            if (e.touches && e.touches.length > 0) {
                return { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
            return { x: e.clientX, y: e.clientY };
        };

        // 드래그 시작
        const onDragStart = (e) => {
            const slice = e.target.closest('.pizza-slice');
            if (!slice || slice.classList.contains('placed')) return;

            e.preventDefault();
            currentSlice = slice;
            isDragging = true;
            dragStartPos = getEventPos(e);
            slice.classList.add('dragging');
        };

        // 드래그 중
        const onDragMove = (e) => {
            if (!isDragging || !currentSlice) return;
            e.preventDefault();

            const pos = getEventPos(e);
            const dx = pos.x - dragStartPos.x;
            const dy = pos.y - dragStartPos.y;

            currentSlice.style.transform = `translate(${dx}px, ${dy}px)`;

            // 접시 위에 있는지 확인
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

        // 드래그 종료
        const onDragEnd = (e) => {
            if (!isDragging || !currentSlice) return;

            const pos = getEventPos(e.changedTouches ? e.changedTouches[0] : e);
            let placed = false;

            // 어느 접시에 놓았는지 확인
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

            // 접시에 놓지 않았으면 원위치
            if (!placed) {
                currentSlice.style.transform = '';
            }

            currentSlice.classList.remove('dragging');
            currentSlice = null;
            isDragging = false;

            // 완료 체크
            this.checkCoreCompletion();
        };

        // 이벤트 리스너 등록
        slices.forEach(slice => {
            // 마우스 이벤트
            slice.addEventListener('mousedown', onDragStart);
            // 터치 이벤트
            slice.addEventListener('touchstart', onDragStart, { passive: false });
        });

        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('touchmove', onDragMove, { passive: false });
        document.addEventListener('mouseup', onDragEnd);
        document.addEventListener('touchend', onDragEnd);
    },

    // 조각을 접시에 배치
    placeSlice(sliceId, plateId) {
        const sliceState = this.coreState.slices.find(s => s.id === sliceId);
        if (sliceState.placed) return;

        sliceState.placed = true;
        sliceState.plate = plateId;

        // SVG 조각 숨기기
        const sliceEl = document.getElementById(`slice-${sliceId}`);
        sliceEl.classList.add('placed');
        sliceEl.style.transform = '';

        // 접시에 미니 조각 추가
        const plateSlices = document.getElementById(`plate-${plateId}-slices`);
        const miniSlice = document.createElement('div');
        miniSlice.className = 'mini-slice';
        plateSlices.appendChild(miniSlice);

        // 카운트 업데이트
        if (plateId === 1) {
            this.coreState.plate1Count++;
            document.getElementById('plate-1-fraction').textContent = `${this.coreState.plate1Count}/4`;
        } else {
            this.coreState.plate2Count++;
            document.getElementById('plate-2-fraction').textContent = `${this.coreState.plate2Count}/4`;
        }
    },

    // Core Scene 완료 체크
    checkCoreCompletion() {
        const allPlaced = this.coreState.slices.every(s => s.placed);

        if (allPlaced) {
            // 피드백 표시
            const feedbackArea = document.getElementById('feedback-area');
            const feedbackText = document.getElementById('feedback-text');

            // 균등 배분 체크 (하나는 1개, 하나는 2개 - 실제로는 각 1.5개씩이 정답이지만, 조각 단위로는 불가)
            const p1 = this.coreState.plate1Count;
            const p2 = this.coreState.plate2Count;

            if (p1 === p2) {
                // 불가능한 경우 (3조각을 2명이 균등하게 나눌 수 없음)
                feedbackText.textContent = '앗! 3조각을 2명이 똑같이 나눌 수 없네요. 그래서 분수 계산이 필요해요!';
            } else {
                feedbackText.textContent = `친구 1: ${p1}/4, 친구 2: ${p2}/4 - 똑같이 나누려면 분수 계산이 필요해요!`;
            }

            feedbackArea.classList.remove('hidden');
            document.getElementById('core-next-btn').classList.remove('hidden');
        }
    },

    // Visualize Scene 초기화
    initVisualizeScene() {
        // 애니메이션은 CSS에서 처리
    },

    // Quiz Scene 초기화
    initQuizScene() {
        // 버튼 상태 리셋
        document.querySelectorAll('.opt-btn').forEach(btn => {
            btn.classList.remove('correct', 'wrong');
            btn.disabled = false;
        });
        document.getElementById('quiz-feedback').classList.add('hidden');
    },

    // 퀴즈 정답 체크
    checkAnswer(answer) {
        const feedbackEl = document.getElementById('quiz-feedback');
        const buttons = document.querySelectorAll('.opt-btn');

        // 모든 버튼 비활성화
        buttons.forEach(btn => btn.disabled = true);

        // 정답: 2/3 나누기 4 = 2/3 x 1/4 = 2/12 = 1/6
        // 가장 가까운 선택지는 2/12
        const isCorrect = answer === '2/12';

        // 클릭한 버튼 찾기
        buttons.forEach(btn => {
            if (btn.textContent === answer) {
                btn.classList.add(isCorrect ? 'correct' : 'wrong');
            }
            // 정답 버튼 표시
            if (btn.textContent === '2/12') {
                btn.classList.add('correct');
            }
        });

        feedbackEl.classList.remove('hidden', 'success', 'error');

        if (isCorrect) {
            feedbackEl.classList.add('success');
            feedbackEl.textContent = '정답입니다! 2/3 나누기 4 = 2/3 x 1/4 = 2/12 (= 1/6)';
            setTimeout(() => this.nextScene(), 2000);
        } else {
            feedbackEl.classList.add('error');
            feedbackEl.textContent = '아쉬워요! 2/3 x 1/4 = 2/12 예요. 분자끼리, 분모끼리 곱하세요!';
            setTimeout(() => this.nextScene(), 3000);
        }
    },

    // Wrap Scene 초기화
    initWrapScene() {
        // 별 애니메이션은 CSS에서 처리
    },

    // 이벤트 바인딩
    bindEvents() {
        // 키보드 네비게이션 (개발/테스트용)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') {
                this.nextScene();
            } else if (e.key === 'ArrowLeft' && this.currentScene > 0) {
                this.changeScene(this.currentScene - 1);
            }
        });
    }
};

// 전역 접근을 위해 window에 등록
window.ContentApp = ContentApp;

// DOM 로드 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    ContentApp.init();
});
