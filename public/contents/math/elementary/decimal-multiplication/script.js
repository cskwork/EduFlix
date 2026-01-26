/**
 * 소수의 곱셈 - 초등 5학년 인터랙티브 수학 콘텐츠
 * 2026-01-26
 */

const THREE = window.THREE;

// 전역 상태
const state = {
  currentScene: 1,
  totalScenes: 7,
  quizAnswer: null, // 사용자가 선택한 소수점 위치
  correctPosition: 1, // 정답 위치 (0.96에서 0과 9 사이)
  animationInProgress: false
};

// DOM 요소
const elements = {
  scenes: null,
  currentSceneEl: null,
  progressFill: null,
  coinContainer: null
};

// Three.js 관련
let coinScene, coinCamera, coinRenderer, coinModel;

/**
 * 초기화
 */
document.addEventListener('DOMContentLoaded', () => {
  initElements();
  initNavigation();
  initCoin3D();
  initSimulator();
  initPrincipleVisualization();
  initQuiz();
  initWrapActions();
  updateProgress();
});

/**
 * DOM 요소 초기화
 */
function initElements() {
  elements.scenes = document.querySelectorAll('.scene');
  elements.currentSceneEl = document.querySelector('.current-scene');
  elements.progressFill = document.getElementById('progress-fill');
  elements.coinContainer = document.getElementById('coin-container');
}

/**
 * 네비게이션 초기화
 */
function initNavigation() {
  // 다음 버튼
  document.querySelectorAll('.next-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const nextScene = parseInt(btn.dataset.next);
      if (nextScene && nextScene <= state.totalScenes) {
        goToScene(nextScene);
      }
    });
  });

  // 이전 버튼
  document.querySelectorAll('.prev-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const prevScene = parseInt(btn.dataset.prev);
      if (prevScene && prevScene >= 1) {
        goToScene(prevScene);
      }
    });
  });
}

/**
 * 씬 전환
 */
function goToScene(sceneNum) {
  if (state.animationInProgress) return;
  state.animationInProgress = true;

  const currentSceneEl = document.querySelector(`.scene[data-scene="${state.currentScene}"]`);
  const nextSceneEl = document.querySelector(`.scene[data-scene="${sceneNum}"]`);

  // 현재 씬 나가기 애니메이션
  currentSceneEl.classList.add('exiting');
  currentSceneEl.classList.remove('active');

  // 다음 씬 들어오기
  setTimeout(() => {
    currentSceneEl.classList.remove('exiting');
    nextSceneEl.classList.add('active');
    state.currentScene = sceneNum;
    updateProgress();

    // 씬별 초기화
    if (sceneNum === 4) {
      initGridVisualization();
    } else if (sceneNum === 5) {
      animatePrincipleSteps();
    }

    state.animationInProgress = false;
  }, 300);
}

/**
 * 프로그레스 업데이트
 */
function updateProgress() {
  elements.currentSceneEl.textContent = state.currentScene;
  const progressPercent = (state.currentScene / state.totalScenes) * 100;
  elements.progressFill.style.width = `${progressPercent}%`;
}

/**
 * 3D 동전 초기화 (Three.js)
 */
function initCoin3D() {
  const container = elements.coinContainer;
  if (!container) return;
  if (!THREE || !THREE.GLTFLoader) {
    console.warn('Three.js 로드가 필요합니다.');
    return;
  }

  // 씬 설정
  coinScene = new THREE.Scene();
  coinScene.background = null;

  // 카메라 설정
  coinCamera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
  coinCamera.position.set(0, 1, 3);

  // 렌더러 설정
  coinRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  coinRenderer.setSize(container.clientWidth, container.clientHeight);
  coinRenderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(coinRenderer.domElement);

  // 조명
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  coinScene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(2, 3, 2);
  coinScene.add(directionalLight);

  // GLB 모델 로드
  const loader = new THREE.GLTFLoader();
  loader.load(
    '../../3d/3d-elementary-coin-gold-20260125.glb',
    (gltf) => {
      coinModel = gltf.scene;
      coinModel.scale.set(1.5, 1.5, 1.5);
      coinScene.add(coinModel);
      animateCoin();
    },
    undefined,
    (error) => {
      console.error('3D 모델 로드 실패:', error);
      // 폴백: 간단한 원통 생성
      createFallbackCoin();
    }
  );
}

/**
 * 폴백 동전 생성
 */
