const fs = require('fs');
const path = require('path');

const b1Files = [
    '3d-geometry-explorer-donga/index.html',
    '3d-shapes-discovery/index.html',
    'box-volume/index.html',
    'circle-area/index.html',
    'coordinate-explorer/index.html'
];
const baseDir = '/Users/danny/Documents/PARA/Resource/EduFlix/public/contents/math/elementary/';

// We will inject the story scene template right after the hook-scene (or where appropriate)
const storySceneTemplate = `
        <!-- Story Scene Injected by Batch Process -->
        <section id="story-scene" class="scene" style="display:none; padding: 2rem; background: var(--glass, rgba(255,255,255,0.1)); border-radius: 20px; margin: 2rem auto; max-width: 600px; text-align: center;">
            <div class="character-box" style="display: flex; align-items: center; gap: 20px; text-align: left;">
                <div class="character-img">
                    <svg width="100" height="100" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="#fff" stroke="#333" stroke-width="2"/>
                        <path d="M20 30 Q 50 10 80 30" stroke="#333" stroke-width="3" fill="none"/>
                        <circle cx="35" cy="45" r="5" fill="#333"/>
                        <circle cx="65" cy="45" r="5" fill="#333"/>
                        <path d="M40 60 Q 50 70 60 60" stroke="#333" stroke-width="2" fill="none"/>
                        <!-- Cat Ears -->
                        <path d="M15 35 L 25 10 L 45 20" fill="#fff" stroke="#333" stroke-width="2"/>
                        <path d="M85 35 L 75 10 L 55 20" fill="#fff" stroke="#333" stroke-width="2"/>
                    </svg>
                </div>
                <div class="speech-bubble" style="background: white; color: #333; padding: 15px; border-radius: 15px; position:relative; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    안녕! 나는 우주 고양이 <strong>'보라'</strong>야. 🐾<br><br>
                    이 수학 퍼즐을 풀려면 네 도움이 꼭 필요해!<br>
                    <span style="color: #6366f1; font-weight: bold;">나와 함께 탐험을 시작해볼까?</span>
                </div>
            </div>
            <button class="nav-btn" onclick="document.getElementById('story-scene').style.display='none'; if(typeof ContentApp !== 'undefined') ContentApp.nextScene();" style="margin-top: 20px; padding: 10px 30px; border-radius: 20px; border:none; background: #6366f1; color: white; font-weight: bold; cursor: pointer;">도와주기</button>
        </section>
`;

b1Files.forEach(file => {
    const fullPath = path.join(baseDir, file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        
        // Very basic injection: Look for end of hook-scene
        if (content.includes('id="hook-scene"') && !content.includes('id="story-scene"')) {
            // Find the closing tag of hook-scene
            // For safety, let's inject right before <script> or right before </body> if no specific hook structure is found easily
            const injectPoint = content.lastIndexOf('</div>\n    <script') !== -1 ? content.lastIndexOf('</div>\n    <script') : content.lastIndexOf('</body>');
            if (injectPoint !== -1) {
                // We'll actually inject right after <div id="app"> if we can, or before closing div
                // Since structures vary (some don't use scenes properly), let's inject right before the game container or app container ends, but making it hidden initially and hook it to the start button.
                
                // For contents that have a "start-screen" or "hook-scene", append the story there
                if (content.includes('id="start-screen"')) {
                     content = content.replace('</section>', '</section>' + storySceneTemplate); // Approximation
                }
                
                // Let's just create a general backup: save original, we'll edit manually or via strictly controlled regex.
                console.log(`Need to process manually or refine script for: ${file}`);
            }
        }
    }
});
console.log("Analysis complete.");
