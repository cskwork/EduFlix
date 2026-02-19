/**
 * WORLD QUIZ BATTLE - 세계 상식 대전
 * 순수 JavaScript (프레임워크 불필요)
 */

// ──────────────────────────────────────────
// 이미지 소스
// ──────────────────────────────────────────
const IMG_SOURCES = {
  bg: 'https://i.imgur.com/2LLsNyo.jpg',
  intro_tanjiro: 'https://i.imgur.com/f5A8RgG.png',
  intro_gojo: 'https://i.imgur.com/0hYV1Mj.png',
  tanjiro_idle: 'https://i.imgur.com/2BK6plS.png',
  tanjiro_attack: 'https://i.imgur.com/XXGcNf3.png',
  gojo_idle: 'https://i.imgur.com/UGQiUKz.png',
  gojo_attack: 'https://i.imgur.com/8d3vKmP.png',
  effect_water: 'https://i.imgur.com/5jmRU4b.png',
  effect_red: 'https://i.imgur.com/WrnKcsb.png'
};

// ──────────────────────────────────────────
// 퀴즈 데이터 (20문제 중 10문제 랜덤 출제)
// ──────────────────────────────────────────
const FULL_QUIZ_LIST = [
  { q: '프랑스의 수도는 어디일까요?', a: ['런던', '파리', '베를린', '로마'], c: 1 },
  { q: "'자유의 여신상'이 있는 나라는?", a: ['미국', '캐나다', '영국', '호주'], c: 0 },
  { q: '세계에서 영토가 가장 넓은 나라는?', a: ['중국', '미국', '러시아', '캐나다'], c: 2 },
  { q: '피자와 파스타의 본고장은?', a: ['스페인', '이탈리아', '그리스', '프랑스'], c: 1 },
  { q: '캥거루와 코알라가 사는 나라는?', a: ['뉴질랜드', '오스트리아', '오스트레일리아', '브라질'], c: 2 },
  { q: '피라미드와 스핑크스가 있는 나라는?', a: ['이집트', '멕시코', '인도', '사우디아라비아'], c: 0 },
  { q: '단풍잎(메이플)이 국기에 그려진 나라는?', a: ['미국', '스위스', '캐나다', '일본'], c: 2 },
  { q: '축구와 삼바 춤으로 유명한 남미 국가는?', a: ['아르헨티나', '칠레', '브라질', '우루과이'], c: 2 },
  { q: '만리장성이 있는 나라는?', a: ['몽골', '중국', '베트남', '태국'], c: 1 },
  { q: '타지마할이 있는 나라는?', a: ['인도네시아', '인도', '파키스탄', '터키'], c: 1 },
  { q: '신들의 나라, 아테네가 수도인 곳은?', a: ['이탈리아', '그리스', '포르투갈', '이집트'], c: 1 },
  { q: '베트남의 대표적인 국수 요리는?', a: ['팟타이', '쌀국수(퍼)', '라멘', '우동'], c: 1 },
  { q: '투우(소싸움)와 플라멩코의 나라는?', a: ['멕시코', '스페인', '포르투갈', '이탈리아'], c: 1 },
  { q: '영국의 랜드마크가 아닌 것은?', a: ['빅벤', '타워브리지', '버킹엄 궁전', '콜로세움'], c: 3 },
  { q: "'해가 지지 않는 나라'로 불렸던 곳은?", a: ['영국', '일본', '미국', '몽골'], c: 0 },
  { q: '초밥(스시)의 나라는?', a: ['중국', '대만', '일본', '한국'], c: 2 },
  { q: '세계에서 인구가 가장 많은 나라는?(2023년 기준)', a: ['중국', '인도', '미국', '인도네시아'], c: 1 },
  { q: '알프스 산맥과 시계, 초콜릿으로 유명한 나라는?', a: ['스위스', '스웨덴', '벨기에', '네덜란드'], c: 0 },
  { q: '튤립과 풍차의 나라는?', a: ['덴마크', '네덜란드', '독일', '핀란드'], c: 1 },
  { q: 'BTS와 김치의 나라는?', a: ['대한민국', '북한', '일본', '중국'], c: 0 }
];

const COLORS = {
  tanjiro: '#00ff88',
  gojo: '#a29bfe'
};

