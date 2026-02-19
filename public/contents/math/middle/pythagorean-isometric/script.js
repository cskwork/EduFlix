/* ------------------------------------------------------------------
   피타고라스 탐험 3D - Phaser 기반 아이소메트릭 수학 콘텐츠
   중학교 2학년 | 직각삼각형의 세 변 관계를 의사 3D로 발견
   ------------------------------------------------------------------ */

// -- 수학 모델 (렌더링과 분리) --
const MathModel = {
  calc(a, b) {
    const a2 = a * a;
    const b2 = b * b;
    const c2 = a2 + b2;
    const c = Math.sqrt(c2);
    return { a, b, c, a2, b2, c2 };
  }
};

// -- 아이소메트릭 변환 유틸 --
const Iso = {
  ANGLE: Math.PI / 6,
  toScreen(x, y, z) {
    const sx = (x - y) * Math.cos(this.ANGLE);
    const sy = (x + y) * Math.sin(this.ANGLE) - z;
    return { x: sx, y: sy };
  }
};

// -- 앱 전역 상태 --
const APP = {
  sceneOrder: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],
  currentScene: 0,
  sides: { a: 3, b: 4 },
  quiz: {
    pool: [
      { a: 3, b: 4, ans: 5, type: 'c' },
      { a: 5, b: 12, ans: 169, type: 'c2' },
      { a: 8, b: 15, ans: 17, type: 'c' },
      { a: 6, b: 8, ans: 100, type: 'c2' },
      { a: 9, b: 12, ans: 15, type: 'c' }
    ],
    current: null,
    index: 0,
    score: 0,
    total: 0
  },
  phaser: null,
  bound: false
};

// -- Phaser 아이소메트릭 3D 씬 --
class Pythagorean3DScene extends Phaser.Scene {
  constructor() {
    super('Pythagorean3DScene');
    this.mainLayer = null;
    this.particleLayer = null;
    this.labelLayer = null;
  }

  create() {
    this.drawBackground();
    this.createParticles();
    this.mainLayer = this.add.container(0, 0);
    this.labelLayer = this.add.container(0, 0);
    this.drawIsometric(APP.sides.a, APP.sides.b);
  }

  // 우주 격자 배경
  drawBackground() {
    const g = this.add.graphics();
    g.fillStyle(0x060e1a, 1);
    g.fillRect(0, 0, 1280, 720);

    // 원근 격자선 (아래로 갈수록 조밀)
    g.lineStyle(1, 0x1a3a5c, 0.3);
    for (let i = 0; i <= 32; i++) {
      const x = i * 40;
      g.moveTo(x, 0);
      g.lineTo(x, 720);
    }
    for (let i = 0; i <= 18; i++) {
      const y = i * 40;
      const fade = 0.15 + (i / 18) * 0.25;
      g.lineStyle(1, 0x1a3a5c, fade);
      g.moveTo(0, y);
      g.lineTo(1280, y);
    }
    g.strokePath();

    // 아이소메트릭 바닥 격자
    const floor = this.add.graphics();
    floor.lineStyle(1, 0x2dd4bf, 0.12);
    const cx = 800;
    const cy = 480;
    for (let i = -8; i <= 8; i++) {
      const s1 = Iso.toScreen(i * 30, -240, 0);
      const e1 = Iso.toScreen(i * 30, 240, 0);
      floor.lineBetween(cx + s1.x, cy + s1.y, cx + e1.x, cy + e1.y);

      const s2 = Iso.toScreen(-240, i * 30, 0);
      const e2 = Iso.toScreen(240, i * 30, 0);
      floor.lineBetween(cx + s2.x, cy + s2.y, cx + e2.x, cy + e2.y);
    }
    floor.strokePath();
  }

  // 배경 파티클 (반짝이는 별)
  createParticles() {
    this.particleLayer = this.add.container(0, 0);
    const colors = [0x67e8f9, 0xfde68a, 0xf9a8d4, 0xa78bfa, 0x86efac];

    for (let i = 0; i < 35; i++) {
      const px = Phaser.Math.Between(50, 1230);
      const py = Phaser.Math.Between(30, 690);
      const r = Phaser.Math.Between(1, 3);
      const color = Phaser.Utils.Array.GetRandom(colors);
      const dot = this.add.circle(px, py, r, color, 0.6);

      this.tweens.add({
        targets: dot,
        alpha: { from: 0.1, to: 0.8 },
        scale: { from: 0.6, to: 1.3 },
        duration: Phaser.Math.Between(1400, 3000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 1500)
      });

      this.particleLayer.add(dot);
    }
  }

