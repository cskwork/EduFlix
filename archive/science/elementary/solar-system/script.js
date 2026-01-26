/**
 * 태양계 여행 (Recreated with Shared Engine)
 */

const planetData = {
  sun: {
    name: '태양',
    description: '태양은 태양계의 중심에 있는 별입니다. 지구에 빛과 열을 제공해요.',
    facts: [
      { label: '종류', value: '항성(별)' },
      { label: '표면 온도', value: '약 5,500°C' },
      { label: '크기', value: '지구의 109배' },
    ],
  },
  mercury: {
    name: '수성',
    description:
      '수성은 태양에서 가장 가까운 행성이에요. 낮에는 매우 뜨겁고 밤에는 매우 추워요.',
    facts: [
      { label: '태양과의 거리', value: '1위 (가장 가까움)' },
      { label: '공전 주기', value: '88일' },
      { label: '크기', value: '지구의 0.4배' },
    ],
  },
  venus: {
    name: '금성',
    description:
      '금성은 지구에서 가장 밝게 보이는 행성이에요. 새벽이나 저녁에 볼 수 있어서 "샛별"이라고도 불러요.',
    facts: [
      { label: '태양과의 거리', value: '2위' },
      { label: '공전 주기', value: '225일' },
      { label: '특징', value: '가장 뜨거운 행성' },
    ],
  },
  earth: {
    name: '지구',
    description: '지구는 우리가 살고 있는 행성이에요. 물과 공기가 있어서 생명체가 살 수 있어요.',
    facts: [
      { label: '태양과의 거리', value: '3위' },
      { label: '공전 주기', value: '365일 (1년)' },
      { label: '특징', value: '유일하게 생명체가 사는 행성' },
    ],
  },
  mars: {
    name: '화성',
    description:
      '화성은 붉은색을 띄어서 "붉은 행성"이라고 불러요. 과학자들이 탐사 로봇을 보내서 연구하고 있어요.',
    facts: [
      { label: '태양과의 거리', value: '4위' },
      { label: '공전 주기', value: '687일 (약 2년)' },
      { label: '특징', value: '산화철로 붉은색' },
    ],
  },
  jupiter: {
    name: '목성',
    description:
      '목성은 태양계에서 가장 큰 행성이에요. 표면에 있는 "대적점"은 지구보다 큰 거대한 폭풍이에요.',
    facts: [
      { label: '태양과의 거리', value: '5위' },
      { label: '공전 주기', value: '약 12년' },
      { label: '크기', value: '태양계에서 가장 큼' },
    ],
  },
  saturn: {
    name: '토성',
    description:
      '토성은 아름다운 고리를 가진 행성이에요. 고리는 얼음과 돌 조각으로 이루어져 있어요.',
    facts: [
      { label: '태양과의 거리', value: '6위' },
      { label: '공전 주기', value: '약 29년' },
      { label: '특징', value: '아름다운 고리' },
    ],
  },
  uranus: {
    name: '천왕성',
    description: '천왕성은 옆으로 누워서 자전하는 특이한 행성이에요. 파란 색깔이 아주 예뻐요.',
    facts: [
      { label: '태양과의 거리', value: '7위' },
      { label: '공전 주기', value: '약 84년' },
      { label: '특징', value: '옆으로 누워서 돔' },
    ],
  },
  neptune: {
    name: '해왕성',
    description:
      '해왕성은 태양에서 가장 먼 행성이에요. 강한 바람이 불고 매우 추운 얼음 행성이에요.',
    facts: [
      { label: '태양과의 거리', value: '8위 (가장 멂)' },
      { label: '공전 주기', value: '약 165년' },
      { label: '특징', value: '가장 강한 바람' },
    ],
  },
}