// ──────────────────────────────────────────
// SVG 아이콘 (lucide-react 대체)
// ──────────────────────────────────────────
const SVG_ZAP = '<svg class="icon-zap" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
const SVG_SKULL = '<svg class="icon-skull" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 20v2h8v-2"/><path d="m12.5 17-.5-1-.5 1h1z"/><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"/></svg>';

// ──────────────────────────────────────────
// 사운드 매니저 (Web Audio API)
// ──────────────────────────────────────────
class SoundManager {
  constructor() {
    this.ctx = null;
    this.bgmTimer = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      } catch (e) {
        console.warn('AudioContext 사용 불가:', e);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  playTone(freq, duration, type, vol) {
    if (!this.ctx || this.muted) return;
    type = type || 'sine';
    vol = vol || 0.1;
    var o = this.ctx.createOscillator();
    var g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, this.ctx.currentTime);
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start();
    o.stop(this.ctx.currentTime + duration);
  }

  playNoise(duration, vol) {
    if (!this.ctx || this.muted) return;
    vol = vol || 0.2;
    var bufferSize = this.ctx.sampleRate * duration;
    var buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    var noise = this.ctx.createBufferSource();
    var gain = this.ctx.createGain();
    var filter = this.ctx.createBiquadFilter();
    noise.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.value = 1000;
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }

  playTheme(char) {
    this.playTone(char === 'Tanjiro' ? 392 : 150, 0.3, char === 'Tanjiro' ? 'square' : 'sawtooth', 0.1);
  }

  startBattleBgm() {
    if (!this.ctx) return;
    this.stopBattleBgm();
    var self = this;
    var beat = 0;
    this.bgmTimer = setInterval(function() {
      if (self.muted) return;
      if (beat % 4 === 0) self.playTone(60, 0.1, 'square', 0.2);
      if (beat % 2 === 0) self.playNoise(0.05, 0.05);
      if (beat % 8 === 0) self.playTone(40, 0.2, 'sawtooth', 0.1);
      if (beat % 8 === 4) self.playTone(45, 0.2, 'sawtooth', 0.1);
      beat++;
    }, 125);
  }

  stopBattleBgm() {
    if (this.bgmTimer) { clearInterval(this.bgmTimer); this.bgmTimer = null; }
  }

  sfxCorrect() {
    this.playTone(523.25, 0.1, 'square', 0.1);
    var self = this;
    setTimeout(function() { self.playTone(659.25, 0.2, 'square', 0.1); }, 100);
  }

  sfxWrong() {
    this.playTone(100, 0.3, 'sawtooth', 0.2);
    var self = this;
    setTimeout(function() { self.playTone(80, 0.3, 'sawtooth', 0.2); }, 150);
  }

  sfxAttack() {
    this.playNoise(0.1, 0.1);
    this.playTone(300, 0.1, 'triangle', 0.05);
  }

  sfxHit() {
    this.playNoise(0.3, 0.4);
    this.playTone(50, 0.2, 'sawtooth', 0.3);
  }
}

var soundMgr = new SoundManager();

// ──────────────────────────────────────────
// 게임 상태
// ──────────────────────────────────────────
var state = {
  gameState: 'START',
  selectedHero: null,
  hp: { p1: 100, p2: 100 },
  damageHp: { p1: 100, p2: 100 },
  timer: 10,
  gameQuizList: [],
  quizIndex: 0,
  currentQuiz: null,
  scoreData: { correct: 0, wrong: 0, combo: 0, maxCombo: 0 },
  isProcessing: false,
  timerInterval: null,
  comboTimeout: null
};

// 캔버스 관련
var images = {};
var canvas, ctx;
var rafId = null;
var gameLogic = {
  p1: null, p2: null,
  particles: [], shockwaves: [],
  shakeIntensity: 0,
  hitStop: 0,
  groundY: 220
};

// ──────────────────────────────────────────
// DOM 참조
// ──────────────────────────────────────────
var $ = function(id) { return document.getElementById(id); };

