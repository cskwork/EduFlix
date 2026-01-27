import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 입체 데이터
const SOLIDS_DATA = {
    cylinder: { 
        name: '원기둥', 
        formula: 'πr²h',
        description: '밑면이 원인 기둥',
        color: 0x0984E3
    },
    cone: { 
        name: '원뿔', 
        formula: '⅓πr²h',
        description: '원기둥의 1/3',
        color: 0xFDCB6E
    },
    sphere: { 
        name: '구', 
        formula: '⁴⁄₃πr³',
        description: '모든 점이 중심에서 같은 거리',
        color: 0x00CEC9
    }
};

// 퀴즈 데이터
const QUIZ_DATA = [
    { 
        question: '반지름 3, 높이 4인 원기둥의 부피는?', 
        answer: '36π', 
        options: ['36π', '12π', '48π'],
        explain: 'πr²h = π × 3² × 4 = 36π'
    },
    { 
        question: '반지름 3, 높이 6인 원뿔의 부피는?', 
        answer: '18π', 
        options: ['54π', '18π', '9π'],
        explain: '⅓πr²h = ⅓ × π × 9 × 6 = 18π'
    },
    { 
        question: '원기둥과 같은 밑면, 높이의 원뿔 몇 개가 원기둥과 같을까?', 
        answer: '3', 
        options: ['2', '3', '4'],
        explain: '원기둥 = 원뿔 × 3'
    },
];

class VolumeSolidsApp {
    constructor() {
        this.currentScene = 0;
        this.scenes = ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'];
        this.currentSolid = 'cylinder';
        this.solidMeshes = {};
        this.waterMeshes = {};
        this.waterLevel = 0;
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
        
        // 배경 그라데이션
        const canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#0a1628');
        gradient.addColorStop(1, '#1a2940');
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
        this.camera.position.set(0, 3, 8);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.getElementById('three-container').appendChild(this.renderer.domElement);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 4;
        this.controls.maxDistance = 20;
        this.controls.enablePan = false;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 1;
    }

