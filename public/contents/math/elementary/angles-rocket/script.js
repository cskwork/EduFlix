// ═══════════════════════════════════════════════════════════════════════════
// 각도의 이해 - CYBERPUNK EDITION
// 초등학교 3-4학년 대상 (각도 측정, 예각/직각/둔각)
// ═══════════════════════════════════════════════════════════════════════════

const COLORS = {
    bgPrimary: 0x020617, bgSecondary: 0x0f172a, bgCard: 0x1e293b,
    primary: 0x0ea5e9, primaryGlow: 0x38bdf8, secondary: 0xc026d3,
    secondaryGlow: 0xe879f9, accent: 0xd946ef, success: 0x10b981,
    warning: 0xf59e0b, error: 0xf43f5e, gold: 0xfcd34d,
    textPrimary: 0xffffff, textSecondary: 0x94a3b8
};
const UI = {
    drawCyberBox(g, x, y, w, h, color, alpha=0.8, border=COLORS.primary) {
        g.fillStyle(color, alpha);
        g.beginPath(); g.moveTo(x+10,y); g.lineTo(x+w,y);
        g.lineTo(x+w,y+h-10); g.lineTo(x+w-10,y+h);
        g.lineTo(x,y+h); g.lineTo(x,y+10); g.closePath(); g.fillPath();
        g.lineStyle(2, border, 1); g.strokePath();
        g.fillStyle(border,1); g.fillRect(x,y+10,4,10);
        g.fillRect(x+w-4,y+h-20,4,10);
    }
};

