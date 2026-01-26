#!/usr/bin/env python3
"""
EduFlix 콘텐츠 마이그레이션 스크립트
- common/style.css 의존성 제거
- engine.js 의존성 제거 (inline으로 대체)
"""

import os
import re
from pathlib import Path

CONTENTS_DIR = Path("/Users/chaeseong-gug/Documents/PARA/Resource/EduFlix/public/contents")

# 이미 마이그레이션된 콘텐츠 (건너뜀)
ALREADY_MIGRATED = [
    "fractions-pizza",
    "shapes-explorer",
    "20260125-pythagorean",  # 원래부터 독립형
]

# Base Engine 코드 (script.js 상단에 추가)
ENGINE_CODE = '''/* ========================================
   Inline EduFlix Engine
   ======================================== */
class Scene {
    constructor(id, element) {
        this.id = id;
        this.element = element;
        this.onEnter = null;
        this.onExit = null;
    }

    show() {
        this.element.classList.add('active');
        if (this.onEnter) this.onEnter();
    }

    hide() {
        this.element.classList.remove('active');
        if (this.onExit) this.onExit();
    }
}

class EduFlixEngine {
    constructor() {
        this.scenes = new Map();
        this.currentSceneId = null;
        this.data = {};
        this.container = document.getElementById('scene-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'scene-container';
            document.body.appendChild(this.container);
        }
    }

    init(gameData) {
        this.data = gameData;
        this.createScenes();
        this.start();
    }

    escapeHtml(value) {
        return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    isImagePath(value) {
        return /^(?:\\.{0,2}\\/|assets\\/|https?:\\/\\/|data:image\\/)/i.test(value) || /\\.(svg|png|jpe?g|gif|webp|avif)$/i.test(value);
    }

    getCharacterMarkup(character) {
        if (!character || !character.image) return '<div class="story-character-emoji">🎓</div>';
        const imageValue = String(character.image);
        if (this.isImagePath(imageValue)) {
            const altText = character.alt ? this.escapeHtml(character.alt) : '캐릭터';
            return `<img class="story-character-image" src="${this.escapeHtml(imageValue)}" alt="${altText}" />`;
        }
        return `<div class="story-character-emoji">${this.escapeHtml(imageValue)}</div>`;
    }

    createScenes() {
        this.createScene('hook', (scene) => {
            scene.innerHTML = `<h1 class="hook-question">${this.data.hook.question}</h1><button class="btn btn-primary-large" onclick="Engine.nextScene()">시작하기</button>`;
        });

        this.createScene('story', (scene) => {
            const { character, situation } = this.data.story;
            scene.innerHTML = `<div class="story-stage">${this.getCharacterMarkup(character)}</div><div class="scene-text typing-effect">${situation}</div><button class="btn btn-primary-large animate-fade-in" onclick="Engine.nextScene()">다음</button>`;
        });

        this.createScene('core', (scene) => {
            scene.innerHTML = `<h2 class="scene-title">${this.data.interaction.title || '체험하기'}</h2><div class="scene-text">${this.data.interaction.instruction}</div><div class="interactive-area" id="core-interactive-area"></div><div id="core-feedback" class="scene-text"></div><button class="btn btn-primary-large" id="core-next-btn" style="display:none;" onclick="Engine.nextScene()">다음</button>`;
        }, () => { if (this.data.interaction.onInit) this.data.interaction.onInit(document.getElementById('core-interactive-area'), this); });

        if (this.data.quiz) {
            this.createScene('quiz', (scene) => {
                scene.innerHTML = `<h2 class="scene-title">퀴즈!</h2><div class="scene-text" id="quiz-question"></div><div class="quiz-container" id="quiz-options"></div>`;
            }, () => { this.startQuiz(); });
        }

        this.createScene('wrap', (scene) => {
            scene.innerHTML = `<h1 class="scene-title">🎉 완료!</h1><div class="wrap-summary"><p class="scene-text">오늘 배운 내용</p><h3>${this.data.title}</h3></div><div style="display:flex; gap:15px;"><button class="btn btn-secondary-large" onclick="location.reload()">다시하기</button><button class="btn btn-primary-large" onclick="window.parent.postMessage('close', '*')">홈으로</button></div>`;
        });
    }

    createScene(id, renderFn, onEnterFn) {
        let sceneEl = document.createElement('div');
        sceneEl.id = `scene-${id}`;
        sceneEl.className = `scene scene-${id}`;
        renderFn(sceneEl);
        this.container.appendChild(sceneEl);
        const scene = new Scene(id, sceneEl);
        if (onEnterFn) scene.onEnter = onEnterFn;
        this.scenes.set(id, scene);
    }

    switchScene(sceneId) {
        if (this.currentSceneId) this.scenes.get(this.currentSceneId).hide();
        if (this.scenes.has(sceneId)) { this.currentSceneId = sceneId; this.scenes.get(sceneId).show(); }
    }

    nextScene() {
        const order = ['hook', 'story', 'core', 'quiz', 'wrap'];
        const currentIndex = order.indexOf(this.currentSceneId);
        if (currentIndex < order.length - 1) this.switchScene(order[currentIndex + 1]);
    }

    start() { this.switchScene('hook'); }

    showFeedback(msg, type='neutral') {
        const el = document.getElementById('core-feedback');
        if(el) { el.innerHTML = msg; el.className = `scene-text feedback-${type}`; }
    }

    enableNext() {
        const btn = document.getElementById('core-next-btn');
        if(btn) { btn.style.display = 'inline-block'; btn.classList.add('animate-fade-in'); }
    }

    startQuiz() {
        const q = this.data.quiz[0];
        document.getElementById('quiz-question').textContent = q.question;
        const optsContainer = document.getElementById('quiz-options');
        optsContainer.innerHTML = '';
        q.options.forEach((opt, idx) => {
            const btn = document.createElement('div');
            btn.className = 'quiz-option';
            btn.textContent = opt;
            btn.onclick = () => this.checkQuiz(idx, q.answer, btn);
            optsContainer.appendChild(btn);
        });
    }

    checkQuiz(selectedIdx, correctIdx, btnElement) {
        const opts = document.querySelectorAll('.quiz-option');
        opts.forEach(o => o.style.pointerEvents = 'none');
        if (selectedIdx === correctIdx) {
            btnElement.classList.add('correct');
            setTimeout(() => this.nextScene(), 1500);
        } else {
            btnElement.classList.add('incorrect');
            opts[correctIdx].classList.add('correct');
            setTimeout(() => this.nextScene(), 2000);
        }
    }
}

window.Engine = new EduFlixEngine();

/* ========================================
   Content Code
   ======================================== */
'''

