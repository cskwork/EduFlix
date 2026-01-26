/**
 * 전기회로 실험실 (Recreated with Shared Engine)
 */

const contentData = {
    title: "전기회로 실험실",
    hook: {
        question: "불을 켜려면 무엇이 필요할까요?"
    },
    story: {
        character: { image: "assets/character.svg" },
        situation: "어두운 방을 밝히기 위해 전구를 켜야 합니다.<br>건전지와 전선을 전구에 올바르게 연결해보세요!"
    },
    interaction: {
        title: "회로 연결하기",
        instruction: "건전지, 스위치, 전구를 연결하여 불을 켜보세요.<br>부품을 클릭하여 선택하고 '연결' 버튼을 눌러보세요.",
        onInit: (container, engine) => {
             container.innerHTML = `
                <div class="circuit-container" id="circuit-board">
                    <div id="connection-mode-indicator">연결 모드: 부품 두 개를 차례로 클릭하세요</div>
                    <!-- Components will be placed here -->
                </div>
                <div class="toolbar">
                    <button class="tool-btn" id="btn-wire">🔌 전선 연결</button>
                    <button class="tool-btn" id="btn-reset-circuit">🔄 다시 하기</button>
                    <button class="tool-btn" id="btn-check-circuit" style="background:#2ecc71;">✅ 불 켜기</button>
                </div>
             `;
             
             const board = container.querySelector('#circuit-board');
             let components = [];
             let wires = [];
             let selectedComponent = null;
             let connectionMode = false;
             
             // Setup basic components
             const setupComponents = () => {
                 components = [
                     { id: 'battery', type: 'battery', icon: '🔋', label: '건전지', x: 50, y: 130 },
                     { id: 'switch', type: 'switch', icon: '🔘', label: '스위치', x: 250, y: 130, state: 'off' },
                     { id: 'bulb', type: 'bulb', icon: '💡', label: '전구', x: 450, y: 130, state: 'off' }
                 ];
                 
                 board.innerHTML = `<div id="connection-mode-indicator">연결 모드: 부품 두 개를 차례로 클릭하세요</div>`;
                 wires = [];
                 
                 components.forEach(c => {
                     const el = document.createElement('div');
                     el.className = 'component';
                     el.id = c.id;
                     el.style.left = c.x + 'px';
                     el.style.top = c.y + 'px';
                     el.innerHTML = `<div class="component-icon">${c.icon}</div><div class="component-label">${c.label}</div>`;
                     
                     el.onclick = (e) => handleComponentClick(c, el);
                     board.appendChild(el);
                 });
             };
             
             const handleComponentClick = (data, el) => {
                 if (data.type === 'switch') {
                     // Toggle Switch Visual
                     data.state = data.state === 'off' ? 'on' : 'off';
                     el.querySelector('.component-icon').textContent = data.state === 'on' ? '🟢' : '🔘';
                 }
                 
                 if (connectionMode) {
                     if (!selectedComponent) {
                         selectedComponent = { data, el };
                         el.style.borderColor = '#4caf50';
                     } else {
                         if (selectedComponent.data.id !== data.id) {
                             createWire(selectedComponent, { data, el });
                         }
                         selectedComponent.el.style.borderColor = '';
                         selectedComponent = null;
                         connectionMode = false;
                         container.querySelector('#connection-mode-indicator').style.display = 'none';
                     }
                 }
             };
             
             const createWire = (start, end) => {
                 // Check if wire exists
                 if (wires.some(w => (w.from === start.data.id && w.to === end.data.id) || (w.from === end.data.id && w.to === start.data.id))) return;
                 
                 wires.push({ from: start.data.id, to: end.data.id });
                 
                 // Draw line (simple visual)
                 const rect1 = start.el.getBoundingClientRect();
                 const rect2 = end.el.getBoundingClientRect();
                 const boardRect = board.getBoundingClientRect();
                 
                 const x1 = rect1.left + rect1.width/2 - boardRect.left;
                 const y1 = rect1.top + rect1.height/2 - boardRect.top;
                 const x2 = rect2.left + rect2.width/2 - boardRect.left;
                 const y2 = rect2.top + rect2.height/2 - boardRect.top;
                 
                 const length = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
                 const angle = Math.atan2(y2-y1, x2-x1) * 180 / Math.PI;
                 
                 const wire = document.createElement('div');
                 wire.className = 'wire';
                 wire.style.width = length + 'px';
                 wire.style.left = x1 + 'px';
                 wire.style.top = y1 + 'px';
                 wire.style.transform = `rotate(${angle}deg)`;
                 board.appendChild(wire);
             };
             
             container.querySelector('#btn-wire').onclick = () => {
                 connectionMode = true;
                 selectedComponent = null;
                 container.querySelector('#connection-mode-indicator').style.display = 'block';
                 engine.showFeedback("부품 두 개를 차례로 클릭하여 연결하세요.", "neutral");
             };
             
             container.querySelector('#btn-reset-circuit').onclick = setupComponents;
             
             container.querySelector('#btn-check-circuit').onclick = () => {
                 // Check if it forms a loop: Battery -> Switch -> Bulb -> Battery
                 // And switch is ON
                 
                 // Simplified check: do we have enough wires?
                 // Minimal circuit: B-S, S-L, L-B (3 wires)
                 if (wires.length < 3) {
                     engine.showFeedback("회로가 끊겨있습니다. 더 연결하세요.", "negative");
                     return;
                 }
                 
                 const switchComp = components.find(c => c.type === 'switch');
                 if (switchComp.state === 'off') {
                     engine.showFeedback("스위치를 켜보세요!", "neutral");
                     return;
                 }
                 
                 // Success
                 const bulbEl = document.getElementById('bulb');
                 bulbEl.classList.add('on');
                 engine.showFeedback("성공! 전구에 불이 들어왔습니다!", "positive");
                 engine.enableNext();
             };
             
             setupComponents();
        }
    },
    quiz: [
        {
            question: "전기가 흐르기 위해 꼭 필요한 것이 아닌 것은?",
            options: ["전원(건전지)", "전선", "장난감", "닫힌 회로"],
            answer: 2
        },
        {
            question: "전구의 불을 끄려면 어떻게 해야 할까요?",
            options: ["전선을 자른다", "스위치를 끈다", "건전지를 뺀다", "모두 정답"],
            answer: 3
        }
    ]
};

Engine.init(contentData);
