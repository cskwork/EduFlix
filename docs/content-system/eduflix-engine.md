# EduFlixEngine 가이드

## 개요

EduFlixEngine은 교육 콘텐츠의 Scene 전환과 상호작용을 관리하는 핵심 엔진입니다. 각 콘텐츠는 독립형 HTML 파일에서 이 엔진을 인라인으로 포함하거나 공유 `engine.js`를 로드합니다.

---

## 아키텍처

```
┌───────────────────────────────────────────────────────────┐
│                       EduFlixEngine                        │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                     Scene Map                         │ │
│  │   hook → story → core → quiz → wrap                  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│
│  │    data     │  │   scenes    │  │   helper methods    ││
│  │  (콘텐츠 데이터)│  │   (씬 맵)    │  │   (피드백, 퀴즈 등)  ││
│  └─────────────┘  └─────────────┘  └─────────────────────┘│
└───────────────────────────────────────────────────────────┘
```

---

## Scene 클래스

### 정의

```javascript
class Scene {
  constructor(id, element) {
    this.id = id
    this.element = element
    this.onEnter = null  // 씬 진입 시 콜백
    this.onExit = null   // 씬 퇴장 시 콜백
  }

  show() {
    this.element.classList.add('active')
    if (this.onEnter) this.onEnter()
  }

  hide() {
    this.element.classList.remove('active')
    if (this.onExit) this.onExit()
  }
}
```

### CSS 연동

```css
.scene {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.5s ease;
}

.scene.active {
  opacity: 1;
  pointer-events: all;
}
```

---

## EduFlixEngine 클래스

### 초기화

```javascript
class EduFlixEngine {
  constructor() {
    this.scenes = new Map()
    this.currentSceneId = null
    this.data = {}
    this.container = document.getElementById('scene-container')
  }

  init(gameData) {
    this.data = gameData
    this.createScenes()
    this.start()
  }
}

// 전역 싱글톤
window.Engine = new EduFlixEngine()
```

### 사용 예시 (script.js)

```javascript
const contentData = {
  title: "원의 넓이",

  hook: {
    question: "원 모양 피자가 사각형 피자보다 클까요?",
    subText: "같은 재료로 만들면 어떤 게 더 큰지 알아봅시다",
    visual: {
      svg: '<svg>...</svg>',
      onInit: function(container) {
        // 동적 시각 요소 초기화
      }
    }
  },

  story: {
    character: {
      image: "chef.png",
      alt: "요리사"
    },
    situation: "최고의 피자를 만들기 위해 수학이 필요합니다!"
  },

  interaction: {
    title: "원의 넓이 탐구",
    instruction: "반지름을 조절해 보세요",
    onInit: function(container, engine) {
      // 상호작용 요소 초기화
      const slider = document.createElement('input')
      slider.type = 'range'
      slider.oninput = () => {
        // 반지름 변경 시 처리
        engine.showFeedback(`반지름: ${slider.value}cm`, 'neutral')
      }
      container.appendChild(slider)
    }
  },

  quiz: [{
    question: "반지름이 3cm인 원의 넓이는?",
    options: ["9π cm²", "6π cm²", "3π cm²", "12π cm²"],
    answer: 0
  }]
}

Engine.init(contentData)
```

---

## 씬 구조

### Hook (흥미 유발)

```javascript
createScene('hook', (scene) => {
  scene.innerHTML = `
    <div class="hook-content">
      <div class="question-box">
        <h1 class="hook-question">${this.data.hook.question}</h1>
        ${this.data.hook.subText ?
          `<p class="hook-subtext">${this.data.hook.subText}</p>` : ''}
      </div>
      ${this.data.hook.visual ?
        `<div class="hook-visual">${this.data.hook.visual.svg}</div>` : ''}
      <button class="btn btn-primary-large" onclick="Engine.nextScene()">
        시작하기
      </button>
    </div>
  `
}, () => {
  // onEnter: 동적 시각 요소 초기화
  if (this.data.hook.visual?.onInit) {
    const container = document.querySelector('.hook-visual')
    this.data.hook.visual.onInit(container)
  }
})
```

### Story (배경 제시)

```javascript
createScene('story', (scene) => {
  const { character, situation } = this.data.story
  const characterMarkup = this.getCharacterMarkup(character)

  scene.innerHTML = `
    <div class="story-stage" id="story-stage">
      <div class="story-character" id="story-char">
        ${characterMarkup}
      </div>
    </div>
    <div class="scene-text typing-effect">${situation}</div>
    <button class="btn btn-primary-large animate-fade-in"
            style="opacity:0; animation-delay: 2s;"
            onclick="Engine.nextScene()">
      다음
    </button>
  `
})
```

### Core (핵심 상호작용)

```javascript
createScene('core', (scene) => {
  scene.innerHTML = `
    <h2 class="scene-title">${this.data.interaction.title || '체험하기'}</h2>
    <div class="scene-text">${this.data.interaction.instruction}</div>
    <div class="interactive-area" id="core-interactive-area"></div>
    <div id="core-feedback" class="scene-text" style="height: 50px;"></div>
    <button class="btn btn-primary-large" id="core-next-btn"
            style="display:none;" onclick="Engine.nextScene()">
      다음
    </button>
  `
}, () => {
  // onEnter: 상호작용 초기화
  if (this.data.interaction.onInit) {
    const container = document.getElementById('core-interactive-area')
    this.data.interaction.onInit(container, this)
  }
})
```

