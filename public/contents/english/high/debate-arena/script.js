/**
 * Debate Arena (Recreated with Shared Engine)
 */

const contentData = {
    title: "Debate Arena",
    hook: {
        question: "How do you win an argument?"
    },
    story: {
        character: { image: "assets/character.svg" },
        situation: "The debate championship is here.<br>Choose the strongest arguments to support your team!"
    },
    interaction: {
        title: "Build Your Argument",
        instruction: "Topic: 'Homework should be banned.'<br>Select 3 arguments that support the PRO side (Agree).",
        onInit: (container, engine) => {
             // Logic: Select 3 correct arguments from list
             const argumentsPool = [
                 { id: 1, text: "Students need time to relax and rest.", side: "pro" },
                 { id: 2, text: "Homework helps reinforce what we learned.", side: "con" },
                 { id: 3, text: "It causes too much stress for students.", side: "pro" },
                 { id: 4, text: "We can spend time on hobbies and sports.", side: "pro" },
                 { id: 5, text: "Parents can see what students sort studying.", side: "con" }
             ];
             
             let selectedIds = new Set();
             const MAX_SELECT = 3;
             
             const render = () => {
                 container.innerHTML = `
                    <div class="arena-bg">
                        <div class="topic-card">
                            <div class="topic-text">Topic: Homework should be banned</div>
                            <p>Side: PRO (Agree)</p>
                        </div>
                        
                        <div class="drop-zone" id="slots">
                             <p>Selected Arguments (${selectedIds.size}/${MAX_SELECT})</p>
                             <div id="selected-list"></div>
                        </div>
                        
                        <div class="argument-list" id="pool-list" style="margin-top:20px;">
                             <!-- Pool -->
                        </div>
                        
                        <div style="margin-top: 20px;">
                             <button class="btn btn-primary" id="submit-debate">Submit Case</button>
                        </div>
                    </div>
                 `;
                 
                 const poolList = container.querySelector('#pool-list');
                 const selectedList = container.querySelector('#selected-list');
                 
                 argumentsPool.forEach(arg => {
                     const bubble = document.createElement('div');
                     bubble.className = `argument-bubble ${arg.side === 'pro' ? 'pro' : 'con'}`; // Just for visual style hint or hide? Let's hide side visual
                     bubble.className = 'argument-bubble';
                     bubble.textContent = arg.text;
                     
                     if (selectedIds.has(arg.id)) {
                         bubble.style.background = '#e1bee7';
                         bubble.onclick = () => {
                             selectedIds.delete(arg.id);
                             render();
                         };
                         selectedList.appendChild(bubble);
                     } else {
                         bubble.onclick = () => {
                             if (selectedIds.size < MAX_SELECT) {
                                 selectedIds.add(arg.id);
                                 render();
                             } else {
                                 engine.showFeedback("You can only choose 3 items.", "neutral");
                             }
                         };
                         poolList.appendChild(bubble);
                     }
                 });
                 
                 container.querySelector('#submit-debate').onclick = () => {
                     if (selectedIds.size !== MAX_SELECT) {
                         engine.showFeedback(`Please select ${MAX_SELECT} arguments.`, "negative");
                         return;
                     }
                     
                     // Check correctness
                     let correctCount = 0;
                     selectedIds.forEach(id => {
                         const arg = argumentsPool.find(a => a.id === id);
                         if (arg.side === 'pro') correctCount++;
                     });
                     
                     if (correctCount === MAX_SELECT) {
                         engine.showFeedback("Excellent! You built a strong case.", "positive");
                         engine.enableNext();
                     } else {
                         engine.showFeedback("Some arguments don't support the PRO side. Try again.", "negative");
                     }
                 };
             };
             
             render();
        }
    },
    quiz: [
        {
            question: "What is a 'Rebuttal'?",
            options: ["Starting speech", "Counter-argument", "Closing statement", "Introduction"],
            answer: 1
        },
        {
            question: "Why is evidence important?",
            options: ["It makes you look smart", "It supports your claim", "It fills time", "It confuses the opponent"],
            answer: 1
        }
    ]
};

Engine.init(contentData);