function createFallbackCoin() {
  const geometry = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 32);
  const material = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    metalness: 0.8,
    roughness: 0.2
  });
  coinModel = new THREE.Mesh(geometry, material);
  coinModel.rotation.x = Math.PI / 2;
  coinScene.add(coinModel);
  animateCoin();
}

/**
 * 동전 애니메이션
 */
function animateCoin() {
  function animate() {
    requestAnimationFrame(animate);
    if (coinModel) {
      coinModel.rotation.y += 0.01;
    }
    coinRenderer.render(coinScene, coinCamera);
  }
  animate();
}

/**
 * 시뮬레이터 초기화
 */
function initSimulator() {
  const num1Int = document.getElementById('num1-int');
  const num1Dec = document.getElementById('num1-dec');
  const num2Int = document.getElementById('num2-int');
  const num2Dec = document.getElementById('num2-dec');
  const animateBtn = document.getElementById('animate-calc');

  // 입력 변경 시 계산 업데이트
  [num1Int, num1Dec, num2Int, num2Dec].forEach(input => {
    if (input) {
      input.addEventListener('input', updateCalculation);
    }
  });

  // 애니메이션 버튼
  if (animateBtn) {
    animateBtn.addEventListener('click', animateCalculation);
  }
}

/**
 * 계산 업데이트
 */
function updateCalculation() {
  const num1Int = parseInt(document.getElementById('num1-int')?.value || 1);
  const num1Dec = parseInt(document.getElementById('num1-dec')?.value || 5);
  const num2Int = parseInt(document.getElementById('num2-int')?.value || 2);
  const num2Dec = parseInt(document.getElementById('num2-dec')?.value || 4);

  const num1 = num1Int + num1Dec / 10;
  const num2 = num2Int + num2Dec / 10;

  const intNum1 = num1Int * 10 + num1Dec;
  const intNum2 = num2Int * 10 + num2Dec;
  const intResult = intNum1 * intNum2;
  const result = (intResult / 100).toFixed(2);

  // 단계별 내용 업데이트
  const step1 = document.getElementById('step1-content');
  const step2 = document.getElementById('step2-content');
  const step3 = document.getElementById('step3-content');
  const resultEl = document.getElementById('result-value');

  if (step1) step1.textContent = `${num1} x 10 = ${intNum1}, ${num2} x 10 = ${intNum2}`;
  if (step2) step2.textContent = `${intNum1} x ${intNum2} = ${intResult}`;
  if (step3) step3.textContent = `소수점 아래 자릿수: 1 + 1 = 2자리`;
  if (resultEl) resultEl.innerHTML = `<span class="result-number">${result}</span>`;

  // 격자 시각화 업데이트
  updateGridVisualization(num1, num2);
}

/**
 * 계산 애니메이션
 */
function animateCalculation() {
  const steps = document.querySelectorAll('.calc-step');
  const resultEl = document.querySelector('.calc-result');

  // 모든 단계 초기화
  steps.forEach(step => step.classList.remove('active'));
  resultEl?.classList.remove('active');

  // 순차적 애니메이션
  steps.forEach((step, index) => {
    setTimeout(() => {
      step.classList.add('active');
    }, (index + 1) * 600);
  });

  // 결과 표시
  setTimeout(() => {
    resultEl?.classList.add('active');
  }, (steps.length + 1) * 600);
}

/**
 * 격자 시각화 초기화
 */
function initGridVisualization() {
  updateGridVisualization(1.5, 2.4);
}

/**
 * 격자 시각화 업데이트
 */
