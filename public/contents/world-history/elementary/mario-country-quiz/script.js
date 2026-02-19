/**
 * 슈퍼마리오 나라이름 퀴즈 - 게임 엔진
 * 순수 JavaScript (프레임워크 불필요)
 */

// ──────────────────────────────────────────
// 퀴즈 데이터
// ──────────────────────────────────────────
const RAW_QUIZ_DB = [
  { q: "피자와 파스타의 본고장이며,\n로마가 수도인 나라는?", a: "이탈리아", w: ["프랑스", "스페인", "독일"] },
  { q: "에펠탑과 바게트가 유명한\n예술의 나라는?", a: "프랑스", w: ["영국", "벨기에", "이탈리아"] },
  { q: "캥거루와 코알라가 살고 있는\n오세아니아의 나라는?", a: "호주", w: ["오스트리아", "뉴질랜드", "미국"] },
  { q: "김치와 태권도의 종주국이며,\n서울이 수도인 나라는?", a: "대한민국", w: ["일본", "중국", "태국"] },
  { q: "자유의 여신상이 있고,\n할리우드 영화가 유명한 나라는?", a: "미국", w: ["캐나다", "영국", "멕시코"] },
  { q: "만리장성과 판다로\n유명한 나라는?", a: "중국", w: ["일본", "몽골", "대만"] },
  { q: "피라미드와 스핑크스가\n있는 나라는?", a: "이집트", w: ["사우디", "이란", "터키"] },
  { q: "축구와 삼바 춤으로 유명한\n남미의 열정적인 나라는?", a: "브라질", w: ["아르헨티나", "칠레", "페루"] },
  { q: "국기에 빨간 단풍잎(메이플)이\n그려져 있는 나라는?", a: "캐나다", w: ["미국", "러시아", "노르웨이"] },
  { q: "튤립과 풍차의 나라로\n불리는 곳은?", a: "네덜란드", w: ["벨기에", "덴마크", "독일"] }
];

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateGameQuizzes() {
  const shuffled = shuffleArray(RAW_QUIZ_DB).slice(0, 10);
  return shuffled.map(item => {
    const options = shuffleArray([item.a, ...item.w]);
    return {
      q: item.q,
      options: options,
      ans: options.indexOf(item.a) + 1,
      exp: '정답: ' + item.a
    };
  });
}

// ──────────────────────────────────────────
// 오디오 (Web Audio API)
// ──────────────────────────────────────────
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const NOTES = {
  G3:196, C4:261.63, E4:329.63, F4:349.23, G4:392, Gs4:415.3, A4:440,
  As4:466.16, B4:493.88, C5:523.25, Cs5:554.37, D5:587.33, Dss5:622.25,
  E5:659.25, F5:698.46, Fs5:739.99, G5:783.99, Gs5:830.61, A5:880,
  As5:932.33, B5:987.77, C6:1046.5
};