# Base CSS 코드 (style.css 상단에 추가)
BASE_CSS = '''/* ========================================
   독립형 스타일 - Base Reset & Scene
   ======================================== */

:root {
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
  --primary-color: #2196F3;
  --accent-color: #4CAF50;
  --bg-color: #f5f5f5;
  --text-color: #333;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: var(--bg-color);
  color: var(--text-color);
}

#scene-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: var(--bg-color);
}

.scene {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.5s ease-in-out;
  padding: 2rem;
  box-sizing: border-box;
}

.scene.active {
  opacity: 1;
  pointer-events: all;
  z-index: 10;
}

.scene-title, .hook-question {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 2rem;
  text-align: center;
  color: var(--primary-color);
}

.scene-text {
  font-size: 1.2rem;
  line-height: 1.8;
  text-align: center;
  max-width: 600px;
  margin-bottom: 2rem;
}

.story-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
}

.story-character-image {
  max-width: 200px;
  height: auto;
}

.story-character-emoji {
  font-size: 80px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.typing-effect, .animate-fade-in {
  animation: fadeIn 0.5s ease forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.interactive-area {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

button {
  cursor: pointer;
  font-family: inherit;
}

.btn, .btn-primary, .btn-primary-large {
  padding: 12px 28px;
  font-size: 1.1rem;
  border-radius: 25px;
  border: none;
  background: var(--primary-color);
  color: white;
  transition: all 0.3s var(--ease-spring);
}

.btn:hover, .btn-primary:hover, .btn-primary-large:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
}

.btn-secondary, .btn-secondary-large {
  padding: 12px 28px;
  font-size: 1.1rem;
  border-radius: 25px;
  background: white;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
}

.hidden { display: none !important; }

.quiz-container {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quiz-option {
  padding: 18px 24px;
  border: 2px solid #ddd;
  border-radius: 12px;
  cursor: pointer;
  background: white;
  font-size: 1.1rem;
  transition: all 0.2s ease;
}

.quiz-option:hover {
  border-color: var(--primary-color);
}

.quiz-option.correct {
  background: #d4edda;
  border-color: #28a745;
}

.quiz-option.incorrect {
  background: #f8d7da;
  border-color: #dc3545;
}

.feedback-positive { color: #28a745; font-weight: bold; }
.feedback-negative { color: #dc3545; font-weight: bold; }
.feedback-neutral { color: #666; }

.wrap-summary {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
  text-align: center;
}

.wrap-summary h3 {
  color: var(--primary-color);
  margin-top: 0.5rem;
}

/* ========================================
   Content Specific Styles
   ======================================== */

'''


