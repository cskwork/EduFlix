import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';

// 퀴즈 데이터
const QUIZ_DATA = [
    { 
        question: '점 (3, 4, 0)과 원점 사이의 거리는?', 
        answer: '5', 
        options: ['5', '7', '12'],
        explain: '√(3² + 4² + 0²) = √25 = 5'
    },
    { 
        question: '점 (1, 2, 2)와 원점 사이의 거리는?', 
        answer: '3', 
        options: ['3', '5', '9'],
        explain: '√(1² + 2² + 2²) = √9 = 3'
    },
    { 
        question: '(2, 0, 0)에서 (2, 3, 4)까지의 거리는?', 
        answer: '5', 
        options: ['4', '5', '7'],
        explain: '√(0² + 3² + 4²) = √25 = 5'
    },
];

// 목표 위치들
const TARGET_POSITIONS = [
    { x: 3, y: 2, z: 4 },
    { x: -2, y: 3, z: 1 },
    { x: 4, y: 1, z: -2 },
];

class CoordinatesApp {
    constructor() {
        this.currentScene = 0;
        this.scenes = ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'];
        this.currentQuiz = 0;
        this.currentTarget = 0;
        this.point = null;
        this.targetPoint = null;
        this.distanceLine = null;
        
        this.init();
    }

    init() {
        this.setupThreeJS();
        this.setupControls();
        this.setupLighting();
        this.createCoordinateSystem();
        this.createPoints();
        this.setupEventListeners();
        this.hideLoadingScreen();
        this.showScene(0);
        this.animate();
    }

    setupThreeJS() {
        this.scene = new THREE.Scene();
        
        // 배경
        const canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#1e272e');
        gradient.addColorStop(1, '#2d3436');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 2, 512);
        