const BGM_SEQUENCE = [
  {n:'E5',d:0.15},{n:'E5',d:0.15},{n:null,d:0.15},{n:'E5',d:0.15},
  {n:null,d:0.15},{n:'C5',d:0.15},{n:'E5',d:0.3},
  {n:'G5',d:0.3},{n:null,d:0.3},{n:'G4',d:0.3},{n:null,d:0.3},
  {n:'C5',d:0.45},{n:'G4',d:0.45},{n:'E4',d:0.45},
  {n:'A4',d:0.3},{n:'B4',d:0.3},{n:'As4',d:0.15},{n:'A4',d:0.3},
  {n:'G4',d:0.2},{n:'E5',d:0.2},{n:'G5',d:0.2},{n:'A5',d:0.3},{n:'F5',d:0.15},{n:'G5',d:0.3},
  {n:'E5',d:0.3},{n:'C5',d:0.15},{n:'D5',d:0.15},{n:'B4',d:0.3},{n:null,d:0.3},
  {n:'C5',d:0.45},{n:'G4',d:0.45},{n:'E4',d:0.45},
  {n:'A4',d:0.3},{n:'B4',d:0.3},{n:'As4',d:0.15},{n:'A4',d:0.3},
  {n:'G4',d:0.2},{n:'E5',d:0.2},{n:'G5',d:0.2},{n:'A5',d:0.3},{n:'F5',d:0.15},{n:'G5',d:0.3},
  {n:'E5',d:0.3},{n:'C5',d:0.15},{n:'D5',d:0.15},{n:'B4',d:0.3},{n:null,d:0.3},
  {n:null,d:0.3},
  {n:'G5',d:0.15},{n:'Fs5',d:0.15},{n:'F5',d:0.15},{n:'Dss5',d:0.3},{n:'E5',d:0.3},
  {n:null,d:0.15},{n:'Gs4',d:0.15},{n:'A4',d:0.15},{n:'C5',d:0.15},{n:null,d:0.15},{n:'A4',d:0.15},{n:'C5',d:0.15},{n:'D5',d:0.3},
  {n:null,d:0.3},
  {n:'G5',d:0.15},{n:'Fs5',d:0.15},{n:'F5',d:0.15},{n:'Dss5',d:0.3},{n:'E5',d:0.3},
  {n:null,d:0.15},{n:'C6',d:0.15},{n:null,d:0.15},{n:'C6',d:0.15},{n:'C6',d:0.3},{n:null,d:0.3},
  {n:null,d:0.3},
  {n:'G5',d:0.15},{n:'Fs5',d:0.15},{n:'F5',d:0.15},{n:'Dss5',d:0.3},{n:'E5',d:0.3},
  {n:null,d:0.15},{n:'Gs4',d:0.15},{n:'A4',d:0.15},{n:'C5',d:0.15},{n:null,d:0.15},{n:'A4',d:0.15},{n:'C5',d:0.15},{n:'D5',d:0.3},
  {n:null,d:0.3},
  {n:'Dss5',d:0.4},{n:null,d:0.2},{n:'D5',d:0.4},{n:null,d:0.2},{n:'C5',d:0.4},{n:null,d:0.8},
  {n:null,d:0.5}
];

let bgmTimeout = null;
let bgmIndex = 0;

function playBGM() {
  if (game.screen !== 'GAME') return;
  const note = BGM_SEQUENCE[bgmIndex];
  bgmIndex++;
  if (bgmIndex >= BGM_SEQUENCE.length) bgmIndex = 11;
  if (note.n && audioCtx) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = NOTES[note.n];
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + note.d * 0.9);
    osc.stop(audioCtx.currentTime + note.d);
  }
  bgmTimeout = setTimeout(playBGM, note.d * 1000);
}

function stopBGM() {
  if (bgmTimeout) { clearTimeout(bgmTimeout); bgmTimeout = null; }
}