def get_title_from_html(html_content):
    """HTML에서 title 추출"""
    match = re.search(r'<title>([^<]+)</title>', html_content)
    return match.group(1) if match else "콘텐츠"


def migrate_index_html(content_dir):
    """index.html 마이그레이션"""
    html_path = content_dir / "index.html"
    if not html_path.exists():
        return False
    
    html_content = html_path.read_text(encoding='utf-8')
    title = get_title_from_html(html_content)
    
    # Three.js 의존성 확인
    has_threejs = 'three' in html_content.lower()
    
    # 새 HTML 생성
    new_html = f'''<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="scene-container"></div>
'''
    
    if has_threejs:
        new_html += '''  <script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/controls/OrbitControls.js"></script>
'''
    
    new_html += '''  <script src="script.js"></script>
</body>
</html>
'''
    
    html_path.write_text(new_html, encoding='utf-8')
    return True


def migrate_style_css(content_dir):
    """style.css 마이그레이션"""
    css_path = content_dir / "style.css"
    if not css_path.exists():
        # style.css가 없으면 base만 생성
        css_path.write_text(BASE_CSS, encoding='utf-8')
        return True
    
    css_content = css_path.read_text(encoding='utf-8')
    
    # 이미 독립형인지 확인
    if 'html, body' in css_content and '#scene-container' in css_content:
        print(f"  - style.css 이미 독립형")
        return True
    
    # Base CSS 추가
    new_css = BASE_CSS + css_content
    css_path.write_text(new_css, encoding='utf-8')
    return True


def migrate_script_js(content_dir):
    """script.js 마이그레이션"""
    js_path = content_dir / "script.js"
    if not js_path.exists():
        return False
    
    js_content = js_path.read_text(encoding='utf-8')
    
    # 이미 engine이 inline인지 확인
    if 'class EduFlixEngine' in js_content:
        print(f"  - script.js 이미 독립형")
        return True
    
    # 첫 번째 주석 또는 코드 찾기
    new_js = ENGINE_CODE + js_content
    js_path.write_text(new_js, encoding='utf-8')
    return True


def migrate_content(content_dir):
    """단일 콘텐츠 마이그레이션"""
    name = content_dir.name
    print(f"\n📦 마이그레이션: {name}")
    
    if name in ALREADY_MIGRATED:
        print(f"  ⏭️ 이미 마이그레이션됨, 건너뜀")
        return
    
    try:
        migrate_index_html(content_dir)
        print(f"  ✅ index.html 완료")
        
        migrate_style_css(content_dir)
        print(f"  ✅ style.css 완료")
        
        migrate_script_js(content_dir)
        print(f"  ✅ script.js 완료")
        
    except Exception as e:
        print(f"  ❌ 오류: {e}")


def main():
    print("=" * 50)
    print("EduFlix 콘텐츠 독립형 마이그레이션")
    print("=" * 50)
    
    # 모든 콘텐츠 디렉토리 찾기
    content_dirs = []
    for subject_dir in CONTENTS_DIR.iterdir():
        if not subject_dir.is_dir() or subject_dir.name in ['common', 'backgrounds', 'icons', 'diagrams']:
            continue
        for level_dir in subject_dir.iterdir():
            if not level_dir.is_dir():
                continue
            for content_dir in level_dir.iterdir():
                if content_dir.is_dir() and (content_dir / "index.html").exists():
                    content_dirs.append(content_dir)
    
    print(f"\n발견된 콘텐츠: {len(content_dirs)}개")
    
    for content_dir in sorted(content_dirs):
        migrate_content(content_dir)
    
    print("\n" + "=" * 50)
    print("마이그레이션 완료!")
    print("=" * 50)


if __name__ == "__main__":
    main()