function updateGridVisualization(num1, num2) {
  const svg = document.getElementById('multiplication-grid');
  if (!svg) return;

  const width = 400;
  const height = 300;
  const padding = 40;
  const gridWidth = width - padding * 2;
  const gridHeight = height - padding * 2;

  // 격자 크기 계산
  const cols = Math.round(num1 * 10);
  const rows = Math.round(num2 * 10);
  const cellWidth = gridWidth / 10;
  const cellHeight = gridHeight / 10;

  let svgContent = `
    <defs>
      <pattern id="smallGrid" width="${cellWidth}" height="${cellHeight}" patternUnits="userSpaceOnUse">
        <rect width="${cellWidth}" height="${cellHeight}" fill="none" stroke="#E0E0E0" stroke-width="0.5"/>
      </pattern>
    </defs>

    <!-- 배경 격자 -->
    <rect x="${padding}" y="${padding}" width="${gridWidth}" height="${gridHeight}" fill="url(#smallGrid)"/>

    <!-- 외곽선 -->
    <rect x="${padding}" y="${padding}" width="${gridWidth}" height="${gridHeight}" fill="none" stroke="#90A4AE" stroke-width="2"/>

    <!-- 곱셈 영역 (채워진 부분) -->
    <rect x="${padding}" y="${padding}" width="${cols * cellWidth / 10}" height="${rows * cellHeight / 10}" fill="#FFB74D" fill-opacity="0.4" stroke="#FF9800" stroke-width="2"/>

    <!-- 축 레이블 -->
    <text x="${padding + cols * cellWidth / 20}" y="${padding - 10}" text-anchor="middle" font-size="14" font-weight="bold" fill="#FF9800">${num1}</text>
    <text x="${padding - 15}" y="${padding + rows * cellHeight / 20}" text-anchor="middle" font-size="14" font-weight="bold" fill="#FF9800" transform="rotate(-90, ${padding - 15}, ${padding + rows * cellHeight / 20})">${num2}</text>

    <!-- 1.0 기준선 -->
    <line x1="${padding + cellWidth}" y1="${padding}" x2="${padding + cellWidth}" y2="${padding + gridHeight}" stroke="#42A5F5" stroke-width="2" stroke-dasharray="5,5"/>
    <line x1="${padding}" y1="${padding + cellHeight}" x2="${padding + gridWidth}" y2="${padding + cellHeight}" stroke="#42A5F5" stroke-width="2" stroke-dasharray="5,5"/>

    <!-- 기준선 레이블 -->
    <text x="${padding + cellWidth}" y="${height - 10}" text-anchor="middle" font-size="12" fill="#42A5F5">1.0</text>
    <text x="15" y="${padding + cellHeight}" text-anchor="middle" font-size="12" fill="#42A5F5">1.0</text>
  `;

  svg.innerHTML = svgContent;
}

/**
 * 원리 시각화 초기화
 */
function initPrincipleVisualization() {
  const svg = document.getElementById('principle-svg');
  if (!svg) return;

  const svgContent = `
    <defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#FF9800"/>
      </marker>
    </defs>

    <!-- 타이틀 -->
    <text x="200" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="#37474F">소수 곱셈의 원리</text>

    <!-- 1.5 표현 -->
    <g transform="translate(50, 60)">
      <rect width="100" height="40" rx="8" fill="#FFE0B2" stroke="#FF9800" stroke-width="2"/>
      <text x="50" y="26" text-anchor="middle" font-size="18" font-weight="bold" fill="#FF9800">1.5</text>
    </g>

    <!-- x 기호 -->
    <text x="175" y="86" text-anchor="middle" font-size="24" fill="#607D8B">x</text>

    <!-- 2.4 표현 -->
    <g transform="translate(200, 60)">
      <rect width="100" height="40" rx="8" fill="#FFE0B2" stroke="#FF9800" stroke-width="2"/>
      <text x="50" y="26" text-anchor="middle" font-size="18" font-weight="bold" fill="#FF9800">2.4</text>
    </g>

    <!-- 화살표 -->
    <path d="M200 110 L200 130" stroke="#FF9800" stroke-width="2" marker-end="url(#arrowhead)"/>

    <!-- 변환 과정 -->
    <g transform="translate(50, 145)">
      <rect width="300" height="50" rx="8" fill="#E3F2FD" stroke="#42A5F5" stroke-width="2"/>
      <text x="150" y="22" text-anchor="middle" font-size="14" fill="#1976D2">15 x 24 = 360</text>
      <text x="150" y="40" text-anchor="middle" font-size="12" fill="#607D8B">(자연수로 변환해서 계산)</text>
    </g>

    <!-- 화살표 -->
    <path d="M200 205 L200 215" stroke="#FF9800" stroke-width="2" marker-end="url(#arrowhead)"/>

    <!-- 결과 -->
    <g transform="translate(100, 225)">
      <rect width="200" height="40" rx="8" fill="#E8F5E9" stroke="#66BB6A" stroke-width="2"/>
      <text x="100" y="26" text-anchor="middle" font-size="18" font-weight="bold" fill="#4CAF50">360 / 100 = 3.6</text>
    </g>
  `;

  svg.innerHTML = svgContent;
}

/**
 * 원리 단계 애니메이션
 */