function playSound(type) {
  if (!audioCtx) return;
  if (type === 'stage_clear') {
    const now = audioCtx.currentTime;
    const notes = [
      {f:392,t:0,d:0.08},{f:523.25,t:0.08,d:0.08},{f:659.25,t:0.16,d:0.08},
      {f:783.99,t:0.24,d:0.08},{f:1046.5,t:0.32,d:0.08},{f:1318.51,t:0.4,d:0.08},
      {f:1567.98,t:0.48,d:0.08},{f:1318.51,t:0.56,d:0.4},
      {f:830.61,t:1.1,d:0.1},{f:932.33,t:1.25,d:0.1},{f:987.77,t:1.4,d:0.1},{f:1046.5,t:1.6,d:0.6}
    ];
    notes.forEach(n => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.value = n.f;
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(now + n.t);
      gain.gain.setValueAtTime(0.1, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.01, now + n.t + n.d);
      osc.stop(now + n.t + n.d);
    });
    return;
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  switch(type) {
    case 'jump':
      osc.type='square'; osc.frequency.setValueAtTime(150,now);
      osc.frequency.linearRampToValueAtTime(300,now+0.1);
      gain.gain.setValueAtTime(0.1,now); gain.gain.linearRampToValueAtTime(0,now+0.1);
      osc.start(now); osc.stop(now+0.1); break;
    case 'coin':
      osc.type='sine'; osc.frequency.setValueAtTime(900,now);
      osc.frequency.setValueAtTime(1200,now+0.1);
      gain.gain.setValueAtTime(0.1,now); gain.gain.linearRampToValueAtTime(0,now+0.3);
      osc.start(now); osc.stop(now+0.3); break;
    case 'bump':
      osc.type='sawtooth'; osc.frequency.setValueAtTime(50,now);
      osc.frequency.linearRampToValueAtTime(30,now+0.1);
      gain.gain.setValueAtTime(0.1,now); gain.gain.linearRampToValueAtTime(0,now+0.1);
      osc.start(now); osc.stop(now+0.1); break;
    case 'stomp':
      osc.type='sawtooth'; osc.frequency.setValueAtTime(100,now);
      osc.frequency.exponentialRampToValueAtTime(20,now+0.1);
      gain.gain.setValueAtTime(0.1,now); gain.gain.linearRampToValueAtTime(0,now+0.1);
      osc.start(now); osc.stop(now+0.1); break;
    case 'pipe':
      osc.type='square'; osc.frequency.setValueAtTime(150,now);
      osc.frequency.linearRampToValueAtTime(50,now+0.4);
      gain.gain.setValueAtTime(0.1,now); gain.gain.linearRampToValueAtTime(0,now+0.4);
      osc.start(now); osc.stop(now+0.4); break;
    case 'gameover':
      osc.type='triangle'; osc.frequency.setValueAtTime(300,now);
      osc.frequency.linearRampToValueAtTime(100,now+2);
      gain.gain.setValueAtTime(0.2,now); gain.gain.linearRampToValueAtTime(0,now+2);
      osc.start(now); osc.stop(now+2); break;
  }
}

// ──────────────────────────────────────────
// SVG 스프라이트 생성
// ──────────────────────────────────────────
function createMarioSVG(frame, facing, isJumping, isDead) {
  const color = isDead ? '#555' : '#E52521';
  const overalls = '#0046AD';
  const skin = '#FED5A5';
  const hair = '#6B4423';

  if (isDead) {
    return `<svg width="32" height="32" viewBox="0 0 16 16">
      <rect x="4" y="10" width="8" height="2" fill="${overalls}"/>
      <rect x="2" y="8" width="12" height="2" fill="${overalls}"/>
      <rect x="5" y="4" width="6" height="4" fill="${color}"/>
      <rect x="5" y="2" width="6" height="2" fill="${skin}"/>
      <rect x="3" y="10" width="2" height="2" fill="${skin}"/>
      <rect x="11" y="10" width="2" height="2" fill="${skin}"/>
    </svg>`;
  }

  const transform = facing === 'left' ? 'scale(-1,1) translate(-16,0)' : '';
  let legs = '';
  if (isJumping) {
    legs = `<rect x="2" y="10" width="4" height="3" fill="${overalls}"/>
            <rect x="9" y="8" width="4" height="3" fill="${overalls}"/>`;
  } else if (frame === 0) {
    legs = `<rect x="3" y="9" width="3" height="3" fill="${overalls}"/>
            <rect x="8" y="9" width="3" height="3" fill="${overalls}"/>
            <rect x="2" y="12" width="3" height="2" fill="${hair}"/>
            <rect x="9" y="12" width="3" height="2" fill="${hair}"/>`;
  } else {
    legs = `<rect x="4" y="9" width="2" height="3" fill="${overalls}"/>
            <rect x="7" y="9" width="5" height="2" fill="${overalls}"/>
            <rect x="3" y="12" width="3" height="2" fill="${hair}"/>
            <rect x="8" y="11" width="3" height="2" fill="${hair}"/>`;
  }

  return `<svg width="32" height="32" viewBox="0 0 16 16" style="overflow:visible">
    <g transform="${transform}">
      <rect x="3" y="0" width="10" height="2" fill="${color}"/>
      <rect x="8" y="0" width="5" height="1" fill="${color}"/>
      <rect x="3" y="2" width="7" height="3" fill="${skin}"/>
      <rect x="3" y="2" width="2" height="1" fill="${hair}"/>
      <rect x="4" y="3" width="1" height="1" fill="${hair}"/>
      <rect x="8" y="3" width="1" height="1" fill="#000"/>
      <rect x="9" y="4" width="2" height="1" fill="#000"/>
      <rect x="10" y="3" width="1" height="1" fill="${skin}"/>
      <rect x="4" y="5" width="6" height="4" fill="${overalls}"/>
      <rect x="2" y="6" width="3" height="2" fill="${color}"/>
      <rect x="9" y="6" width="3" height="2" fill="${color}"/>
      ${legs}
    </g>
  </svg>`;
}

