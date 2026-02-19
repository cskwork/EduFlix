// ═══════════════════════════════════════════════════════════════════════════
// 비와 비율 - CYBERPUNK EDITION
// 초등학교 5-6학년 대상 (비, 비율, 비례식)
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
        const draw = (bc, sc, sy=1) => {
            bg.clear(); UI.drawCyberBox(bg, -width/2, -height/2*sy, width, height*sy, bc, 1, sc);
        };
        draw(COLORS.bgSecondary, COLORS.primary);
        const label = this.add.text(0, 0, text, {
            fontFamily:'Noto Sans KR', fontSize:'20px', color:'#ffffff', fontStyle:'bold'
        }).setOrigin(0.5);
        c.add([bg, label]); c.setSize(width, height);
        c.setInteractive({ useHandCursor: true });
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
// 1. BootScene
// ═══════════════════════════════════════════════════════════════════════════
class BootScene extends CyberScene {
    constructor() { super('BootScene'); }
    create() { this.scene.start('HookScene'); }
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. HookScene - 배합 비율 문제 제기
// ═══════════════════════════════════════════════════════════════════════════
class HookScene extends CyberScene {
    constructor() { super('HookScene'); }
    create() {
        this.add.rectangle(300, 300, 600, 600, COLORS.bgPrimary);
        this.add.text(300, 70, 'FORMULA DECODE', { fontFamily:'Orbitron', fontSize:'38px', color:'#0ea5e9', fontStyle:'900' }).setOrigin(0.5);
        this.add.text(300, 110, 'RATIO & PROPORTION ANALYSIS', { fontFamily:'Orbitron', fontSize:'14px', color:'#94a3b8', letterSpacing:3 }).setOrigin(0.5);

        this.add.text(300, 170, '4인분 레시피를 6명이 먹으려면\n재료를 얼마나 넣어야 할까?', {
            fontFamily:'Noto Sans KR', fontSize:'20px', color:'#ffffff', align:'center', lineSpacing:8
        }).setOrigin(0.5);

        // 비커 시각화 (4인분 vs 6인분)
        const g = this.add.graphics();
        // 4인분 비커
        this.drawBeaker(g, 180, 350, 80, 120, 0.6, COLORS.primary);
        this.add.text(180, 490, '4인분', { fontFamily:'Noto Sans KR', fontSize:'18px', color:'#38bdf8' }).setOrigin(0.5);
        // 화살표
        this.add.text(300, 350, '>>>', { fontFamily:'Orbitron', fontSize:'30px', color:'#fcd34d', fontStyle:'bold' }).setOrigin(0.5);
        // 6인분 비커 (가득 채운 모양)
        this.drawBeaker(g, 420, 350, 80, 120, 0.9, COLORS.secondary);
        this.add.text(420, 490, '6인분 ???', { fontFamily:'Noto Sans KR', fontSize:'18px', color:'#e879f9' }).setOrigin(0.5);

        this.createButton(300, 550, '분석 시작', 200, 50, () => {
            this.cameras.main.fadeOut(300,0,0,0);
            this.time.delayedCall(300, () => this.scene.start('AnchorScene'));
        });
        this.cameras.main.fadeIn(500,0,0,0);
    }
    drawBeaker(g, x, y, w, h, fillLevel, color) {
        // 비커 윤곽선
        g.lineStyle(3, color, 0.8);
        g.strokeRect(x - w/2, y - h/2, w, h);
        // 채움
        const fh = h * fillLevel;
        g.fillStyle(color, 0.3);
        g.fillRect(x - w/2 + 2, y + h/2 - fh, w - 4, fh - 2);
        // 눈금선
        g.lineStyle(1, color, 0.3);
        for(let i=1; i<5; i++) {
            const ly = y - h/2 + (h/5)*i;
            g.lineBetween(x - w/2, ly, x - w/2 + 10, ly);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. AnchorScene - 곱셈/나눗셈 역연산 복습
// ═══════════════════════════════════════════════════════════════════════════
class AnchorScene extends CyberScene {
    constructor() { super('AnchorScene'); }
    create() {
        this.add.rectangle(300, 300, 600, 600, COLORS.bgPrimary);
        this.createHeader('DATA RETRIEVAL: OPERATIONS');

        this.add.text(300, 110, '곱셈과 나눗셈은 역연산이에요!', { fontFamily:'Noto Sans KR', fontSize:'22px', color:'#ffffff' }).setOrigin(0.5);

        const box1 = this.add.graphics();
        UI.drawCyberBox(box1, 100, 160, 400, 70, COLORS.bgSecondary, 0.8, COLORS.primary);
        this.add.text(300, 195, '3 × 4 = 12', { fontFamily:'Orbitron', fontSize:'28px', color:'#38bdf8', fontStyle:'bold' }).setOrigin(0.5);

        const box2 = this.add.graphics();
        UI.drawCyberBox(box2, 100, 260, 400, 70, COLORS.bgSecondary, 0.8, COLORS.secondary);
        this.add.text(300, 295, '12 ÷ 4 = 3', { fontFamily:'Orbitron', fontSize:'28px', color:'#e879f9', fontStyle:'bold' }).setOrigin(0.5);

        // 3x4 블록 그리드
        const gridG = this.add.graphics();
        for(let r=0; r<3; r++) {
            for(let c=0; c<4; c++) {
                const bx = 200 + c*30; const by = 380 + r*30;
                gridG.fillStyle((r+c)%2===0 ? COLORS.primary : COLORS.secondary, 0.5);
                gridG.fillRect(bx, by, 26, 26);
                gridG.lineStyle(1, COLORS.primaryGlow, 0.6);
                gridG.strokeRect(bx, by, 26, 26);
            }
        }
        this.add.text(370, 400, '= 12개', { fontFamily:'Noto Sans KR', fontSize:'20px', color:'#fcd34d', fontStyle:'bold' }).setOrigin(0, 0.5);

        this.createButton(300, 530, '다음 [데이터 접속]', 220, 50, () => {
            this.cameras.main.fadeOut(300,0,0,0);
            this.time.delayedCall(300, () => this.scene.start('StoryScene'));
        });
        this.cameras.main.fadeIn(500,0,0,0);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. StoryScene - 사이퍼 요원의 배합 미션
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

        const msg = "긴급 통신이야!\n해커가 우리 연료 배합 데이터를\n암호화해버렸어.\n\n원래 4배치 분량의 레시피인데,\n6배치를 만들어야 해.\n비례식을 써서 재료를 해독해줘!";
        const t = this.add.text(190, 140, '', { fontFamily:'Noto Sans KR', fontSize:'17px', color:'#ffffff', lineSpacing:8 });
        let i=0;
        this.time.addEvent({ delay:25, repeat:msg.length-1, callback:()=>{ t.text+=msg[i]; if(i%5===0)eyes.text=['>_<','-_-','O_O'][Math.floor(Math.random()*3)]; i++; }});
        this.time.delayedCall(msg.length*25+500, () => {
            this.createButton(300, 480, '배합 시뮬레이터 가동', 260, 50, () => {
                this.cameras.main.fadeOut(300,0,0,0);
                this.time.delayedCall(300, () => this.scene.start('CoreScene'));
            });
        });
        this.cameras.main.fadeIn(500,0,0,0);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. CoreScene - 비율 바 시뮬레이터
// ═══════════════════════════════════════════════════════════════════════════
class CoreScene extends CyberScene {
    constructor() { super('CoreScene'); }
    create() {
        this.add.rectangle(300, 300, 600, 600, COLORS.bgPrimary);
        this.createHeader('RATIO SIMULATOR');
        this.add.text(300, 90, '인원수를 변경하면 재료량이 자동 계산됩니다.', { fontFamily:'Noto Sans KR', fontSize:'16px', color:'#94a3b8' }).setOrigin(0.5);

        // 기준: 떡 400g, 고추장 3큰술, 설탕 2큰술, 어묵 200g (4인분)
        this.base = { people: 4, items: [
            { name: '떡', amount: 400, unit: 'g', color: COLORS.warning },
            { name: '고추장', amount: 3, unit: '큰술', color: COLORS.error },
            { name: '설탕', amount: 2, unit: '큰술', color: COLORS.secondary },
            { name: '어묵', amount: 200, unit: 'g', color: COLORS.primary }
        ]};
        this.currentPeople = 4;

        // 인원수 표시
        this.peopleText = this.add.text(300, 130, '인원: 4명', {
            fontFamily:'Orbitron', fontSize:'28px', color:'#fcd34d', fontStyle:'bold'
        }).setOrigin(0.5);

        // +/- 버튼
        this.createButton(200, 130, '-', 50, 40, () => this.changePeople(-1));
        this.createButton(400, 130, '+', 50, 40, () => this.changePeople(1));

        // 바 차트 영역
        this.bars = [];
        this.barLabels = [];
        this.barValues = [];
        const startY = 190;

        this.base.items.forEach((item, idx) => {
            const y = startY + idx * 80;
            this.add.text(70, y, item.name, { fontFamily:'Noto Sans KR', fontSize:'18px', color:'#ffffff' }).setOrigin(0, 0.5);
            
            // 바 배경
            const barBg = this.add.graphics();
            barBg.fillStyle(COLORS.bgCard, 0.5);
            barBg.fillRect(140, y - 15, 350, 30);
            barBg.lineStyle(1, COLORS.primary, 0.3);
            barBg.strokeRect(140, y - 15, 350, 30);

            // 바 채움
            const bar = this.add.graphics();
            this.bars.push(bar);

            // 값 표시
            const val = this.add.text(500, y, `${item.amount}${item.unit}`, {
                fontFamily:'Orbitron', fontSize:'16px', color:'#ffffff', fontStyle:'bold'
            }).setOrigin(0, 0.5);
            this.barValues.push(val);
        });
        this.updateBars();

        // 배수 표시
        this.multiplierText = this.add.text(300, 510, '배수: ×1.0', {
            fontFamily:'Orbitron', fontSize:'20px', color:'#10b981', fontStyle:'bold'
        }).setOrigin(0.5);

        this.createButton(300, 560, '비례식 알아보기', 220, 50, () => {
            this.cameras.main.fadeOut(300,0,0,0);
            this.time.delayedCall(300, () => this.scene.start('VisualizeScene'));
        });
        this.cameras.main.fadeIn(500,0,0,0);
    }

    changePeople(delta) {
        this.currentPeople = Phaser.Math.Clamp(this.currentPeople + delta, 1, 10);
        this.peopleText.setText(`인원: ${this.currentPeople}명`);
        this.updateBars();
    }

    updateBars() {
        const ratio = this.currentPeople / this.base.people;
        this.base.items.forEach((item, idx) => {
            const bar = this.bars[idx];
            bar.clear();
            const y = 190 + idx * 80;
            const maxW = 350;
            const w = Math.min(maxW, (ratio / 2.5) * maxW);
            bar.fillStyle(item.color, 0.6);
            bar.fillRect(140, y - 15, w, 30);

            const newAmount = Math.round(item.amount * ratio * 10) / 10;
            this.barValues[idx].setText(`${newAmount}${item.unit}`);
        });
        if(this.multiplierText) {
            const ratio = this.currentPeople / this.base.people;
            this.multiplierText.setText(`배수: ×${ratio.toFixed(1)}`);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. VisualizeScene - 비례식 공식 도출
// ═══════════════════════════════════════════════════════════════════════════
class VisualizeScene extends CyberScene {
    constructor() { super('VisualizeScene'); }
    create() {
        this.add.rectangle(300, 300, 600, 600, COLORS.bgPrimary);
        this.createHeader('FORMULA DERIVATION');

        // 비례식 시각화
        const s1 = this.add.text(300, 120, '비례식이란?', { fontFamily:'Noto Sans KR', fontSize:'22px', color:'#ffffff', fontStyle:'bold' }).setOrigin(0.5).setAlpha(0);

        const box1 = this.add.graphics().setAlpha(0);
        UI.drawCyberBox(box1, 80, 150, 440, 70, COLORS.bgSecondary, 0.8, COLORS.primary);
        const f1 = this.add.text(300, 185, 'a : b = c : d', { fontFamily:'Orbitron', fontSize:'30px', color:'#38bdf8', fontStyle:'bold' }).setOrigin(0.5).setAlpha(0);

        const s2 = this.add.text(300, 260, '"외항의 곱 = 내항의 곱"', { fontFamily:'Noto Sans KR', fontSize:'20px', color:'#e879f9', fontStyle:'bold' }).setOrigin(0.5).setAlpha(0);

        const box2 = this.add.graphics().setAlpha(0);
        UI.drawCyberBox(box2, 100, 290, 400, 70, COLORS.bgCard, 0.9, COLORS.success);
        const f2 = this.add.text(300, 325, 'a × d = b × c', { fontFamily:'Orbitron', fontSize:'28px', color:'#10b981', fontStyle:'bold' }).setOrigin(0.5).setAlpha(0);

        // 예시
        const exBox = this.add.graphics().setAlpha(0);
        UI.drawCyberBox(exBox, 70, 390, 460, 100, COLORS.bgSecondary, 0.7, COLORS.warning);
        const ex1 = this.add.text(300, 415, '예: 떡 400g : 4인분 = 떡 600g : 6인분', { fontFamily:'Noto Sans KR', fontSize:'16px', color:'#fcd34d' }).setOrigin(0.5).setAlpha(0);
        const ex2 = this.add.text(300, 440, '400 × 6 = 4 × 600', { fontFamily:'Noto Sans KR', fontSize:'18px', color:'#ffffff' }).setOrigin(0.5).setAlpha(0);
        const ex3 = this.add.text(300, 465, '2400 = 2400  ✓', { fontFamily:'Noto Sans KR', fontSize:'20px', color:'#10b981', fontStyle:'bold' }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({ targets: [s1], alpha:1, duration:600, delay:300 });
        this.tweens.add({ targets: [box1, f1], alpha:1, duration:600, delay:800 });
        this.tweens.add({ targets: [s2], alpha:1, duration:600, delay:1500 });
        this.tweens.add({ targets: [box2, f2], alpha:1, duration:600, delay:2200 });
        this.tweens.add({ targets: [exBox, ex1, ex2, ex3], alpha:1, duration:600, delay:3000 });

        this.time.delayedCall(3800, () => {
            this.createButton(300, 550, '연산 돌입 [도전]', 240, 50, () => {
                this.cameras.main.fadeOut(300,0,0,0);
                this.time.delayedCall(300, () => this.scene.start('QuizScene'));
            });
        });
        this.cameras.main.fadeIn(500,0,0,0);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. QuizScene - 비례식 퀴즈
// ═══════════════════════════════════════════════════════════════════════════
class QuizScene extends CyberScene {
    constructor() { super('QuizScene'); }
    create() {
        this.add.rectangle(300, 300, 600, 600, COLORS.bgPrimary);
        this.createHeader('TARGET DECRYPTION');
        this.add.text(300, 100, '비례식을 이용해 미지수를 구하라.', { fontFamily:'Noto Sans KR', fontSize:'18px', color:'#ffffff' }).setOrigin(0.5);

        const pBox = this.add.graphics();
        UI.drawCyberBox(pBox, 60, 140, 480, 120, COLORS.bgSecondary, 0.8, COLORS.warning);
        this.add.text(300, 170, '밀가루 300g에 설탕 100g을 넣는 레시피가 있다.', { fontFamily:'Noto Sans KR', fontSize:'16px', color:'#ffffff' }).setOrigin(0.5);
        this.add.text(300, 200, '밀가루를 450g 사용하면 설탕은 몇 g?', { fontFamily:'Noto Sans KR', fontSize:'18px', color:'#fcd34d', fontStyle:'bold' }).setOrigin(0.5);
        this.add.text(300, 240, '300 : 100 = 450 : ?', { fontFamily:'Orbitron', fontSize:'24px', color:'#38bdf8', fontStyle:'bold' }).setOrigin(0.5);

        // 바 차트 시각화
        const barG = this.add.graphics();
        // 밀가루 300g
        barG.fillStyle(COLORS.warning, 0.5); barG.fillRect(120, 290, 150, 30);
        barG.lineStyle(1, COLORS.warning, 0.8); barG.strokeRect(120, 290, 150, 30);
        this.add.text(100, 305, '밀가루', { fontFamily:'Noto Sans KR', fontSize:'12px', color:'#94a3b8' }).setOrigin(1, 0.5);
        this.add.text(280, 305, '300g', { fontFamily:'Noto Sans KR', fontSize:'14px', color:'#fcd34d' }).setOrigin(0, 0.5);

        // 설탕 100g
        barG.fillStyle(COLORS.error, 0.5); barG.fillRect(120, 330, 50, 30);
        barG.lineStyle(1, COLORS.error, 0.8); barG.strokeRect(120, 330, 50, 30);
        this.add.text(100, 345, '설탕', { fontFamily:'Noto Sans KR', fontSize:'12px', color:'#94a3b8' }).setOrigin(1, 0.5);
        this.add.text(180, 345, '100g', { fontFamily:'Noto Sans KR', fontSize:'14px', color:'#f43f5e' }).setOrigin(0, 0.5);

        // 밀가루 450g (새)
        barG.fillStyle(COLORS.warning, 0.3); barG.fillRect(340, 290, 225, 30);
        barG.lineStyle(1, COLORS.warning, 0.5); barG.strokeRect(340, 290, 225, 30);
        this.add.text(575, 305, '450g', { fontFamily:'Noto Sans KR', fontSize:'14px', color:'#fcd34d' }).setOrigin(0, 0.5);

        // 설탕 ? (점선)
        barG.lineStyle(2, COLORS.error, 0.5);
        const dashLen = 8;
        for(let dx=340; dx<420; dx+=dashLen*2) { barG.lineBetween(dx, 330, dx+dashLen, 330); barG.lineBetween(dx, 360, dx+dashLen, 360); }
        barG.lineBetween(340, 330, 340, 360); barG.lineBetween(420, 330, 420, 360);
        this.add.text(380, 345, '?', { fontFamily:'Orbitron', fontSize:'24px', color:'#f43f5e', fontStyle:'bold' }).setOrigin(0.5);

        // 옵션
        const options = [
            { text: '120g', val: false },
            { text: '150g', val: true },
            { text: '180g', val: false }
        ];
        Phaser.Utils.Array.Shuffle(options);
        options.forEach((o, idx) => {
            this.createButton(120 + idx*180, 430, o.text, 140, 50, () => this.checkAnswer(o.val, 120+idx*180, 430));
        });
        this.feedback = this.add.text(300, 530, '', { fontFamily:'Noto Sans KR', fontSize:'22px', fontStyle:'bold' }).setOrigin(0.5);
        this.cameras.main.fadeIn(500,0,0,0);
    }
    checkAnswer(ok, x, y) {
        if(ok) {
            this.feedback.setText('DECRYPTION SUCCESS!').setColor('#10b981');
            this.cameras.main.flash(500,16,185,129);
            for(let i=0;i<20;i++){const p=this.add.rectangle(x,y,6,6,COLORS.success);this.tweens.add({targets:p,x:x+Phaser.Math.Between(-100,100),y:y+Phaser.Math.Between(-100,100),alpha:0,rotation:Phaser.Math.FloatBetween(0,6),duration:1000,ease:'Power2'});}
            this.time.delayedCall(1500,()=>{this.cameras.main.fadeOut(300,0,0,0);this.time.delayedCall(300,()=>this.scene.start('WrapScene'));});
        } else {
            this.feedback.setText('ACCESS DENIED. 300×?=100×450').setColor('#f43f5e');
            this.cameras.main.shake(200, 0.01);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. WrapScene
// ═══════════════════════════════════════════════════════════════════════════
class WrapScene extends CyberScene {
    constructor() { super('WrapScene'); }
    create() {
        this.add.rectangle(300, 300, 600, 600, COLORS.bgPrimary);
        this.createHeader('MISSION COMPLETE');
        const box = this.add.graphics();
        UI.drawCyberBox(box, 50, 100, 500, 220, COLORS.bgSecondary, 0.8, COLORS.primary);
        this.add.text(300, 130, '[ SYSTEM LOG: 비례식 해독 완료 ]', { fontFamily:'Noto Sans KR', fontSize:'18px', color:'#0ea5e9', fontStyle:'bold' }).setOrigin(0.5);
        this.add.text(100, 170, '▶ 비(ratio): 두 수의 관계를 a:b로 표현한다.\n▶ 비율: 비를 분수나 소수로 나타낸 것.\n▶ 비례식: a:b = c:d 일 때, a×d = b×c\n▶ 비례식을 이용하면 미지수를 구할 수 있다.', {
            fontFamily:'Noto Sans KR', fontSize:'15px', color:'#ffffff', lineSpacing:10
        });

        // 실생활 예시
        const exBox = this.add.graphics();
        UI.drawCyberBox(exBox, 80, 350, 440, 100, COLORS.bgCard, 0.9, COLORS.success);
        this.add.text(300, 380, '실생활 속 비와 비율', { fontFamily:'Noto Sans KR', fontSize:'16px', color:'#10b981', fontStyle:'bold' }).setOrigin(0.5);
        this.add.text(200, 420, 'RECIPE', { fontFamily:'Orbitron', fontSize:'14px', color:'#38bdf8' }).setOrigin(0.5);
        this.add.text(300, 420, 'MAP SCALE', { fontFamily:'Orbitron', fontSize:'14px', color:'#e879f9' }).setOrigin(0.5);
        this.add.text(400, 420, 'EXCHANGE', { fontFamily:'Orbitron', fontSize:'14px', color:'#fcd34d' }).setOrigin(0.5);

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
    scene: [BootScene, HookScene, AnchorScene, StoryScene, CoreScene, VisualizeScene, QuizScene, WrapScene],
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }
};
new Phaser.Game(config);
