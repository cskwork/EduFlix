import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 정다면체 데이터
const SOLIDS_DATA = {
    tetrahedron: { 
        name: '정사면체', 
        faces: 4, edges: 6, vertices: 4,
        faceShape: '정삼각형',
        color: 0x6C5CE7
    },
    cube: { 
        name: '정육면체', 
        faces: 6, edges: 12, vertices: 8,
        faceShape: '정사각형',
        color: 0x00CEC9
    },
    octahedron: { 
        name: '정팔면체', 
        faces: 8, edges: 12, vertices: 6,
        faceShape: '정삼각형',
        color: 0xFDCB6E
    },
    dodecahedron: { 
        name: '정십이면체', 
        faces: 12, edges: 30, vertices: 20,
        faceShape: '정오각형',
        color: 0xE17055
    },
    icosahedron: { 
        name: '정이십면체', 
        faces: 20, edges: 30, vertices: 12,
        faceShape: '정삼각형',
        color: 0x00B894
    }
};

// 퀴즈 데이터
const QUIZ_DATA = [
    { question: '정팔면체의 면은 몇 개일까요?', answer: 8, options: [6, 8, 12], explain: "정삼각형 면이 위쪽 4개, 아래쪽 4개로 모두 8개입니다." },
    { question: '정육면체의 꼭짓점은 몇 개일까요?', answer: 8, options: [6, 8, 12], explain: "위쪽 4개와 아래쪽 4개를 더하면 꼭짓점은 8개입니다." },
    { question: '정이십면체의 면은 몇 개일까요?', answer: 20, options: [12, 16, 20], explain: "합동인 정삼각형 면 20개로 이루어집니다. 면 20, 모서리 30, 꼭짓점 12에서 12−30+20=2도 확인하세요." },
];

class PlatonicSolidsApp {
    constructor() {
        this.currentScene = 0;
        this.scenes = ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'];
        this.currentSolid = 'tetrahedron';
        this.solidMeshes = {};
        this.isWireframe = false;
        this.currentQuiz = 0;
        
        this.init();
    }

    init() {
        this.setupThreeJS();
        this.setupControls();
        this.setupLighting();
        this.createSolids();
        this.setupEventListeners();
        this.hideLoadingScreen();
        this.showScene(0);
        this.animate();
    }

