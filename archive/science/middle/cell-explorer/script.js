/**
 * 세포 탐험 (Recreated with Shared Engine)
 */

const contentData = {
    title: "세포 탐험",
    hook: {
        question: "우리 몸은 무엇으로 이루어져 있을까요?"
    },
    story: {
        character: { image: "assets/character.svg" },
        situation: "현미경으로 마이크로 세계를 들여다보세요.<br>세포 친구들이 각자의 역할을 소개하고 싶어 해요!"
    },
    interaction: {
        title: "세포 관찰하기",
        instruction: "세포 소기관을 클릭하여 이름과 하는 일을 알아보세요.",
        onInit: (container, engine) => {
             container.innerHTML = `
                <div class="cell-container">
                    <div class="cell">
                        <div class="organelle nucleus" data-id="nucleus" title="핵"></div>
                        <div class="organelle mitochondria mito-1" data-id="mitochondria" title="미토콘드리아"></div>
                        <div class="organelle mitochondria mito-2" data-id="mitochondria" title="미토콘드리아"></div>
                        <!-- Random Ribosomes -->
                        ${Array.from({length: 10}).map(() => {
                            const top = Math.random() * 80 + 10;
                            const left = Math.random() * 80 + 10;
                            return `<div class="organelle ribosome" style="top:${top}%; left:${left}%" data-id="ribosome"></div>`;
                        }).join('')}
                    </div>
                </div>
                <div class="info-box" id="cell-info-box">
                    <h3 id="organelle-name"></h3>
                    <p id="organelle-desc"></p>
                </div>
             `;
             
             const infoBox = container.querySelector('#cell-info-box');
             const nameEl = container.querySelector('#organelle-name');
             const descEl = container.querySelector('#organelle-desc');
             
             const infoData = {
                 nucleus: { name: "핵 (Nucleus)", desc: "세포의 생명 활동을 조절하는 사령탑입니다. DNA가 들어있어요." },
                 mitochondria: { name: "미토콘드리아 (Mitochondria)", desc: "세포의 발전소입니다. 에너지를 만들어요." },
                 ribosome: { name: "리보솜 (Ribosome)", desc: "단백질을 만드는 작은 공장입니다." }
             };
             
             const explored = new Set();
             
             container.querySelectorAll('.organelle').forEach(el => {
                 el.onclick = (e) => {
                     e.stopPropagation();
                     const id = el.dataset.id;
                     const data = infoData[id];
                     
                     nameEl.textContent = data.name;
                     descEl.textContent = data.desc;
                     infoBox.classList.add('active');
                     
                     if (!explored.has(id)) {
                         explored.add(id);
                         if(explored.size === 3) {
                             engine.enableNext();
                             engine.showFeedback("주요 소기관을 모두 찾았습니다!", "positive");
                         }
                     }
                 };
             });
             
             // Click outside closes info
             container.querySelector('.cell').onclick = () => {
                 infoBox.classList.remove('active');
             };
        }
    },
    quiz: [
        {
            question: "세포의 생명 활동을 조절하는 곳은?",
            options: ["미토콘드리아", "핵", "리보솜", "세포막"],
            answer: 1
        },
        {
            question: "에너지를 만드는 세포 소기관은?",
            options: ["핵", "엽록체", "미토콘드리아", "액포"],
            answer: 2
        }
    ]
};

Engine.init(contentData);