function animatePrincipleSteps() {
  const steps = document.querySelectorAll('.principle-step');
  steps.forEach((step, index) => {
    step.style.opacity = '0';
    step.style.transform = 'translateX(-20px)';

    setTimeout(() => {
      step.style.transition = 'all 0.4s ease';
      step.style.opacity = '1';
      step.style.transform = 'translateX(0)';
    }, (index + 1) * 300);
  });
}

/**
 * 퀴즈 초기화
 */
function initQuiz() {
  const draggable = document.getElementById('draggable-point');
  const dropZones = document.querySelectorAll('.drop-zone');
  const hintBtn = document.getElementById('show-hint');
  const hintContent = document.getElementById('hint-content');
  const checkBtn = document.getElementById('check-answer');
  const resultEl = document.getElementById('quiz-result');

  if (!draggable) return;

  // 드래그 시작
  draggable.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', 'decimal-point');
    draggable.style.opacity = '0.5';
  });

  draggable.addEventListener('dragend', () => {
    draggable.style.opacity = '1';
  });

  // 터치 이벤트 지원
  let touchStartX, touchStartY;
  draggable.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    touchStartX = touch.clientX - draggable.offsetLeft;
    touchStartY = touch.clientY - draggable.offsetTop;
    draggable.style.position = 'fixed';
    draggable.style.zIndex = '1000';
  });

  draggable.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    draggable.style.left = (touch.clientX - touchStartX) + 'px';
    draggable.style.top = (touch.clientY - touchStartY) + 'px';

    // 드롭존 하이라이트
    dropZones.forEach(zone => {
      const rect = zone.getBoundingClientRect();
      if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
          touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        zone.classList.add('highlight');
      } else {
        zone.classList.remove('highlight');
      }
    });
  });

  draggable.addEventListener('touchend', (e) => {
    const touch = e.changedTouches[0];
    dropZones.forEach(zone => {
      const rect = zone.getBoundingClientRect();
      if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
          touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        handleDrop(zone);
      }
      zone.classList.remove('highlight');
    });

    // 위치 리셋
    draggable.style.position = '';
    draggable.style.left = '';
    draggable.style.top = '';
    draggable.style.zIndex = '';
  });

  // 드롭존 이벤트
  dropZones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('highlight');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('highlight');
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('highlight');
      handleDrop(zone);
    });
  });

  // 힌트 버튼
  if (hintBtn && hintContent) {
    hintBtn.addEventListener('click', () => {
      hintContent.classList.toggle('show');
    });
  }

  // 정답 확인 버튼
  if (checkBtn) {
    checkBtn.addEventListener('click', checkAnswer);
  }
}

/**
 * 드롭 처리
 */
function handleDrop(zone) {
  // 기존 선택 제거
  document.querySelectorAll('.drop-zone').forEach(z => {
    z.classList.remove('filled');
  });

  // 새 위치에 소수점 표시
  zone.classList.add('filled');
  state.quizAnswer = parseInt(zone.dataset.position);
}

/**
 * 정답 확인
 */
function checkAnswer() {
  const resultEl = document.getElementById('quiz-result');
  if (!resultEl) return;

  resultEl.classList.remove('show', 'correct', 'incorrect');

  // 정답: position 1 (0과 9 사이) -> 0.96
  const isCorrect = state.quizAnswer === state.correctPosition;

  setTimeout(() => {
    resultEl.classList.add('show');
    resultEl.classList.add(isCorrect ? 'correct' : 'incorrect');
  }, 100);
}

/**
 * 마무리 씬 액션 초기화
 */
function initWrapActions() {
  const restartBtn = document.getElementById('restart-btn');
  const nextLessonBtn = document.getElementById('next-lesson-btn');

  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      goToScene(1);
    });
  }

  if (nextLessonBtn) {
    nextLessonBtn.addEventListener('click', () => {
      // 다음 학습으로 이동 (실제 구현에서는 다른 페이지로 이동)
      alert('다음 학습: "소수의 나눗셈"으로 이동합니다!');
    });
  }
}

// 윈도우 리사이즈 처리
window.addEventListener('resize', () => {
  if (coinRenderer && elements.coinContainer) {
    const container = elements.coinContainer;
    coinCamera.aspect = container.clientWidth / container.clientHeight;
    coinCamera.updateProjectionMatrix();
    coinRenderer.setSize(container.clientWidth, container.clientHeight);
  }
});