function createGoombaSVG(frame, isDead) {
  const body = '#8B4513';
  const skin = '#FED5A5';
  if (isDead) {
    return `<svg width="32" height="16" viewBox="0 0 16 8">
      <rect x="2" y="2" width="12" height="6" fill="${body}"/>
      <rect x="4" y="4" width="8" height="2" fill="${skin}"/>
    </svg>`;
  }
  const feetL = frame === 0 ? 2 : 1;
  const feetR = frame === 0 ? 11 : 10;
  return `<svg width="32" height="32" viewBox="0 0 16 16">
    <rect x="4" y="4" width="8" height="8" fill="${body}"/>
    <rect x="3" y="5" width="1" height="5" fill="${body}"/>
    <rect x="12" y="5" width="1" height="5" fill="${body}"/>
    <rect x="5" y="6" width="2" height="3" fill="#fff"/>
    <rect x="6" y="7" width="1" height="2" fill="#000"/>
    <rect x="9" y="6" width="2" height="3" fill="#fff"/>
    <rect x="9" y="7" width="1" height="2" fill="#000"/>
    <rect x="6" y="10" width="4" height="1" fill="${skin}"/>
    <rect x="${feetL}" y="12" width="4" height="2" fill="#000"/>
    <rect x="${feetR}" y="12" width="4" height="2" fill="#000"/>
  </svg>`;
}

// ──────────────────────────────────────────
// 블록 HTML 생성
// ──────────────────────────────────────────
function createBlockHTML(type, frame) {
  if (type === 'BRICK') {
    return `<div style="width:32px;height:32px;background:#D87536;border:2px solid #9C4A1A;box-sizing:border-box;position:relative">
      <div style="position:absolute;top:4px;left:0;width:100%;height:2px;background:#000;opacity:0.2"></div>
      <div style="position:absolute;top:16px;left:0;width:100%;height:2px;background:#000;opacity:0.2"></div>
      <div style="position:absolute;top:0;left:14px;width:2px;height:16px;background:#000;opacity:0.2"></div>
      <div style="position:absolute;top:16px;left:6px;width:2px;height:16px;background:#000;opacity:0.2"></div>
      <div style="position:absolute;top:16px;left:22px;width:2px;height:16px;background:#000;opacity:0.2"></div>
    </div>`;
  }
  if (type === 'Q') {
    const c = frame % 2 === 0 ? '#FFD700' : '#EAC100';
    return `<div style="width:32px;height:32px;background:${c};border:2px solid #B8860B;box-sizing:border-box;display:flex;align-items:center;justify-content:center;box-shadow:inset 2px 2px 0 #FFF,inset -2px -2px 0 #DAA520;position:relative">
      <span style="font-family:'Press Start 2P',cursive;font-size:20px;color:#000;margin-top:2px">?</span>
      <div style="position:absolute;top:2px;right:2px;width:2px;height:2px;background:#000;opacity:0.5"></div>
      <div style="position:absolute;bottom:2px;left:2px;width:2px;height:2px;background:#000;opacity:0.5"></div>
      <div style="position:absolute;top:2px;left:2px;width:2px;height:2px;background:#000;opacity:0.5"></div>
      <div style="position:absolute;bottom:2px;right:2px;width:2px;height:2px;background:#000;opacity:0.5"></div>
    </div>`;
  }
  if (type === 'EMPTY') {
    return `<div style="width:32px;height:32px;background:#6B4423;border:2px solid #3d2613;box-sizing:border-box">
      <div style="width:100%;height:100%;border:2px solid #8B4513"></div>
    </div>`;
  }
  return '';
}