  // 아이소메트릭 3D 블록 그리기
  drawIsoBlock(g, cx, cy, w, h, d, fillTop, fillLeft, fillRight, alpha) {
    alpha = alpha || 1;
    const hw = w / 2;
    const hh = h / 2;

    // 8개 꼭짓점 (아이소메트릭 투영)
    const ftl = Iso.toScreen(-hw, -hh, d);
    const ftr = Iso.toScreen(hw, -hh, d);
    const fbr = Iso.toScreen(hw, hh, d);
    const fbl = Iso.toScreen(-hw, hh, d);
    const btl = Iso.toScreen(-hw, -hh, 0);
    const btr = Iso.toScreen(hw, -hh, 0);
    const bbr = Iso.toScreen(hw, hh, 0);
    const bbl = Iso.toScreen(-hw, hh, 0);

    // 윗면
    g.fillStyle(fillTop, 0.7 * alpha);
    g.beginPath();
    g.moveTo(cx + ftl.x, cy + ftl.y);
    g.lineTo(cx + ftr.x, cy + ftr.y);
    g.lineTo(cx + fbr.x, cy + fbr.y);
    g.lineTo(cx + fbl.x, cy + fbl.y);
    g.closePath();
    g.fillPath();

    // 왼쪽면
    g.fillStyle(fillLeft, 0.5 * alpha);
    g.beginPath();
    g.moveTo(cx + fbl.x, cy + fbl.y);
    g.lineTo(cx + fbr.x, cy + fbr.y);
    g.lineTo(cx + bbr.x, cy + bbr.y);
    g.lineTo(cx + bbl.x, cy + bbl.y);
    g.closePath();
    g.fillPath();

    // 오른쪽면
    g.fillStyle(fillRight, 0.4 * alpha);
    g.beginPath();
    g.moveTo(cx + fbr.x, cy + fbr.y);
    g.lineTo(cx + ftr.x, cy + ftr.y);
    g.lineTo(cx + btr.x, cy + btr.y);
    g.lineTo(cx + bbr.x, cy + bbr.y);
    g.closePath();
    g.fillPath();

    // 외곽선
    g.lineStyle(1.5, 0xffffff, 0.15 * alpha);
    g.beginPath();
    g.moveTo(cx + ftl.x, cy + ftl.y);
    g.lineTo(cx + ftr.x, cy + ftr.y);
    g.lineTo(cx + fbr.x, cy + fbr.y);
    g.lineTo(cx + fbl.x, cy + fbl.y);
    g.closePath();
    g.strokePath();

    g.beginPath();
    g.moveTo(cx + fbl.x, cy + fbl.y);
    g.lineTo(cx + bbl.x, cy + bbl.y);
    g.lineTo(cx + bbr.x, cy + bbr.y);
    g.lineTo(cx + fbr.x, cy + fbr.y);
    g.strokePath();

    g.beginPath();
    g.moveTo(cx + fbr.x, cy + fbr.y);
    g.lineTo(cx + btr.x, cy + btr.y);
    g.strokePath();
  }

  // 아이소메트릭 삼각형 바닥 그리기
  drawIsoTriangle(g, cx, cy, a, b, scale) {
    const pxA = a * scale;
    const pxB = b * scale;

    const p0 = Iso.toScreen(0, 0, 0);
    const p1 = Iso.toScreen(pxA, 0, 0);
    const p2 = Iso.toScreen(pxA, pxB, 0);

    g.fillStyle(0x38bdf8, 0.2);
    g.lineStyle(3, 0x67e8f9, 0.9);
    g.beginPath();
    g.moveTo(cx + p0.x, cy + p0.y);
    g.lineTo(cx + p1.x, cy + p1.y);
    g.lineTo(cx + p2.x, cy + p2.y);
    g.closePath();
    g.fillPath();
    g.strokePath();

    // 직각 표시
    const markSize = 12;
    const m1 = Iso.toScreen(pxA - markSize, 0, 0);
    const m2 = Iso.toScreen(pxA - markSize, markSize, 0);
    const m3 = Iso.toScreen(pxA, markSize, 0);
    g.lineStyle(2, 0xfef08a, 0.8);
    g.beginPath();
    g.moveTo(cx + m1.x, cy + m1.y);
    g.lineTo(cx + m2.x, cy + m2.y);
    g.lineTo(cx + m3.x, cy + m3.y);
    g.strokePath();
  }

