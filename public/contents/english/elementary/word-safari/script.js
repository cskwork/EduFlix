/**
 * Word Safari (Recreated with Shared Engine)
 */

const words = [
    { word: "Lion", icon: "images/lion.png" },
    { word: "Elephant", icon: "images/elephant.png" },
    { word: "Monkey", icon: "images/monkey.png" },
    { word: "Rabbit", icon: "images/rabbit.png" },
    { word: "Bird", icon: "images/bird.png" }
];

const contentData = {
    title: "Word Safari",
    hook: {
        question: "Ready to explore the jungle?"
    },
    story: {
        character: { image: "assets/character.svg" },
        situation: "Welcome to the Safari!<br>We need to find animals and learn their names."
    },
    interaction: {
        title: "Match the Word",
        instruction: "Find the animal that matches the word!",
        onInit: (container, engine) => {
             // Game Logic: Show a word, User picks the card
             let currentWordIdx = 0;
             let score = 0;
             
             // Shuffle for display
             const getOptions = () => {
                 const correct = words[currentWordIdx];
                 const others = words.filter((_, i) => i !== currentWordIdx);
                 // Pick 2 random wrong options
                 const wrong = others.sort(() => 0.5 - Math.random()).slice(0, 2);
                 return [correct, ...wrong].sort(() => 0.5 - Math.random());
             };
             
             const render = () => {
                 const target = words[currentWordIdx];
                 container.innerHTML = `
                    <div class="safari-scene">
                        <div id="safari-bg"></div>
                        <div class="match-target">${target.word}</div>
                        <div class="card-container">
                            <!-- Cards -->
                        </div>
                    </div>
                 `;
                 
                 const opts = getOptions();
                 const cardContainer = container.querySelector('.card-container');
                 
                 opts.forEach(opt => {
                     const card = document.createElement('div');
                     card.className = 'word-card';
                     card.innerHTML = `
                        <div class="card-image"><img src="${opt.icon}" alt="${opt.word}" style="width:80px; height:80px; object-fit:contain;"></div>
                     `;
                     
                     card.onclick = () => {
                         if (opt.word === target.word) {
                             card.style.background = '#e8f5e9';
                             card.style.borderColor = '#4caf50';
                             engine.showFeedback("Correct! It's a " + target.word, "positive");
                             
                             setTimeout(() => {
                                 if (currentWordIdx < words.length - 1) {
                                     currentWordIdx++;
                                     render();
                                     engine.showFeedback("", "neutral");
                                 } else {
                                     engine.enableNext();
                                     engine.showFeedback("Safari Completed!", "positive");
                                 }
                             }, 1000);
                         } else {
                             card.style.background = '#ffebee';
                             card.style.borderColor = '#f44336';
                             engine.showFeedback("Try again!", "negative");
                         }
                     };
                     
                     cardContainer.appendChild(card);
                 });
             };
             
             render();
        }
    },
    quiz: [
        {
            question: "Which animal has long ears?",
            options: ["Lion", "Rabbit", "Monkey", "Bird"],
            answer: 1
        },
        {
            question: "Which animal is the King of the Jungle?",
            options: ["Elephant", "Rabbit", "Lion", "Monkey"],
            answer: 2
        }
    ]
};

Engine.init(contentData);