### Quiz (확인)

```javascript
createScene('quiz', (scene) => {
  scene.innerHTML = `
    <h2 class="scene-title">퀴즈!</h2>
    <div class="scene-text" id="quiz-question"></div>
    <div class="quiz-container" id="quiz-options"></div>
  `
}, () => {
  this.startQuiz()
})
```

### Wrap (정리)

```javascript
createScene('wrap', (scene) => {
  scene.innerHTML = `
    <h1 class="scene-title">완료!</h1>
    <div class="wrap-summary">
      <p class="scene-text">오늘 배운 내용</p>
      <h3>${this.data.title}</h3>
    </div>
    <div style="display:flex; gap: 20px;">
      <button class="btn btn-secondary-large" onclick="location.reload()">
        다시하기
      </button>
      <button class="btn btn-primary-large"
              onclick="window.parent.postMessage('close', '*')">
        홈으로
      </button>
    </div>
  `
})
```

---

## 헬퍼 메서드

### switchScene(sceneId)

씬 전환

```javascript
switchScene(sceneId) {
  // 현재 씬 숨기기
  if (this.currentSceneId) {
    this.scenes.get(this.currentSceneId).hide()
  }

  // 새 씬 표시
  if (this.scenes.has(sceneId)) {
    this.currentSceneId = sceneId
    this.scenes.get(sceneId).show()
  } else {
    console.error(`Scene ${sceneId} does not exist`)
  }
}
```

### nextScene()

다음 씬으로 이동

```javascript
nextScene() {
  const order = ['hook', 'story', 'core', 'quiz', 'wrap']
  const currentIndex = order.indexOf(this.currentSceneId)

  if (currentIndex < order.length - 1) {
    this.switchScene(order[currentIndex + 1])
  }
}
```

### showFeedback(msg, type)

피드백 표시

```javascript
showFeedback(msg, type = 'neutral') {
  const el = document.getElementById('core-feedback')
  if (el) {
    el.innerHTML = msg
    el.className = `scene-text feedback-${type}`
  }
}

// 타입: 'positive' (녹색), 'negative' (빨간색), 'neutral' (기본)
```

### enableNext()

다음 버튼 활성화

```javascript
enableNext() {
  const btn = document.getElementById('core-next-btn')
  if (btn) {
    btn.style.display = 'inline-block'
    btn.classList.add('animate-fade-in')
  }
}
```

### 퀴즈 로직

```javascript
startQuiz() {
  const q = this.data.quiz[0]
  document.getElementById('quiz-question').textContent = q.question

  const optsContainer = document.getElementById('quiz-options')
  optsContainer.innerHTML = ''

  q.options.forEach((opt, idx) => {
    const btn = document.createElement('div')
    btn.className = 'quiz-option'
    btn.textContent = opt
    btn.onclick = () => this.checkQuiz(idx, q.answer, btn)
    optsContainer.appendChild(btn)
  })
}

checkQuiz(selectedIdx, correctIdx, btnElement) {
  const opts = document.querySelectorAll('.quiz-option')
  opts.forEach(o => o.style.pointerEvents = 'none') // 잠금

  if (selectedIdx === correctIdx) {
    btnElement.classList.add('correct')
    this.showFeedback("정답입니다!", 'positive')
    setTimeout(() => this.nextScene(), 1500)
  } else {
    btnElement.classList.add('incorrect')
    opts[correctIdx].classList.add('correct')
    setTimeout(() => this.nextScene(), 2000)
  }
}
```

---

## HTML 이스케이프

보안을 위한 HTML 이스케이프

```javascript
escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
```

---

## 캐릭터 마크업

이미지/이모지 캐릭터 렌더링

```javascript
getCharacterMarkup(character) {
  if (!character || !character.image) {
    return '<div class="story-character-emoji">🏃</div>'
  }

  const imageValue = String(character.image)

  // 이미지 경로 확인
  if (this.isImagePath(imageValue)) {
    const altText = character.alt ? this.escapeHtml(character.alt) : '캐릭터'
    return `<img class="story-character-image"
                 src="${this.escapeHtml(imageValue)}"
                 alt="${altText}" />`
  }

  // 이모지
  return `<div class="story-character-emoji">${this.escapeHtml(imageValue)}</div>`
}

isImagePath(value) {
  return /^(?:\.{0,2}\/|assets\/|https?:\/\/|data:image\/)/i.test(value) ||
         /\.(svg|png|jpe?g|gif|webp|avif)$/i.test(value)
}
```

---

## 부모 창 통신

```javascript
// 콘텐츠에서 홈으로 돌아가기
window.parent.postMessage('close', '*')

// ContentView.vue에서 수신
window.addEventListener('message', (e) => {
  if (e.data === 'close') {
    router.push('/')
  }
})
```

---

## 다음 단계

- [AI 생성 시스템](./ai-generation.md)
- [콘텐츠 매니페스트](./content-manifest.md)
- [스타일링 가이드](./styling-guide.md)