// ──────────────────────────────────────────
// 유틸리티
// ──────────────────────────────────────────
function wait(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

function shuffleArray(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function showScreen(id) {
  var screens = document.querySelectorAll('.screen');
  screens.forEach(function(s) { s.classList.remove('active'); });
  var el = $(id);
  if (el) el.classList.add('active');
}

// ──────────────────────────────────────────
// 이미지 프리로드
// ──────────────────────────────────────────
function startPreloading() {
  soundMgr.init();
  state.gameState = 'LOADING';
  showScreen('screen-loading');

  var keys = Object.keys(IMG_SOURCES);
  var total = keys.length;
  var loaded = 0;
  var fill = $('loading-bar-fill');

  var promises = keys.map(function(key) {
    return new Promise(function(resolve) {
      var img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = function() {
        images[key] = img;
        loaded++;
        fill.style.width = ((loaded / total) * 100) + '%';
        resolve();
      };
      img.onerror = function() {
        loaded++;
        fill.style.width = ((loaded / total) * 100) + '%';
        resolve();
      };
      img.src = IMG_SOURCES[key];
    });
  });

  Promise.all(promises).then(function() {
    return wait(300);
  }).then(function() {
    // 캐릭터 선택 배경 이미지 설정
    $('select-bg-tanjiro').style.backgroundImage = 'url(' + IMG_SOURCES.intro_tanjiro + ')';
    $('select-bg-gojo').style.backgroundImage = 'url(' + IMG_SOURCES.intro_gojo + ')';
    state.gameState = 'SELECT';
    showScreen('screen-select');
  });
}

// ──────────────────────────────────────────
// 게임 초기화
// ──────────────────────────────────────────
function initializeGameData() {
  var shuffled = shuffleArray(FULL_QUIZ_LIST);
  // 10문제 추출 후 옵션 순서 셔플 (정답 위치 고정 방지)
  state.gameQuizList = shuffled.slice(0, 10).map(function(q) {
    var indices = shuffleArray([0, 1, 2, 3]);
    return {
      q: q.q,
      a: indices.map(function(i) { return q.a[i]; }),
      c: indices.indexOf(q.c)
    };
  });
  state.quizIndex = 0;
  state.currentQuiz = state.gameQuizList[0];
  state.hp = { p1: 100, p2: 100 };
  state.damageHp = { p1: 100, p2: 100 };
  state.scoreData = { correct: 0, wrong: 0, combo: 0, maxCombo: 0 };
  state.timer = 10000;
  state.isProcessing = false;
}

// ──────────────────────────────────────────
// 캐릭터 선택 및 게임 시작
// ──────────────────────────────────────────
function selectCharacter(hero) {
  state.selectedHero = hero;
  soundMgr.startBattleBgm();
  initializeGameData();

  // 파이터 생성
  if (hero === 'Tanjiro') {
    gameLogic.p1 = createFighter({ x: 200, y: gameLogic.groundY }, 'Tanjiro', COLORS.tanjiro, 1);
    gameLogic.p2 = createFighter({ x: 750, y: gameLogic.groundY }, 'Gojo', COLORS.gojo, -1);
  } else {
    gameLogic.p1 = createFighter({ x: 200, y: gameLogic.groundY }, 'Gojo', COLORS.gojo, 1);
    gameLogic.p2 = createFighter({ x: 750, y: gameLogic.groundY }, 'Tanjiro', COLORS.tanjiro, -1);
  }

  // VS 화면 표시 후 배틀 시작
  state.gameState = 'VS';
  showScreen('screen-vs');

  setTimeout(function() {
    state.gameState = 'BATTLE';
    showScreen('screen-battle');
    updateBattleUI();
    renderQuiz();
    startTimer();
  }, 2000);
}

// ──────────────────────────────────────────
// 배틀 UI 업데이트
// ──────────────────────────────────────────
function updateBattleUI() {
  var isTanjiroP1 = state.selectedHero === 'Tanjiro';
  var p1Src = isTanjiroP1 ? IMG_SOURCES.intro_tanjiro : IMG_SOURCES.intro_gojo;
  var p2Src = isTanjiroP1 ? IMG_SOURCES.intro_gojo : IMG_SOURCES.intro_tanjiro;
  var p1Name = isTanjiroP1 ? 'TANJIRO' : 'GOJO';
  var p2Name = isTanjiroP1 ? 'GOJO' : 'TANJIRO';
  var p1Color = isTanjiroP1 ? COLORS.tanjiro : COLORS.gojo;
  var p2Color = isTanjiroP1 ? COLORS.gojo : COLORS.tanjiro;

  // 포트레이트
  $('p1-portrait').src = p1Src;
  $('p2-portrait').src = p2Src;
  $('p1-hp-bg').src = p1Src;
  $('p2-hp-bg').src = p2Src;

  // 이름
  $('p1-name').textContent = p1Name;
  $('p2-name').textContent = p2Name;
  $('p1-name').style.color = p1Color;
  $('p1-name').style.textShadow = '0 0 10px ' + p1Color;
  $('p2-name').style.color = p2Color;
  $('p2-name').style.textShadow = '0 0 10px ' + p2Color;

  // HP 바 색상
  updateHpBars();
}

function updateHpBars() {
  var isTanjiroP1 = state.selectedHero === 'Tanjiro';
  var p1Color = isTanjiroP1 ? COLORS.tanjiro : COLORS.gojo;
  var p2Color = isTanjiroP1 ? COLORS.gojo : COLORS.tanjiro;

  var p1Fill = $('p1-hp-fill');
  var p2Fill = $('p2-hp-fill');
  var p1Damage = $('p1-hp-damage');
  var p2Damage = $('p2-hp-damage');

  p1Fill.style.width = state.hp.p1 + '%';
  p1Fill.style.background = p1Color;
  p1Fill.style.boxShadow = '0 0 20px ' + p1Color;

  p2Fill.style.width = state.hp.p2 + '%';
  p2Fill.style.background = p2Color;
  p2Fill.style.boxShadow = '0 0 20px ' + p2Color;

  p1Damage.style.width = state.damageHp.p1 + '%';
  p2Damage.style.width = state.damageHp.p2 + '%';
}

// ──────────────────────────────────────────
// 퀴즈 렌더링
// ──────────────────────────────────────────
function renderQuiz() {
  var quiz = state.currentQuiz;
  if (!quiz) return;

  $('quiz-round').textContent = 'ROUND ' + (state.quizIndex + 1) + ' / 10';
  $('quiz-question').textContent = quiz.q;
  $('quiz-timer-bar').style.width = '100%';

  var optionsEl = $('quiz-options');
  optionsEl.innerHTML = '';

  quiz.a.forEach(function(option, idx) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quiz-option';
    btn.innerHTML = '<span class="quiz-option-text">' + option + '</span><div class="quiz-option-shine"></div>';
    btn.addEventListener('click', function() { handleAnswer(idx); });
    optionsEl.appendChild(btn);
  });

  // 퀴즈 덱 표시
  $('quiz-deck').classList.remove('hidden');
}

// ──────────────────────────────────────────
// 타이머
// ──────────────────────────────────────────
function startTimer() {
  stopTimer();
  state.timer = 10000; // 밀리초 단위로 정밀도 유지
  $('timer-value').textContent = '10';

  state.timerInterval = setInterval(function() {
    if (state.isProcessing) return;
    state.timer -= 100;
    if (state.timer <= 0) {
      state.timer = 0;
      handleAnswer(-1); // 시간 초과
    }
    $('timer-value').textContent = Math.ceil(state.timer / 1000);
    $('quiz-timer-bar').style.width = ((state.timer / 10000) * 100) + '%';
  }, 100);
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

// ──────────────────────────────────────────
// 정답 처리
// ──────────────────────────────────────────
function handleAnswer(selectedIdx) {
  if (state.isProcessing) return;
  state.isProcessing = true;
  stopTimer();

  var quiz = state.currentQuiz;
  var isCorrect = selectedIdx === quiz.c;
  var attacker = isCorrect ? gameLogic.p1 : gameLogic.p2;
  var defender = isCorrect ? gameLogic.p2 : gameLogic.p1;

  // 옵션 피드백
  showOptionFeedback(selectedIdx, isCorrect);

  if (isCorrect) {
    soundMgr.sfxCorrect();
    state.scoreData.correct++;
    state.scoreData.combo++;
    state.scoreData.maxCombo = Math.max(state.scoreData.maxCombo, state.scoreData.combo);
    showCombo(state.scoreData.combo);
  } else {
    soundMgr.sfxWrong();
    state.scoreData.wrong++;
    state.scoreData.combo = 0;
    shakeContainer();
  }

  // 공격 시퀀스 -> 데미지 -> 다음 라운드
  performAttackSequence(attacker, defender).then(function() {
    var damage = 15;
    if (isCorrect) {
      state.hp.p2 = Math.max(0, state.hp.p2 - damage);
    } else {
      state.hp.p1 = Math.max(0, state.hp.p1 - damage);
    }
    updateHpBars();

    // 데미지 HP 지연 업데이트
    setTimeout(function() {
      if (isCorrect) {
        state.damageHp.p2 = state.hp.p2;
      } else {
        state.damageHp.p1 = state.hp.p1;
      }
      updateHpBars();
    }, 600);

    // 게임 종료 체크
    var nextIdx = state.quizIndex + 1;
    var isHpZero = state.hp.p1 <= 0 || state.hp.p2 <= 0;
    var isQuizEnd = nextIdx >= state.gameQuizList.length;

    if (isHpZero || isQuizEnd) {
      wait(1000).then(function() { endGame(); });
    } else {
      wait(500).then(function() {
        state.quizIndex = nextIdx;
        state.currentQuiz = state.gameQuizList[nextIdx];
        state.isProcessing = false;
        renderQuiz();
        startTimer();
      });
    }
  });
}

function showOptionFeedback(selectedIdx, isCorrect) {
  var buttons = $('quiz-options').querySelectorAll('.quiz-option');
  var correctIdx = state.currentQuiz.c;
  buttons.forEach(function(btn, idx) {
    btn.disabled = true;
    if (idx === selectedIdx) {
      if (isCorrect) {
        btn.classList.add('correct');
        var textEl = btn.querySelector('.quiz-option-text');
        textEl.innerHTML = SVG_ZAP + textEl.textContent;
      } else {
        btn.classList.add('wrong');
        var textEl2 = btn.querySelector('.quiz-option-text');
        textEl2.innerHTML = SVG_SKULL + textEl2.textContent;
      }
    } else if (idx === correctIdx && !isCorrect) {
      // 틀렸거나 시간 초과 시 정답 하이라이트
      btn.classList.add('correct');
    } else {
      btn.classList.add('dimmed');
    }
  });
}

function showCombo(count) {
  var el = $('combo-display');
  $('combo-count').textContent = count;
  el.classList.remove('hidden');
  if (state.comboTimeout) clearTimeout(state.comboTimeout);
  state.comboTimeout = setTimeout(function() {
    el.classList.add('hidden');
  }, 1500);
}

function shakeContainer() {
  var container = $('game-container');
  container.classList.add('container-shake');
  setTimeout(function() { container.classList.remove('container-shake'); }, 500);
}

// ──────────────────────────────────────────
// 공격 시퀀스 (캔버스 애니메이션)
// ──────────────────────────────────────────
function performAttackSequence(attacker, defender) {
  return new Promise(function(resolve) {
    attacker.state = 'DASH';
    soundMgr.sfxAttack();
    var targetX = defender.pos.x - (250 * attacker.facing);
    var startX = attacker.startPos.x;
    var dashStep = 0;

    function dashForward() {
      if (dashStep < 10) {
        attacker.pos.x += (targetX - startX) / 10;
        dashStep++;
        setTimeout(dashForward, 16);
      } else {
        // 공격
        attacker.state = 'ATTACK';
        gameLogic.shakeIntensity = 20;
        gameLogic.hitStop = 8;
        soundMgr.sfxHit();

        var hitColor = attacker.name === 'Tanjiro' ? '#3498db' : '#ff3333';
        addExplosion(defender.pos.x + 60, defender.pos.y + 100, hitColor);
        defender.state = 'HIT';

        // 히트 플래시
        $('hit-flash').classList.add('active');
        setTimeout(function() { $('hit-flash').classList.remove('active'); }, 200);

        setTimeout(function() {
          // 복귀
          attacker.state = 'DASH';
          defender.state = 'IDLE';
          var returnStep = 0;
          function returnBack() {
            if (returnStep < 15) {
              attacker.pos.x += (startX - attacker.pos.x) * 0.2;
              returnStep++;
              setTimeout(returnBack, 16);
            } else {
              attacker.pos.x = startX;
              attacker.state = 'IDLE';
              resolve();
            }
          }
          returnBack();
        }, 400);
      }
    }
    dashForward();
  });
}

// ──────────────────────────────────────────
// 게임 종료
// ──────────────────────────────────────────
function endGame() {
  soundMgr.stopBattleBgm();
  stopTimer();

  var finalHp = state.hp;
  var isAlive = finalHp.p1 > 0;
  var isEnemyDead = finalHp.p2 <= 0;
  var isScoreWin = finalHp.p1 > finalHp.p2;
  var winState = isAlive && (isEnemyDead || isScoreWin);

  var score = (state.scoreData.correct * 100) - (state.scoreData.wrong * 50) + (state.scoreData.maxCombo * 30);
  if (score < 0) score = 0;

  var msg = '';
  if (winState) {
    msg = state.selectedHero === 'Tanjiro'
      ? '세계 정복 완료! 지리는 나의 힘이다!'
      : '이 정도 상식은 기본이지. 시시해.';
  } else {
    msg = state.selectedHero === 'Tanjiro'
      ? '공부가 더 필요해... 다시 도전하자!'
      : '세계 상식이 부족했나? 믿을 수 없어.';
  }

  // 결과 화면 업데이트
  var titleEl = $('result-title');
  titleEl.textContent = winState ? 'YOU WIN' : 'GAME OVER';
  titleEl.className = 'font-hs result-title ' + (winState ? 'win' : 'lose');

  $('result-score').textContent = Math.floor(score);
  $('result-combo').textContent = state.scoreData.maxCombo;
  $('result-msg').textContent = '"' + msg + '"';

  state.gameState = 'RESULT';
  showScreen('screen-result');
}

function restartGame() {
  state.gameState = 'SELECT';
  showScreen('screen-select');
}

// ──────────────────────────────────────────
// 캔버스 파이터 생성
// ──────────────────────────────────────────
function createFighter(pos, name, color, facing) {
  return {
    pos: { x: pos.x, y: pos.y },
    startPos: { x: pos.x, y: pos.y },
    name: name,
    color: color,
    facing: facing,
    width: 140,
    height: 220,
    state: 'IDLE',
    frame: 0,
    trail: [],

    update: function() {
      this.frame++;
      if (this.state !== 'IDLE' && this.frame % 2 === 0) {
        this.trail.push({ x: this.pos.x, y: this.pos.y, a: 0.5 });
      }
      for (var i = this.trail.length - 1; i >= 0; i--) {
        this.trail[i].a -= 0.08;
        if (this.trail[i].a <= 0) this.trail.splice(i, 1);
      }
      if (this.state === 'IDLE') {
        this.pos.y = this.startPos.y + Math.sin(this.frame * 0.08) * 3;
      }
    },

    draw: function(c) {
      var self = this;
      // 잔상
      this.trail.forEach(function(t) {
        c.save();
        c.globalAlpha = t.a;
        c.translate(t.x + (self.facing === -1 ? self.width : 0), t.y);
        c.scale(self.name === 'Gojo' ? -self.facing : self.facing, 1);
        self.drawBody(c, true);
        c.restore();
      });
      // 메인 캐릭터
      c.save();
      var scaleX = this.name === 'Gojo' ? -this.facing : this.facing;
      c.translate(this.pos.x + (scaleX === -1 ? this.width : 0), this.pos.y);
      c.scale(scaleX, 1);
      // 그림자
      c.fillStyle = 'rgba(0,0,0,0.4)';
      c.beginPath();
      c.ellipse(this.width / 2, this.height - 10, 50, 10, 0, 0, Math.PI * 2);
      c.fill();
      // 스킬 이펙트
      if (this.state === 'ATTACK') this.drawSkill(c);
      // 캐릭터 본체
      this.drawBody(c, false);
      c.restore();
    },

    drawBody: function(c, isSilhouette) {
      var key = this.name === 'Tanjiro' ? 'tanjiro' : 'gojo';
      key += this.state === 'ATTACK' ? '_attack' : '_idle';
      var img = images[key];
      if (img && !isSilhouette) {
        c.drawImage(img, 0, 0, this.width, this.height);
      } else {
        c.fillStyle = isSilhouette ? this.color : '#fff';
        c.fillRect(0, 0, this.width, this.height);
      }
    },

    drawSkill: function(c) {
      var key = this.name === 'Tanjiro' ? 'effect_water' : 'effect_red';
      var img = images[key];
      if (img) {
        var offX = this.name === 'Tanjiro' ? -150 : -100;
        var offY = this.name === 'Tanjiro' ? -50 : -80;
        c.drawImage(img, offX, offY, 300, 300);
      }
    }
  };
}

// ──────────────────────────────────────────
// 파티클 및 충격파
// ──────────────────────────────────────────
function addExplosion(x, y, color) {
  for (var i = 0; i < 15; i++) {
    gameLogic.particles.push({
      x: x, y: y,
      dx: (Math.random() - 0.5) * 15,
      dy: (Math.random() - 0.5) * 15,
      c: color,
      s: Math.random() * 8 + 4,
      l: 30
    });
  }
  gameLogic.shockwaves.push({ x: x, y: y, r: 10, c: color, a: 1 });
}

// ──────────────────────────────────────────
// 캔버스 렌더 루프
// ──────────────────────────────────────────
function drawLoop() {
  if (!ctx || !canvas) { rafId = requestAnimationFrame(drawLoop); return; }

  // 히트 스톱
  if (gameLogic.hitStop > 0) {
    gameLogic.hitStop--;
    rafId = requestAnimationFrame(drawLoop);
    return;
  }

  // 화면 흔들림
  var sx = 0, sy = 0;
  if (gameLogic.shakeIntensity > 0) {
    sx = (Math.random() - 0.5) * gameLogic.shakeIntensity;
    sy = (Math.random() - 0.5) * gameLogic.shakeIntensity;
    gameLogic.shakeIntensity *= 0.9;
    if (gameLogic.shakeIntensity < 0.5) gameLogic.shakeIntensity = 0;
  }

  ctx.save();
  // shake 오프셋 적용 전 전체 클리어 (잔상 방지)
  ctx.clearRect(-30, -30, canvas.width + 60, canvas.height + 60);
  ctx.translate(sx, sy);

  // 배경
  if (images.bg) {
    ctx.drawImage(images.bg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // 파이터
  if (gameLogic.p1 && gameLogic.p2) {
    if (gameLogic.p1.state === 'ATTACK') {
      gameLogic.p2.update(); gameLogic.p2.draw(ctx);
      gameLogic.p1.update(); gameLogic.p1.draw(ctx);
    } else {
      gameLogic.p1.update(); gameLogic.p1.draw(ctx);
      gameLogic.p2.update(); gameLogic.p2.draw(ctx);
    }
  }

  // 파티클
  for (var i = gameLogic.particles.length - 1; i >= 0; i--) {
    var p = gameLogic.particles[i];
    p.x += p.dx; p.y += p.dy; p.l--; p.s *= 0.9;
    if (p.l <= 0) { gameLogic.particles.splice(i, 1); continue; }
    ctx.globalAlpha = p.l / 30;
    ctx.fillStyle = p.c;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // 충격파
  for (var j = gameLogic.shockwaves.length - 1; j >= 0; j--) {
    var s = gameLogic.shockwaves[j];
    s.r += 20; s.a -= 0.1;
    if (s.a <= 0) { gameLogic.shockwaves.splice(j, 1); continue; }
    ctx.save();
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.strokeStyle = s.c;
    ctx.lineWidth = 8;
    ctx.globalAlpha = s.a;
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
  rafId = requestAnimationFrame(drawLoop);
}

// ──────────────────────────────────────────
// 이벤트 바인딩
// ──────────────────────────────────────────
function bindEvents() {
  // START 화면 클릭
  $('screen-start').addEventListener('click', startPreloading);

  // 캐릭터 선택
  $('select-tanjiro').addEventListener('click', function() { selectCharacter('Tanjiro'); });
  $('select-gojo').addEventListener('click', function() { selectCharacter('Gojo'); });

  // 캐릭터 호버 사운드
  $('select-tanjiro').addEventListener('mouseenter', function() { soundMgr.playTheme('Tanjiro'); });
  $('select-gojo').addEventListener('mouseenter', function() { soundMgr.playTheme('Gojo'); });

  // 재시작 버튼
  $('btn-restart').addEventListener('click', restartGame);
}

// ──────────────────────────────────────────
// 초기화
// ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  canvas = $('battle-canvas');
  ctx = canvas.getContext('2d');

  bindEvents();

  // 캔버스 렌더 루프 시작
  rafId = requestAnimationFrame(drawLoop);
});