// ──────────────────────────────────────────
// 게임 상태
// ──────────────────────────────────────────
const GRAVITY = 0.4;
const FRICTION = 0.8;
const MOVE_ACCEL = 0.5;
const JUMP_FORCE = -10;
const GROUND_Y = 500;

const game = {
  screen: 'TITLE',
  level: 1,
  score: 0,
  coins: 0,
  hearts: 3,
  timeLeft: 120,
  quizList: [],
  quizIdx: 0,
  feedback: null,
  showPipe: false,
  frameCount: 0
};

const mario = {
  x: 100, y: 300, vx: 0, vy: 0,
  width: 32, height: 32,
  grounded: false, facing: 'right',
  animFrame: 0, state: 'IDLE',
  invincible: 0, enteringPipe: false
};

let entities = [];
let particles = [];
const keys = {};

// ──────────────────────────────────────────
// 입력 처리
// ──────────────────────────────────────────
window.addEventListener('keydown', function(e) {
  keys[e.code] = true;
  if ((e.code === 'Space' || e.code === 'Enter') && game.screen !== 'GAME') {
    if (e.code === 'Space') e.preventDefault();
    startGame();
  }
});
window.addEventListener('keyup', function(e) { keys[e.code] = false; });

// ──────────────────────────────────────────
// 레벨 초기화
// ──────────────────────────────────────────
function initLevel() {
  mario.x = 50; mario.y = GROUND_Y - 32;
  mario.vx = 0; mario.vy = 0;
  mario.grounded = true; mario.facing = 'right';
  mario.animFrame = 0; mario.state = 'IDLE';
  mario.invincible = 0; mario.enteringPipe = false;

  entities = [];
  const startX = 250;
  const gap = 100;
  for (let i = 0; i < 4; i++) {
    entities.push({
      id: 'qblock-' + i, type: 'BLOCK', subtype: 'Q',
      x: startX + i * gap, y: 350, width: 32, height: 32,
      value: i, active: true, bumpY: 0
    });
  }
  for (let i = 0; i < 25; i++) {
    entities.push({ id: 'g-' + i, type: 'BLOCK', subtype: 'GROUND', x: i * 32, y: GROUND_Y + 32, width: 32, height: 32 });
    entities.push({ id: 'g2-' + i, type: 'BLOCK', subtype: 'GROUND', x: i * 32, y: GROUND_Y + 64, width: 32, height: 32 });
  }
  entities.push({ id: 'pipe', type: 'PIPE', x: 700, y: GROUND_Y - 16, width: 64, height: 64 });
  particles = [];
  game.feedback = null;
  game.showPipe = false;
}

function startGame() {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  game.quizList = generateGameQuizzes();
  game.score = 0; game.coins = 0; game.hearts = 3;
  game.quizIdx = 0; game.level = 1; game.timeLeft = 120;
  initLevel();
  game.screen = 'GAME';
  bgmIndex = 0;
  playBGM();
}

function nextLevel() {
  if (game.quizIdx + 1 >= 10) {
    game.screen = 'CLEAR';
    stopBGM();
    playSound('stage_clear');
    render();
    return;
  }
  game.quizIdx++;
  game.level++;
  initLevel();
}