    setupThreeJS() {
        // Scene
        this.scene = new THREE.Scene();
        
        // 그라데이션 배경
        const canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#0f0f1a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 2, 512);
        
        const bgTexture = new THREE.CanvasTexture(canvas);
        this.scene.background = bgTexture;

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 2, 8);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        document.getElementById('three-container').appendChild(this.renderer.domElement);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 20;
        this.controls.enablePan = false;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 1.5;
    }

    setupLighting() {
        // Ambient
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);

        // Main light
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(5, 10, 7);
        mainLight.castShadow = true;
        this.scene.add(mainLight);

        // Fill light
        const fillLight = new THREE.DirectionalLight(0x6C5CE7, 0.3);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);

        // Back light
        const backLight = new THREE.DirectionalLight(0x00CEC9, 0.2);
        backLight.position.set(0, -5, -10);
        this.scene.add(backLight);
    }

    createSolids() {
        const geometries = {
            tetrahedron: new THREE.TetrahedronGeometry(2),
            cube: new THREE.BoxGeometry(2.5, 2.5, 2.5),
            octahedron: new THREE.OctahedronGeometry(2),
            dodecahedron: new THREE.DodecahedronGeometry(2),
            icosahedron: new THREE.IcosahedronGeometry(2)
        };

        for (const [name, geometry] of Object.entries(geometries)) {
            const material = new THREE.MeshPhysicalMaterial({
                color: SOLIDS_DATA[name].color,
                metalness: 0.1,
                roughness: 0.3,
                transparent: true,
                opacity: 0.85,
                side: THREE.DoubleSide
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.visible = false;
            
            // 모서리 라인
            const edges = new THREE.EdgesGeometry(geometry);
            const lineMaterial = new THREE.LineBasicMaterial({ 
                color: 0xffffff, 
                transparent: true, 
                opacity: 0.6 
            });
            const wireframe = new THREE.LineSegments(edges, lineMaterial);
            mesh.add(wireframe);
            
            this.solidMeshes[name] = mesh;
            this.scene.add(mesh);
        }

        // 초기 표시: icosahedron (Hook scene)
        this.solidMeshes.icosahedron.visible = true;
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.onResize());
        
        // Navigation
        document.getElementById('prev-btn').addEventListener('click', () => this.prevScene());
        document.getElementById('next-btn').addEventListener('click', () => this.nextScene());
        
        // Keyboard
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') this.nextScene();
            if (e.key === 'ArrowLeft') this.prevScene();
        });

        // Solid selector buttons
        document.querySelectorAll('.solid-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const solid = e.currentTarget.dataset.solid;
                this.switchSolid(solid);
                
                // Update active state
                document.querySelectorAll('.solid-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        // Action buttons
        document.getElementById('unfold-btn')?.addEventListener('click', () => this.toggleUnfold());
        document.getElementById('wireframe-btn')?.addEventListener('click', () => this.toggleWireframe());
        
        // Quiz options
        document.querySelectorAll('.quiz-option').forEach(opt => {
            opt.addEventListener('click', (e) => this.checkQuizAnswer(e));
        });

        // Wrap actions
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

    // Scene Management
    showScene(index) {
        // Update UI
        document.querySelectorAll('.scene-ui').forEach(el => el.classList.remove('active'));
        document.getElementById(`${this.scenes[index]}-ui`).classList.add('active');
        
        // Update navigation
        document.getElementById('prev-btn').disabled = index === 0;
        document.getElementById('next-btn').disabled = index === this.scenes.length - 1;
        this.updateProgressIndicator(index);
        
        this.currentScene = index;
        
        // Scene-specific setup
        const sceneName = this.scenes[index];
        this[`setup${this.capitalize(sceneName)}Scene`]?.();
    }

    setupHookScene() {
        // 모든 메쉬 숨기고 icosahedron만 표시
        Object.values(this.solidMeshes).forEach(m => m.visible = false);
        this.solidMeshes.icosahedron.visible = true;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 2;
    }

    setupAnchorScene() {
        Object.values(this.solidMeshes).forEach(m => m.visible = false);
        this.solidMeshes.tetrahedron.visible = true;
        this.controls.autoRotateSpeed = 1;
    }

    setupStoryScene() {
        Object.values(this.solidMeshes).forEach(m => m.visible = false);
        
        // 여러 정다면체 순차 표시 애니메이션
        const sequence = ['tetrahedron', 'cube', 'octahedron', 'dodecahedron', 'icosahedron'];
        let current = 0;
        
        const showNext = () => {
            Object.values(this.solidMeshes).forEach(m => m.visible = false);
            if (current < sequence.length) {
                this.solidMeshes[sequence[current]].visible = true;
                current++;
                setTimeout(showNext, 1500);
            } else {
                current = 0;
                setTimeout(showNext, 1500);
            }
        };
        
        // 스토리 씬에서만 실행
        this.storyInterval = setInterval(() => {
            if (this.currentScene !== 2) {
                clearInterval(this.storyInterval);
                return;
            }
        }, 100);
        
        showNext();
    }

    setupCoreScene() {
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 1;
        this.switchSolid('tetrahedron');
        
        // Reset button states
        document.querySelectorAll('.solid-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-solid="tetrahedron"]')?.classList.add('active');
    }

    setupVisualizeScene() {
        Object.values(this.solidMeshes).forEach(m => m.visible = false);
        
        // 5개 모두 작게 표시
        const positions = [
            { x: -4, y: 0, z: 0 },
            { x: -2, y: 0, z: 0 },
            { x: 0, y: 0, z: 0 },
            { x: 2, y: 0, z: 0 },
            { x: 4, y: 0, z: 0 }
        ];
        
        const solids = ['tetrahedron', 'cube', 'octahedron', 'dodecahedron', 'icosahedron'];
        solids.forEach((name, i) => {
            const mesh = this.solidMeshes[name];
            mesh.visible = true;
            mesh.scale.set(0.4, 0.4, 0.4);
            mesh.position.set(positions[i].x, positions[i].y, positions[i].z);
        });
        
        this.camera.position.set(0, 2, 12);
        this.controls.autoRotate = false;
    }

    setupQuizScene() {
        // Reset scale and position
        Object.values(this.solidMeshes).forEach(m => {
            m.scale.set(1, 1, 1);
            m.position.set(0, 0, 0);
            m.visible = false;
        });
        
        this.currentQuiz = 0;
        this.loadQuiz(this.currentQuiz);
        this.camera.position.set(0, 2, 8);
        this.controls.autoRotate = true;
    }

    setupWrapScene() {
        Object.values(this.solidMeshes).forEach(m => {
            m.scale.set(1, 1, 1);
            m.position.set(0, 0, 0);
            m.visible = false;
        });
        this.solidMeshes.icosahedron.visible = true;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.5;
    }

    switchSolid(solidName) {
        Object.values(this.solidMeshes).forEach(m => {
            m.visible = false;
            m.scale.set(1, 1, 1);
            m.position.set(0, 0, 0);
        });
        
        this.solidMeshes[solidName].visible = true;
        this.currentSolid = solidName;
        this.updateStats(solidName);
    }

    updateStats(solidName) {
        const data = SOLIDS_DATA[solidName];
        document.getElementById('stat-faces').textContent = data.faces;
        document.getElementById('stat-edges').textContent = data.edges;
        document.getElementById('stat-vertices').textContent = data.vertices;
        
        const euler = data.vertices - data.edges + data.faces;
        document.getElementById('stat-euler').textContent = `=${euler}`;
    }

    toggleWireframe() {
        this.isWireframe = !this.isWireframe;
        const mesh = this.solidMeshes[this.currentSolid];
        mesh.material.opacity = this.isWireframe ? 0.1 : 0.85;
        mesh.material.wireframe = this.isWireframe;
    }

    toggleUnfold() {
        // 도형을 확대하거나 원래 크기로 되돌린다. 전개도를 생성하지 않는다.
        const mesh = this.solidMeshes[this.currentSolid];
        const startScale = mesh.scale.x;
        const targetScale = startScale > 1 ? 1 : 1.5;
        
        const animate = () => {
            const diff = targetScale - mesh.scale.x;
            if (Math.abs(diff) > 0.01) {
                mesh.scale.x += diff * 0.1;
                mesh.scale.y += diff * 0.1;
                mesh.scale.z += diff * 0.1;
                requestAnimationFrame(animate);
            }
        };
        animate();
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
            btn.textContent = `${opt}개`;
            btn.addEventListener('click', (e) => this.checkQuizAnswer(e));
            optionsContainer.appendChild(btn);
        });

        // 해당 정다면체 표시
        if (index === 0) this.switchSolid('octahedron');
        else if (index === 1) this.switchSolid('cube');
        else if (index === 2) this.switchSolid('icosahedron');
        
        document.getElementById('quiz-feedback').classList.add('hidden');
    }

    checkQuizAnswer(e) {
        if (e.target.disabled) return;
        const selected = parseInt(e.target.dataset.answer);
        const correct = QUIZ_DATA[this.currentQuiz].answer;
        const feedback = document.getElementById('quiz-feedback');
        
        // 모든 옵션 비활성화
        document.querySelectorAll('.quiz-option').forEach(opt => {
            opt.disabled = true;
            if (parseInt(opt.dataset.answer) === correct) {
                opt.classList.add('correct');
            }
        });
        
        if (selected === correct) {
            e.target.classList.add('correct');
            feedback.textContent = `정답입니다. ${QUIZ_DATA[this.currentQuiz].explain}`;
            feedback.className = 'quiz-feedback success';
        } else {
            e.target.classList.add('wrong');
            feedback.textContent = `정답은 ${correct}개입니다. ${QUIZ_DATA[this.currentQuiz].explain}`;
            feedback.className = 'quiz-feedback error';
        }
        
        feedback.classList.remove('hidden');
        
        // 다음 퀴즈로
        const next = document.createElement('button');
        next.className = 'action-btn';
        next.textContent = '해설을 읽었어요 · 다음';
        next.onclick = () => {
            next.remove();
            this.currentQuiz++;
            if (this.currentQuiz < QUIZ_DATA.length) this.loadQuiz(this.currentQuiz);
            else this.nextScene();
        };
        feedback.appendChild(document.createElement('br'));
        feedback.appendChild(next);
    }

    enterFreeExplore() {
        // 모든 UI 숨기고 자유 탐색 모드
        document.getElementById('ui-overlay').style.display = 'none';
        document.getElementById('scene-nav').style.display = 'none';
        
        // 선택기 UI 표시
        const selector = document.createElement('div');
        selector.className = 'free-explore-selector';
        selector.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
            z-index: 100;
        `;
        
        Object.keys(SOLIDS_DATA).forEach(name => {
            const btn = document.createElement('button');
            btn.textContent = SOLIDS_DATA[name].name;
            btn.className = 'nav-btn';
            btn.style.padding = '10px 16px';
            btn.style.fontSize = '0.85rem';
            btn.onclick = () => this.switchSolid(name);
            selector.appendChild(btn);
        });
        
        // 나가기 버튼
        const exitBtn = document.createElement('button');
        exitBtn.textContent = '나가기';
        exitBtn.className = 'nav-btn';
        exitBtn.style.background = '#D63031';
        exitBtn.onclick = () => location.reload();
        selector.appendChild(exitBtn);
        
        document.body.appendChild(selector);
        
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.5;
        this.switchSolid('icosahedron');
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
        
        this.controls.update();
        
        // 활성 솔리드 약간 회전 (자동 회전 외 추가)
        Object.values(this.solidMeshes).forEach(mesh => {
            if (mesh.visible) {
                mesh.rotation.y += 0.001;
            }
        });
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Start app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PlatonicSolidsApp();
});