class CyberScene extends Phaser.Scene {
    createButton(x, y, text, width, height, onClick) {
        const c = this.add.container(x, y);
        const bg = this.add.graphics();
        const draw = (bc, sc, sy=1) => { bg.clear(); UI.drawCyberBox(bg, -width/2, -height/2*sy, width, height*sy, bc, 1, sc); };
        draw(COLORS.bgSecondary, COLORS.primary);
        const label = this.add.text(0, 0, text, { fontFamily:'Noto Sans KR', fontSize:'20px', color:'#ffffff', fontStyle:'bold' }).setOrigin(0.5);
        c.add([bg, label]); c.setSize(width, height); c.setInteractive({ useHandCursor: true });
        c.on('pointerover', () => { draw(COLORS.bgCard, COLORS.primaryGlow, 1.05); this.tweens.add({targets:label,scale:1.05,duration:100}); });
        c.on('pointerout', () => { draw(COLORS.bgSecondary, COLORS.primary, 1); this.tweens.add({targets:label,scale:1,duration:100}); });
        c.on('pointerdown', () => { draw(COLORS.primary, COLORS.textPrimary, 0.95); this.time.delayedCall(100, onClick); });
        return c;
    }
    createHeader(title) {
        this.add.text(300, 40, title, { fontFamily:'Orbitron', fontSize:'22px', color:'#0ea5e9', fontStyle:'bold', letterSpacing:2 }).setOrigin(0.5);
        const l = this.add.graphics(); l.lineStyle(2,COLORS.primary,0.5); l.lineBetween(50,60,550,60);
        l.fillStyle(COLORS.primaryGlow,1); l.fillRect(250,58,100,4);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
class BootScene extends CyberScene {
    constructor() { super('BootScene'); }
    create() { this.scene.start('HookScene'); }
}

// ═══════════════════════════════════════════════════════════════════════════
// HookScene - 로켓 발사 각도 문제
// ═══════════════════════════════════════════════════════════════════════════
class HookScene extends CyberScene {
    constructor() { super('HookScene'); }
    create() {
        this.add.rectangle(300, 300, 600, 600, COLORS.bgPrimary);
        this.add.text(300, 60, 'LAUNCH VECTOR', { fontFamily:'Orbitron', fontSize:'42px', color:'#0ea5e9', fontStyle:'900' }).setOrigin(0.5);
        this.add.text(300, 100, 'ANGLE TRAJECTORY SYSTEM', { fontFamily:'Orbitron', fontSize:'14px', color:'#94a3b8', letterSpacing:3 }).setOrigin(0.5);

        this.add.text(300, 160, '목표: 각도를 조절하여 예각, 직각,\n둔각의 경계를 구별해요.', {
            fontFamily:'Noto Sans KR', fontSize:'22px', color:'#ffffff', align:'center', lineSpacing:8
        }).setOrigin(0.5);

        // 로켓 그리기
        const rocketG = this.add.graphics();
        this.drawRocket(rocketG, 200, 350, 45);
        
        // 행성 (목표)
        const planet = this.add.graphics();
        planet.fillStyle(COLORS.secondary, 0.5); planet.fillCircle(420, 200, 35);
        planet.lineStyle(2, COLORS.secondaryGlow, 0.8); planet.strokeCircle(420, 200, 35);
        planet.lineStyle(1, COLORS.secondaryGlow, 0.3); planet.strokeCircle(420, 200, 45);
        this.add.text(420, 200, 'TARGET', { fontFamily:'Orbitron', fontSize:'12px', color:'#e879f9' }).setOrigin(0.5);

        // 점선 궤적
        const trajG = this.add.graphics();
        trajG.lineStyle(2, COLORS.gold, 0.4);
        for(let i=0; i<15; i++) {
            const t = i/15;
            const sx = 200 + t*220;
            const sy = 350 - t*150;
            trajG.fillStyle(COLORS.gold, 0.6); trajG.fillCircle(sx, sy, 2);
        }

        // 별 배경
        for(let i=0;i<30;i++) {
            const s = this.add.rectangle(Phaser.Math.Between(0,600), Phaser.Math.Between(0,600), 2, 2, COLORS.textPrimary, 0.3);
            this.tweens.add({ targets:s, alpha:0.1, yoyo:true, repeat:-1, duration:Phaser.Math.Between(800,2000) });
        }

        this.createButton(300, 530, '스캔 시작', 200, 50, () => {
            this.cameras.main.fadeOut(300,0,0,0);
            this.time.delayedCall(300, () => this.scene.start('AnchorScene'));
        });
        this.cameras.main.fadeIn(500,0,0,0);
    }

    drawRocket(g, x, y, angleDeg) {
        const rad = Phaser.Math.DegToRad(-angleDeg);
        // 본체
        g.fillStyle(COLORS.textSecondary, 0.8);
        g.lineStyle(2, COLORS.primaryGlow, 0.8);
        // 간략화된 로켓 형상
        const len=50, w=12;
        const tip = { x: x + Math.cos(rad)*len, y: y + Math.sin(rad)*len };
        const l1 = { x: x + Math.cos(rad+0.3)*w, y: y + Math.sin(rad+0.3)*w };
        const l2 = { x: x + Math.cos(rad-0.3)*w, y: y + Math.sin(rad-0.3)*w };
        g.beginPath(); g.moveTo(tip.x,tip.y); g.lineTo(l1.x,l1.y); g.lineTo(l2.x,l2.y); g.closePath();
        g.fillPath(); g.strokePath();
        // 불꽃
        g.fillStyle(COLORS.warning, 0.6);
        const fireDir = Math.PI + rad;
        g.fillCircle(x + Math.cos(fireDir)*15, y + Math.sin(fireDir)*15, 8);
        g.fillStyle(COLORS.error, 0.4);
        g.fillCircle(x + Math.cos(fireDir)*22, y + Math.sin(fireDir)*22, 5);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// AnchorScene - 점, 선, 각도의 기초
// ═══════════════════════════════════════════════════════════════════════════
class AnchorScene extends CyberScene {
    constructor() { super('AnchorScene'); }
    create() {
        this.add.rectangle(300, 300, 600, 600, COLORS.bgPrimary);
        this.createHeader('DATA RETRIEVAL: LINES');
        this.add.text(300, 110, '점에서 두 개의 선이 벌어지면...', { fontFamily:'Noto Sans KR', fontSize:'22px', color:'#ffffff' }).setOrigin(0.5);

        // 두 선 (각도 시각화)
        const g = this.add.graphics();
        const cx = 200, cy = 320;
        // 수평선
        g.lineStyle(3, COLORS.primary, 0.8); g.lineBetween(cx, cy, cx+150, cy);
        // 회전선
        g.lineStyle(3, COLORS.secondary, 0.8);
        const ang = Phaser.Math.DegToRad(-60);
        g.lineBetween(cx, cy, cx+Math.cos(ang)*150, cy+Math.sin(ang)*150);
        // 꼭짓점
        g.fillStyle(COLORS.gold, 1); g.fillCircle(cx, cy, 6);
        // 각도 호
        g.lineStyle(2, COLORS.gold, 0.6);
        g.beginPath();
        g.arc(cx, cy, 40, 0, ang, true);
        g.strokePath();
        this.add.text(cx+55, cy-30, '각도', { fontFamily:'Noto Sans KR', fontSize:'16px', color:'#fcd34d', fontStyle:'bold' });

        // 정보 박스
        const box = this.add.graphics();
        UI.drawCyberBox(box, 50, 420, 500, 80, COLORS.bgSecondary, 0.8, COLORS.success);
        this.add.text(300, 450, '한 점에서 시작하는 두 반직선이 각을 만들고,', { fontFamily:'Noto Sans KR', fontSize:'16px', color:'#ffffff' }).setOrigin(0.5);
        this.add.text(300, 475, '벌어진 정도를 "각도(°)"라고 합니다.', { fontFamily:'Noto Sans KR', fontSize:'16px', color:'#10b981', fontStyle:'bold' }).setOrigin(0.5);

        this.createButton(300, 550, '다음 [데이터 접속]', 220, 50, () => {
            this.cameras.main.fadeOut(300,0,0,0);
            this.time.delayedCall(300, () => this.scene.start('StoryScene'));
        });
        this.cameras.main.fadeIn(500,0,0,0);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// StoryScene - 보라 요원의 미션
// ═══════════════════════════════════════════════════════════════════════════
class StoryScene extends CyberScene {
    constructor() { super('StoryScene'); }
    create() {
        this.add.rectangle(300, 300, 600, 600, COLORS.bgPrimary);
        this.createHeader('INCOMING TRANSMISSION');
        const d = this.add.graphics();
        UI.drawCyberBox(d, 50, 120, 500, 250, COLORS.bgSecondary, 0.8, COLORS.primary);
        const av = this.add.graphics();
        av.fillStyle(COLORS.bgPrimary,1); av.fillCircle(120,230,40);
        av.lineStyle(2,COLORS.primaryGlow,1); av.strokeCircle(120,230,40);
        const eyes = this.add.text(120, 230, '>_<', { fontFamily:'Orbitron', fontSize:'24px', color:'#0ea5e9', fontStyle:'bold' }).setOrigin(0.5);
        this.add.text(120, 290, 'AGENT BORA', { fontFamily:'Orbitron', fontSize:'14px', color:'#94a3b8' }).setOrigin(0.5);

        const msg = "큰일이야! 로켓의 발사각 제어\n시스템이 고장났어.\n\n각도를 정확히 입력해야만\n행성에 도달할 수 있는데,\n먼저 각도의 종류를 배워두자!";
        const t = this.add.text(190, 140, '', { fontFamily:'Noto Sans KR', fontSize:'18px', color:'#ffffff', lineSpacing:8 });
        let i=0;
        this.time.addEvent({ delay:30, repeat:msg.length-1, callback:()=>{ t.text+=msg[i]; if(i%5===0)eyes.text=['>_<','-_-','O_O'][Math.floor(Math.random()*3)]; i++; }});
        this.time.delayedCall(msg.length*30+500, () => {
            this.createButton(300, 480, '발사각 분석 시스템', 260, 50, () => {
                this.cameras.main.fadeOut(300,0,0,0);
                this.time.delayedCall(300, () => this.scene.start('CoreScene'));
            });
        });
        this.cameras.main.fadeIn(500,0,0,0);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// CoreScene - 각도 조절 인터랙션 (드래그로 각도 만들기)
// ═══════════════════════════════════════════════════════════════════════════
class CoreScene extends CyberScene {
    constructor() { super('CoreScene'); }
    create() {
        this.add.rectangle(300, 300, 600, 600, COLORS.bgPrimary);
        this.createHeader('ANGLE CONTROL SYSTEM');
        this.add.text(300, 90, '89°, 90°, 91°을 만들고 각의 종류를 비교하세요.', { fontFamily:'Noto Sans KR', fontSize:'16px', color:'#94a3b8' }).setOrigin(0.5);

        this.currentAngle = 45; // 기본 45도
        this.cx = 250;
        this.cy = 320;
        this.armLen = 120;

        this.angleGraphics = this.add.graphics();
        this.drawAngle();

        // 각도 표시
        this.angleText = this.add.text(300, 130, '45°', {
            fontFamily:'Orbitron', fontSize:'48px', color:'#fcd34d', fontStyle:'bold'
        }).setOrigin(0.5);

        // 타입 표시
        this.typeText = this.add.text(300, 175, '예각 (ACUTE)', {
            fontFamily:'Noto Sans KR', fontSize:'20px', color:'#38bdf8', fontStyle:'bold'
        }).setOrigin(0.5);

        // +/- 버튼
        this.createButton(150, 500, '-10°', 80, 45, () => this.changeAngle(-10));
        this.createButton(250, 500, '-1°', 60, 45, () => this.changeAngle(-1));
        this.createButton(350, 500, '+1°', 60, 45, () => this.changeAngle(1));
        this.createButton(450, 500, '+10°', 80, 45, () => this.changeAngle(10));

        // 유형 안내
        const infoBox = this.add.graphics();
        UI.drawCyberBox(infoBox, 380, 230, 190, 180, COLORS.bgSecondary, 0.7, COLORS.primary);
        this.add.text(475, 260, '예각: 0° < 각 < 90°', { fontFamily:'Noto Sans KR', fontSize:'14px', color:'#38bdf8' }).setOrigin(0.5);
        this.add.text(475, 300, '직각: 90°', { fontFamily:'Noto Sans KR', fontSize:'14px', color:'#10b981' }).setOrigin(0.5);
        this.add.text(475, 340, '둔각: 90° < 각 < 180°', { fontFamily:'Noto Sans KR', fontSize:'14px', color:'#e879f9' }).setOrigin(0.5);
        this.add.text(475, 380, '평각: 180°', { fontFamily:'Noto Sans KR', fontSize:'14px', color:'#f43f5e' }).setOrigin(0.5);

        this.createButton(300, 560, '퀴즈 도전', 200, 50, () => {
            this.cameras.main.fadeOut(300,0,0,0);
            this.time.delayedCall(300, () => this.scene.start('QuizScene'));
        });
        this.cameras.main.fadeIn(500,0,0,0);
    }

    changeAngle(delta) {
        this.currentAngle = Phaser.Math.Clamp(this.currentAngle + delta, 0, 180);
        this.drawAngle();
        this.angleText.setText(`${this.currentAngle}°`);

        if(this.currentAngle === 0) { this.typeText.setText('0도').setColor('#94a3b8'); }
        else if(this.currentAngle < 90) { this.typeText.setText('예각 (ACUTE)').setColor('#38bdf8'); }
        else if(this.currentAngle === 90) { this.typeText.setText('직각 (RIGHT)').setColor('#10b981'); }
        else if(this.currentAngle < 180) { this.typeText.setText('둔각 (OBTUSE)').setColor('#e879f9'); }
        else { this.typeText.setText('평각 (STRAIGHT)').setColor('#f43f5e'); }
    }

    drawAngle() {
        const g = this.angleGraphics;
        g.clear();
        const cx=this.cx, cy=this.cy, len=this.armLen;
        const rad = Phaser.Math.DegToRad(-this.currentAngle);

        // 각도 호 (filled)
        let color = COLORS.primary;
        if(this.currentAngle === 90) color = COLORS.success;
        else if(this.currentAngle > 90) color = COLORS.secondary;

        g.fillStyle(color, 0.15);
        g.beginPath(); g.moveTo(cx, cy);
        g.arc(cx, cy, 60, 0, rad, true);
        g.closePath(); g.fillPath();

        g.lineStyle(2, color, 0.6);
        g.beginPath(); g.arc(cx, cy, 60, 0, rad, true); g.strokePath();

        // 수평선 (기준선)
        g.lineStyle(4, COLORS.primary, 0.8);
        g.lineBetween(cx, cy, cx+len, cy);
        // 회전선
        g.lineStyle(4, COLORS.secondary, 0.8);
        g.lineBetween(cx, cy, cx+Math.cos(rad)*len, cy+Math.sin(rad)*len);
        // 꼭짓점
        g.fillStyle(COLORS.gold, 1); g.fillCircle(cx, cy, 7);

        // 직각 표시 (90도일 때)
        if(this.currentAngle === 90) {
            g.lineStyle(2, COLORS.success, 0.8);
            g.strokeRect(cx, cy-20, 20, 20);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// QuizScene - 각도 맞추기
// ═══════════════════════════════════════════════════════════════════════════
class QuizScene extends CyberScene {
    constructor() { super('QuizScene'); }
    create() {
        this.answerComplete = false;
        this.add.rectangle(300, 300, 600, 600, COLORS.bgPrimary);
        this.createHeader('TARGET DECRYPTION');
        
        // 문제: 135도 각의 종류는?
        this.add.text(300, 100, '다음 발사각의 종류를 판별하라.', { fontFamily:'Noto Sans KR', fontSize:'18px', color:'#ffffff' }).setOrigin(0.5);

        // 135도 각도 시각화
        const cx = 250, cy = 320, len = 100;
        const g = this.add.graphics();
        const rad = Phaser.Math.DegToRad(-135);
        // 각도 호
        g.fillStyle(COLORS.secondary, 0.15);
        g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, 50, 0, rad, true); g.closePath(); g.fillPath();
        g.lineStyle(2, COLORS.secondary, 0.6);
        g.beginPath(); g.arc(cx, cy, 50, 0, rad, true); g.strokePath();
        // 기준선
        g.lineStyle(4, COLORS.primary, 0.8); g.lineBetween(cx, cy, cx+len, cy);
        // 회전선
        g.lineStyle(4, COLORS.secondary, 0.8); g.lineBetween(cx, cy, cx+Math.cos(rad)*len, cy+Math.sin(rad)*len);
        // 꼭짓점
        g.fillStyle(COLORS.gold, 1); g.fillCircle(cx, cy, 7);

        this.add.text(cx + 70, cy - 40, '135°', { fontFamily:'Orbitron', fontSize:'28px', color:'#fcd34d', fontStyle:'bold' }).setOrigin(0.5);

        // 옵션
        const options = [
            { text: '예각 (ACUTE)', val: false },
            { text: '직각 (RIGHT)', val: false },
            { text: '둔각 (OBTUSE)', val: true }
        ];
        Phaser.Utils.Array.Shuffle(options);
        options.forEach((o, idx) => {
            this.createButton(300, 395 + idx*55, o.text, 280, 50, () => this.checkAnswer(o.val, 300, 395+idx*55));
        });

        this.feedback = this.add.text(300, 540, '', { fontFamily:'Noto Sans KR', fontSize: '16px', wordWrap: { width: 550 }, align: 'center', fontStyle:'bold' }).setOrigin(0.5);
        this.cameras.main.fadeIn(500,0,0,0);
    }

    checkAnswer(ok, x, y) {
        if (this.answerComplete) return;
        if(ok) {
            this.answerComplete = true;
            this.feedback.setText('정답! 90° < 135° < 180°이므로 둔각').setColor('#10b981');
            this.cameras.main.flash(500,16,185,129);
            for(let i=0;i<20;i++) { const p=this.add.rectangle(x,y,6,6,COLORS.success); this.tweens.add({targets:p,x:x+Phaser.Math.Between(-100,100),y:y+Phaser.Math.Between(-100,100),alpha:0,rotation:Phaser.Math.FloatBetween(0,6),duration:1000,ease:'Power2'}); }
            this.createButton(300, 580, '해설 확인 · 정리', 240, 38, () => this.scene.start('WrapScene'));
        } else {
            this.feedback.setText('135°는 90°보다 크고 180°보다 작은 둔각').setColor('#f43f5e');
            this.cameras.main.shake(200, 0.01);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// WrapScene
// ═══════════════════════════════════════════════════════════════════════════
class WrapScene extends CyberScene {
    constructor() { super('WrapScene'); }
    create() {
        this.add.rectangle(300, 300, 600, 600, COLORS.bgPrimary);
        this.createHeader('MISSION COMPLETE');
        this.add.text(300, 465, '두 변을 길게 그려도 각도가 같을까요? 이유를 말하세요.', { fontFamily:'Noto Sans KR', fontSize:'15px', color:'#ffffff' }).setOrigin(0.5);
        const box = this.add.graphics();
        UI.drawCyberBox(box, 50, 100, 500, 200, COLORS.bgSecondary, 0.8, COLORS.primary);
        this.add.text(300, 130, '[ SYSTEM LOG: 각도 분석 완료 ]', { fontFamily:'Noto Sans KR', fontSize:'18px', color:'#0ea5e9', fontStyle:'bold' }).setOrigin(0.5);
        this.add.text(100, 170, '▶ 두 반직선이 벌어진 정도를 각도(°)라 한다.\n▶ 예각: 0° < 각 < 90°\n▶ 직각: 각 = 90° (ㄱ자 표시)\n▶ 둔각: 90° < 각 < 180°\n▶ 평각: 각 = 180° (일직선)', {
            fontFamily:'Noto Sans KR', fontSize:'15px', color:'#ffffff', lineSpacing:10
        });

        // 각도별 미니 시각화
        const miniG = this.add.graphics();
        const types = [
            { x:140, label:'예각', deg:45, color:COLORS.primary },
            { x:250, label:'직각', deg:90, color:COLORS.success },
            { x:360, label:'둔각', deg:135, color:COLORS.secondary },
            { x:470, label:'평각', deg:180, color:COLORS.error }
        ];
        types.forEach(t => {
            const rad = Phaser.Math.DegToRad(-t.deg);
            miniG.lineStyle(2, t.color, 0.7);
            miniG.lineBetween(t.x, 400, t.x+30, 400);
            miniG.lineBetween(t.x, 400, t.x+Math.cos(rad)*30, 400+Math.sin(rad)*30);
            miniG.fillStyle(COLORS.gold, 0.8); miniG.fillCircle(t.x, 400, 3);
            this.add.text(t.x+15, 430, t.label, { fontFamily:'Noto Sans KR', fontSize:'14px', color:'#94a3b8' }).setOrigin(0.5);
        });

        this.createButton(300, 530, '시스템 재부팅', 200, 50, () => {
            this.cameras.main.fadeOut(300,0,0,0);
            this.time.delayedCall(300,()=>this.scene.start('HookScene'));
        });
        this.cameras.main.fadeIn(500,0,0,0);
        for(let i=0;i<30;i++){const s=this.add.rectangle(Phaser.Math.Between(0,600),-20,4,10,COLORS.success);this.tweens.add({targets:s,y:620,alpha:0,duration:Phaser.Math.Between(1500,3500),delay:Phaser.Math.Between(0,1000),repeat:-1});}
    }
}

// ═══════════════════════════════════════════════════════════════════════════
const config = {
    type: Phaser.AUTO, width: 600, height: 600,
    parent: 'game-container', backgroundColor: '#020617',
    scene: [BootScene, HookScene, AnchorScene, StoryScene, CoreScene, QuizScene, WrapScene],
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }
};
new Phaser.Game(config);