const solarContentData = {
    title: "태양계 여행",
    hook: {
        question: "우주에는 어떤 행성들이 있을까요?"
    },
    story: {
        character: { image: "assets/character.svg" },
        situation: "여러분은 우주선 선장입니다. 태양계를 탐험하며 모든 행성의 비밀을 밝혀내세요!"
    },
    interaction: {
        title: "태양계 탐험",
        instruction: "행성을 클릭해서 우주선을 보내고 정보를 수집하세요.",
        onInit: (container, engine) => {
            // Stars background
            const stars = document.createElement('div');
            stars.className = 'stars';
            for (let i = 0; i < 100; i++) {
                const star = document.createElement('div');
                star.className = 'star';
                star.style.left = `${Math.random() * 100}%`;
                star.style.top = `${Math.random() * 100}%`;
                star.style.animationDelay = `${Math.random() * 2}s`;
                star.style.opacity = Math.random() * 0.5 + 0.3;
                stars.appendChild(star);
            }
            container.appendChild(stars);

            // Solar System Stage
            const stage = document.createElement('div');
            stage.className = 'solar-system-stage';
            
            const solarSystem = document.createElement('div');
            solarSystem.className = 'solar-system';
            
            // Sun
            solarSystem.innerHTML += `
                <div class="sun" id="sun">
                    <span class="sun-label">태양</span>
                </div>
            `;
            
            // Orbits and Planets
            const planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
            planets.forEach(p => {
                solarSystem.innerHTML += `
                    <div class="orbit" data-planet="${p}">
                        <div class="planet ${p}" id="${p}" data-id="${p}">
                            <div class="planet-label">${planetData[p].name}</div>
                            ${p === 'saturn' ? '<div class="saturn-ring"></div>' : ''}
                        </div>
                    </div>
                `;
            });
            
            stage.appendChild(solarSystem);
            
            // Info Panel
            const infoPanel = document.createElement('div');
            infoPanel.className = 'info-panel';
            infoPanel.innerHTML = `
                <button class="close-btn" onclick="this.parentElement.classList.remove('active')">&times;</button>
                <div class="info-title" id="info-title"></div>
                <div class="info-content" id="info-content"></div>
                <div class="info-facts" id="info-facts"></div>
            `;
            stage.appendChild(infoPanel);
            
            // Spaceship
            const spaceship = document.createElement('div');
            spaceship.className = 'spaceship';
            spaceship.innerHTML = '🚀';
            stage.appendChild(spaceship);
            
            container.appendChild(stage);
            
            // Logic
            let visitedCount = 0;
            const visited = new Set();
            
            const visitPlanet = (id) => {
                const planetEl = solarSystem.querySelector(`#${id}`);
                const panel = infoPanel;
                const data = planetData[id];
                
                // Move spaceship (Simplified for now - just jump to position or close to it)
                // Real implementation would calculate relative coordinates
                
                // Show Info
                panel.querySelector('#info-title').textContent = data.name;
                panel.querySelector('#info-content').innerHTML = `<p>${data.description}</p>`;
                panel.querySelector('#info-facts').innerHTML = data.facts.map(f => `
                    <div class="fact-item"><span class="fact-label">${f.label}</span> <span class="fact-value">${f.value}</span></div>
                `).join('');
                panel.classList.add('active');
                
                if (!visited.has(id) && id !== 'sun') {
                    visited.add(id);
                    visitedCount++;
                    planetEl.classList.add('visited');
                    engine.showFeedback(`${data.name} 발견! (${visitedCount}/${planets.length})`, "positive");
                    
                    if(visitedCount === planets.length) {
                        setTimeout(() => {
                             engine.enableNext();
                             engine.showFeedback("모든 행성을 탐험했습니다!", "positive");
                        }, 1000);
                    }
                }
            };
            
            // Click Events
            solarSystem.addEventListener('click', (e) => {
                const planet = e.target.closest('.planet') || e.target.closest('.sun');
                if (planet) {
                    const id = planet.id || planet.dataset.id;
                    visitPlanet(id);
                }
            });
        }
    },
    quiz: [
        {
            question: "우리 태양계에서 가장 큰 행성은 무엇일까요?",
            options: ["지구", "목성", "토성", "태양"],
            answer: 1
        },
        {
            question: "아름다운 고리를 가진 행성은?",
            options: ["화성", "수성", "토성", "금성"],
            answer: 2
        }
    ]
};

Engine.init(solarContentData);