// ──────────────────────────────────────────
// 물리 엔진
// ──────────────────────────────────────────
function updatePhysics() {
  if (mario.enteringPipe) {
    mario.y += 1;
    if (mario.y > GROUND_Y + 32) nextLevel();
    return;
  }

  if (game.screen === 'GAME') {
    if (keys['ArrowRight']) { mario.vx += MOVE_ACCEL; mario.facing = 'right'; mario.state = 'WALK'; }
    else if (keys['ArrowLeft']) { mario.vx -= MOVE_ACCEL; mario.facing = 'left'; mario.state = 'WALK'; }
    else { mario.state = 'IDLE'; }

    if ((keys['Space'] || keys['ArrowUp']) && mario.grounded) {
      mario.vy = JUMP_FORCE;
      mario.grounded = false;
      mario.state = 'JUMP';
      playSound('jump');
    }

    if (game.showPipe) {
      const pipe = entities.find(e => e.type === 'PIPE');
      if (pipe && Math.abs((mario.x + 16) - (pipe.x + 32)) < 20 && Math.abs(mario.y + 32 - pipe.y) < 5) {
        mario.enteringPipe = true;
        playSound('pipe');
      }
    }
  }

  mario.vx *= FRICTION;
  mario.vy += GRAVITY;
  mario.x += mario.vx;
  mario.y += mario.vy;

  if (mario.x < 0) mario.x = 0;
  if (mario.x > 768) mario.x = 768;

  mario.grounded = false;
  if (mario.y >= GROUND_Y - mario.height) {
    mario.y = GROUND_Y - mario.height;
    mario.vy = 0;
    mario.grounded = true;
  }

  if (mario.invincible > 0) mario.invincible--;

  entities.forEach(entity => {
    // 충돌 감지
    if (
      mario.x < entity.x + entity.width &&
      mario.x + mario.width > entity.x &&
      mario.y < entity.y + entity.height &&
      mario.y + mario.height > entity.y
    ) {
      if (entity.type === 'BLOCK') {
        const dx = (mario.x + mario.width/2) - (entity.x + entity.width/2);
        const dy = (mario.y + mario.height/2) - (entity.y + entity.height/2);
        const w = (mario.width + entity.width) / 2;
        const h = (mario.height + entity.height) / 2;
        const crossW = w * dy;
        const crossH = h * dx;
        if (Math.abs(dx) <= w && Math.abs(dy) <= h) {
          if (crossW > crossH) {
            if (crossW > -crossH) {
              mario.y = entity.y + entity.height;
              mario.vy = 0;
              if (entity.subtype === 'Q' && entity.active && !game.feedback) {
                hitBlock(entity);
              } else {
                playSound('bump');
              }
            } else {
              mario.x = entity.x - mario.width;
              mario.vx = 0;
            }
          } else {
            if (crossW > -crossH) {
              mario.x = entity.x + entity.width;
              mario.vx = 0;
            } else {
              if (mario.vy > 0) {
                mario.y = entity.y - mario.height;
                mario.vy = 0;
                mario.grounded = true;
              }
            }
          }
        }
      }
      if (entity.type === 'GOOMBA' && !entity.dead && mario.invincible === 0) {
        if (mario.vy > 0 && mario.y + mario.height < entity.y + entity.height / 2) {
          entity.dead = true;
          mario.vy = -5;
          game.score += 50;
          playSound('stomp');
          setTimeout(() => { entities = entities.filter(e => e !== entity); }, 500);
        } else {
          mario.invincible = 120;
          game.hearts--;
          if (game.hearts <= 0) {
            game.screen = 'GAMEOVER';
            stopBGM();
            playSound('gameover');
          } else {
            playSound('bump');
          }
        }
      }
    }

    if (entity.type === 'GOOMBA' && !entity.dead) {
      entity.x += entity.vx;
      if (entity.x < 0 || entity.x > 780) entity.vx *= -1;
      entity.frame = Math.floor(game.frameCount / 15) % 2;
    }
    if (entity.bumpY && entity.bumpY > 0) entity.bumpY -= 1;
  });
}