  drawIsometric(a, b) {
    this.mainLayer.removeAll(true);
    this.labelLayer.removeAll(true);

    const m = MathModel.calc(a, b);
    const scale = 18;
    const cx = 800;
    const cy = 420;
    const blockHeight = 28;

    const g = this.add.graphics();

    // 삼각형 바닥
    this.drawIsoTriangle(g, cx, cy, a, b, scale);

    // a² 블록 (초록)
    const sqASize = a * scale;
    const aPos = Iso.toScreen(sqASize / 2, -sqASize / 2, 0);
    this.drawIsoBlock(g, cx + aPos.x, cy + aPos.y,
      sqASize, sqASize, blockHeight,
      0x22c55e, 0x16a34a, 0x15803d, 1);

    // b² 블록 (주황)
    const sqBSize = b * scale;
    const bPos = Iso.toScreen(a * scale + sqBSize / 2, sqBSize / 2, 0);
    this.drawIsoBlock(g, cx + bPos.x, cy + bPos.y,
      sqBSize, sqBSize, blockHeight,
      0xf59e0b, 0xd97706, 0xb45309, 1);

    // c² 블록 (빨강) - 별도 위치에 표시
    var sqCSize = m.c * scale;
    if (sqCSize > 220) sqCSize = 220;
    var cOffX = -280;
    var cOffY = 80;
    var cP = Iso.toScreen(cOffX, cOffY, 0);
    this.drawIsoBlock(g, cx + cP.x, cy + cP.y,
      sqCSize, sqCSize, blockHeight,
      0xef4444, 0xdc2626, 0xb91c1c, 1);

    this.mainLayer.add(g);

    // 라벨
    var font = { fontFamily: 'Noto Sans KR', fontSize: '18px', fontStyle: 'bold' };

    var aLabel = this.add.text(cx + aPos.x, cy + aPos.y - blockHeight - 10,
      `a² = ${m.a2}`, Object.assign({}, font, { color: '#bbf7d0' })).setOrigin(0.5);

    var bLabel = this.add.text(cx + bPos.x, cy + bPos.y - blockHeight - 10,
      `b² = ${m.b2}`, Object.assign({}, font, { color: '#fde68a' })).setOrigin(0.5);

    var cLabel = this.add.text(cx + cP.x, cy + cP.y - blockHeight - 10,
      `c² = ${m.c2}`, Object.assign({}, font, { color: '#fecaca' })).setOrigin(0.5);

    // 변 라벨
    var midA = Iso.toScreen(a * scale / 2, 10, 0);
    var sideALabel = this.add.text(cx + midA.x, cy + midA.y + 10,
      `a=${a}`, { fontFamily: 'Noto Sans KR', fontSize: '16px', color: '#86efac' }).setOrigin(0.5);

    var midB = Iso.toScreen(a * scale + 10, b * scale / 2, 0);
    var sideBLabel = this.add.text(cx + midB.x + 10, cy + midB.y,
      `b=${b}`, { fontFamily: 'Noto Sans KR', fontSize: '16px', color: '#fcd34d' }).setOrigin(0.5);

    var midC = Iso.toScreen(a * scale / 2, b * scale / 2, 0);
    var sideCLabel = this.add.text(cx + midC.x - 15, cy + midC.y - 10,
      `c=${m.c.toFixed(1)}`, { fontFamily: 'Noto Sans KR', fontSize: '16px', color: '#fca5a5', fontStyle: 'bold' }).setOrigin(0.5);

    // 수식 표시
    var formulaText = this.add.text(cx - 340, 80,
      `a² + b² = ${m.a2} + ${m.b2} = ${m.c2}\nc² = ${m.c.toFixed(2)}² = ${m.c2}`,
      { fontFamily: 'Noto Sans KR', fontSize: '20px', color: '#e0f2fe',
        lineSpacing: 8, fontStyle: 'bold' });

    // 등호 아이콘
    var eqBadge = this.add.text(cx - 340, 150,
      m.a2 + m.b2 === m.c2 ? 'a² + b² = c²' : `a² + b² = c²`,
      { fontFamily: 'Noto Sans KR', fontSize: '22px', color: '#fde047',
        fontStyle: 'bold', backgroundColor: 'rgba(253,224,71,0.15)',
        padding: { x: 12, y: 6 } });

    this.labelLayer.add([aLabel, bLabel, cLabel, sideALabel, sideBLabel, sideCLabel, formulaText, eqBadge]);

    // 등장 애니메이션
    [aLabel, bLabel, cLabel].forEach(function(label, i) {
      label.setAlpha(0);
      label.setScale(0.5);
      this.tweens.add({
        targets: label,
        alpha: 1,
        scale: 1,
        duration: 500,
        delay: 200 + i * 150,
        ease: 'Back.easeOut'
      });
    }.bind(this));
  }

