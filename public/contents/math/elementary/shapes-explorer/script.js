/**
 * 도형 탐험가 (Recreated with Shared Engine)
 */

// Draw functions (copied and adapted)
function drawTriangle(ctx, color) {
  const size = 100
  ctx.beginPath()
  ctx.moveTo(0, -size)
  ctx.lineTo(-size * 0.866, size * 0.5)
  ctx.lineTo(size * 0.866, size * 0.5)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 3
  ctx.stroke()
}

function drawSquare(ctx, color) {
  const size = 90
  ctx.fillStyle = color
  ctx.fillRect(-size, -size, size * 2, size * 2)
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 3
  ctx.strokeRect(-size, -size, size * 2, size * 2)
}

function drawPentagon(ctx, color) {
  const size = 90
  const sides = 5
  ctx.beginPath()
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI / sides) - Math.PI / 2
    const x = size * Math.cos(angle)
    const y = size * Math.sin(angle)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 3
  ctx.stroke()
}

function drawHexagon(ctx, color) {
  const size = 90
  const sides = 6
  ctx.beginPath()
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI / sides) - Math.PI / 2
    const x = size * Math.cos(angle)
    const y = size * Math.sin(angle)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 3
  ctx.stroke()
}

function drawCircle(ctx, color) {
  const size = 90
  ctx.beginPath()
  ctx.arc(0, 0, size, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 3
  ctx.stroke()
}

const shapesData = {
    triangle: { name: '삼각형', sides: 3, vertices: 3, color: '#ff6b6b', draw: drawTriangle, description: '세 개의 변과 세 개의 꼭짓점이 있어요.' },
    square: { name: '사각형', sides: 4, vertices: 4, color: '#4ecdc4', draw: drawSquare, description: '네 개의 변과 네 개의 꼭짓점이 있어요.' },
    pentagon: { name: '오각형', sides: 5, vertices: 5, color: '#45b7d1', draw: drawPentagon, description: '다섯 개의 변과 다섯 개의 꼭짓점이 있어요.' },
    hexagon: { name: '육각형', sides: 6, vertices: 6, color: '#96ceb4', draw: drawHexagon, description: '여섯 개의 변과 여섯 개의 꼭짓점이 있어요.' },
    circle: { name: '원', sides: 0, vertices: 0, color: '#ffeaa7', draw: drawCircle, description: '변과 꼭짓점이 없어요. 동그란 모양이에요.' }
};

const contentData = {
    title: "도형 탐험가",
    hook: {
        question: "네모, 세모, 동그라미... 이름이 뭘까요?"
    },
    story: {
        character: { image: "assets/character.svg" },
        situation: "도형 나라의 건축가가 잃어버린 설계도를 찾고 있어요.<br>도형들의 이름을 맞춰야 설계도가 완성된대요!"
    },
    interaction: {
        title: "도형 관찰하기",
        instruction: "버튼을 눌러 도형을 살펴보고 특징을 알아보세요.",
        onInit: (container, engine) => {
             // UI Structure
             container.innerHTML = `
                <div class="exploration-area">
                    <div class="shape-tabs">
                         <div class="shape-selector" id="shape-selector"></div>
                    </div>
                    <div class="shape-display">
                        <canvas id="shape-canvas" width="300" height="300"></canvas>
                    </div>
                    <div class="shape-info">
                        <h2 class="shape-name" id="display-name"></h2>
                        <p class="shape-description" id="display-desc"></p>
                        <div class="shape-properties">
                            <div class="property"><span class="property-label">변</span><span class="property-value" id="val-sides">-</span></div>
                            <div class="property"><span class="property-label">꼭짓점</span><span class="property-value" id="val-vertices">-</span></div>
                        </div>
                    </div>
                </div>
             `;
             
             const canvas = container.querySelector('#shape-canvas');
             const ctx = canvas.getContext('2d');
             const selector = container.querySelector('#shape-selector');
             
             let currentShape = 'triangle';
             const explored = new Set();
             
             // Draw Shape
             const renderShape = (key) => {
                 const data = shapesData[key];
                 ctx.clearRect(0, 0, canvas.width, canvas.height);
                 ctx.save();
                 ctx.translate(canvas.width/2, canvas.height/2);
                 data.draw(ctx, data.color);
                 ctx.restore();
                 
                 // Info
                 container.querySelector('#display-name').textContent = data.name;
                 container.querySelector('#display-desc').textContent = data.description;
                 container.querySelector('#val-sides').textContent = data.sides;
                 container.querySelector('#val-vertices').textContent = data.vertices;
                 
                 // Update buttons
                 selector.querySelectorAll('.shape-btn').forEach(btn => {
                     btn.classList.toggle('active', btn.dataset.key === key);
                 });
                 
                 if(!explored.has(key)) {
                     explored.add(key);
                     const btn = selector.querySelector(`[data-key="${key}"]`);
                     if(btn) btn.classList.add('explored');
                     
                     if(explored.size === Object.keys(shapesData).length) {
                         engine.enableNext();
                         engine.showFeedback("모든 도형을 찾았습니다!", "positive");
                     }
                 }
             };
             
             // Build Selector
             Object.keys(shapesData).forEach(key => {
                 const btn = document.createElement('button');
                 btn.className = 'shape-btn';
                 btn.textContent = shapesData[key].name;
                 btn.dataset.key = key;
                 btn.onclick = () => {
                     currentShape = key;
                     renderShape(key);
                 };
                 selector.appendChild(btn);
             });
             
             // Init
             renderShape(currentShape);
        }
    },
    quiz: [
        {
            question: "변이 3개이고 꼭짓점이 3개인 도형은?",
            options: ["사각형", "삼각형", "원", "육각형"],
            answer: 1
        },
        {
            question: "변과 꼭짓점이 없는 도형은?",
            options: ["삼각형", "사각형", "원", "오각형"],
            answer: 2
        }
    ]
};

Engine.init(contentData);
