/**
 * Grammar Quest (Recreated with Shared Engine)
 */

const quests = [
    {
        instruction: "Select the NOUNS (names of people, places, things) in this sentence.",
        sentence: "The cat sat on the mat.",
        answers: ["cat", "mat"] // Simple keyword matching for demo
    },
    {
        instruction: "Select the VERB (action word) in this sentence.",
        sentence: "She runs very fast.",
        answers: ["runs"]
    },
    {
        instruction: "Select the ADJECTIVE (describing word) in this sentence.",
        sentence: "He has a red car.",
        answers: ["red"]
    }
];

const contentData = {
    title: "Grammar Quest",
    hook: {
        question: "Can you unlock the secrets of language?"
    },
    story: {
        character: { image: "assets/character.svg" },
        situation: "The language scroll is broken.<br>Help the wizard fix the sentences by identifying the magic words!"
    },
    interaction: {
        title: "Identify Part of Speech",
        instruction: "Read the instruction and click on the correct words.",
        onInit: (container, engine) => {
             let currentLevel = 0;
             
             const render = () => {
                 const quest = quests[currentLevel];
                 container.innerHTML = `
                    <div class="quest-container">
                        <div class="instruction-text">${quest.instruction}</div>
                        <div class="sentence-box" id="sentence-area"></div>
                        <div style="text-align:center;">
                            <button class="btn btn-primary" id="check-grammar-btn">Check Magic</button>
                        </div>
                    </div>
                 `;
                 
                 const area = container.querySelector('#sentence-area');
                 const words = quest.sentence.split(' ');
                 
                 words.forEach((word, idx) => {
                     const span = document.createElement('span');
                     span.className = 'word-token';
                     span.textContent = word;
                     span.dataset.clean = word.replace(/[.,!?]/g, ''); // Remove punctuation for checking works roughly
                     span.onclick = () => span.classList.toggle('selected');
                     area.appendChild(span);
                     // Add space
                     if(idx < words.length - 1) area.appendChild(document.createTextNode(' '));
                 });
                 
                 container.querySelector('#check-grammar-btn').onclick = () => {
                     const selectedEls = area.querySelectorAll('.word-token.selected');
                     const selectedWords = Array.from(selectedEls).map(el => el.dataset.clean);
                     
                     // Check logic: All answers must be selected, no extras
                     const targets = quest.answers;
                     const missed = targets.filter(t => !selectedWords.includes(t));
                     const wrong = selectedWords.filter(s => !targets.includes(s));
                     
                     if (missed.length === 0 && wrong.length === 0) {
                         selectedEls.forEach(el => el.classList.add('correct'));
                         engine.showFeedback("Correct! The magic is working!", "positive");
                         
                         setTimeout(() => {
                             if(currentLevel < quests.length - 1) {
                                 currentLevel++;
                                 render();
                                 engine.showFeedback("Next Scroll...", "neutral");
                             } else {
                                 engine.enableNext();
                                 engine.showFeedback("Quest Complete!", "positive");
                             }
                         }, 1500);
                     } else {
                         engine.showFeedback("Not quite right. Try again.", "negative");
                         selectedEls.forEach(el => el.classList.remove('selected')); // Reset selection on fail for better UX or keep it
                         // Let's keep selection but maybe shake?
                     }
                 };
             };
             
             render();
        }
    },
    quiz: [
        {
            question: "What is a Noun?",
            options: ["Action word", "Person, Place, Thing", "Describing word", "Linking word"],
            answer: 1
        },
        {
            question: "Which word is a Verb?",
            options: ["Blue", "Quickly", "Jump", "Table"],
            answer: 2
        }
    ]
};

Engine.init(contentData);