  // 아하 모먼트 파티클 이펙트
  playAhaEffect(x, y) {
    var colors = [0x22c55e, 0xf59e0b, 0xef4444, 0x67e8f9, 0xfde047];
    for (var i = 0; i < 20; i++) {
      var px = x + Phaser.Math.Between(-60, 60);
      var py = y + Phaser.Math.Between(-60, 60);
      var dot = this.add.circle(x, y, Phaser.Math.Between(2, 5),
        Phaser.Utils.Array.GetRandom(colors), 1);
      this.tweens.add({
        targets: dot,
        x: px,
        y: py,
        alpha: 0,
        scale: { from: 1, to: 0.1 },
        duration: Phaser.Math.Between(600, 1200),
        ease: 'Cubic.easeOut',
        onComplete: function() { dot.destroy(); }
      });
    }
  }

  refreshBySides(a, b) {
    this.drawIsometric(a, b);
  }
}

// -- Phaser 초기화 --
function mountPhaser() {
  var config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'phaser-container',
    backgroundColor: '#060e1a',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [Pythagorean3DScene]
  };
  APP.phaser = new Phaser.Game(config);
}

// -- DOM 유틸 --
function sceneElement(name) {
  return document.getElementById(name + '-scene');
}

function updateNav() {
  var idx = APP.currentScene;
  document.getElementById('prev-btn').disabled = idx === 0;
  document.getElementById('next-btn').disabled = idx === APP.sceneOrder.length - 1;
  document.getElementById('progress-text').textContent = (idx + 1) + ' / ' + APP.sceneOrder.length;
}

// -- Visualize 씬 동적 업데이트 --
function updateVisualSummary() {
  var m = MathModel.calc(APP.sides.a, APP.sides.b);
  document.getElementById('formula-view').textContent = m.a + '² + ' + m.b + '² = ' + m.c2;
  document.getElementById('visual-steps').innerHTML = [
    '<p>좌변: a² + b² = ' + m.a2 + ' + ' + m.b2 + ' = ' + m.c2 + '</p>',
    '<p>우변: c = √' + m.c2 + ' ≈ ' + m.c.toFixed(2) + ', c² = ' + m.c2 + '</p>',
    '<p>결론: 어떤 직각삼각형이든 두 값은 항상 같다</p>'
  ].join('');
}