function hitBlock(block) {
  block.active = false;
  block.subtype = 'EMPTY';
  block.bumpY = 10;

  const currentQuiz = game.quizList[game.quizIdx];
  if (block.value + 1 === currentQuiz.ans) {
    playSound('coin');
    game.score += 100;
    game.coins++;
    game.feedback = { type: 'CORRECT', msg: currentQuiz.exp };
    game.showPipe = true;
    particles.push({ type: 'COIN', x: block.x + 8, y: block.y - 32, vy: -5, life: 30 });
  } else {
    playSound('bump');
    game.feedback = { type: 'WRONG', msg: currentQuiz.exp };
    game.showPipe = true;
    setTimeout(() => {
      if (game.screen !== 'GAME') return;
      entities.push({
        id: 'goomba-' + Date.now(), type: 'GOOMBA',
        x: block.x, y: GROUND_Y - 32, width: 32, height: 32,
        vx: -1, frame: 0, dead: false
      });
      playSound('bump');
    }, 1000);
  }
  // 나머지 Q블록 제거
  entities.forEach(e => {
    if (e.type === 'BLOCK' && e.subtype === 'Q' && e !== block) {
      e.active = false; e.subtype = 'EMPTY'; e.y = -1000;
    }
  });
}

// ──────────────────────────────────────────
// 렌더링
// ──────────────────────────────────────────
const container = document.getElementById('game-container');

