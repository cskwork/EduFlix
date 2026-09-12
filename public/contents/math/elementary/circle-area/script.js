// ═══════════════════════════════════════════════════════════════════════════
// 원의 넓이 - CYBERPUNK EDITION
// 초등학교 5-6학년 대상 (원의 넓이 공식 도출)
// ═══════════════════════════════════════════════════════════════════════════

const COLORS = {
    bgPrimary: 0x020617,
    bgSecondary: 0x0f172a,
    bgCard: 0x1e293b,
    primary: 0x0ea5e9, // Cyan
    primaryGlow: 0x38bdf8,
    secondary: 0xc026d3, // Magenta
    secondaryGlow: 0xe879f9,
    accent: 0xd946ef,
    success: 0x10b981, // Emerald neon
    warning: 0xf59e0b,
    error: 0xf43f5e,
    gold: 0xfcd34d,
    textPrimary: 0xffffff,
    textSecondary: 0x94a3b8
};

// UI 헬퍼
const UI = {
    drawCyberBox(graphics, x, y, width, height, color, alpha = 0.8, borderColor = COLORS.primary) {
        graphics.fillStyle(color, alpha);
        graphics.beginPath();
        graphics.moveTo(x + 10, y);
        graphics.lineTo(x + width, y);
        graphics.lineTo(x + width, y + height - 10);
        graphics.lineTo(x + width - 10, y + height);
        graphics.lineTo(x, y + height);
        graphics.lineTo(x, y + 10);
        graphics.closePath();
        graphics.fillPath();
        graphics.lineStyle(2, borderColor, 1);
        graphics.strokePath();

        graphics.fillStyle(borderColor, 1);
        graphics.fillRect(x, y + 10, 4, 10);
        graphics.fillRect(x + width - 4, y + height - 20, 4, 10);
    }
};

const Icons = {
    drawEnergyCore(graphics, x, y, size, color = COLORS.primary, innerColor = COLORS.primaryGlow) {
        // Outer Rings
        graphics.lineStyle(3, color, 0.8);
        graphics.strokeCircle(x, y, size);
        graphics.lineStyle(1, color, 0.4);
        graphics.strokeCircle(x, y, size * 1.2);
        
        // Inner Core
        graphics.fillStyle(innerColor, 0.3);
        graphics.fillCircle(x, y, size * 0.8);
        graphics.fillStyle(color, 0.8);
        graphics.fillCircle(x, y, size * 0.4);
        
        // Sparkles / Nodes
        graphics.fillStyle(COLORS.textPrimary, 1);
        graphics.fillCircle(x, y, size * 0.1);
        for(let i=0; i<4; i++) {
            const angle = i * Math.PI/2;
            graphics.fillCircle(x + Math.cos(angle)*size*0.8, y + Math.sin(angle)*size*0.8, 3);
        }
    },
    drawWedge(graphics, x, y, radius, startAngle, endAngle, color, strokeColor) {
        graphics.fillStyle(color, 0.4);
        graphics.lineStyle(2, strokeColor, 1);
        graphics.beginPath();
        graphics.moveTo(x, y);
        graphics.arc(x, y, radius, startAngle, endAngle, false);
        graphics.closePath();
        graphics.fillPath();
        graphics.strokePath();
    }
};

