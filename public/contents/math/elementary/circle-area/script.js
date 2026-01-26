/**
 * 원의 넓이 인터랙티브 콘텐츠
 * 부채꼴 분할 및 직사각형 변환 애니메이션
 */
const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    sliceCount: 8,
    isUnfolded: false,

    init() {
        this.updateProgress();
        this.bindEvents();
        this.initHookScene();
    },

    nextScene() {
        if (this.currentScene < this.scenes.length - 1) {
            this.changeScene(this.currentScene + 1);
        }
    },

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

            // 씬별 초기화
            const initFn = this[`init${this.capitalize(sceneName)}Scene`];
            if (initFn) initFn.call(this);

            // MathJax 재렌더링
            if (window.MathJax && window.MathJax.typesetPromise) {
                window.MathJax.typesetPromise([sceneEl]);
            }
        }
    },

    updateProgress() {
        const pct = ((this.currentScene + 1) / this.scenes.length) * 100;
        document.getElementById('progress-bar').style.width = `${pct}%`;
    },

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // --- Scene Logic ---

    initHookScene() {
        // 피자 애니메이션 (펄스 효과)
        const pizzas = document.querySelectorAll('.pizza-visual');
        pizzas.forEach((pizza, i) => {
            setTimeout(() => {
                pizza.style.animation = 'pulse 1s ease infinite';
            }, i * 300);
        });
    },

    initAnchorScene() {
        // 다이어그램 페이드인
        const diagram = document.querySelector('.diagram-img');
        if (diagram) {
            diagram.style.opacity = '0';
            diagram.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                diagram.style.opacity = '1';
            }, 200);
        }
    },

    initStoryScene() {
        const text = "30cm 피자와 20cm 피자의 가격을 어떻게 정해야 할까? 크기가 1.5배 차이면 가격도 1.5배면 될까? 아니면 원의 넓이를 계산해서 정해야 할까?";
        const el = document.getElementById('typewriter-text');
        el.textContent = '';
        let i = 0;

        // 타이핑 효과
        const type = () => {
            if (i < text.length) {
                el.textContent += text.charAt(i);
                i++;
                setTimeout(type, 40);
            }
        };
        type();
    },

    initCoreScene() {
        this.isUnfolded = false;
        this.sliceCount = 8;

        // 슬라이더 이벤트
        const slider = document.getElementById('slice-slider');
        const countLabel = document.getElementById('slice-count');
        const unfoldBtn = document.getElementById('unfold-btn');

        slider.value = this.sliceCount;
        countLabel.textContent = this.sliceCount;

        slider.oninput = () => {
            this.sliceCount = parseInt(slider.value);
            countLabel.textContent = this.sliceCount;
            this.isUnfolded = false;
            unfoldBtn.textContent = '펼치기';
            this.renderCircleSlices();
            this.clearRectangle();
        };

        unfoldBtn.onclick = () => {
            if (!this.isUnfolded) {
                this.unfoldToRectangle();
                unfoldBtn.textContent = '다시 접기';
                this.isUnfolded = true;

                // 16조각 이상이면 다음 버튼 표시
                if (this.sliceCount >= 16) {
                    setTimeout(() => {
                        document.getElementById('core-next-btn').classList.remove('hidden');
                    }, 1500);
                }
            } else {
                this.renderCircleSlices();
                this.clearRectangle();
                unfoldBtn.textContent = '펼치기';
                this.isUnfolded = false;
            }
        };

        // 초기 렌더링
        this.renderCircleSlices();
        this.clearRectangle();
        document.getElementById('core-next-btn').classList.add('hidden');
    },

    renderCircleSlices() {
        const container = document.getElementById('circle-container');
        const radius = 80;
        const cx = 100;
        const cy = 100;
        const slices = this.sliceCount;
        const anglePerSlice = (2 * Math.PI) / slices;

        // SVG 생성
        let svg = `<svg viewBox="0 0 200 200">`;

        // 색상 배열 (번갈아가며)
        const colors = ['#FF7043', '#FFCA28'];

        for (let i = 0; i < slices; i++) {
            const startAngle = i * anglePerSlice - Math.PI / 2;
            const endAngle = (i + 1) * anglePerSlice - Math.PI / 2;

            const x1 = cx + radius * Math.cos(startAngle);
            const y1 = cy + radius * Math.sin(startAngle);
            const x2 = cx + radius * Math.cos(endAngle);
            const y2 = cy + radius * Math.sin(endAngle);

            const largeArc = anglePerSlice > Math.PI ? 1 : 0;

            const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

            svg += `<path d="${pathData}" fill="${colors[i % 2]}" stroke="#fff" stroke-width="1" class="slice slice-${i}"/>`;
        }

        // 중심점
        svg += `<circle cx="${cx}" cy="${cy}" r="3" fill="#333"/>`;

        // 반지름 표시
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx + radius}" y2="${cy}" stroke="#EF4444" stroke-width="2"/>`;
        svg += `<text x="${cx + radius/2}" y="${cy - 8}" text-anchor="middle" fill="#EF4444" font-size="12" font-weight="bold">r</text>`;

        svg += `</svg>`;
        container.innerHTML = svg;
    },

    clearRectangle() {
        const container = document.getElementById('rectangle-container');
        container.innerHTML = '';
    },

    unfoldToRectangle() {
        const container = document.getElementById('rectangle-container');
        const slices = this.sliceCount;
        const radius = 80;
        const circumference = 2 * Math.PI * radius;
        const halfCircum = circumference / 2;

        // 직사각형 크기 계산
        const rectWidth = Math.min(400, halfCircum * 1.2);
        const rectHeight = radius * 0.8;
        const sliceWidth = rectWidth / (slices / 2);

        // 색상
        const colors = ['#FF7043', '#FFCA28'];

        let svg = `<svg viewBox="0 0 ${rectWidth + 40} ${rectHeight + 60}" style="overflow: visible;">`;

        // 가로 레이블 (피r)
        svg += `<line x1="20" y1="${rectHeight + 35}" x2="${rectWidth + 20}" y2="${rectHeight + 35}" stroke="#2196F3" stroke-width="2"/>`;
        svg += `<text x="${(rectWidth + 40) / 2}" y="${rectHeight + 55}" text-anchor="middle" fill="#2196F3" font-size="12" font-weight="bold">pi r (원주의 절반)</text>`;

        // 세로 레이블 (r)
        svg += `<line x1="${rectWidth + 30}" y1="10" x2="${rectWidth + 30}" y2="${rectHeight + 10}" stroke="#EF4444" stroke-width="2"/>`;
        svg += `<text x="${rectWidth + 38}" y="${rectHeight / 2 + 10}" fill="#EF4444" font-size="12" font-weight="bold">r</text>`;

        // 부채꼴 조각들 (지그재그로 배치)
        for (let i = 0; i < slices; i++) {
            const isTop = i % 2 === 0;
            const pairIndex = Math.floor(i / 2);
            const x = 20 + pairIndex * sliceWidth;

            // 삼각형 모양으로 표현
            let pathData;
            if (isTop) {
                // 위쪽 (뾰족한 부분이 위)
                pathData = `M ${x} ${rectHeight + 10} L ${x + sliceWidth / 2} 10 L ${x + sliceWidth} ${rectHeight + 10} Z`;
            } else {
                // 아래쪽 (뾰족한 부분이 아래)
                pathData = `M ${x} 10 L ${x + sliceWidth / 2} ${rectHeight + 10} L ${x + sliceWidth} 10 Z`;
            }

            // 애니메이션 딜레이
            const delay = i * 0.05;

            svg += `<path d="${pathData}" fill="${colors[i % 2]}" stroke="#fff" stroke-width="1"
                    style="opacity: 0; animation: fadeSlice 0.3s ease ${delay}s forwards;"/>`;
        }

        svg += `</svg>`;

        // CSS 애니메이션 추가
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeSlice {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);

        container.innerHTML = svg;
    },

    initVisualizeScene() {
        // 단계별 애니메이션
        const steps = document.querySelectorAll('.derivation-step');
        steps.forEach((step, i) => {
            step.style.opacity = '0';
            step.style.transform = 'translateY(20px)';
            setTimeout(() => {
                step.style.transition = 'all 0.5s ease';
                step.style.opacity = '1';
                step.style.transform = 'translateY(0)';
            }, i * 500);
        });

        // 최종 공식 박스 애니메이션
        const formulaBox = document.querySelector('.final-formula-box');
        if (formulaBox) {
            formulaBox.style.opacity = '0';
            formulaBox.style.transform = 'scale(0.9)';
            setTimeout(() => {
                formulaBox.style.transition = 'all 0.5s ease';
                formulaBox.style.opacity = '1';
                formulaBox.style.transform = 'scale(1)';
            }, 1200);
        }
    },

    checkAnswer(val) {
        const buttons = document.querySelectorAll('.opt-btn');
        const feedback = document.getElementById('quiz-feedback');

        // 모든 버튼 비활성화
        buttons.forEach(btn => btn.disabled = true);

        if (val === 314) {
            // 정답
            buttons.forEach(btn => {
                if (btn.textContent.includes('314')) {
                    btn.classList.add('correct');
                }
            });

            feedback.textContent = '정답! pi x 10^2 = 3.14 x 100 = 314 cm^2';
            feedback.className = 'quiz-feedback success';
            feedback.classList.remove('hidden');

            setTimeout(() => {
                this.nextScene();
            }, 2000);
        } else {
            // 오답
            buttons.forEach(btn => {
                const btnVal = parseFloat(btn.textContent);
                if (btnVal === val) {
                    btn.classList.add('wrong');
                }
            });

            feedback.textContent = '다시 생각해보세요. pi x r^2 = 3.14 x 10 x 10 = ?';
            feedback.className = 'quiz-feedback error';
            feedback.classList.remove('hidden');

            // 재시도 허용
            setTimeout(() => {
                buttons.forEach(btn => {
                    btn.disabled = false;
                    btn.classList.remove('wrong');
                });
            }, 1500);
        }
    },

    initWrapScene() {
        // 3D 구 로딩 (Three.js)
        this.init3DSphere();
    },

    init3DSphere() {
        const canvas = document.getElementById('sphere-canvas');
        if (!canvas || !window.THREE) return;

        try {
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                alpha: true,
                antialias: true
            });

            renderer.setSize(100, 100);
            renderer.setClearColor(0x000000, 0);

            // GLB 로더
            const loader = new THREE.GLTFLoader();
            loader.load(
                '../../3d/3d-elementary-sphere-red-20260125.glb',
                (gltf) => {
                    const model = gltf.scene;
                    model.scale.set(1.5, 1.5, 1.5);
                    scene.add(model);

                    // 조명
                    const light = new THREE.DirectionalLight(0xffffff, 1);
                    light.position.set(5, 5, 5);
                    scene.add(light);

                    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
                    scene.add(ambient);

                    camera.position.z = 3;

                    // 애니메이션
                    const animate = () => {
                        requestAnimationFrame(animate);
                        model.rotation.y += 0.01;
                        model.rotation.x += 0.005;
                        renderer.render(scene, camera);
                    };
                    animate();
                },
                undefined,
                (error) => {
                    // GLB 로드 실패 시 기본 구 생성
                    console.log('GLB 로드 실패, 기본 구 사용');
                    const geometry = new THREE.SphereGeometry(1, 32, 32);
                    const material = new THREE.MeshPhongMaterial({
                        color: 0xff7043,
                        shininess: 100
                    });
                    const sphere = new THREE.Mesh(geometry, material);
                    scene.add(sphere);

                    const light = new THREE.DirectionalLight(0xffffff, 1);
                    light.position.set(5, 5, 5);
                    scene.add(light);

                    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
                    scene.add(ambient);

                    camera.position.z = 3;

                    const animate = () => {
                        requestAnimationFrame(animate);
                        sphere.rotation.y += 0.01;
                        sphere.rotation.x += 0.005;
                        renderer.render(scene, camera);
                    };
                    animate();
                }
            );
        } catch (e) {
            console.log('Three.js 초기화 실패:', e);
        }
    },

    bindEvents() {
        // 키보드 네비게이션
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                this.nextScene();
            }
        });

        // 터치 스와이프 (모바일)
        let touchStartX = 0;
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;

            // 오른쪽에서 왼쪽으로 스와이프 (다음)
            if (diff > 50) {
                this.nextScene();
            }
        }, { passive: true });
    }
};

// 시작
document.addEventListener('DOMContentLoaded', () => {
    ContentApp.init();
});