function render() {
  let html = '';

  if (game.screen === 'TITLE') {
    html = `<div class="title-screen">
      <div style="margin-bottom:40px;text-align:center">
        <h1 class="title-heading">SUPER MARIO</h1>
        <h2 class="title-subheading">나라 이름 퀴즈</h2>
      </div>
      <button class="start-btn blink" onclick="startGame()">PRESS START BUTTON</button>
      <div class="title-ground"></div>
      <div style="margin-top:20px">${createMarioSVG(0, 'right', false, false)}</div>
    </div>`;
  }

  else if (game.screen === 'GAME' && game.quizList[game.quizIdx]) {
    const quiz = game.quizList[game.quizIdx];
    const blinkFrame = Math.floor(game.frameCount / 30);

    // HUD
    html += `<div class="hud">
      <div class="hud-col"><span>MARIO</span><span>${String(game.score).padStart(6,'0')}</span></div>
      <div class="hud-col center"><span>WORLD</span><span>1-${game.level}</span></div>
      <div class="hud-col center"><span>TIME</span><span>${String(game.timeLeft).padStart(3,'0')}</span></div>
    </div>`;
    html += `<div class="hud-sub">
      <span>&hearts; ${game.hearts}</span>
      <span class="coin-text">&#x1FA99; x ${String(game.coins).padStart(2,'0')}</span>
    </div>`;

    // 구름
    html += `<div class="sky-cloud" style="width:128px;height:48px;top:80px;left:80px"></div>`;
    html += `<div class="sky-cloud" style="width:96px;height:40px;top:160px;right:160px"></div>`;

    // 퀴즈 박스
    html += `<div class="quiz-box">
      <p class="quiz-label">QUESTION ${game.quizIdx + 1}/10</p>
      <p class="quiz-question">${quiz.q}</p>
    </div>`;

    // 피드백
    if (game.feedback) {
      const isCorrect = game.feedback.type === 'CORRECT';
      html += `<div class="feedback-box">
        <p class="feedback-result ${isCorrect ? 'correct' : 'wrong'}">
          ${isCorrect ? '정답입니다!' : '오답입니다!'}
        </p>
        <p class="feedback-exp">${game.feedback.msg}</p>
        ${game.showPipe ? '<p class="feedback-pipe blink">GO TO PIPE &rarr;</p>' : ''}
      </div>`;
    }

    // 게임 필드
    html += '<div style="position:absolute;width:100%;height:100%">';

    entities.forEach(ent => {
      if (ent.type === 'BLOCK' && ent.subtype !== 'GROUND') {
        const top = ent.y - (ent.bumpY || 0);
        html += `<div style="position:absolute;left:${ent.x}px;top:${top}px;width:${ent.width}px;height:${ent.height}px">`;
        html += createBlockHTML(ent.subtype, blinkFrame);
        if (ent.subtype === 'Q') {
          html += `<div class="block-number">${ent.value + 1}</div>`;
          html += `<div class="block-option">${quiz.options[ent.value]}</div>`;
        }
        html += '</div>';
      }
      if (ent.type === 'GOOMBA') {
        const op = ent.dead ? 0 : 1;
        html += `<div style="position:absolute;left:${ent.x}px;top:${ent.y}px;width:${ent.width}px;height:${ent.height}px;opacity:${op};transition:${ent.dead ? 'opacity 0.2s' : 'none'}">`;
        html += createGoombaSVG(ent.frame || 0, ent.dead);
        html += '</div>';
      }
      if (ent.type === 'PIPE') {
        html += `<div style="position:absolute;left:${ent.x}px;top:${ent.y}px;width:${ent.width}px;height:${ent.height}px;display:flex;flex-direction:column;align-items:center">`;
        if (game.showPipe) {
          html += `<div class="pipe-indicator blink"><span>HERE</span><span>&darr;</span></div>`;
        }
        html += `<div style="width:64px;height:32px;background:#00A800;border:4px solid #000;box-sizing:border-box"></div>`;
        html += `<div style="width:56px;height:32px;background:#00A800;border:4px solid #000;border-top:none;box-sizing:border-box"></div>`;
        html += '</div>';
      }
    });

    // 파티클
    particles.forEach(p => {
      const py = p.y - (30 - p.life) * 2;
      html += `<div style="position:absolute;left:${p.x}px;top:${py}px;width:16px;height:16px;background:#FFD700;border-radius:50%;border:2px solid #DAA520;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold">$</div>`;
    });

    // 마리오
    const marioOpacity = mario.invincible % 4 < 2 ? 1 : 0.5;
    html += `<div style="position:absolute;left:${mario.x}px;top:${mario.y}px;width:32px;height:32px;opacity:${marioOpacity};z-index:100">`;
    html += createMarioSVG(Math.floor(mario.x / 10) % 2, mario.facing, !mario.grounded, false);
    html += '</div>';

    html += '</div>';

    // 바닥
    html += '<div class="ground-layer"></div>';
  }

  else if (game.screen === 'GAMEOVER') {
    html = `<div class="gameover-screen">
      <h1 class="gameover-title">GAME OVER</h1>
      <p class="gameover-score">FINAL SCORE: ${game.score}</p>
      <div class="gameover-hint"><p>다시 도전해보세요!</p></div>
      <button class="retry-btn" onclick="startGame()">RETRY</button>
    </div>`;
  }

  else if (game.screen === 'CLEAR') {
    const total = game.score + game.coins * 50 + game.hearts * 200 + game.timeLeft;
    html = `<div class="clear-screen">
      <div class="clear-box">
        <h1 class="clear-title">CONGRATULATIONS!</h1>
        <div class="clear-scores">
          <p>정답 : ${game.score / 100} x 100 = ${game.score}</p>
          <p>동전 : ${game.coins} x 50 = ${game.coins * 50}</p>
          <p>하트 : ${game.hearts} x 200 = ${game.hearts * 200}</p>
          <p>남은 시간 : ${game.timeLeft} x 1 = ${game.timeLeft}</p>
          <hr class="clear-divider">
          <p class="clear-total">TOTAL SCORE = ${total}</p>
        </div>
        <button class="retry-btn" style="margin-top:32px" onclick="startGame()">PLAY AGAIN</button>
      </div>
      <div class="clear-firework tl">&#127878;</div>
      <div class="clear-firework br">&#10024;</div>
    </div>`;
  }

  container.innerHTML = html;
}

// ──────────────────────────────────────────
// 메인 루프
// ──────────────────────────────────────────
function gameLoop() {
  if (game.frameCount % 60 === 0 && game.screen === 'GAME' && !game.feedback && !mario.enteringPipe) {
    game.timeLeft--;
    if (game.timeLeft <= 0) {
      game.screen = 'GAMEOVER';
      stopBGM();
      playSound('gameover');
    }
  }

  if (game.screen === 'GAME') {
    updatePhysics();
    // 파티클 업데이트
    particles.forEach(p => { p.life--; });
    particles = particles.filter(p => p.life > 0);
  }

  game.frameCount++;
  render();
  requestAnimationFrame(gameLoop);
}

// 초기 렌더 후 루프 시작
render();
requestAnimationFrame(gameLoop);
