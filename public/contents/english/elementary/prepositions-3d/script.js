/* ================================================
   3D Prepositions of Place - Three.js Script
   ================================================ */

const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    threeScenes: {},
    currentPreposition: 'in',
    quizData: [
        { prep: 'in', sentence: 'The ball is ______ the box.', answer: 'in' },
        { prep: 'on', sentence: 'The ball is ______ the table.', answer: 'on' },
        { prep: 'under', sentence: 'The ball is ______ the table.', answer: 'under' },
        { prep: 'nextto', sentence: 'The ball is ______ the box.', answer: 'next to' },
        { prep: 'between', sentence: 'The ball is ______ the boxes.', answer: 'between' }
    ],
    currentQuiz: 0,
    quizScore: 0,

    // Initialize
    init() {
        this.bindEvents();
        this.showScene(0);
        this.initHookScene();
    },

    // Scene Management
    showScene(index) {
        document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
        const sceneId = `${this.scenes[index]}-scene`;
        document.getElementById(sceneId).classList.add('active');
        this.currentScene = index;

        // Update progress bar
        const progress = ((index + 1) / this.scenes.length) * 100;
        document.getElementById('progress-bar').style.width = `${progress}%`;

        // Initialize scene-specific 3D
        const initMethod = `init${this.capitalizeFirst(this.scenes[index])}Scene`;
        if (this[initMethod]) {
            this[initMethod]();
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

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    bindEvents() {
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') this.nextScene();
            if (e.key === 'ArrowLeft') this.prevScene();
        });
    },

    // ================================================
    // Three.js Utilities
    // ================================================
    createBasicScene(container, bgColor = 0x87CEEB) {
        const width = container.clientWidth;
        const height = container.clientHeight;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(bgColor);

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(3, 3, 5);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;
        container.appendChild(renderer.domElement);

        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = false;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        // Floor
        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFCCBC,
            roughness: 0.8
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);

        return { scene, camera, renderer, controls };
    },

    createBox(color = 0x8D6E63, size = { w: 1.2, h: 0.8, d: 1.2 }) {
        const group = new THREE.Group();

        // Box body (hollow)
        const boxGeometry = new THREE.BoxGeometry(size.w, size.h, size.d);
        const boxMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.7
        });
        const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
        boxMesh.position.y = size.h / 2;
        boxMesh.castShadow = true;
        group.add(boxMesh);

        // Inner cutout visualization (top open)
        const innerGeometry = new THREE.BoxGeometry(size.w - 0.1, size.h - 0.05, size.d - 0.1);
        const innerMaterial = new THREE.MeshStandardMaterial({
            color: 0xD7CCC8,
            roughness: 0.9
        });
        const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
        innerMesh.position.y = size.h / 2 + 0.03;
        group.add(innerMesh);

        return group;
    },

    createBall(color = 0xFF6B6B, radius = 0.3) {
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3,
            metalness: 0.1
        });
        const ball = new THREE.Mesh(geometry, material);
        ball.castShadow = true;
        return ball;
    },

    createTable(color = 0x8D6E63) {
        const group = new THREE.Group();

        // Table top
        const topGeometry = new THREE.BoxGeometry(2, 0.1, 1.2);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.6
        });
        const top = new THREE.Mesh(topGeometry, material);
        top.position.y = 1;
        top.castShadow = true;
        group.add(top);

        // Legs
        const legGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
        const positions = [
            [-0.85, 0.5, -0.45],
            [0.85, 0.5, -0.45],
            [-0.85, 0.5, 0.45],
            [0.85, 0.5, 0.45]
        ];
        positions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, material);
            leg.position.set(...pos);
            leg.castShadow = true;
            group.add(leg);
        });

        return group;
    },

    createChair(color = 0x5D4037) {
        const group = new THREE.Group();
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.7
        });

        // Seat
        const seatGeometry = new THREE.BoxGeometry(0.6, 0.08, 0.6);
        const seat = new THREE.Mesh(seatGeometry, material);
        seat.position.y = 0.5;
        seat.castShadow = true;
        group.add(seat);

        // Back
        const backGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.08);
        const back = new THREE.Mesh(backGeometry, material);
        back.position.set(0, 0.85, -0.26);
        back.castShadow = true;
        group.add(back);

        // Legs
        const legGeometry = new THREE.BoxGeometry(0.06, 0.5, 0.06);
        const legPositions = [
            [-0.22, 0.25, -0.22],
            [0.22, 0.25, -0.22],
            [-0.22, 0.25, 0.22],
            [0.22, 0.25, 0.22]
        ];
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, material);
            leg.position.set(...pos);
            leg.castShadow = true;
            group.add(leg);
        });

        return group;
    },

    createRobot() {
        const group = new THREE.Group();

        // Body
        const bodyGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.4);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x4ECDC4,
            roughness: 0.3,
            metalness: 0.5
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.4;
        group.add(body);

        // Head
        const headGeometry = new THREE.BoxGeometry(0.5, 0.4, 0.35);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.y = 1.05;
        group.add(head);

        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.08, 16, 16);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            emissive: 0xFFFF00,
            emissiveIntensity: 0.5
        });
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.12, 1.1, 0.15);
        group.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.12, 1.1, 0.15);
        group.add(rightEye);

        // Antenna
        const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.2);
        const antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.y = 1.35;
        group.add(antenna);

        const tipGeometry = new THREE.SphereGeometry(0.05, 16, 16);
        const tipMaterial = new THREE.MeshStandardMaterial({
            color: 0xFF6B6B,
            emissive: 0xFF6B6B,
            emissiveIntensity: 0.5
        });
        const tip = new THREE.Mesh(tipGeometry, tipMaterial);
        tip.position.y = 1.5;
        group.add(tip);

        return group;
    },

    createTrophy() {
        const group = new THREE.Group();

        // Cup
        const cupGeometry = new THREE.CylinderGeometry(0.3, 0.2, 0.6, 32);
        const cupMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            roughness: 0.2,
            metalness: 0.8
        });
        const cup = new THREE.Mesh(cupGeometry, cupMaterial);
        cup.position.y = 0.5;
        group.add(cup);

        // Base
        const baseGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.15, 32);
        const base = new THREE.Mesh(baseGeometry, cupMaterial);
        base.position.y = 0.075;
        group.add(base);

        // Handles
        const handleGeometry = new THREE.TorusGeometry(0.15, 0.03, 16, 32, Math.PI);
        const leftHandle = new THREE.Mesh(handleGeometry, cupMaterial);
        leftHandle.rotation.y = Math.PI / 2;
        leftHandle.rotation.x = Math.PI / 2;
        leftHandle.position.set(-0.35, 0.5, 0);
        group.add(leftHandle);

        const rightHandle = new THREE.Mesh(handleGeometry, cupMaterial);
        rightHandle.rotation.y = -Math.PI / 2;
        rightHandle.rotation.x = Math.PI / 2;
        rightHandle.position.set(0.35, 0.5, 0);
        group.add(rightHandle);

        // Star
        const starShape = new THREE.Shape();
        const outerRadius = 0.15;
        const innerRadius = 0.06;
        for (let i = 0; i < 10; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
            if (i === 0) {
                starShape.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            } else {
                starShape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            }
        }
        starShape.closePath();

        const starGeometry = new THREE.ExtrudeGeometry(starShape, {
            depth: 0.05,
            bevelEnabled: false
        });
        const starMaterial = new THREE.MeshStandardMaterial({
            color: 0xFF6B6B,
            roughness: 0.3
        });
        const star = new THREE.Mesh(starGeometry, starMaterial);
        star.rotation.x = Math.PI / 2;
        star.position.set(0, 0.85, 0.15);
        group.add(star);

        return group;
    },

    animateScene(sceneData, animate) {
        const { scene, camera, renderer, controls } = sceneData;

        function loop() {
            requestAnimationFrame(loop);
            if (animate) animate();
            controls.update();
            renderer.render(scene, camera);
        }
        loop();
    },

    // ================================================
    // Scene Initializers
    // ================================================
    initHookScene() {
        const container = document.getElementById('hook-3d');
        if (!container || container.children.length > 0) return;

        const sceneData = this.createBasicScene(container);
        const { scene } = sceneData;

        // Create room elements
        const box = this.createBox();
        box.position.set(0, 0, 0);
        scene.add(box);

        const ball = this.createBall();
        ball.position.set(0, 0.7, 0); // In the box
        scene.add(ball);

        const table = this.createTable();
        table.position.set(-2, 0, 0);
        scene.add(table);

        const chair = this.createChair();
        chair.position.set(2, 0, 0);
        scene.add(chair);

        sceneData.camera.position.set(4, 4, 6);

        let time = 0;
        this.animateScene(sceneData, () => {
            time += 0.02;
            ball.position.y = 0.7 + Math.sin(time) * 0.1;
        });

        this.threeScenes['hook'] = sceneData;
    },

    initAnchorScene() {
        // Mini 3D previews for vocabulary
        const containers = [
            { id: 'anchor-box-3d', create: () => this.createBox(0x8D6E63, { w: 0.8, h: 0.6, d: 0.8 }) },
            { id: 'anchor-table-3d', create: () => this.createTable() },
            { id: 'anchor-chair-3d', create: () => this.createChair() },
            { id: 'anchor-ball-3d', create: () => this.createBall() }
        ];

        containers.forEach(({ id, create }) => {
            const container = document.getElementById(id);
            if (!container || container.children.length > 0) return;

            const sceneData = this.createBasicScene(container, 0xF5F5F5);
            const { scene } = sceneData;

            const object = create();
            scene.add(object);

            sceneData.camera.position.set(2, 2, 3);
            sceneData.controls.autoRotate = true;
            sceneData.controls.autoRotateSpeed = 2;

            this.animateScene(sceneData);
        });
    },

    initStoryScene() {
        const container = document.getElementById('story-character-3d');
        if (!container || container.children.length > 0) return;

        const sceneData = this.createBasicScene(container, 0xE8F4FC);
        const { scene } = sceneData;

        const robot = this.createRobot();
        scene.add(robot);

        sceneData.camera.position.set(0, 1, 3);
        sceneData.controls.autoRotate = true;
        sceneData.controls.autoRotateSpeed = 1;

        let time = 0;
        this.animateScene(sceneData, () => {
            time += 0.03;
            robot.position.y = Math.sin(time) * 0.05;
        });
    },

    initCoreScene() {
        const container = document.getElementById('core-3d');
        if (!container || container.children.length > 0) return;

        const sceneData = this.createBasicScene(container, 0xFFF9E6);
        const { scene } = sceneData;

        // Box
        const box = this.createBox();
        box.position.set(0, 0, 0);
        box.name = 'box';
        scene.add(box);

        // Ball
        const ball = this.createBall();
        ball.name = 'ball';
        scene.add(ball);

        sceneData.camera.position.set(3, 3, 4);

        this.threeScenes['core'] = sceneData;
        this.threeScenes['core'].ball = ball;
        this.threeScenes['core'].box = box;

        // Set initial position
        this.updateBallPosition('in');

        this.animateScene(sceneData);
    },

    updateBallPosition(preposition) {
        const sceneData = this.threeScenes['core'];
        if (!sceneData || !sceneData.ball) return;

        const ball = sceneData.ball;
        const scene = sceneData.scene;

        // Remove extra objects
        const toRemove = scene.children.filter(c => c.name === 'extraBox' || c.name === 'extraChair');
        toRemove.forEach(obj => scene.remove(obj));

        // Update ball position based on preposition
        const positions = {
            'in': { x: 0, y: 0.7, z: 0 },
            'on': { x: 0, y: 1.15, z: 0 },
            'under': { x: 0, y: 0.3, z: 0 },
            'nextto': { x: 1.2, y: 0.3, z: 0 },
            'between': { x: 0, y: 0.3, z: 0 }
        };

        // Animate ball movement
        const targetPos = positions[preposition] || positions['in'];
        const startPos = { ...ball.position };

        let progress = 0;
        const animateBall = () => {
            progress += 0.05;
            if (progress <= 1) {
                ball.position.x = startPos.x + (targetPos.x - startPos.x) * progress;
                ball.position.y = startPos.y + (targetPos.y - startPos.y) * progress;
                ball.position.z = startPos.z + (targetPos.z - startPos.z) * progress;
                requestAnimationFrame(animateBall);
            }
        };
        animateBall();

        // Add extra boxes for 'between'
        if (preposition === 'between') {
            const box1 = this.createBox(0x74B9FF, { w: 0.8, h: 0.6, d: 0.8 });
            box1.position.set(-1, 0, 0);
            box1.name = 'extraBox';
            scene.add(box1);

            const box2 = this.createBox(0x74B9FF, { w: 0.8, h: 0.6, d: 0.8 });
            box2.position.set(1, 0, 0);
            box2.name = 'extraBox';
            scene.add(box2);

            // Hide main box
            const mainBox = scene.children.find(c => c.name === 'box');
            if (mainBox) mainBox.visible = false;
        } else {
            // Show main box
            const mainBox = scene.children.find(c => c.name === 'box');
            if (mainBox) mainBox.visible = true;
        }

        // Add table for 'on'
        if (preposition === 'on') {
            const mainBox = scene.children.find(c => c.name === 'box');
            if (mainBox) mainBox.visible = false;

            const table = this.createTable();
            table.name = 'extraChair';
            scene.add(table);
        }

        // Update example sentence
        const examples = {
            'in': { en: 'The ball is <span class="highlight" style="color:#FF6B6B;">in</span> the box.', ko: '공이 박스 <span style="color:#FF6B6B;">안에</span> 있어요.' },
            'on': { en: 'The ball is <span class="highlight" style="color:#4ECDC4;">on</span> the table.', ko: '공이 테이블 <span style="color:#4ECDC4;">위에</span> 있어요.' },
            'under': { en: 'The ball is <span class="highlight" style="color:#A29BFE;">under</span> the box.', ko: '공이 박스 <span style="color:#A29BFE;">아래에</span> 있어요.' },
            'nextto': { en: 'The ball is <span class="highlight" style="color:#FD79A8;">next to</span> the box.', ko: '공이 박스 <span style="color:#FD79A8;">옆에</span> 있어요.' },
            'between': { en: 'The ball is <span class="highlight" style="color:#74B9FF;">between</span> the boxes.', ko: '공이 박스들 <span style="color:#74B9FF;">사이에</span> 있어요.' }
        };

        const exampleDiv = document.getElementById('core-example');
        if (exampleDiv && examples[preposition]) {
            exampleDiv.innerHTML = `
                <p class="english-text">${examples[preposition].en}</p>
                <p class="korean-text">${examples[preposition].ko}</p>
            `;
        }
    },

    selectPreposition(prep) {
        // Update button states
        document.querySelectorAll('.prep-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.prep === prep) {
                btn.classList.add('active');
            }
        });

        this.currentPreposition = prep;
        this.updateBallPosition(prep);

        // Play pronunciation
        const pronunciations = {
            'in': 'in',
            'on': 'on',
            'under': 'under',
            'nextto': 'next to',
            'between': 'between'
        };
        this.playAudio(pronunciations[prep] || prep);
    },

    initVisualizeScene() {
        const container = document.getElementById('visualize-3d');
        if (!container || container.children.length > 0) return;

        const sceneData = this.createBasicScene(container, 0xE3F2FD);
        const { scene } = sceneData;

        // Create all preposition demonstrations
        const spacing = 2.5;

        // In
        const box1 = this.createBox(0xFF6B6B, { w: 0.8, h: 0.6, d: 0.8 });
        box1.position.set(-spacing * 2, 0, 0);
        scene.add(box1);
        const ball1 = this.createBall(0xFFFFFF, 0.2);
        ball1.position.set(-spacing * 2, 0.5, 0);
        scene.add(ball1);

        // On
        const table = this.createTable(0x4ECDC4);
        table.position.set(-spacing, 0, 0);
        table.scale.set(0.5, 0.5, 0.5);
        scene.add(table);
        const ball2 = this.createBall(0xFFFFFF, 0.2);
        ball2.position.set(-spacing, 0.75, 0);
        scene.add(ball2);

        // Under
        const box2 = this.createBox(0xA29BFE, { w: 0.8, h: 0.6, d: 0.8 });
        box2.position.set(0, 0.5, 0);
        scene.add(box2);
        const ball3 = this.createBall(0xFFFFFF, 0.2);
        ball3.position.set(0, 0.2, 0.6);
        scene.add(ball3);

        // Next to
        const chair = this.createChair(0xFD79A8);
        chair.position.set(spacing, 0, 0);
        chair.scale.set(0.8, 0.8, 0.8);
        scene.add(chair);
        const ball4 = this.createBall(0xFFFFFF, 0.2);
        ball4.position.set(spacing + 0.6, 0.2, 0);
        scene.add(ball4);

        // Between
        const box3 = this.createBox(0x74B9FF, { w: 0.5, h: 0.5, d: 0.5 });
        box3.position.set(spacing * 2 - 0.5, 0, 0);
        scene.add(box3);
        const box4 = this.createBox(0x74B9FF, { w: 0.5, h: 0.5, d: 0.5 });
        box4.position.set(spacing * 2 + 0.5, 0, 0);
        scene.add(box4);
        const ball5 = this.createBall(0xFFFFFF, 0.15);
        ball5.position.set(spacing * 2, 0.25, 0);
        scene.add(ball5);

        sceneData.camera.position.set(0, 5, 10);
        sceneData.controls.autoRotate = true;
        sceneData.controls.autoRotateSpeed = 0.5;

        this.animateScene(sceneData);
    },

    initQuizScene() {
        this.currentQuiz = 0;
        this.quizScore = 0;
        this.showQuiz(0);
    },

    showQuiz(index) {
        const container = document.getElementById('quiz-3d');
        if (!container) return;

        // Clear previous
        container.innerHTML = '';
        document.querySelectorAll('.quiz-option').forEach(btn => {
            btn.classList.remove('correct', 'incorrect');
            btn.disabled = false;
        });
        document.getElementById('quiz-feedback').classList.remove('show', 'correct', 'incorrect');

        const quiz = this.quizData[index];
        if (!quiz) {
            this.showQuizComplete();
            return;
        }

        // Update UI
        document.getElementById('quiz-current').textContent = index + 1;
        document.getElementById('quiz-total').textContent = this.quizData.length;
        document.getElementById('quiz-question').innerHTML = `<p class="english-text">${quiz.sentence}</p>`;

        // Create 3D scene for quiz
        const sceneData = this.createBasicScene(container, 0xFFFDE7);
        const { scene } = sceneData;

        // Add objects based on quiz
        const box = this.createBox();
        scene.add(box);

        const ball = this.createBall();

        // Position based on answer
        const positions = {
            'in': { x: 0, y: 0.7, z: 0 },
            'on': { x: 0, y: 1.15, z: 0 },
            'under': { x: 0, y: 0.3, z: 0 },
            'next to': { x: 1.2, y: 0.3, z: 0 },
            'between': { x: 0, y: 0.3, z: 0 }
        };

        const pos = positions[quiz.answer] || positions['in'];
        ball.position.set(pos.x, pos.y, pos.z);
        scene.add(ball);

        // Special cases
        if (quiz.answer === 'on' || quiz.answer === 'under') {
            box.visible = false;
            const table = this.createTable();
            scene.add(table);
        }

        if (quiz.answer === 'between') {
            box.visible = false;
            const box1 = this.createBox(0x74B9FF, { w: 0.6, h: 0.5, d: 0.6 });
            box1.position.set(-0.8, 0, 0);
            scene.add(box1);
            const box2 = this.createBox(0x74B9FF, { w: 0.6, h: 0.5, d: 0.6 });
            box2.position.set(0.8, 0, 0);
            scene.add(box2);
        }

        sceneData.camera.position.set(3, 3, 4);
        this.animateScene(sceneData);
    },

    checkAnswer(answer) {
        const quiz = this.quizData[this.currentQuiz];
        const feedback = document.getElementById('quiz-feedback');
        const options = document.querySelectorAll('.quiz-option');

        options.forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === quiz.answer) {
                btn.classList.add('correct');
            } else if (btn.textContent === answer && answer !== quiz.answer) {
                btn.classList.add('incorrect');
            }
        });

        if (answer === quiz.answer) {
            this.quizScore++;
            feedback.textContent = `Correct! ${quiz.sentence.replace('______', quiz.answer)} ${quiz.answer === 'on' ? '표면에 닿아 있어요.' : quiz.answer === 'under' ? '테이블 면 아래에 있어요.' : quiz.answer === 'between' ? '두 상자의 사이에 있어요.' : quiz.answer === 'in' ? '상자 안쪽이에요.' : '상자 옆이에요.'}`;
            feedback.classList.add('show', 'correct');
            this.playAudio('Correct');
        } else {
            feedback.textContent = `정답: ${quiz.sentence.replace('______', quiz.answer)} 그림의 물체와 기준 물체의 위치를 비교해 보세요.`;
            feedback.classList.add('show', 'incorrect');
        }

        // Next quiz after delay
        setTimeout(() => {
            this.currentQuiz++;
            if (this.currentQuiz < this.quizData.length) {
                this.showQuiz(this.currentQuiz);
            } else {
                this.nextScene();
            }
        }, 2000);
    },

    showQuizComplete() {
        // Quiz complete - move to wrap scene
        this.nextScene();
    },

    initWrapScene() {
        const container = document.getElementById('wrap-3d');
        if (!container || container.children.length > 0) return;

        const sceneData = this.createBasicScene(container, 0xFFE66D);
        const { scene } = sceneData;

        const trophy = this.createTrophy();
        scene.add(trophy);

        sceneData.camera.position.set(0, 1.5, 3);
        sceneData.controls.autoRotate = true;
        sceneData.controls.autoRotateSpeed = 2;

        let time = 0;
        this.animateScene(sceneData, () => {
            time += 0.02;
            trophy.position.y = Math.sin(time) * 0.05;
            trophy.rotation.y = time * 0.5;
        });
    },

    // Audio
    playAudio(text, lang = 'en-US') {
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            utterance.rate = 0.9;
            speechSynthesis.speak(utterance);
        }
    }
};

// Start app
document.addEventListener('DOMContentLoaded', () => ContentApp.init());
