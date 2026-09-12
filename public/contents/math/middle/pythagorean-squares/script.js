// 피타고라스 정리: 제곱의 비밀 - 인터랙티브 콘텐츠
const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    coreRevealed: false,
    
    init() {
        this.updateProgress();
        this.initHookScene();
        this.bindEvents();
    },

    nextScene() {
        if (this.currentScene < this.scenes.length - 1) {
            this.changeScene(this.currentScene + 1);
        }
    },

    changeScene(index) {
        document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
        this.currentScene = index;
        this.updateProgress();
        const sceneName = this.scenes[index];
        const sceneEl = document.getElementById(`${sceneName}-scene`);
        if (sceneEl) {
            sceneEl.classList.add('active');
            const initFn = this[`init${this.capitalize(sceneName)}Scene`];
            if (initFn) initFn.call(this);
        }
    },

    updateProgress() {
        const pct = ((this.currentScene + 1) / this.scenes.length) * 100;
        document.getElementById('progress-bar').style.width = `${pct}%`;
    },

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // === 1. Hook Scene ===
    initHookScene() {
        const char = document.getElementById('character');
        const emoji = document.getElementById('char-emoji');
        char.setAttribute('cx', 20);
        char.setAttribute('cy', 280);
        emoji.setAttribute('x', 20);
        emoji.setAttribute('y', 285);
        
        setTimeout(() => {
            // 대각선으로 이동 애니메이션
            const duration = 2000;
            const startTime = performance.now();
            const animate = (now) => {
                const elapsed = now - startTime;
                const t = Math.min(elapsed / duration, 1);
                // easeOutCubic
                const ease = 1 - Math.pow(1 - t, 3);
                const cx = 20 + 260 * ease;
                const cy = 280 - 260 * ease;
                char.setAttribute('cx', cx);
                char.setAttribute('cy', cy);
                emoji.setAttribute('x', cx);
                emoji.setAttribute('y', cy + 5);
                if (t < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
        }, 800);
    },

    // === 2. Anchor Scene: 인터랙티브 정사각형 ===
    initAnchorScene() {
        const slider = document.getElementById('side-slider');
        this.updateSquareGrid(parseInt(slider.value));
        
        slider.addEventListener('input', (e) => {
            this.updateSquareGrid(parseInt(e.target.value));
        });
    },

    updateSquareGrid(n) {
        const container = document.getElementById('grid-cells');
        const visual = document.getElementById('square-visual');
        const sideValue = document.getElementById('side-value');
        const labelLeft = document.getElementById('label-left');
        const labelBottom = document.getElementById('label-bottom');
        const areaText = document.getElementById('area-text');
        const areaFormula = document.getElementById('area-formula');
        
        sideValue.textContent = n;
        labelLeft.textContent = n;
        labelBottom.textContent = n;
        
        // 정사각형 크기 조절
        const maxSize = 180;
        const cellSize = Math.min(maxSize / n, 40);
        const totalSize = cellSize * n;
        visual.style.width = totalSize + 'px';
        visual.style.height = totalSize + 'px';
        
        // 그리드 셀 생성
        container.innerHTML = '';
        container.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
        container.style.display = 'grid';
        container.style.width = '100%';
        container.style.height = '100%';
        
        for (let i = 0; i < n * n; i++) {
            const div = document.createElement('div');
            div.style.border = '1px solid rgba(74, 144, 217, 0.3)';
            div.style.background = 'rgba(227, 242, 253, 0)';
            div.style.borderRadius = '2px';
            container.appendChild(div);
            // 순차 애니메이션
            setTimeout(() => {
                div.style.transition = 'background 0.15s ease';
                div.style.background = 'rgba(227, 242, 253, 0.8)';
            }, i * 30);
        }
        
        areaText.innerHTML = `${n} &times; ${n} = <strong>${n * n}</strong>`;
        areaFormula.innerHTML = `= ${n}<sup>2</sup>`;
    },

    // === 3. Story Scene: 타이핑 효과 ===
    initStoryScene() {
        const text = "경사로를 만들어야 하는데... 벽 높이가 3m이고, 바닥 공간이 4m야. 경사로 길이는 얼마만큼 준비해야 할까?";
        const el = document.getElementById('typewriter-text');
        el.textContent = '';
        let i = 0;
        const type = () => {
            if (i < text.length) {
                el.textContent += text.charAt(i);
                i++;
                setTimeout(type, 25);
            }
        };
        type();
    },

    // === 4. Core Scene: 인터랙티브 피타고라스 탐구 ===
    initCoreScene() {
        const canvas = document.getElementById('squares-canvas');
        const ctx = canvas.getContext('2d');
        const sliderA = document.getElementById('slider-a');
        const sliderB = document.getElementById('slider-b');
        
        const draw = () => {
            const a = parseInt(sliderA.value);
            const b = parseInt(sliderB.value);
            const c2 = a * a + b * b;
            const c = Math.sqrt(c2);
            
            // 값 업데이트
            document.getElementById('val-a').textContent = a;
            document.getElementById('val-b').textContent = b;
            
            // 수식 업데이트
            const eqDisplay = document.getElementById('equation-display');
            eqDisplay.querySelector('.eq-a').innerHTML = `${a}<sup>2</sup> = ${a*a}`;
            eqDisplay.querySelector('.eq-b').innerHTML = `${b}<sup>2</sup> = ${b*b}`;
            eqDisplay.querySelector('.eq-sum').innerHTML = `${a*a} + ${b*b} = ${c2}`;
            document.getElementById('c-squared').textContent = c2;
            
            // c가 정수인지 확인
            const isInteger = Number.isInteger(c);
            const eqResult = document.getElementById('eq-result');
            if (isInteger) {
                eqResult.innerHTML = `c = ${c} (정수!)  a<sup>2</sup> + b<sup>2</sup> = c<sup>2</sup> 성립!`;
                eqResult.classList.add('success');
            } else {
                eqResult.innerHTML = `c = &radic;${c2} &approx; ${c.toFixed(2)}  a<sup>2</sup> + b<sup>2</sup> = c<sup>2</sup> 항상 성립!`;
                eqResult.classList.remove('success');
            }
            
            // 캔버스 그리기
            this.drawPythagorasCanvas(ctx, canvas, a, b);
            
            // 다음 버튼 표시 (처음 조작 후)
            if (!this.coreRevealed) {
                this.coreRevealed = true;
                setTimeout(() => {
                    document.getElementById('core-next-btn').classList.remove('hidden');
                }, 1500);
            }
        };
        
        sliderA.addEventListener('input', draw);
        sliderB.addEventListener('input', draw);
        draw();
    },

    drawPythagorasCanvas(ctx, canvas, a, b) {
        const W = canvas.width;
        const H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        
        const unit = Math.min(30, Math.min((W - 80) / (a + b + 2), (H - 60) / (Math.max(a, b) + 2)));
        const c2 = a * a + b * b;
        const c = Math.sqrt(c2);
        
        // 중심 기준점
        const cx = W / 2 - (b * unit) / 4;
        const cy = H / 2 + (a * unit) / 4;
        
        // 삼각형 꼭짓점 (직각이 cx, cy)
        const p1 = { x: cx, y: cy };                     // 직각 꼭짓점
        const p2 = { x: cx, y: cy - a * unit };          // 위 (변 a)
        const p3 = { x: cx + b * unit, y: cy };          // 오른쪽 (변 b)
        
        // === 정사각형 A (왼쪽, 변 a) ===
        ctx.fillStyle = 'rgba(255, 112, 67, 0.15)';
        ctx.strokeStyle = '#FF7043';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(cx - a * unit, cy - a * unit, a * unit, a * unit);
        ctx.fill();
        ctx.stroke();
        
        // A 그리드
        ctx.strokeStyle = 'rgba(255, 112, 67, 0.3)';
        ctx.lineWidth = 0.5;
        for (let i = 1; i < a; i++) {
            ctx.beginPath();
            ctx.moveTo(cx - a * unit, cy - i * unit);
            ctx.lineTo(cx, cy - i * unit);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx - i * unit, cy - a * unit);
            ctx.lineTo(cx - i * unit, cy);
            ctx.stroke();
        }
        
        // A 라벨
        ctx.fillStyle = '#FF7043';
        ctx.font = 'bold 16px "Jua", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`a² = ${a*a}`, cx - (a * unit) / 2, cy - (a * unit) / 2 + 6);
        
        // === 정사각형 B (아래, 변 b) ===
        ctx.fillStyle = 'rgba(66, 165, 245, 0.15)';
        ctx.strokeStyle = '#42A5F5';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(cx, cy, b * unit, b * unit);
        ctx.fill();
        ctx.stroke();
        
        // B 그리드
        ctx.strokeStyle = 'rgba(66, 165, 245, 0.3)';
        ctx.lineWidth = 0.5;
        for (let i = 1; i < b; i++) {
            ctx.beginPath();
            ctx.moveTo(cx, cy + i * unit);
            ctx.lineTo(cx + b * unit, cy + i * unit);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx + i * unit, cy);
            ctx.lineTo(cx + i * unit, cy + b * unit);
            ctx.stroke();
        }
        
        // B 라벨
        ctx.fillStyle = '#42A5F5';
        ctx.font = 'bold 16px "Jua", sans-serif';
        ctx.fillText(`b² = ${b*b}`, cx + (b * unit) / 2, cy + (b * unit) / 2 + 6);
        
        // === 삼각형 ===
        ctx.fillStyle = 'rgba(200, 200, 200, 0.2)';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // 직각 표시
        const sq = 10;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p1.x + sq, p1.y);
        ctx.lineTo(p1.x + sq, p1.y - sq);
        ctx.lineTo(p1.x, p1.y - sq);
        ctx.stroke();
        
        // 변 라벨
        ctx.fillStyle = '#FF7043';
        ctx.font = 'bold 14px "Noto Sans KR", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`a=${a}`, p1.x - 6, (p1.y + p2.y) / 2 + 4);
        
        ctx.fillStyle = '#42A5F5';
        ctx.textAlign = 'center';
        ctx.fillText(`b=${b}`, (p1.x + p3.x) / 2, p1.y + 18);
        
        // 빗변 라벨
        ctx.fillStyle = '#2196F3';
        ctx.font = 'bold 14px "Noto Sans KR", sans-serif';
        const midHypX = (p2.x + p3.x) / 2;
        const midHypY = (p2.y + p3.y) / 2;
        ctx.textAlign = 'left';
        ctx.fillText(`c=√${c2}`, midHypX + 8, midHypY - 4);
        if (Number.isInteger(c)) {
            ctx.fillText(`= ${c}`, midHypX + 8, midHypY + 14);
        }
    },

    // === 5. Visualize Scene ===
    initVisualizeScene() {
        // 공식 순차 애니메이션
        const terms = document.querySelectorAll('.animated-formula .term, .animated-formula .operator');
        terms.forEach((t, i) => {
            t.style.opacity = '0';
            t.style.transform = 'scale(0.5)';
            setTimeout(() => {
                t.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                t.style.opacity = '1';
                t.style.transform = 'scale(1)';
            }, i * 300);
        });
    },

    initQuizScene() {
        document.querySelectorAll('.opt-btn').forEach(button => {
            button.style.pointerEvents = 'auto';
            button.classList.remove('disabled', 'correct', 'incorrect');
        });
        document.getElementById('quiz-feedback').textContent = '';
        document.getElementById('quiz-feedback').className = 'quiz-feedback';
        document.getElementById('quiz-continue').hidden = true;
    },

    // === 6. Quiz Scene: 인라인 피드백 ===
    checkAnswer(btnEl, val) {
        const options = document.querySelectorAll('.opt-btn');
        const feedback = document.getElementById('quiz-feedback');
        
        // 모든 버튼 잠금
        options.forEach(b => {
            b.style.pointerEvents = 'none';
            b.classList.add('disabled');
        });
        
        if (val === 13) {
            btnEl.classList.add('correct');
            feedback.innerHTML = '정답! 5<sup>2</sup> + 12<sup>2</sup> = 25 + 144 = 169 = 13<sup>2</sup>';
            feedback.className = 'quiz-feedback show correct';
            document.getElementById('quiz-continue').hidden = false;
        } else {
            btnEl.classList.add('incorrect');
            // 정답 하이라이트
            options.forEach(b => {
                if (parseInt(b.dataset.value) === 13) b.classList.add('correct');
            });
            feedback.innerHTML = '아쉬워요! &radic;(25 + 144) = &radic;169 = 13';
            feedback.className = 'quiz-feedback show incorrect';
            document.getElementById('quiz-continue').hidden = false;
        }
    },

    // === 7. Wrap Scene ===
    initWrapScene() {
        // 요약 항목 순차 표시
        const items = document.querySelectorAll('.summary-item');
        items.forEach((item, i) => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';
            setTimeout(() => {
                item.style.transition = 'all 0.5s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, 300 + i * 400);
        });
        
        // 미니 지뢰폭발 효과
        this.createConfetti();
    },

    createConfetti() {
        const container = document.getElementById('confetti-container');
        if (!container) return;
        container.innerHTML = '';
        
        const colors = ['#FF7043', '#42A5F5', '#FFD54F', '#66BB6A', '#AB47BC'];
        for (let i = 0; i < 30; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.background = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = Math.random() * 1.5 + 's';
            piece.style.animationDuration = (1.5 + Math.random() * 2) + 's';
            container.appendChild(piece);
        }
    },

    bindEvents() {}
};

window.ContentApp = ContentApp;

document.addEventListener('DOMContentLoaded', () => {
    ContentApp.init();
});