// -- 씬 전환 --
function applyScene(index) {
  APP.currentScene = Math.max(0, Math.min(index, APP.sceneOrder.length - 1));

  APP.sceneOrder.forEach(function(name, idx) {
    var el = sceneElement(name);
    if (!el) return;
    if (idx === APP.currentScene) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  var currentName = APP.sceneOrder[APP.currentScene];

  if (currentName === 'visualize') {
    updateVisualSummary();
  }

  if (currentName === 'story') {
    typeStoryText();
  }

  updateNav();
}

// -- 스토리 타자 효과 --
function typeStoryText() {
  var el = document.getElementById('story-text');
  var fullText = '미래 도시의 건축가 피타는 직각 경사로를 설계합니다. 밑변과 높이는 정했지만, 경사면의 정확한 길이를 알아야 안전 기준을 통과할 수 있습니다. 3D 블록으로 면적 관계를 확인해 볼까요?';
  el.textContent = '';
  var i = 0;
  var timer = setInterval(function() {
    if (i < fullText.length) {
      el.textContent += fullText[i];
      i++;
    } else {
      clearInterval(timer);
    }
  }, 25);
}

// -- Core 슬라이더 --
function setupCoreControls() {
  var sideA = document.getElementById('side-a');
  var sideB = document.getElementById('side-b');

  var onChange = function() {
    var a = Number(sideA.value);
    var b = Number(sideB.value);

    // 범위 검증
    a = Math.max(2, Math.min(12, a));
    b = Math.max(2, Math.min(12, b));

    APP.sides.a = a;
    APP.sides.b = b;

    var m = MathModel.calc(a, b);

    document.getElementById('side-a-value').textContent = String(a);
    document.getElementById('side-b-value').textContent = String(b);
    document.getElementById('left-value').textContent = String(m.c2);
    document.getElementById('right-value').textContent = String(m.c2);
    document.getElementById('core-insight').textContent = '두 값이 항상 같습니다!';
    document.getElementById('core-detail').textContent = 'c = ' + m.c.toFixed(2) + ' | a²=' + m.a2 + ', b²=' + m.b2;

    // 등호 배지 애니메이션
    var eq = document.getElementById('eq-badge');
    eq.classList.add('match');
    setTimeout(function() { eq.classList.remove('match'); }, 600);

    // Phaser 씬 업데이트
    if (APP.phaser && APP.phaser.scene) {
      var pScene = APP.phaser.scene.keys.Pythagorean3DScene;
      if (pScene) {
        pScene.refreshBySides(a, b);
        pScene.playAhaEffect(800, 420);
      }
    }
  };

  sideA.addEventListener('input', onChange);
  sideB.addEventListener('input', onChange);
}

// -- 퀴즈 시스템 --
function nextQuizQuestion() {
  var pool = APP.quiz.pool;
  APP.quiz.index = (APP.quiz.index + 1) % pool.length;
  APP.quiz.current = pool[APP.quiz.index];
  var q = APP.quiz.current;

  var questionText;
  if (q.type === 'c2') {
    questionText = 'a=' + q.a + ', b=' + q.b + '일 때 c²의 값은?';
  } else {
    questionText = 'a=' + q.a + ', b=' + q.b + '일 때 c의 값은?';
  }

  document.getElementById('quiz-question').textContent = questionText;
  document.getElementById('quiz-input').value = '';
  document.getElementById('quiz-feedback').textContent = '정답을 입력하세요.';
  document.getElementById('quiz-feedback').style.color = '#fde68a';

  if (q.type === 'c2') {
    document.getElementById('quiz-explain').textContent = '힌트: ' + q.a + '² + ' + q.b + '²를 계산하세요.';
  } else {
    document.getElementById('quiz-explain').textContent = '힌트: c = √(a² + b²)를 계산하세요.';
  }
}

function setupQuiz() {
  var input = document.getElementById('quiz-input');
  var check = document.getElementById('quiz-check');
  var next = document.getElementById('quiz-next');

  check.addEventListener('click', function() {
    var q = APP.quiz.current;
    if (!q) return;

    var value = Number(input.value);
    var feedback = document.getElementById('quiz-feedback');

    if (!Number.isFinite(value) || input.value.trim() === '') {
      feedback.textContent = '숫자를 입력하세요.';
      feedback.style.color = '#fca5a5';
      return;
    }

    APP.quiz.total++;
    var expected = q.ans;

    if (value === expected) {
      APP.quiz.score++;
      feedback.textContent = '정답입니다! ' + (q.type === 'c2' ? 'c² = ' + expected : 'c = ' + expected);
      feedback.style.color = '#86efac';

      // 아하 이펙트
      if (APP.phaser && APP.phaser.scene) {
        var pScene = APP.phaser.scene.keys.Pythagorean3DScene;
        if (pScene) pScene.playAhaEffect(640, 360);
      }
    } else {
      feedback.textContent = '오답입니다. 정답: ' + expected;
      feedback.style.color = '#fca5a5';

      var m = MathModel.calc(q.a, q.b);
      if (q.type === 'c2') {
        document.getElementById('quiz-explain').textContent =
          '풀이: ' + q.a + '² + ' + q.b + '² = ' + m.a2 + ' + ' + m.b2 + ' = ' + m.c2;
      } else {
        document.getElementById('quiz-explain').textContent =
          '풀이: √(' + m.a2 + ' + ' + m.b2 + ') = √' + m.c2 + ' = ' + m.c.toFixed(0);
      }
    }

    document.getElementById('quiz-score').textContent = '점수: ' + APP.quiz.score + ' / ' + APP.quiz.total;
  });

  next.addEventListener('click', nextQuizQuestion);

  // 첫 문제 설정
  APP.quiz.index = -1;
  nextQuizQuestion();
}

// -- 네비게이션 --
function setupNav() {
  document.getElementById('prev-btn').addEventListener('click', function() {
    applyScene(APP.currentScene - 1);
  });
  document.getElementById('next-btn').addEventListener('click', function() {
    applyScene(APP.currentScene + 1);
  });

  var nextBtns = document.querySelectorAll('[data-next]');
  for (var i = 0; i < nextBtns.length; i++) {
    nextBtns[i].addEventListener('click', function() {
      applyScene(APP.currentScene + 1);
    });
  }

  document.getElementById('restart-btn').addEventListener('click', function() {
    APP.quiz.score = 0;
    APP.quiz.total = 0;
    document.getElementById('quiz-score').textContent = '점수: 0 / 0';
    applyScene(0);
  });
}

// -- 앱 초기화 --
function initApp() {
  if (APP.bound) return;
  APP.bound = true;

  mountPhaser();
  setupNav();
  setupCoreControls();
  setupQuiz();
  applyScene(0);
}

document.addEventListener('DOMContentLoaded', initApp);
