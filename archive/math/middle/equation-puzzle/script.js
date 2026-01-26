/**
 * 방정식 퍼즐 (Recreated with Shared Engine)
 */

const problems = [
  { equation: '2x = 6', left: '2x', right: '6', answer: 3, hint: '양변을 2로 나누어 보세요.' },
  { equation: '3x + 1 = 10', left: '3x+1', right: '10', answer: 3, hint: '먼저 1을 빼보세요.' },
  { equation: '2x - 4 = 10', left: '2x-4', right: '10', answer: 7, hint: '먼저 4를 더해보세요.' },
  { equation: '5x = 25', left: '5x', right: '25', answer: 5, hint: '5단 구구단을 생각해보세요.' }
];

const contentData = {
    title: "방정식 퍼즐",
    hook: {
        question: "양팔 저울의 균형을 맞추려면 x는 얼마일까요?"
    },
    story: {
        character: { image: "assets/character.svg" },
        situation: "고대 보물 창고의 문을 열려면 저울의 균형을 맞춰야 합니다.<br>x의 무게를 정확히 맞춰주세요!"
    },
    interaction: {
        title: "저울 균형 맞추기",
        instruction: "방정식을 보고 x의 값을 입력하여 저울의 수평을 맞추세요.",
        onInit: (container, engine) => {
             // State
             let currentIdx = 0;
             
             // UI
             container.innerHTML = `
                <div class="equation-display" id="eq-display"></div>
                <div class="balance-container">
                    <div class="balance-scale">
                        <div class="balance-bar" id="balance-bar">
                            <div class="plate left">
                                <div class="value-box" id="left-val"></div>
                            </div>
                            <div class="plate right">
                                <div class="value-box" id="right-val"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="input-area">
                    <span>x = </span>
                    <input type="number" id="answer-input" placeholder="?">
                    <button class="btn btn-primary" id="check-btn">확인</button>
                    <button class="btn btn-secondary" id="hint-btn">힌트</button>
                </div>
             `;
             
             const eqDisplay = container.querySelector('#eq-display');
             const leftVal = container.querySelector('#left-val');
             const rightVal = container.querySelector('#right-val');
             const balanceBar = container.querySelector('#balance-bar');
             const input = container.querySelector('#answer-input');
             const checkBtn = container.querySelector('#check-btn');
             const hintBtn = container.querySelector('#hint-btn');
             
             const loadProblem = () => {
                 const p = problems[currentIdx];
                 eqDisplay.textContent = p.equation;
                 leftVal.textContent = p.left;
                 rightVal.textContent = p.right;
                 input.value = '';
                 input.focus();
                 balanceBar.style.transform = 'translateX(-50%) rotate(0deg)';
                 checkBtn.disabled = false;
                 
                  // Random initial tilt
                 const tilt = Math.random() > 0.5 ? 10 : -10;
                 balanceBar.style.transform = `translateX(-50%) rotate(${tilt}deg)`;
             };
             
             checkBtn.onclick = () => {
                 const val = parseFloat(input.value);
                 const p = problems[currentIdx];
                 
                 if (val === p.answer) {
                     balanceBar.style.transform = 'translateX(-50%) rotate(0deg)';
                     engine.showFeedback("정답입니다! 균형이 맞았습니다.", "positive");
                     checkBtn.disabled = true;
                     
                     setTimeout(() => {
                         if(currentIdx < problems.length - 1) {
                             currentIdx++;
                             loadProblem();
                             engine.showFeedback("다음 문제로 넘어갑니다.", "neutral");
                         } else {
                             engine.enableNext();
                             engine.showFeedback("모든 자물쇠가 풀렸습니다!", "positive");
                         }
                     }, 1500);
                 } else {
                     const tilt = val > p.answer ? -15 : 15; // Simple direction check logic, usually logic is complex but this is visual proxy
                     balanceBar.style.transform = `translateX(-50%) rotate(${tilt}deg)`;
                     engine.showFeedback("틀렸습니다. 저울이 기울어집니다.", "negative");
                 }
             };
             
             hintBtn.onclick = () => {
                 engine.showFeedback(problems[currentIdx].hint, "neutral");
             };
             
             loadProblem();
        }
    },
    quiz: [
        {
            question: "방정식 2x + 4 = 10 의 해는?",
            options: ["2", "3", "4", "5"],
            answer: 1
        },
        {
            question: "3x = 21 의 해는?",
            options: ["5", "6", "7", "8"],
            answer: 2
        }
    ]
};

Engine.init(contentData);
