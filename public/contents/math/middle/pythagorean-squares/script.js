const ContentApp = {
    currentScene: 0,
    scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
    
    init() {
        this.updateProgress();
        this.initHookScene();
        this.bindEvents();
    },

    nextScene() {
        if (this.currentScene < this.scenes.length - 1) {
            this.changeScene(this.currentScene + 1);
        }
    },

    changeScene(index) {
        // Hide current
        document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
        
        // Update index
        this.currentScene = index;
        this.updateProgress();

        // Show new
        const sceneName = this.scenes[index];
        const sceneEl = document.getElementById(`${sceneName}-scene`);
        
        if (sceneEl) {
            sceneEl.classList.add('active');
            
            // Init specific scene logic
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

    // --- Scene Logic ---

    initHookScene() {
        // Simple SVG animation already in CSS/SVG structure, 
        // but let's animate the character along path
        const char = document.getElementById('character');
        // Reset
        char.setAttribute('cx', 20);
        char.setAttribute('cy', 280);
        
        // Wait then animate
        setTimeout(() => {
            // Animate along diagonal (simplified for pure JS/CSS interaction demo)
            // Ideally use SMIL or Web Animations API
            char.style.transition = 'all 2s ease-out';
            char.style.transform = 'translate(260px, -260px)'; // 20 -> 280 roughly
        }, 1000);
    },

    initAnchorScene() {
        // Generate grid cells
        const container = document.querySelector('.grid-cells');
        container.innerHTML = '';
        for(let i=0; i<9; i++) {
            const div = document.createElement('div');
            container.appendChild(div);
            // Staggered animation
            setTimeout(() => {
                div.style.background = '#E3F2FD';
            }, i * 100);
        }
    },

    initStoryScene() {
        const text = "내가 손수레를 끌고 올라가려면 경사로가 필요한데... 벽 높이가 4m고, 바닥 여유 공간이 3m밖에 없어. 경사로 길이는 얼마만큼 준비해야 할까?";
        const el = document.getElementById('typewriter-text');
        el.textContent = '';
        let i = 0;
        
        // Typewriter effect
        const type = () => {
            if (i < text.length) {
                el.textContent += text.charAt(i);
                i++;
                setTimeout(type, 30);
            }
        };
        type();
    },

    initCoreScene() {
        // Clear previous connection
        const container = document.getElementById('puzzle-area');
        container.innerHTML = '';
        container.style.position = 'relative';

        // Create Grid Visualization
        // We use a simplified 3-4-5 triangle setup
        // Square A (3x3), Square B (4x4), Square C (5x5)
        
        const unit = 30; // pixel size for one grid unit
        const gap = 2;
        
        // Wrapper for centering
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.width = '400px';
        wrapper.style.height = '350px';
        wrapper.style.margin = '0 auto';
        container.appendChild(wrapper);

        // Positions (relative to wrapper)
        // Triangle in center: Right angle at (150, 200). 
        // Side A (3 units) goes UP from (150, 200) to (150, 110)
        // Side B (4 units) goes RIGHT from (150, 200) to (270, 200)
        // Hypotenuse connects (150, 110) to (270, 200)

        const originX = 140;
        const originY = 220;

        // 1. Draw Triangle Background
        const svgBg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgBg.setAttribute('width', '100%');
        svgBg.setAttribute('height', '100%');
        svgBg.style.position = 'absolute';
        svgBg.style.top = '0';
        svgBg.style.left = '0';
        // 3*30=90, 4*30=120. (3-4-5 scaled by 30)
        // A (vertical): 90px. B (horizontal): 120px.
        const p1 = `${originX},${originY}`; // Corner
        const p2 = `${originX},${originY - 90}`; // Top
        const p3 = `${originX + 120},${originY}`; // Right
        
        // Triangle
        const tri = document.createElementNS("http://www.w3.org/2000/svg", "path");
        tri.setAttribute('d', `M ${p1} L ${p2} L ${p3} Z`);
        tri.setAttribute('fill', '#eee');
        tri.setAttribute('stroke', '#ccc');
        svgBg.appendChild(tri);
        
        // Target Grid C (Hypotenuse)
        // We need 5x5 slots rotated.
        // Rotation angle: tan(theta) = 3/4. theta = 36.87 deg.
        // Wait, normally angle is at p3. The angle at p2 is 53.13.
        // Slope of hypotenuse: dy/dx = -3/4.
        // The square C sits on the hypotenuse.
        // Let's just create placeholder slots for Square C.
        
        const slots = [];
        const angleRad = Math.atan(3/4);
        const cos = Math.cos(angleRad); // 0.8
        const sin = Math.sin(angleRad); // 0.6
        
        // Start point for C grid is p2 (150, 110)
        // Direction vectors for C grid axes:
        // u = (cos, sin) -> acts like 'right' along hypotenuse? No, hypotenuse goes down-right.
        // H vector = (120, 90). Normalized (0.8, 0.6).
        // Perpendicular vector v = (sin, -cos) ? No, (-0.6, 0.8) goes "Up-Right".
        // Let's compute exact pixel coords for 25 target slots.
        
        for(let r=0; r<5; r++) {
            for(let c=0; c<5; c++) {
                // local coords in C square
                // x' = c * unit, y' = r * unit
                // Rotate and translate
                // We want the square to be "above/right" of the hypotenuse.
                
                // Let's keep it simple: Just put the slots relative to P2
                // along the standard geometric construction
                
                const lx = c * unit + unit/2; 
                const ly = -1 * (r * unit + unit/2); // go 'up' away from triangle
                
                // Rotation matrix for aligning with hypotenuse
                // The hypotenuse vector is (0.8, 0.6) direction from P2? Actually P2 to P3 is (120, 90).
                // Let's imply Angle = -36.87 (standard clockwise from x).
                // Actually, let's just cheat and place 25 targets in a grid layout to the right side
                // and animate them "flying" there. Simple is better for reliability.
                // Or better: Just put them in a 5x5 grid slightly offset.
            }
        }
        
        // Correction: Let's simpler. Just draw an empty 5x5 grid visual rotated.
        wrapper.appendChild(svgBg); // Add background first

        // Create Feedback Element Dynamically (since we cleared container)
        const feedback = document.createElement('div');
        feedback.id = 'feedback-msg';
        feedback.className = 'feedback hidden';
        feedback.textContent = "딱 맞았어요!";
        wrapper.appendChild(feedback);

        // Square A Blocks (3x3) - Left side
        const blocksA = [];
        for(let r=0; r<3; r++) {
            for(let c=0; c<3; c++) {
                const b = document.createElement('div');
                b.className = 'grid-block block-a';
                b.style.width = (unit - gap) + 'px';
                b.style.height = (unit - gap) + 'px';
                b.style.left = (originX - (3-c)*unit) + 'px';
                b.style.top = (originY - (3-r)*unit) + 'px'; // Up from origin
                b.dataset.r = r; b.dataset.c = c;
                wrapper.appendChild(b);
                blocksA.push(b);
            }
        }

        // Square B Blocks (4x4) - Bottom side
        const blocksB = [];
        for(let r=0; r<4; r++) {
            for(let c=0; c<4; c++) {
                const b = document.createElement('div');
                b.className = 'grid-block block-b';
                b.style.width = (unit - gap) + 'px';
                b.style.height = (unit - gap) + 'px';
                b.style.left = (originX + c*unit) + 'px'; // Right from origin
                b.style.top = (originY + r*unit) + 'px'; 
                wrapper.appendChild(b);
                blocksB.push(b);
            }
        }

        // Square C Target (5x5) - On Hypotenuse
        // ... (keep existing targetContainer code) ...
        const targetContainer = document.createElement('div');
        targetContainer.style.position = 'absolute';
        targetContainer.style.width = (5*unit) + 'px';
        targetContainer.style.height = (5*unit) + 'px';
        targetContainer.style.border = '2px dashed #2196F3'; // Dashed for "Target" feel
        targetContainer.style.boxSizing = 'content-box';
        
        // Use the simplified "Right Side" placement for better visibility
        targetContainer.style.left = '280px';
        targetContainer.style.top = '50px';
        targetContainer.style.border = '2px solid #333';
        targetContainer.innerHTML = '<div style="position:absolute;top:-25px;width:100%;text-align:center;">C² (5×5)</div>';
        wrapper.appendChild(targetContainer);
        
        // 25 Slots in target
        const targets = [];
        for(let i=0; i<25; i++) {
            const r = Math.floor(i/5);
            const c = i%5;
            const t = {
                x: 280 + c*unit,
                y: 50 + r*unit
            };
            targets.push(t);
        }

        // Interaction
        const btn = document.createElement('button');
        btn.className = 'btn-primary';
        btn.textContent = '합체!';
        btn.style.position = 'absolute';
        btn.style.bottom = '10px';
        btn.style.right = '10px';
        btn.onclick = () => {
             // Animate all blocks to targets
             const allBlocks = [...blocksA, ...blocksB];
             let i=0;
             // Disable button immediately
             btn.disabled = true;
             btn.style.opacity = '0.5';

             const interval = setInterval(() => {
                 if(i >= allBlocks.length) {
                     clearInterval(interval);
                     
                     // Show success message
                     const fbEl = document.getElementById('feedback-msg');
                     if(fbEl) {
                         fbEl.textContent = "와! 9 + 16 = 25! 딱 맞네요!";
                         fbEl.classList.remove('hidden');
                     }

                     // Reveal Next Button (outside the puzzle area)
                     setTimeout(() => {
                         const nextBtn = document.getElementById('core-next-btn');
                         if(nextBtn) nextBtn.classList.remove('hidden');
                     }, 1000);
                     return;
                 }
                 const b = allBlocks[i];
                 const t = targets[i];
                 
                 b.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                 b.style.left = t.x + 'px';
                 b.style.top = t.y + 'px';
                 b.style.zIndex = 100 + i;
                 
                 i++;
             }, 50);
        };
        wrapper.appendChild(btn);
    },

    checkAnswer(val) {
        if (val === 13) {
            alert("정답입니다! 5² + 12² = 25 + 144 = 169 = 13²");
            this.nextScene();
        } else {
            alert("다시 생각해보세요. √ (5² + 12²) = ?");
        }
    },

    bindEvents() {
        // Any global bindings
    }
};

// Start
document.addEventListener('DOMContentLoaded', () => {
    ContentApp.init();
});