    setupLighting() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);

        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(5, 10, 7);
        this.scene.add(mainLight);

        const fillLight = new THREE.DirectionalLight(0x74B9FF, 0.3);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);
    }

    createSolids() {
        const radius = 1.5;
        const height = 3;

        // 원기둥
        const cylGeom = new THREE.CylinderGeometry(radius, radius, height, 32, 1, true);
        const cylMat = new THREE.MeshPhysicalMaterial({
            color: 0x0984E3,
            metalness: 0.1,
            roughness: 0.2,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        const cylinder = new THREE.Mesh(cylGeom, cylMat);
        
        // 원기둥 뚜껑/바닥
        const capGeom = new THREE.CircleGeometry(radius, 32);
        const capMat = new THREE.MeshPhysicalMaterial({
            color: 0x0984E3,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const topCap = new THREE.Mesh(capGeom, capMat);
        topCap.rotation.x = -Math.PI / 2;
        topCap.position.y = height / 2;
        const bottomCap = new THREE.Mesh(capGeom, capMat.clone());
        bottomCap.rotation.x = Math.PI / 2;
        bottomCap.position.y = -height / 2;
        
        const cylinderGroup = new THREE.Group();
        cylinderGroup.add(cylinder);
        cylinderGroup.add(topCap);
        cylinderGroup.add(bottomCap);
        cylinderGroup.visible = false;
        this.solidMeshes.cylinder = cylinderGroup;
        this.scene.add(cylinderGroup);

        // 원뿔
        const coneGeom = new THREE.ConeGeometry(radius, height, 32, 1, true);
        const coneMat = new THREE.MeshPhysicalMaterial({
            color: 0xFDCB6E,
            metalness: 0.1,
            roughness: 0.2,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        const cone = new THREE.Mesh(coneGeom, coneMat);
        
        const coneBottom = new THREE.Mesh(capGeom.clone(), new THREE.MeshPhysicalMaterial({
            color: 0xFDCB6E,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        }));
        coneBottom.rotation.x = Math.PI / 2;
        coneBottom.position.y = -height / 2;
        
        const coneGroup = new THREE.Group();
        coneGroup.add(cone);
        coneGroup.add(coneBottom);
        coneGroup.visible = false;
        this.solidMeshes.cone = coneGroup;
        this.scene.add(coneGroup);

        // 구
        const sphereGeom = new THREE.SphereGeometry(radius, 32, 32);
        const sphereMat = new THREE.MeshPhysicalMaterial({
            color: 0x00CEC9,
            metalness: 0.1,
            roughness: 0.2,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        const sphere = new THREE.Mesh(sphereGeom, sphereMat);
        sphere.visible = false;
        this.solidMeshes.sphere = sphere;
        this.scene.add(sphere);

        // 물 메쉬 (원기둥 내부)
        const waterCylGeom = new THREE.CylinderGeometry(radius * 0.95, radius * 0.95, 0.1, 32);
        const waterMat = new THREE.MeshPhysicalMaterial({
            color: 0x74B9FF,
            metalness: 0,
            roughness: 0.1,
            transparent: true,
            opacity: 0.7
        });
        this.waterMesh = new THREE.Mesh(waterCylGeom, waterMat);
        this.waterMesh.position.y = -height / 2 + 0.05;
        this.waterMesh.visible = false;
        this.scene.add(this.waterMesh);

        // 초기: 원기둥과 원뿔 함께 표시 (Hook)
        this.hookSetup();
    }

    hookSetup() {
        // Hook: 원기둥 1개와 원뿔 3개 배치
        this.solidMeshes.cylinder.visible = true;
        this.solidMeshes.cylinder.position.set(-2, 0, 0);
        
        // 3개의 작은 원뿔
        this.smallCones = [];
        for (let i = 0; i < 3; i++) {
            const coneGeom = new THREE.ConeGeometry(0.8, 1.6, 32);
            const coneMat = new THREE.MeshPhysicalMaterial({
                color: 0xFDCB6E,
                metalness: 0.1,
                roughness: 0.2,
                transparent: true,
                opacity: 0.6
            });
            const cone = new THREE.Mesh(coneGeom, coneMat);
            cone.position.set(2, (i - 1) * 1.8, 0);
            this.scene.add(cone);
            this.smallCones.push(cone);
        }
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onResize());
        
        document.getElementById('prev-btn').addEventListener('click', () => this.prevScene());
        document.getElementById('next-btn').addEventListener('click', () => this.nextScene());
        
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') this.nextScene();
            if (e.key === 'ArrowLeft') this.prevScene();
        });

        document.querySelectorAll('.solid-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const solid = e.currentTarget.dataset.solid;
                this.switchSolid(solid);
                
                document.querySelectorAll('.solid-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        document.getElementById('fill-btn')?.addEventListener('click', () => this.fillWater());
        document.getElementById('pour-btn')?.addEventListener('click', () => this.pourWater());
        document.getElementById('slice-btn')?.addEventListener('click', () => this.toggleSlice());

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
        // 모든 메쉬 숨기기
        Object.values(this.solidMeshes).forEach(m => {
            m.visible = false;
            m.position.set(0, 0, 0);
        });
        
        this.hookSetup();
        this.controls.autoRotate = true;
    }

    setupAnchorScene() {
        this.clearExtraObjects();
        Object.values(this.solidMeshes).forEach(m => m.visible = false);
        
        // 원 → 원기둥 애니메이션
        const circleGeom = new THREE.CircleGeometry(1.5, 32);
        const circleMat = new THREE.MeshBasicMaterial({
            color: 0x74B9FF,
            side: THREE.DoubleSide
        });
        this.anchorCircle = new THREE.Mesh(circleGeom, circleMat);
        this.anchorCircle.rotation.x = -Math.PI / 2;
        this.scene.add(this.anchorCircle);
    }

    setupStoryScene() {
        this.clearExtraObjects();
        Object.values(this.solidMeshes).forEach(m => m.visible = false);
        this.solidMeshes.cylinder.visible = true;
        this.solidMeshes.cylinder.position.set(-2, 0, 0);
        this.solidMeshes.cone.visible = true;
        this.solidMeshes.cone.position.set(2, 0, 0);
    }

    setupCoreScene() {
        this.clearExtraObjects();
        Object.values(this.solidMeshes).forEach(m => {
            m.visible = false;
            m.position.set(0, 0, 0);
        });
        this.switchSolid('cylinder');
        this.waterMesh.visible = false;
        this.waterLevel = 0;
        
        document.querySelectorAll('.solid-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-solid="cylinder"]')?.classList.add('active');
    }

    setupVisualizeScene() {
        this.clearExtraObjects();
        
        // 3개 입체 나란히 배치
        Object.values(this.solidMeshes).forEach(m => {
            m.visible = true;
            m.scale.set(0.5, 0.5, 0.5);
        });
        
        this.solidMeshes.cylinder.position.set(-3, 0, 0);
        this.solidMeshes.cone.position.set(0, 0, 0);
        this.solidMeshes.sphere.position.set(3, 0, 0);
        
        this.camera.position.set(0, 3, 10);
        this.controls.autoRotate = false;
    }

    setupQuizScene() {
        this.clearExtraObjects();
        Object.values(this.solidMeshes).forEach(m => {
            m.scale.set(1, 1, 1);
            m.position.set(0, 0, 0);
            m.visible = false;
        });
        
        this.loadQuiz(this.currentQuiz);
        this.camera.position.set(0, 3, 8);
        this.controls.autoRotate = true;
    }

    setupWrapScene() {
        this.clearExtraObjects();
        Object.values(this.solidMeshes).forEach(m => {
            m.scale.set(0.6, 0.6, 0.6);
            m.visible = true;
        });
        
        this.solidMeshes.cylinder.position.set(-2.5, 0, 0);
        this.solidMeshes.cone.position.set(0, 0, 0);
        this.solidMeshes.sphere.position.set(2.5, 0, 0);
        
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.5;
    }

    clearExtraObjects() {
        // 임시 오브젝트 정리
        if (this.smallCones) {
            this.smallCones.forEach(c => this.scene.remove(c));
            this.smallCones = [];
        }
        if (this.anchorCircle) {
            this.scene.remove(this.anchorCircle);
            this.anchorCircle = null;
        }
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
        this.waterMesh.visible = false;
        this.waterLevel = 0;
    }

    updateStats(solidName) {
        const data = SOLIDS_DATA[solidName];
        document.getElementById('stat-radius').textContent = 'r';
        document.getElementById('stat-height').textContent = solidName === 'sphere' ? '-' : 'h';
        document.getElementById('stat-volume').textContent = data.formula;
    }

    fillWater() {
        if (this.currentSolid !== 'cylinder') return;
        
        this.waterMesh.visible = true;
        this.waterLevel = 0;
        
        const fillInterval = setInterval(() => {
            this.waterLevel += 0.02;
            if (this.waterLevel >= 1) {
                this.waterLevel = 1;
                clearInterval(fillInterval);
            }
            
            const height = this.waterLevel * 2.9;
            this.waterMesh.scale.y = Math.max(height, 0.1);
            this.waterMesh.position.y = -1.5 + height / 2;
        }, 30);
    }

    pourWater() {
        // 물 붓기 애니메이션 (시각적 효과)
        if (this.waterLevel <= 0) return;
        
        const pourInterval = setInterval(() => {
            this.waterLevel -= 0.03;
            if (this.waterLevel <= 0) {
                this.waterLevel = 0;
                this.waterMesh.visible = false;
                clearInterval(pourInterval);
            }
            
            const height = this.waterLevel * 2.9;
            this.waterMesh.scale.y = Math.max(height, 0.1);
            this.waterMesh.position.y = -1.5 + height / 2;
        }, 30);
    }

    toggleSlice() {
        // 단면 보기 (투명도 조절)
        const mesh = this.solidMeshes[this.currentSolid];
        if (mesh.children) {
            mesh.children.forEach(child => {
                if (child.material) {
                    child.material.opacity = child.material.opacity > 0.3 ? 0.15 : 0.4;
                }
            });
        } else if (mesh.material) {
            mesh.material.opacity = mesh.material.opacity > 0.3 ? 0.15 : 0.4;
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

        // 해당 입체 표시
        if (index === 0) this.switchSolid('cylinder');
        else if (index === 1) this.switchSolid('cone');
        else this.switchSolid('cylinder');
        
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
        
        const selector = document.createElement('div');
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
        
        const exitBtn = document.createElement('button');
        exitBtn.textContent = '나가기';
        exitBtn.className = 'nav-btn';
        exitBtn.style.background = '#D63031';
        exitBtn.onclick = () => location.reload();
        selector.appendChild(exitBtn);
        
        document.body.appendChild(selector);
        
        Object.values(this.solidMeshes).forEach(m => {
            m.scale.set(1, 1, 1);
            m.position.set(0, 0, 0);
            m.visible = false;
        });
        this.solidMeshes.cylinder.visible = true;
        this.controls.autoRotate = true;
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
        
        // 물 흔들림 효과
        if (this.waterMesh && this.waterMesh.visible) {
            this.waterMesh.rotation.y += 0.01;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Start
document.addEventListener('DOMContentLoaded', () => {
    window.app = new VolumeSolidsApp();
});