class CyberScene extends Phaser.Scene {
    createButton(x, y, text, width, height, onClick) {
        const container = this.add.container(x, y);
        const bg = this.add.graphics();
        
        const drawBtn = (bgColor, strokeColor, scaleY=1) => {
            bg.clear();
            const w = width; const h = height;
            const hx = -w/2; const hy = -h/2 * scaleY;
            UI.drawCyberBox(bg, hx, hy, w, h * scaleY, bgColor, 1, strokeColor);
        };
        drawBtn(COLORS.bgSecondary, COLORS.primary);

        const label = this.add.text(0, 0, text, {
            fontFamily: 'Noto Sans KR', fontSize: '20px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        container.add([bg, label]);
        container.setSize(width, height);
        container.setInteractive({ useHandCursor: true });

        container.on('pointerover', () => {
            drawBtn(COLORS.bgCard, COLORS.primaryGlow, 1.05);
            this.tweens.add({ targets: label, scale: 1.05, duration: 100 });
        });
        container.on('pointerout', () => {
            drawBtn(COLORS.bgSecondary, COLORS.primary, 1);
            this.tweens.add({ targets: label, scale: 1, duration: 100 });
        });
        container.on('pointerdown', () => {
             drawBtn(COLORS.primary, COLORS.textPrimary, 0.95);
             this.time.delayedCall(100, onClick);
        });
        return container;
    }

    createHeader(title) {
        const headerText = this.add.text(300, 40, title, {
            fontFamily: 'Orbitron', fontSize: '24px', color: '#0ea5e9', fontStyle: 'bold', letterSpacing: 2
        }).setOrigin(0.5);
        
        const line = this.add.graphics();
        line.lineStyle(2, COLORS.primary, 0.5);
        line.lineBetween(50, 60, 550, 60);
        line.fillStyle(COLORS.primaryGlow, 1);
        line.fillRect(250, 58, 100, 4);

        return headerText;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. BootScene
// ═══════════════════════════════════════════════════════════════════════════
class BootScene extends CyberScene {
    constructor() { super('BootScene'); }
    create() {
        this.scene.start('HookScene');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. HookScene - 피자 비교 -> 에너지 코어 비교
// ═══════════════════════════════════════════════════════════════════════════
class HookScene extends CyberScene {
    constructor() { super('HookScene'); }
    create() {
        this.add.rectangle(300, 300, 600, 600, COLORS.bgPrimary);
        
        this.add.text(300, 100, 'ENERGY CORE ANALYSIS', {
            fontFamily: 'Orbitron', fontSize: '36px', color: '#0ea5e9', fontStyle: '900', shadow: { blur: 10, color: '#0ea5e9', fill: true }
        }).setOrigin(0.5);

        this.add.text(300, 140, '목표: 원의 넓이를 구해 두 원의 양을 비교해요.', {
            fontFamily: 'Noto Sans KR', fontSize: '18px', color: '#94a3b8'
        }).setOrigin(0.5);

        // 큰 코어 (지름 30cm)
        const core1 = this.add.graphics();
        Icons.drawEnergyCore(core1, 150, 300, 90, COLORS.primary, COLORS.primaryGlow);
        this.add.text(150, 430, '지름 30cm (1개)', { fontFamily: 'Noto Sans KR', fontSize: '20px', color: '#38bdf8' }).setOrigin(0.5);

        // VS Text
        const vsText = this.add.text(300, 300, 'VS', {
            fontFamily: 'Orbitron', fontSize: '40px', color: '#f43f5e', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.tweens.add({ targets: vsText, scale: 1.1, yoyo: true, repeat: -1, duration: 800 });

        // 작은 코어 2개 (지름 20cm)
        const core2a = this.add.graphics();
        Icons.drawEnergyCore(core2a, 450, 240, 60, COLORS.secondary, COLORS.secondaryGlow);
        const core2b = this.add.graphics();
        Icons.drawEnergyCore(core2b, 450, 380, 60, COLORS.secondary, COLORS.secondaryGlow);
        this.add.text(450, 480, '지름 20cm (2개)', { fontFamily: 'Noto Sans KR', fontSize: '20px', color: '#e879f9' }).setOrigin(0.5);

        this.createButton(300, 540, '스캔 시작', 200, 50, () => {
             this.cameras.main.fadeOut(300, 0, 0, 0);
             this.time.delayedCall(300, () => this.scene.start('AnchorScene'));
        });
        this.cameras.main.fadeIn(500, 0, 0, 0);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. AnchorScene - 원의 둘레 복습
// ═══════════════════════════════════════════════════════════════════════════
class AnchorScene extends CyberScene {
    constructor() { super('AnchorScene'); }
    create() {
        this.add.rectangle(300, 300, 600, 600, COLORS.bgPrimary);
        this.createHeader('DATA RETRIEVAL: CIRCUMFERENCE');

        this.add.text(300, 120, '원주 (원의 둘레) 공식을 기억하나요?', { fontFamily: 'Noto Sans KR', fontSize: '22px', color: '#ffffff' }).setOrigin(0.5);

        const circleG = this.add.graphics();
        // 원 그리기
        circleG.lineStyle(4, COLORS.primary, 0.8);
        circleG.strokeCircle(300, 280, 100);
        
        // 중심점과 반지름
        circleG.fillStyle(COLORS.error, 1);
        circleG.fillCircle(300, 280, 5);
        circleG.lineStyle(2, COLORS.error, 1);
        circleG.lineBetween(300, 280, 400, 280);

        this.add.text(350, 260, 'r (반지름)', { fontFamily: 'Noto Sans KR', fontSize: '16px', color: '#f43f5e', fontStyle: 'bold' }).setOrigin(0.5);

        // 둘레 텍스트 애니메이션 (원을 따라 도는 점)
        const dot = this.add.graphics();
        dot.fillStyle(COLORS.gold, 1);
        dot.fillCircle(0, 0, 6);
        
        this.tweens.addCounter({
            from: 0, to: Math.PI * 2, duration: 4000, repeat: -1,
            onUpdate: (tween) => {
                const angle = tween.getValue();
                dot.setPosition(300 + Math.cos(angle)*100, 280 + Math.sin(angle)*100);
            }
        });

        const boxRect = this.add.graphics();
        UI.drawCyberBox(boxRect, 180, 420, 240, 80, COLORS.bgSecondary, 0.9, COLORS.success);
        
        this.add.text(300, 460, '원주 (C) = 2 × π × r', { fontFamily: 'Noto Sans KR', fontSize: '20px', color: '#10b981', fontStyle: 'bold' }).setOrigin(0.5);

        this.createButton(300, 540, '다음 [데이터 접속]', 220, 50, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
             this.time.delayedCall(300, () => this.scene.start('StoryScene'));
        });
        
        this.cameras.main.fadeIn(500, 0, 0, 0);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. StoryScene - 사이퍼 요원의 임무
// ═══════════════════════════════════════════════════════════════════════════
class StoryScene extends CyberScene {
    constructor() { super('StoryScene'); }
    create() {
        this.add.rectangle(300, 300, 600, 600, COLORS.bgPrimary);
        this.createHeader('INCOMING TRANSMISSION');

        const boxParams = { x: 50, y: 150, w: 500, h: 250 };
        const dialogBox = this.add.graphics();
        UI.drawCyberBox(dialogBox, boxParams.x, boxParams.y, boxParams.w, boxParams.h, COLORS.bgSecondary, 0.8, COLORS.primary);

        const avatar = this.add.graphics();
        avatar.fillStyle(COLORS.bgPrimary, 1);
        avatar.fillCircle(120, 270, 40);
        avatar.lineStyle(2, COLORS.primaryGlow, 1);
        avatar.strokeCircle(120, 270, 40);
        
        const eyesText = this.add.text(120, 270, '>_<', { fontFamily: 'Orbitron', fontSize: '24px', color: '#0ea5e9', fontStyle: 'bold'}).setOrigin(0.5);
        this.add.text(120, 330, 'AGENT BORA', { fontFamily: 'Orbitron', fontSize: '14px', color: '#94a3b8' }).setOrigin(0.5);

        const msg = "안녕! 난 사이버 요원 '보라'야.\n우주선의 메인 시스템을 가동하려면 에너지가\n가장 많은 코어를 장착해야 해.\n\n그런데 코어가 얼마나 많은 에너지를\n담고 있는지 (원의 넓이) 계산하는\n방법을 잊어버렸어. 나를 도와줄래?";
        
        const textObj = this.add.text(190, 190, '', {
            fontFamily: 'Noto Sans KR', fontSize: '18px', color: '#ffffff', lineSpacing: 10
        });

        let i = 0;
        this.time.addEvent({
            delay: 30, repeat: msg.length - 1,
            callback: () => {
                textObj.text += msg[i];
                if(i % 5 === 0) eyesText.text = ['>_<', '-_-', 'O_O'][Math.floor(Math.random()*3)];
                i++;
            }
        });

        this.time.delayedCall(msg.length * 30 + 500, () => {
             this.createButton(300, 480, '분석 시스템 가동', 240, 50, () => {
                this.cameras.main.fadeOut(300, 0, 0, 0);
                this.time.delayedCall(300, () => this.scene.start('CoreScene'));
            });
        });

        this.cameras.main.fadeIn(500, 0, 0, 0);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. CoreScene - 부채꼴 분할 인터랙션
// ═══════════════════════════════════════════════════════════════════════════
class CoreScene extends CyberScene {
    constructor() { super('CoreScene'); }
    create() {
        this.add.rectangle(300, 300, 600, 600, COLORS.bgPrimary);
        this.createHeader('CORE VISUALIZATION MODE');

        this.add.text(300, 100, '조각 수를 늘려 펼친 모양과 직사각형을 비교하세요.', {
            fontFamily: 'Noto Sans KR', fontSize: '18px', color: '#94a3b8'
        }).setOrigin(0.5);

        this.radius = 80;
        this.cx = 300;
        this.cy = 300;
        
        this.wedges = [];
        this.isUnfolded = false;

        this.drawCircle(16); // 처음엔 16조각

        // 버튼
        this.btnUnfold = this.createButton(200, 520, '펼치기', 150, 50, () => this.unfold());
        this.btnReset = this.createButton(400, 520, '다시 합치기', 150, 50, () => this.fold());

        this.cameras.main.fadeIn(500, 0, 0, 0);
        
        this.btnNext = this.createButton(300, 520, '다음 [공식 확인]', 200, 50, () => {
             this.cameras.main.fadeOut(300, 0, 0, 0);
             this.time.delayedCall(300, () => this.scene.start('VisualizeScene'));
        });
        this.btnNext.setVisible(false);
    }

    drawCircle(numSlices) {
        // 기존 조각 제거
        this.wedges.forEach(w => w.destroy());
        this.wedges = [];

        const sliceAngle = (Math.PI * 2) / numSlices;

        for (let i = 0; i < numSlices; i++) {
            const startAngle = i * sliceAngle;
            const endAngle = (i + 1) * sliceAngle;
            const color = i % 2 === 0 ? COLORS.primary : COLORS.secondary;
            const strokeColor = i % 2 === 0 ? COLORS.primaryGlow : COLORS.secondaryGlow;

            const wedge = this.add.graphics();
            Icons.drawWedge(wedge, 0, 0, this.radius, startAngle, endAngle, color, strokeColor);
            
            // 컨테이너로 묶기
            const container = this.add.container(this.cx, this.cy, [wedge]);
            container.originalAngle = i * sliceAngle;
            container.index = i;
            container.numSlices = numSlices;
            
            this.wedges.push(container);
        }
    }

    unfold() {
        if(this.isUnfolded) return;
        this.isUnfolded = true;

        this.btnUnfold.setVisible(false);
        this.btnReset.setVisible(false);

        const numSlices = this.wedges.length;
        // 직사각형이 만들어질 위치 (아래쪽 중심)
        const rectY = 320;
        // 한 조각이 차지하는 폭 (대략적으로)
        // 원의 둘레의 절반이 가로 길이
        const halfCircumference = Math.PI * this.radius;
        const widthPerSlice = halfCircumference / (numSlices / 2);
        
        const startX = 300 - halfCircumference / 2 + (widthPerSlice / 2);

        this.wedges.forEach((w, i) => {
            const isUp = i % 2 !== 0; // 홀수 인덱스는 포인트가 위를 향함
            const targetX = startX + Math.floor(i / 2) * widthPerSlice + (isUp ? widthPerSlice/2 : 0);
            const targetY = rectY + (isUp ? this.radius/2 : -this.radius/2);
            
            // 부채꼴의 중심회전
            // 기본 부채꼴은 [0, sliceAngle] 사이에 그려짐. 회전축 포인트가 (0,0)임
            const sliceAngleDeg = (360 / numSlices);
            
            // 목표 회전각도
            // 짝수(위에서 아래로 향하는 꼭짓점): -90도 회전
            // 홀수(아래서 위로 향하는 꼭짓점): 90도 회전
            const targetRot = isUp ? Phaser.Math.DegToRad(90 - sliceAngleDeg/2) : Phaser.Math.DegToRad(-90 - sliceAngleDeg/2);

            this.tweens.add({
                targets: w,
                x: targetX,
                y: targetY,
                rotation: targetRot,
                duration: 1500,
                ease: 'Cubic.easeInOut'
            });
        });

        this.time.delayedCall(1600, () => {
            this.btnReset.setVisible(true);
            this.btnReset.setPosition(200, 520);
            this.btnNext.setVisible(true);
            this.btnNext.setPosition(400, 520);
            
            // 설명 텍스트 표시
            this.explText = this.add.text(300, 430, '조각이 많아질수록 굽은 경계가 직선에 가까워져요.', {
                fontFamily: 'Noto Sans KR', fontSize: '18px', color: '#10b981', fontStyle: 'bold'
            }).setOrigin(0.5);
        });
    }

    fold() {
        if(!this.isUnfolded) return;
        this.isUnfolded = false;

        this.btnReset.setVisible(false);
        this.btnNext.setVisible(false);
        if(this.explText) this.explText.destroy();

        this.wedges.forEach((w, i) => {
            this.tweens.add({
                targets: w,
                x: this.cx,
                y: this.cy,
                rotation: 0,
                duration: 1500,
                ease: 'Cubic.easeInOut'
            });
        });

        this.time.delayedCall(1600, () => {
            this.btnUnfold.setVisible(true);
            this.btnReset.setVisible(true);
            this.btnReset.setPosition(400, 520);
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. VisualizeScene - 공식 도출
// ═══════════════════════════════════════════════════════════════════════════
class VisualizeScene extends CyberScene {
    constructor() { super('VisualizeScene'); }
    create() {
        this.add.rectangle(300, 300, 600, 600, COLORS.bgPrimary);
        this.createHeader('FORMULA DERIVATION');

        // 직사각형 시각화
        const rectW = 260;
        const rectH = 80;
        const rX = 300 - rectW/2;
        const rY = 180;

        const rect = this.add.graphics();
        rect.fillStyle(COLORS.bgCard, 1);
        rect.lineStyle(3, COLORS.primary, 1);
        rect.fillRect(rX, rY, rectW, rectH);
        rect.strokeRect(rX, rY, rectW, rectH);

        // 안쪽에 지그재그 선 (펼친 모양 암시)
        rect.lineStyle(1, COLORS.primaryGlow, 0.4);
        for(let i=0; i<16; i++) {
            const x1 = rX + (i * rectW/16);
            if(i%2===0) { rect.lineBetween(x1, rY, x1 + rectW/16, rY + rectH); }
            else { rect.lineBetween(x1, rY+rectH, x1 + rectW/16, rY); }
        }

        // 라벨
        this.add.text(300, rY - 20, '가로 = 원주의 1/2 = π × r', { fontFamily: 'Noto Sans KR', fontSize: '18px', color: '#0ea5e9' }).setOrigin(0.5);
        this.add.text(rX + rectW + 60, rY + rectH/2, '세로\n=\nr', { fontFamily: 'Noto Sans KR', fontSize: '18px', color: '#f43f5e', align: 'center' }).setOrigin(0.5);

        // 공식 애니메이션
        const step1 = this.add.text(300, 350, '직사각형 넓이 = 가로 × 세로', { fontFamily: 'Noto Sans KR', fontSize: '20px', color: '#94a3b8' }).setOrigin(0.5).setAlpha(0);
        const step2 = this.add.text(300, 390, '= (π × r) × r', { fontFamily: 'Noto Sans KR', fontSize: '24px', color: '#38bdf8' }).setOrigin(0.5).setAlpha(0);
        
        const box = this.add.graphics().setAlpha(0);
        UI.drawCyberBox(box, 150, 430, 300, 80, COLORS.bgSecondary, 0.9, COLORS.success);
        const step3 = this.add.text(300, 470, '원의 넓이 (S) = πr²', { fontFamily: 'Noto Sans KR', fontSize: '28px', color: '#10b981', fontStyle: 'bold' }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({ targets: step1, alpha: 1, duration: 800, delay: 500 });
        this.tweens.add({ targets: step2, alpha: 1, duration: 800, delay: 1500 });
        this.tweens.add({ targets: [box, step3], alpha: 1, duration: 800, delay: 2500 });

        this.time.delayedCall(3500, () => {
             this.createButton(300, 550, '연산 돌입 [도전]', 240, 50, () => {
                 this.cameras.main.fadeOut(300, 0, 0, 0);
                 this.time.delayedCall(300, () => this.scene.start('QuizScene'));
             });
        });
        
        this.cameras.main.fadeIn(500, 0, 0, 0);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. QuizScene - 마지막 연산
// ═══════════════════════════════════════════════════════════════════════════
class QuizScene extends CyberScene {
    constructor() { super('QuizScene'); }
    create() {
        this.answerComplete = false;
        this.add.rectangle(300, 300, 600, 600, COLORS.bgPrimary);
        this.createHeader('TARGET DECRYPTION');

        this.add.text(300, 100, '다음 에너지 코어의 총 용량(넓이)을 계산하라.', {
            fontFamily: 'Noto Sans KR', fontSize: '18px', color: '#ffffff'
        }).setOrigin(0.5);
        this.add.text(300, 130, '(원주율 π는 약 3.14 로 계산)', {
            fontFamily: 'Noto Sans KR', fontSize: '14px', color: '#94a3b8'
        }).setOrigin(0.5);

        // 문제 시각화
        const core = this.add.graphics();
        Icons.drawEnergyCore(core, 300, 260, 80, COLORS.warning, COLORS.gold);
        core.lineStyle(2, COLORS.textPrimary, 1);
        core.lineBetween(300, 260, 380, 260);
        this.add.text(340, 245, '10cm', { fontFamily: 'Orbitron', fontSize: '16px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

        this.add.text(300, 370, 'S = 3.14 × 10 × 10 = ?', { fontFamily: 'Orbitron', fontSize: '24px', color: '#38bdf8', fontStyle: 'bold' }).setOrigin(0.5);

        // 옵션 버튼
        const options = [
            { text: '62.8 cm²', val: false },
            { text: '314 cm²', val: true },
            { text: '628 cm²', val: false }
        ];

        Phaser.Utils.Array.Shuffle(options);

        options.forEach((opt, idx) => {
            const bx = 120 + (idx * 180);
            this.createButton(bx, 450, opt.text, 140, 50, () => this.checkAnswer(opt.val, bx, 450));
        });

        this.feedback = this.add.text(300, 530, '', { fontFamily: 'Noto Sans KR', fontSize: '16px', wordWrap: { width: 550 }, align: 'center', fontStyle: 'bold' }).setOrigin(0.5);

        this.cameras.main.fadeIn(500, 0, 0, 0);
    }

    checkAnswer(isCorrect, x, y) {
        if (this.answerComplete) return;
        if (isCorrect) {
            this.answerComplete = true;
            this.feedback.setText('정답! 3.14×10² = 314cm²').setColor('#10b981');
            this.cameras.main.flash(500, 16, 185, 129); // success flash
            
            // 파티클 터지는 효과
            for(let i=0; i<20; i++) {
                const p = this.add.rectangle(x, y, 6, 6, COLORS.success);
                this.tweens.add({
                    targets: p,
                    x: x + Phaser.Math.Between(-100, 100),
                    y: y + Phaser.Math.Between(-100, 100),
                    alpha: 0,
                    rotation: Phaser.Math.FloatBetween(0, Math.PI*2),
                    duration: 1000,
                    ease: 'Power2'
                });
            }

            this.createButton(300, 575, '해설 확인 · 정리', 240, 38, () => this.scene.start('WrapScene'));
        } else {
            this.feedback.setText('반지름을 제곱해요. 3.14×100=314cm²').setColor('#f43f5e');
            this.cameras.main.shake(200, 0.01);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. WrapScene - 요약 및 피자 대결 결론
// ═══════════════════════════════════════════════════════════════════════════
class WrapScene extends CyberScene {
    constructor() { super('WrapScene'); }
    create() {
        this.add.rectangle(300, 300, 600, 600, COLORS.bgPrimary);
        this.createHeader('MISSION COMPLETE');

        const box = this.add.graphics();
        UI.drawCyberBox(box, 50, 100, 500, 200, COLORS.bgSecondary, 0.8, COLORS.primary);
        
        this.add.text(300, 130, '[ SYSTEM LOG: 원의 넓이 확보 ]', { fontFamily: 'Noto Sans KR', fontSize: '18px', color: '#0ea5e9', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(100, 170, '▶ 조각 수를 늘리면 직사각형 모양에 가까워진다.\n▶ 직사각형의 가로는 (원주의 절반), 세로는 (반지름)\n▶ S = π r²', {
            fontFamily: 'Noto Sans KR', fontSize: '16px', color: '#ffffff', lineSpacing: 10
        });

        // 처음에 제기된 문제 해결 (30cm 1개 vs 20cm 2개)
        this.add.text(300, 340, '초기 의문 해독 완료!', { fontFamily: 'Noto Sans KR', fontSize: '20px', color: '#10b981', fontStyle: 'bold' }).setOrigin(0.5);

        // 결과창
        const uiLine = this.add.graphics();
        uiLine.lineStyle(1, COLORS.textSecondary, 0.5);
        uiLine.strokeRect(80, 380, 440, 100);

        this.add.text(180, 410, '지름 30cm (1개)\n= 706.5cm²', { fontFamily: 'Noto Sans KR', fontSize: '16px', color: '#38bdf8', align: 'center' }).setOrigin(0.5);
        this.add.text(300, 410, '>', { fontFamily: 'Orbitron', fontSize: '24px', color: '#fcd34d' }).setOrigin(0.5);
        this.add.text(420, 410, '지름 20cm (2개)\n= 314 × 2 = 628cm²', { fontFamily: 'Noto Sans KR', fontSize: '16px', color: '#e879f9', align: 'center' }).setOrigin(0.5);

        this.add.text(300, 450, '반지름을 2배로 하면 넓이는 몇 배일까요?', { fontFamily: 'Noto Sans KR', fontSize: '16px', color: '#10b981' }).setOrigin(0.5);

        // 다시하기
        this.createButton(300, 530, '시스템 재부팅', 200, 50, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.time.delayedCall(300, () => this.scene.start('HookScene'));
        });

        this.cameras.main.fadeIn(500, 0, 0, 0);
        
        // 종료 파티클 효과
        for(let i=0; i<30; i++) {
             const spark = this.add.rectangle(Phaser.Math.Between(0, 600), -20, 4, 10, COLORS.success);
             this.tweens.add({
                 targets: spark,
                 y: 620,
                 alpha: 0,
                 duration: Phaser.Math.Between(1500, 3500),
                 delay: Phaser.Math.Between(0, 1000),
                 repeat: -1
             });
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 게임 설정 및 실행
// ═══════════════════════════════════════════════════════════════════════════
const config = {
    type: Phaser.AUTO,
    width: 600,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#020617',
    scene: [BootScene, HookScene, AnchorScene, StoryScene, CoreScene, VisualizeScene, QuizScene, WrapScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

new Phaser.Game(config);