        this.scene.background = new THREE.CanvasTexture(canvas);

        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(8, 6, 8);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.getElementById('three-container').appendChild(this.renderer.domElement);
    }

    setupControls() {
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.05;
        this.orbitControls.minDistance = 5;
        this.orbitControls.maxDistance = 25;
        this.orbitControls.enablePan = false;
    }

    setupLighting() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);

        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(5, 10, 7);
        this.scene.add(mainLight);

        const fillLight = new THREE.DirectionalLight(0xE17055, 0.3);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);
    }

    createCoordinateSystem() {
        const axisLength = 6;
        
        // X축 (빨강)
        const xAxisGeom = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-axisLength, 0, 0),
            new THREE.Vector3(axisLength, 0, 0)
        ]);
        const xAxisMat = new THREE.LineBasicMaterial({ color: 0xFF6B6B, linewidth: 2 });
        this.xAxis = new THREE.Line(xAxisGeom, xAxisMat);
        this.scene.add(this.xAxis);

        // Y축 (청록)
        const yAxisGeom = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, -axisLength, 0),
            new THREE.Vector3(0, axisLength, 0)
        ]);
        const yAxisMat = new THREE.LineBasicMaterial({ color: 0x4ECDC4, linewidth: 2 });
        this.yAxis = new THREE.Line(yAxisGeom, yAxisMat);
        this.scene.add(this.yAxis);

        // Z축 (하늘)
        const zAxisGeom = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, -axisLength),
            new THREE.Vector3(0, 0, axisLength)
        ]);
        const zAxisMat = new THREE.LineBasicMaterial({ color: 0x45B7D1, linewidth: 2 });
        this.zAxis = new THREE.Line(zAxisGeom, zAxisMat);
        this.scene.add(this.zAxis);

        // 그리드 평면 (XZ)
        const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x333333);
        this.scene.add(gridHelper);

        // 축 화살표
        this.createArrow(new THREE.Vector3(axisLength, 0, 0), 0xFF6B6B, 'X');
        this.createArrow(new THREE.Vector3(0, axisLength, 0), 0x4ECDC4, 'Y');
        this.createArrow(new THREE.Vector3(0, 0, axisLength), 0x45B7D1, 'Z');

        // 원점 표시
        const originGeom = new THREE.SphereGeometry(0.15, 16, 16);
        const originMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const origin = new THREE.Mesh(originGeom, originMat);
        this.scene.add(origin);

        // 눈금 표시
        for (let i = -5; i <= 5; i++) {
            if (i === 0) continue;
            
            // X축 눈금
            const xTick = this.createTick();
            xTick.position.set(i, 0, 0);
            this.scene.add(xTick);
            
            // Z축 눈금
            const zTick = this.createTick();
            zTick.position.set(0, 0, i);
            this.scene.add(zTick);
        }
    }

    createArrow(position, color, label) {
        const coneGeom = new THREE.ConeGeometry(0.15, 0.4, 16);
        const coneMat = new THREE.MeshBasicMaterial({ color });
        const cone = new THREE.Mesh(coneGeom, coneMat);
        
        // 방향에 따라 회전
        if (position.x > 0) cone.rotation.z = -Math.PI / 2;
        else if (position.z > 0) cone.rotation.x = Math.PI / 2;
        
        cone.position.copy(position);
        this.scene.add(cone);
    }

    createTick() {
        const geom = new THREE.SphereGeometry(0.05, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color: 0x888888 });
        return new THREE.Mesh(geom, mat);
    }

    createPoints() {
        // 유저가 움직이는 점 (주황)
        const pointGeom = new THREE.SphereGeometry(0.3, 32, 32);
        const pointMat = new THREE.MeshPhysicalMaterial({
            color: 0xE17055,
            metalness: 0.3,
            roughness: 0.4,
            emissive: 0xE17055,
            emissiveIntensity: 0.3
        });
        this.point = new THREE.Mesh(pointGeom, pointMat);
        this.point.position.set(0, 0, 0);
        this.point.userData.draggable = true;
        this.scene.add(this.point);

        // 목표 점 (노랑, 반투명)
        const targetGeom = new THREE.SphereGeometry(0.35, 32, 32);
        const targetMat = new THREE.MeshPhysicalMaterial({
            color: 0xFDCB6E,
            metalness: 0.1,
            roughness: 0.3,
            transparent: true,
            opacity: 0.6
        });
        this.targetPoint = new THREE.Mesh(targetGeom, targetMat);
        this.targetPoint.position.set(3, 2, 4);
        this.targetPoint.visible = false;
        this.scene.add(this.targetPoint);

        // 점에서 각 축으로의 투영선
        this.projectionLines = new THREE.Group();
        this.scene.add(this.projectionLines);
        
        // 거리선 (두 점 사이)
        const lineMat = new THREE.LineBasicMaterial({ 
            color: 0xFDCB6E, 
            linewidth: 2 
        });
        const lineGeom = new THREE.BufferGeometry();
        this.distanceLine = new THREE.Line(lineGeom, lineMat);
        this.distanceLine.visible = false;
        this.scene.add(this.distanceLine);
    }

    setupDragControls() {
        if (this.dragControls) {
            this.dragControls.dispose();
        }
        
        this.dragControls = new DragControls([this.point], this.camera, this.renderer.domElement);
        
        this.dragControls.addEventListener('dragstart', () => {
            this.orbitControls.enabled = false;
        });
        
        this.dragControls.addEventListener('drag', (event) => {
            // 정수 좌표로 스냅
            this.point.position.x = Math.round(this.point.position.x);
            this.point.position.y = Math.max(0, Math.round(this.point.position.y));
            this.point.position.z = Math.round(this.point.position.z);
            
            // 범위 제한
            this.point.position.clamp(
                new THREE.Vector3(-5, 0, -5),
                new THREE.Vector3(5, 5, 5)
            );
            
            this.updateStats();
            this.updateProjectionLines();
        });
        
        this.dragControls.addEventListener('dragend', () => {
            this.orbitControls.enabled = true;
        });
    }

    updateStats() {
        document.getElementById('stat-x').textContent = this.point.position.x.toFixed(0);
        document.getElementById('stat-y').textContent = this.point.position.y.toFixed(0);
        document.getElementById('stat-z').textContent = this.point.position.z.toFixed(0);
    }

    updateProjectionLines() {
        // 기존 투영선 제거
        while (this.projectionLines.children.length > 0) {
            this.projectionLines.remove(this.projectionLines.children[0]);
        }
        
        const pos = this.point.position;
        const lineMat = new THREE.LineDashedMaterial({ 
            color: 0x888888, 
            dashSize: 0.2, 
            gapSize: 0.1 
        });
        
        // XZ 평면으로 투영 (수직선)
        const vertLine = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(pos.x, 0, pos.z),
            new THREE.Vector3(pos.x, pos.y, pos.z)
        ]);
        const vLine = new THREE.Line(vertLine, lineMat);
        vLine.computeLineDistances();
        this.projectionLines.add(vLine);
        
        // X축으로 투영
        const xLine = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, pos.z),
            new THREE.Vector3(pos.x, 0, pos.z)
        ]);
        const xL = new THREE.Line(xLine, new THREE.LineDashedMaterial({ 
            color: 0xFF6B6B, dashSize: 0.2, gapSize: 0.1 
        }));
        xL.computeLineDistances();
        this.projectionLines.add(xL);
        
        // Z축으로 투영
        const zLine = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(pos.x, 0, 0),
            new THREE.Vector3(pos.x, 0, pos.z)
        ]);
        const zL = new THREE.Line(zLine, new THREE.LineDashedMaterial({ 
            color: 0x45B7D1, dashSize: 0.2, gapSize: 0.1 
        }));
        zL.computeLineDistances();
        this.projectionLines.add(zL);
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onResize());
        
        document.getElementById('prev-btn').addEventListener('click', () => this.prevScene());
        document.getElementById('next-btn').addEventListener('click', () => this.nextScene());
        
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') this.nextScene();
            if (e.key === 'ArrowLeft') this.prevScene();
            
            // WASD + QE로 점 이동
            if (this.currentScene === 3) { // Core scene
                const step = 1;
                switch(e.key.toLowerCase()) {
                    case 'w': this.point.position.z -= step; break;
                    case 's': this.point.position.z += step; break;
                    case 'a': this.point.position.x -= step; break;
                    case 'd': this.point.position.x += step; break;
                    case 'q': this.point.position.y -= step; break;
                    case 'e': this.point.position.y += step; break;
                }
                this.point.position.clamp(
                    new THREE.Vector3(-5, 0, -5),
                    new THREE.Vector3(5, 5, 5)
                );
                this.updateStats();
                this.updateProjectionLines();
            }
        });

        document.getElementById('reset-point-btn')?.addEventListener('click', () => this.resetPoint());
        document.getElementById('show-distance-btn')?.addEventListener('click', () => this.toggleDistanceLine());
        document.getElementById('check-position-btn')?.addEventListener('click', () => this.checkPosition());

        document.getElementById('free-explore-btn')?.addEventListener('click', () => this.enterFreeExplore());
        document.getElementById('restart-btn')?.addEventListener('click', () => location.reload());
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }

    showScene(index) {
        document.querySelectorAll('.scene-ui').forEach(el => el.classList.remove('active'));
        document.getElementById(`${this.scenes[index]}-ui`).classList.add('active');
        
        document.getElementById('prev-btn').disabled = index === 0;
        document.getElementById('next-btn').disabled = index === this.scenes.length - 1;
        this.updateProgressIndicator(index);
        
        this.currentScene = index;
        
        const sceneName = this.scenes[index];
        this[`setup${this.capitalize(sceneName)}Scene`]?.();
    }

    setupHookScene() {
        this.point.visible = false;
        this.targetPoint.visible = false;
        this.projectionLines.visible = false;
        this.distanceLine.visible = false;
        this.camera.position.set(10, 8, 10);
        this.orbitControls.autoRotate = true;
        this.orbitControls.autoRotateSpeed = 1;
    }

    setupAnchorScene() {
        this.point.visible = true;
        this.point.position.set(2, 0, 3);
        this.projectionLines.visible = true;
        this.updateStats();
        this.updateProjectionLines();
        this.orbitControls.autoRotate = false;
    }

    setupStoryScene() {
        this.point.visible = true;
        this.point.position.set(3, 4, 2);
        this.updateStats();
        this.updateProjectionLines();
    }

    setupCoreScene() {
        this.point.visible = true;
        this.targetPoint.visible = true;
        this.projectionLines.visible = true;
        this.distanceLine.visible = false;
        
        // 목표 위치 설정
        const target = TARGET_POSITIONS[this.currentTarget];
        this.targetPoint.position.set(target.x, target.y, target.z);
        document.getElementById('target-x').textContent = target.x;
        document.getElementById('target-y').textContent = target.y;
        document.getElementById('target-z').textContent = target.z;
        
        // 점 초기화
        this.point.position.set(0, 0, 0);
        this.updateStats();
        this.updateProjectionLines();
        
        // 드래그 컨트롤 활성화
        this.setupDragControls();
        
        this.camera.position.set(8, 6, 8);
        this.orbitControls.autoRotate = false;
    }

    setupVisualizeScene() {
        this.point.visible = true;
        this.targetPoint.visible = true;
        this.projectionLines.visible = false;
        
        // 예시: (0,0,0)에서 (3,4,0)
        this.point.position.set(0, 0, 0);
        this.targetPoint.position.set(3, 4, 0);
        
        // 거리선 표시
        this.distanceLine.visible = true;
        const lineGeom = new THREE.BufferGeometry().setFromPoints([
            this.point.position.clone(),
            this.targetPoint.position.clone()
        ]);
        this.distanceLine.geometry.dispose();
        this.distanceLine.geometry = lineGeom;
        
        if (this.dragControls) this.dragControls.enabled = false;
    }

    setupQuizScene() {
        this.point.visible = true;
        this.targetPoint.visible = false;
        this.distanceLine.visible = false;
        this.projectionLines.visible = false;
        
        this.loadQuiz(this.currentQuiz);
        this.camera.position.set(8, 6, 8);
        
        if (this.dragControls) this.dragControls.enabled = false;
    }

    setupWrapScene() {
        this.point.visible = true;
        this.targetPoint.visible = true;
        this.projectionLines.visible = true;
        this.distanceLine.visible = true;
        
        this.point.position.set(0, 0, 0);
        this.targetPoint.position.set(3, 4, 0);
        this.updateProjectionLines();
        
        const lineGeom = new THREE.BufferGeometry().setFromPoints([
            this.point.position.clone(),
            this.targetPoint.position.clone()
        ]);
        this.distanceLine.geometry.dispose();
        this.distanceLine.geometry = lineGeom;
        
        this.orbitControls.autoRotate = true;
        this.orbitControls.autoRotateSpeed = 0.5;
    }

    resetPoint() {
        this.point.position.set(0, 0, 0);
        this.updateStats();
        this.updateProjectionLines();
    }

    toggleDistanceLine() {
        this.distanceLine.visible = !this.distanceLine.visible;
        
        if (this.distanceLine.visible) {
            const lineGeom = new THREE.BufferGeometry().setFromPoints([
                this.point.position.clone(),
                this.targetPoint.position.clone()
            ]);
            this.distanceLine.geometry.dispose();
            this.distanceLine.geometry = lineGeom;
            
            // 거리 계산
            const dx = this.targetPoint.position.x - this.point.position.x;
            const dy = this.targetPoint.position.y - this.point.position.y;
            const dz = this.targetPoint.position.z - this.point.position.z;
            const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
            
            alert(`거리: ${distance.toFixed(2)}`);
        }
    }

    checkPosition() {
        const target = TARGET_POSITIONS[this.currentTarget];
        const p = this.point.position;
        
        if (Math.abs(p.x - target.x) < 0.5 && 
            Math.abs(p.y - target.y) < 0.5 && 
            Math.abs(p.z - target.z) < 0.5) {
            
            alert('정확해요! 목표 위치에 도달했습니다!');
            
            this.currentTarget++;
            if (this.currentTarget < TARGET_POSITIONS.length) {
                // 다음 목표
                const nextTarget = TARGET_POSITIONS[this.currentTarget];
                this.targetPoint.position.set(nextTarget.x, nextTarget.y, nextTarget.z);
                document.getElementById('target-x').textContent = nextTarget.x;
                document.getElementById('target-y').textContent = nextTarget.y;
                document.getElementById('target-z').textContent = nextTarget.z;
                this.point.position.set(0, 0, 0);
                this.updateStats();
                this.updateProjectionLines();
            } else {
                this.nextScene();
            }
        } else {
            alert(`현재 위치: (${p.x}, ${p.y}, ${p.z})\n목표 위치: (${target.x}, ${target.y}, ${target.z})\n다시 시도해보세요!`);
        }
    }

    loadQuiz(index) {
        if (index >= QUIZ_DATA.length) {
            this.nextScene();
            return;
        }
        
        const quiz = QUIZ_DATA[index];
        document.getElementById('quiz-question').textContent = quiz.question;
        
        const optionsContainer = document.getElementById('quiz-options');
        optionsContainer.innerHTML = '';
        
        quiz.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option';
            btn.dataset.answer = opt;
            btn.textContent = opt;
            btn.addEventListener('click', (e) => this.checkQuizAnswer(e));
            optionsContainer.appendChild(btn);
        });

        // 해당 점 표시
        if (index === 0) {
            this.point.position.set(3, 4, 0);
        } else if (index === 1) {
            this.point.position.set(1, 2, 2);
        } else {
            this.point.position.set(2, 3, 4);
            this.targetPoint.visible = true;
            this.targetPoint.position.set(2, 0, 0);
        }
        
        this.projectionLines.visible = true;
        this.updateProjectionLines();
        
        document.getElementById('quiz-feedback').classList.add('hidden');
    }

    checkQuizAnswer(e) {
        const selected = e.target.dataset.answer;
        const quiz = QUIZ_DATA[this.currentQuiz];
        const feedback = document.getElementById('quiz-feedback');
        
        document.querySelectorAll('.quiz-option').forEach(opt => {
            opt.disabled = true;
            if (opt.dataset.answer === quiz.answer) {
                opt.classList.add('correct');
            }
        });
        
        if (selected === quiz.answer) {
            e.target.classList.add('correct');
            feedback.textContent = `정답! ${quiz.explain}`;
            feedback.className = 'quiz-feedback success';
        } else {
            e.target.classList.add('wrong');
            feedback.textContent = `오답. ${quiz.explain}`;
            feedback.className = 'quiz-feedback error';
        }
        
        feedback.classList.remove('hidden');
        
        setTimeout(() => {
            this.currentQuiz++;
            if (this.currentQuiz < QUIZ_DATA.length) {
                this.loadQuiz(this.currentQuiz);
            } else {
                this.nextScene();
            }
        }, 2500);
    }

    enterFreeExplore() {
        document.getElementById('ui-overlay').style.display = 'none';
        document.getElementById('scene-nav').style.display = 'none';
        
        // 좌표 표시 UI
        const coordDisplay = document.createElement('div');
        coordDisplay.style.cssText = `
            position: fixed;
            top: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.7);
            padding: 16px 24px;
            border-radius: 12px;
            font-size: 1.2rem;
            z-index: 100;
        `;
        coordDisplay.id = 'free-coord';
        coordDisplay.innerHTML = '(<span style="color:#FF6B6B">0</span>, <span style="color:#4ECDC4">0</span>, <span style="color:#45B7D1">0</span>)';
        document.body.appendChild(coordDisplay);
        
        // 컨트롤 안내
        const controls = document.createElement('div');
        controls.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.7);
            padding: 12px 20px;
            border-radius: 12px;
            font-size: 0.9rem;
            z-index: 100;
        `;
        controls.textContent = 'WASD: 가로/깊이 이동 | Q/E: 높이 조절 | 마우스: 시점 회전';
        document.body.appendChild(controls);
        
        // 나가기 버튼
        const exitBtn = document.createElement('button');
        exitBtn.textContent = '나가기';
        exitBtn.className = 'nav-btn';
        exitBtn.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: #D63031;
            z-index: 100;
        `;
        exitBtn.onclick = () => location.reload();
        document.body.appendChild(exitBtn);
        
        this.point.visible = true;
        this.targetPoint.visible = false;
        this.projectionLines.visible = true;
        this.point.position.set(0, 0, 0);
        this.updateProjectionLines();
        this.setupDragControls();
        
        // 좌표 실시간 업데이트
        this.freeExploreMode = true;
    }

    nextScene() {
        if (this.currentScene < this.scenes.length - 1) {
            this.showScene(this.currentScene + 1);
        }
    }

    prevScene() {
        if (this.currentScene > 0) {
            this.showScene(this.currentScene - 1);
        }
    }

    updateProgressIndicator(index) {
        const container = document.getElementById('progress-indicator');
        container.innerHTML = '';
        this.scenes.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = 'progress-dot';
            if (i < index) dot.classList.add('completed');
            if (i === index) dot.classList.add('active');
            container.appendChild(dot);
        });
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.orbitControls.update();
        
        // 점 펄스 애니메이션
        if (this.point && this.point.visible) {
            const scale = 1 + Math.sin(Date.now() * 0.003) * 0.1;
            this.point.scale.set(scale, scale, scale);
        }
        
        // 자유 탐색 모드 좌표 업데이트
        if (this.freeExploreMode) {
            const coord = document.getElementById('free-coord');
            if (coord) {
                const p = this.point.position;
                coord.innerHTML = `(<span style="color:#FF6B6B">${p.x.toFixed(0)}</span>, <span style="color:#4ECDC4">${p.y.toFixed(0)}</span>, <span style="color:#45B7D1">${p.z.toFixed(0)}</span>)`;
            }
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Start
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CoordinatesApp();
});
