/**
 * 비와 비율 인터랙티브 콘텐츠
 * 초등 6학년 수학 - 레시피 비율 조절 학습
 */
const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],

    // 레시피 기본 데이터 (4인분 기준)
    baseRecipe: {
        servings: 4,
        ingredients: [
            { name: '떡', amount: 400, unit: 'g', maxBar: 1000, barClass: 'tteok' },
            { name: '고추장', amount: 3, unit: '큰술', maxBar: 10, barClass: 'gochujang' },
            { name: '설탕', amount: 2, unit: '큰술', maxBar: 10, barClass: 'sugar' },
            { name: '어묵', amount: 200, unit: 'g', maxBar: 500, barClass: 'eomuk' }
        ]
    },

    init() {
        this.updateProgress();
        this.setupHookScene();
        this.bindEvents();
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

        // 새 씬 보이기
        const sceneName = this.scenes[index];
        const sceneEl = document.getElementById(`${sceneName}-scene`);

        if (sceneEl) {
            sceneEl.classList.add('active');

            // 씬별 초기화 함수 호출
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

    // --- 씬별 로직 ---

    setupHookScene() {
        // 재료 애니메이션은 CSS에서 처리
        // 추가 인터랙션이 필요하면 여기에 구현
    },

    initHookScene() {
        // Hook 씬 재방문 시 초기화
    },

    initAnchorScene() {
        // 3x4 블록 그리드 생성
        const container = document.getElementById('anchor-blocks');
        if (!container) return;

        container.innerHTML = '';
        for (let i = 0; i < 12; i++) {
            const block = document.createElement('div');
            block.className = 'block';
            block.style.animationDelay = `${i * 0.05}s`;
            container.appendChild(block);
        }
    },

    initStoryScene() {
        const text = "안녕하세요! 저는 요리 유튜버 쉐프 지민이에요. " +
            "오늘 떡볶이 레시피를 올렸는데, 구독자분이 질문을 주셨어요. " +
            "'4인분 레시피인데, 6명이 먹으려면 재료를 어떻게 조절해야 하나요?' " +
            "여러분이 도와주세요!";

        const el = document.getElementById('typewriter-text');
        if (!el) return;

        el.textContent = '';
        let i = 0;

        // 타자기 효과
        const type = () => {
            if (i < text.length) {
                el.textContent += text.charAt(i);
                i++;
                setTimeout(type, 25);
            }
        };
        type();
    },

    initCoreScene() {
        this.renderIngredientBars(4);
        this.setupSlider();
    },

    setupSlider() {
        const slider = document.getElementById('person-slider');
        if (!slider) return;

        slider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.updateRecipeDisplay(value);
        });
    },

    updateRecipeDisplay(servings) {
        // 인원수 표시 업데이트
        const countEl = document.getElementById('person-count');
        if (countEl) {
            countEl.textContent = servings;
        }

        // 비율 표시 업데이트
        const ratioEl = document.getElementById('current-ratio');
        if (ratioEl) {
            ratioEl.textContent = `${servings}인분`;
        }

        // 배수 표시 업데이트
        const multiplierEl = document.getElementById('multiplier-value');
        if (multiplierEl) {
            const multiplier = servings / this.baseRecipe.servings;
            multiplierEl.textContent = multiplier % 1 === 0 ? multiplier : multiplier.toFixed(2);
        }

        // 재료 막대 업데이트
        this.renderIngredientBars(servings);
    },

    renderIngredientBars(servings) {
        const container = document.getElementById('ingredient-bars');
        if (!container) return;

        const multiplier = servings / this.baseRecipe.servings;

        container.innerHTML = this.baseRecipe.ingredients.map(ing => {
            const newAmount = ing.amount * multiplier;
            const displayAmount = newAmount % 1 === 0 ? newAmount : newAmount.toFixed(1);
            const barWidth = Math.min((newAmount / ing.maxBar) * 100, 100);

            return `
                <div class="ingredient-bar-item">
                    <div class="ingredient-bar-label">
                        <span>${ing.name}</span>
                        <span class="amount">${displayAmount}${ing.unit}</span>
                    </div>
                    <div class="bar-container">
                        <div class="bar-fill ${ing.barClass}" style="width: ${barWidth}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    },

    initVisualizeScene() {
        // 비례식 시각화 애니메이션
        // 필요 시 추가 애니메이션 구현
    },

    initQuizScene() {
        // 퀴즈 초기화
        const feedback = document.getElementById('quiz-feedback');
        if (feedback) {
            feedback.classList.add('hidden');
            feedback.classList.remove('success', 'error');
        }

        // 버튼 초기화
        document.querySelectorAll('.opt-btn').forEach(btn => {
            btn.classList.remove('correct', 'wrong');
            btn.disabled = false;
        });
    },

    checkAnswer(val) {
        const feedback = document.getElementById('quiz-feedback');
        const buttons = document.querySelectorAll('.opt-btn');

        // 모든 버튼 비활성화
        buttons.forEach(btn => {
            btn.disabled = true;
            const btnVal = parseInt(btn.textContent);
            if (btnVal === val) {
                btn.classList.add(val === 150 ? 'correct' : 'wrong');
            }
        });

        if (val === 150) {
            // 정답
            if (feedback) {
                feedback.textContent = '정답입니다! 300 : 100 = 450 : 150 (비례식 성립!)';
                feedback.classList.remove('hidden', 'error');
                feedback.classList.add('success');
            }

            // 정답인 버튼 하이라이트
            buttons.forEach(btn => {
                if (parseInt(btn.textContent) === 150) {
                    btn.classList.add('correct');
                }
            });

            // 다음 씬으로
            setTimeout(() => {
                this.nextScene();
            }, 2000);
        } else {
            // 오답
            if (feedback) {
                feedback.textContent = '다시 생각해보세요. 300 x ? = 100 x 450 을 계산해보세요!';
                feedback.classList.remove('hidden', 'success');
                feedback.classList.add('error');
            }

            // 다시 시도 가능하도록 버튼 활성화
            setTimeout(() => {
                buttons.forEach(btn => {
                    btn.disabled = false;
                    btn.classList.remove('wrong');
                });
            }, 1500);
        }
    },

    initWrapScene() {
        // 트로피 애니메이션은 CSS에서 처리
    },

    bindEvents() {
        // 키보드 네비게이션
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                // 퀴즈 씬에서는 스페이스바로 넘어가지 않도록
                if (this.scenes[this.currentScene] !== 'quiz') {
                    this.nextScene();
                }
            }
            if (e.key === 'ArrowLeft' && this.currentScene > 0) {
                this.changeScene(this.currentScene - 1);
            }
        });
    }
};

// 앱 시작
document.addEventListener('DOMContentLoaded', () => {
    ContentApp.init();
});
