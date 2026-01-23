/**
 * 피자로 배우는 분수 (Recreated with Shared Engine)
 */

const pizzaContentData = {
    title: "피자로 배우는 분수",
    hook: {
        question: "피자를 똑같이 나누려면 어떻게 해야 할까?"
    },
    story: {
        character: { image: "assets/character.svg" }, 
        situation: "피자 가게 사장님이 고민에 빠졌어요.<br>손님들이 '내 조각이 더 작잖아!'라고 화를 냈거든요.<br>여러분이 사장님을 도와 피자를 똑같이 나눠주세요!"
    },
    interaction: {
        title: "피자 나누기 연습",
        instruction: "피자를 클릭해서 4조각으로 똑같이 나눠보세요!",
        onInit: (container, engine) => {
            // State
            let currentSlices = 1;
            const targetSlices = 4;
            
            // Create DOM
            container.innerHTML = `
                <div class="pizza-container">
                    <div class="pizza" id="pizza-target"></div>
                </div>
                <div class="fraction-display">
                    <span id="current-slice-count">1</span>조각
                </div>
                <div style="margin-top: 20px;">
                    <button class="btn btn-secondary" id="reset-slice-btn">다시 하기</button>
                    <button class="btn btn-primary" id="check-slice-btn">확인</button>
                </div>
            `;
            
            const pizza = container.querySelector('#pizza-target');
            const countDisplay = container.querySelector('#current-slice-count');
            const checkBtn = container.querySelector('#check-slice-btn');
            const resetBtn = container.querySelector('#reset-slice-btn');

            // Render function
            const render = () => {
                pizza.innerHTML = '';
                const sliceAngle = 360 / currentSlices;
                for (let i = 0; i < currentSlices; i++) {
                    const slice = document.createElement('div');
                    slice.className = 'pizza-slice';
                    const rotation = i * sliceAngle;
                    
                    // Simple radial lines or clip-path
                    if (currentSlices > 1) {
                         // Using clip-path for slices is better
                         // But for simplicity let's stick to lines or rudimentary rotation
                         // Ideally we copy the logic from original or use conic-gradient
                         
                         // Reusing original rotate logic roughly
                         slice.style.transform = `rotate(${rotation}deg)`;
                         slice.style.height = '50%';
                         slice.style.width = '2px'; // Line separator
                         slice.style.background = 'rgba(139, 69, 19, 0.5)';
                         slice.style.transformOrigin = 'bottom center';
                         slice.style.position = 'absolute';
                         slice.style.top = '0';
                         slice.style.left = '50%';
                    }
                    pizza.appendChild(slice);
                }
                
                // Better visual: Conic Gradient
                let gradient = [];
                for(let i=0; i<currentSlices; i++) {
                     gradient.push(`#f5d0a9 ${i * (100/currentSlices)}% ${(i+1) * (100/currentSlices)}%`);
                }
                // Border lines visual via repetitive gradient
                pizza.style.background = `repeating-conic-gradient(
                    from 0deg,
                    #f5d0a9 0deg ${360/currentSlices - 2}deg,
                    #e6a15c ${360/currentSlices - 2}deg ${360/currentSlices}deg
                )`;
                
                countDisplay.textContent = currentSlices;
            };

            // Event Listeners
            pizza.onclick = () => {
                if(currentSlices < 12) {
                    currentSlices++;
                    render();
                } else {
                    engine.showFeedback("너무 조각이 많아요!", "neutral");
                }
            };

            resetBtn.onclick = () => {
                currentSlices = 1;
                render();
                engine.showFeedback("", "neutral");
            };

            checkBtn.onclick = () => {
                if (currentSlices === targetSlices) {
                    engine.showFeedback("성공! 똑같이 4조각으로 나눠졌네요.", "positive");
                    engine.enableNext();
                    checkBtn.disabled = true;
                    pizza.style.pointerEvents = 'none';
                } else {
                     engine.showFeedback(`${targetSlices}조각이 아니에요. 다시 해보세요!`, "negative");
                }
            };
            
            render();
        }
    },
    quiz: [
        {
            question: "친구가 2명 더 와서 총 8명이 되었습니다. 피자를 몇 조각으로 나눠야 할까요?",
            options: ["4조각", "6조각", "8조각", "12조각"],
            answer: 2 // 0-based index
        }
    ]
};

Engine.init(pizzaContentData);
