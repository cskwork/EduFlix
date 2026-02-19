// ═══════════════════════════════════════════════════════════════════════════
// 직육면체의 부피 - CYBERPUNK EDITION
// 초등학교 5-6학년 대상 (V = 가로 × 세로 × 높이)
// ═══════════════════════════════════════════════════════════════════════════

const COLORS = {
    bgPrimary: 0x020617,
    bgSecondary: 0x0f172a,
    bgCard: 0x1e293b,
    primary: 0x0ea5e9,
    primaryGlow: 0x38bdf8,
    secondary: 0xc026d3,
    secondaryGlow: 0xe879f9,
    accent: 0xd946ef,
    success: 0x10b981,
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

// 아이소메트릭 큐브 그리기 헬퍼
const Iso = {
    // 아이소메트릭 좌표 변환
    toScreen(gx, gy, gz, originX, originY, tileW, tileH) {
        const sx = originX + (gx - gy) * (tileW / 2);
        const sy = originY + (gx + gy) * (tileH / 2) - gz * tileH;
        return { x: sx, y: sy };
    },

    // 아이소메트릭 큐브 한 개 그리기
    drawCube(graphics, sx, sy, tileW, tileH, topColor, leftColor, rightColor, alpha = 1) {
        const hw = tileW / 2;
        const hh = tileH / 2;

        // 윗면
        graphics.fillStyle(topColor, alpha);
        graphics.beginPath();
        graphics.moveTo(sx, sy - hh);
        graphics.lineTo(sx + hw, sy);
        graphics.lineTo(sx, sy + hh);
        graphics.lineTo(sx - hw, sy);
        graphics.closePath();
        graphics.fillPath();

        // 왼쪽면
        graphics.fillStyle(leftColor, alpha);
        graphics.beginPath();
        graphics.moveTo(sx - hw, sy);
        graphics.lineTo(sx, sy + hh);
        graphics.lineTo(sx, sy + hh + tileH);
        graphics.lineTo(sx - hw, sy + tileH);
        graphics.closePath();
        graphics.fillPath();

        // 오른쪽면
        graphics.fillStyle(rightColor, alpha);
        graphics.beginPath();
        graphics.moveTo(sx + hw, sy);
        graphics.lineTo(sx, sy + hh);
        graphics.lineTo(sx, sy + hh + tileH);
        graphics.lineTo(sx + hw, sy + tileH);
        graphics.closePath();
        graphics.fillPath();

        // 윤곽선
        graphics.lineStyle(1, COLORS.primaryGlow, 0.5);
        // top
        graphics.beginPath();
        graphics.moveTo(sx, sy - hh);
        graphics.lineTo(sx + hw, sy);
        graphics.lineTo(sx, sy + hh);
        graphics.lineTo(sx - hw, sy);
        graphics.closePath();
        graphics.strokePath();
        // left
        graphics.beginPath();
        graphics.moveTo(sx - hw, sy);
        graphics.lineTo(sx - hw, sy + tileH);
        graphics.lineTo(sx, sy + hh + tileH);
        graphics.lineTo(sx, sy + hh);
        graphics.closePath();
        graphics.strokePath();
        // right
        graphics.beginPath();
        graphics.moveTo(sx + hw, sy);
        graphics.lineTo(sx + hw, sy + tileH);
        graphics.lineTo(sx, sy + hh + tileH);
        graphics.lineTo(sx, sy + hh);
        graphics.closePath();
        graphics.strokePath();
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// CyberScene 기본 클래스
// ═══════════════════════════════════════════════════════════════════════════
class CyberScene extends Phaser.Scene {
    createButton(x, y, text, width, height, onClick) {
        const container = this.add.container(x, y);
        const bg = this.add.graphics();
        const drawBtn = (bgColor, strokeColor, scaleY = 1) => {
            bg.clear();
            UI.drawCyberBox(bg, -width / 2, -height / 2 * scaleY, width, height * scaleY, bgColor, 1, strokeColor);
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
        this.add.text(300, 40, title, {
            fontFamily: 'Orbitron', fontSize: '22px', color: '#0ea5e9', fontStyle: 'bold', letterSpacing: 2
        }).setOrigin(0.5);
        const line = this.add.graphics();
        line.lineStyle(2, COLORS.primary, 0.5);
        line.lineBetween(50, 60, 550, 60);
        line.fillStyle(COLORS.primaryGlow, 1);
        line.fillRect(250, 58, 100, 4);
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
// 2. HookScene - 흥미 유발 (데이터 큐브를 몇 개 넣을 수 있을까?)
// ═══════════════════════════════════════════════════════════════════════════
class HookScene extends CyberScene {
    constructor() { super('HookScene'); }
    create() {
        this.add.rectangle(300, 300, 600, 600, COLORS.bgPrimary);

        this.add.text(300, 80, 'DATA MATRIX', {
            fontFamily: 'Orbitron', fontSize: '42px', color: '#0ea5e9', fontStyle: '900'
        }).setOrigin(0.5);
        this.add.text(300, 120, 'STORAGE CAPACITY ANALYSIS', {
            fontFamily: 'Orbitron', fontSize: '16px', color: '#94a3b8', letterSpacing: 3
        }).setOrigin(0.5);

        this.add.text(300, 170, '이 저장장치에\n데이터 큐브를 몇 개 넣을 수 있을까?', {
            fontFamily: 'Noto Sans KR', fontSize: '20px', color: '#ffffff', align: 'center', lineSpacing: 8
        }).setOrigin(0.5);

        // 아이소메트릭 저장 컨테이너 (빈 상자)
        const boxG = this.add.graphics();
        const ox = 300, oy = 320, tw = 50, th = 25;

        // 와이어프레임 박스 (가로4 x 세로3 x 높이2)
        const w = 4, h = 3, d = 2;
        this.drawWireframeBox(boxG, ox, oy, tw, th, w, h, d);

        // 작은 floating data cube
        const cubeG = this.add.graphics();
        Iso.drawCube(cubeG, 420, 220, 30, 15, 0x38bdf8, 0x0284c7, 0x0369a1, 0.9);
        this.tweens.add({ targets: cubeG, y: -10, yoyo: true, repeat: -1, duration: 1200, ease: 'Sine.easeInOut' });

        this.add.text(450, 230, '1cm³', {
            fontFamily: 'Orbitron', fontSize: '16px', color: '#38bdf8', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.createButton(300, 530, '스캔 시작', 200, 50, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.time.delayedCall(300, () => this.scene.start('AnchorScene'));
        });
        this.cameras.main.fadeIn(500, 0, 0, 0);
    }

    drawWireframeBox(g, ox, oy, tw, th, w, h, d) {
        g.lineStyle(2, COLORS.primary, 0.6);
        // 바닥 4개 꼭짓점
        const b0 = Iso.toScreen(0, 0, 0, ox, oy, tw, th);
        const b1 = Iso.toScreen(w, 0, 0, ox, oy, tw, th);
        const b2 = Iso.toScreen(w, h, 0, ox, oy, tw, th);
        const b3 = Iso.toScreen(0, h, 0, ox, oy, tw, th);
        // 윗면 4개 꼭짓점
        const t0 = Iso.toScreen(0, 0, d, ox, oy, tw, th);
        const t1 = Iso.toScreen(w, 0, d, ox, oy, tw, th);
        const t2 = Iso.toScreen(w, h, d, ox, oy, tw, th);
        const t3 = Iso.toScreen(0, h, d, ox, oy, tw, th);

        // 바닥면
        g.beginPath();
        g.moveTo(b0.x, b0.y); g.lineTo(b1.x, b1.y);
        g.lineTo(b2.x, b2.y); g.lineTo(b3.x, b3.y); g.closePath();
        g.strokePath();
        // 윗면
        g.lineStyle(3, COLORS.primaryGlow, 0.8);
        g.beginPath();
        g.moveTo(t0.x, t0.y); g.lineTo(t1.x, t1.y);
        g.lineTo(t2.x, t2.y); g.lineTo(t3.x, t3.y); g.closePath();
        g.strokePath();
        // 세로 기둥
        g.lineStyle(2, COLORS.primary, 0.5);
        g.lineBetween(b0.x, b0.y, t0.x, t0.y);
        g.lineBetween(b1.x, b1.y, t1.x, t1.y);
        g.lineBetween(b2.x, b2.y, t2.x, t2.y);
        g.lineBetween(b3.x, b3.y, t3.x, t3.y);

        // 치수 라벨
        const midBot = { x: (b0.x + b1.x) / 2, y: (b0.y + b1.y) / 2 + 20 };
        this.add.text(midBot.x, midBot.y, '가로 4cm', { fontFamily: 'Noto Sans KR', fontSize: '14px', color: '#38bdf8' }).setOrigin(0.5);
        const midRight = { x: (b1.x + b2.x) / 2 + 30, y: (b1.y + b2.y) / 2 };
        this.add.text(midRight.x, midRight.y, '세로 3cm', { fontFamily: 'Noto Sans KR', fontSize: '14px', color: '#e879f9' }).setOrigin(0.5);
        const midVert = { x: (b0.x + t0.x) / 2 - 30, y: (b0.y + t0.y) / 2 };
        this.add.text(midVert.x, midVert.y, '높이 2cm', { fontFamily: 'Noto Sans KR', fontSize: '14px', color: '#10b981' }).setOrigin(0.5);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. AnchorScene - 직사각형의 넓이 복습
// ═══════════════════════════════════════════════════════════════════════════
class AnchorScene extends CyberScene {
    constructor() { super('AnchorScene'); }
    create() {
        this.add.rectangle(300, 300, 600, 600, COLORS.bgPrimary);
        this.createHeader('DATA RETRIEVAL: AREA');

        this.add.text(300, 110, '직사각형의 넓이, 기억하나요?', {
            fontFamily: 'Noto Sans KR', fontSize: '22px', color: '#ffffff'
        }).setOrigin(0.5);

        // 아이소메트릭 바닥면 그리드 (가로 4 x 세로 3)
        const gridG = this.add.graphics();
        const ox = 300, oy = 280, tw = 50, th = 25;

        for (let gx = 0; gx < 4; gx++) {
            for (let gy = 0; gy < 3; gy++) {
                const s = Iso.toScreen(gx, gy, 0, ox, oy, tw, th);
                const color = (gx + gy) % 2 === 0 ? 0x0e7490 : 0x0891b2;
                // 다이아몬드(타일) 그리기
                gridG.fillStyle(color, 0.6);
                gridG.lineStyle(1, COLORS.primaryGlow, 0.5);
                gridG.beginPath();
                gridG.moveTo(s.x, s.y - th / 2);
                gridG.lineTo(s.x + tw / 2, s.y);
                gridG.lineTo(s.x, s.y + th / 2);
                gridG.lineTo(s.x - tw / 2, s.y);
                gridG.closePath();
                gridG.fillPath();
                gridG.strokePath();
            }
        }

        // 공식 블록
        const formulaBox = this.add.graphics();
        UI.drawCyberBox(formulaBox, 130, 410, 340, 80, COLORS.bgSecondary, 0.9, COLORS.primaryGlow);
        this.add.text(300, 430, '가로 × 세로 = 넓이', { fontFamily: 'Noto Sans KR', fontSize: '22px', color: '#38bdf8', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(300, 465, '4 × 3 = 12 (cm²)', { fontFamily: 'Noto Sans KR', fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);

        this.add.text(300, 380, '여기에 높이가 더해지면...?', {
            fontFamily: 'Noto Sans KR', fontSize: '18px', color: '#10b981', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.createButton(300, 540, '다음 [데이터 접속]', 220, 50, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.time.delayedCall(300, () => this.scene.start('StoryScene'));
        });
        this.cameras.main.fadeIn(500, 0, 0, 0);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. StoryScene - 보라 요원의 임무
// ═══════════════════════════════════════════════════════════════════════════
class StoryScene extends CyberScene {
    constructor() { super('StoryScene'); }
    create() {
        this.add.rectangle(300, 300, 600, 600, COLORS.bgPrimary);
        this.createHeader('INCOMING TRANSMISSION');

        const dialogBox = this.add.graphics();
        UI.drawCyberBox(dialogBox, 50, 120, 500, 260, COLORS.bgSecondary, 0.8, COLORS.primary);

        // 캐릭터 아바타
        const avatar = this.add.graphics();
        avatar.fillStyle(COLORS.bgPrimary, 1);
        avatar.fillCircle(120, 230, 40);
        avatar.lineStyle(2, COLORS.primaryGlow, 1);
        avatar.strokeCircle(120, 230, 40);
        const eyesText = this.add.text(120, 230, '>_<', {
            fontFamily: 'Orbitron', fontSize: '24px', color: '#0ea5e9', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add.text(120, 290, 'AGENT BORA', {
            fontFamily: 'Orbitron', fontSize: '14px', color: '#94a3b8'
        }).setOrigin(0.5);

        const msg = "우주 관제센터에서 긴급 통신이 왔어!\n새로운 행성에 배달할 물건을 1cm³\n데이터 큐브 모양으로 패킹해야 하는데,\n이 저장 컨테이너에 큐브를 몇 개나\n넣을 수 있는지 계산해줘!\n\n한 층씩 쌓으면 답이 보일 거야.";

        const textObj = this.add.text(190, 140, '', {
            fontFamily: 'Noto Sans KR', fontSize: '17px', color: '#ffffff', lineSpacing: 8
        });

        let i = 0;
        this.time.addEvent({
            delay: 25, repeat: msg.length - 1,
            callback: () => {
                textObj.text += msg[i];
                if (i % 5 === 0) eyesText.text = ['>_<', '-_-', 'O_O'][Math.floor(Math.random() * 3)];
                i++;
            }
        });

        this.time.delayedCall(msg.length * 25 + 500, () => {
            this.createButton(300, 480, '패킹 시뮬레이터 가동', 260, 50, () => {
                this.cameras.main.fadeOut(300, 0, 0, 0);
                this.time.delayedCall(300, () => this.scene.start('CoreScene'));
            });
        });
        this.cameras.main.fadeIn(500, 0, 0, 0);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. CoreScene - 층별 큐브 쌓기 인터랙션
// ═══════════════════════════════════════════════════════════════════════════
class CoreScene extends CyberScene {
    constructor() { super('CoreScene'); }
    create() {
        this.add.rectangle(300, 300, 600, 600, COLORS.bgPrimary);
        this.createHeader('PACKING SIMULATOR');

        this.add.text(300, 90, '버튼을 눌러 한 층씩 데이터 큐브를 쌓아보세요.', {
            fontFamily: 'Noto Sans KR', fontSize: '16px', color: '#94a3b8'
        }).setOrigin(0.5);

        // 설정: 가로4 세로3 높이2
        this.boxW = 4;
        this.boxH = 3;
        this.boxD = 2;
        this.currentLayer = 0;
        this.tileW = 40;
        this.tileH = 20;
        this.originX = 300;
        this.originY = 340;

        // 큐브 그래픽 레이어
        this.cubeGraphics = this.add.graphics();

        // 와이어프레임 박스 (투명 외곽선)
        this.wireG = this.add.graphics();
        this.drawWireframe();

        // 카운터 UI
        const ctrBox = this.add.graphics();
        UI.drawCyberBox(ctrBox, 380, 110, 190, 100, COLORS.bgSecondary, 0.8, COLORS.primary);

        this.add.text(475, 130, '현재 층', { fontFamily: 'Noto Sans KR', fontSize: '14px', color: '#94a3b8' }).setOrigin(0.5);
        this.layerText = this.add.text(475, 155, '0 / 2', {
            fontFamily: 'Orbitron', fontSize: '22px', color: '#38bdf8', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(475, 180, '전체 큐브', { fontFamily: 'Noto Sans KR', fontSize: '14px', color: '#94a3b8' }).setOrigin(0.5);
        this.totalText = this.add.text(475, 205, '0개', {
            fontFamily: 'Orbitron', fontSize: '22px', color: '#e879f9', fontStyle: 'bold'
        }).setOrigin(0.5);

        // 쌓기 버튼
        this.addBtn = this.createButton(300, 520, '한 층 쌓기', 180, 50, () => this.addLayer());

        // 피드백
        this.feedbackText = this.add.text(300, 470, '', {
            fontFamily: 'Noto Sans KR', fontSize: '20px', color: '#10b981', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.cameras.main.fadeIn(500, 0, 0, 0);
    }

    drawWireframe() {
        const g = this.wireG;
        const ox = this.originX, oy = this.originY;
        const tw = this.tileW, th = this.tileH;
        const w = this.boxW, h = this.boxH, d = this.boxD;

        g.clear();
        g.lineStyle(2, COLORS.primary, 0.3);

        const b0 = Iso.toScreen(0, 0, 0, ox, oy, tw, th);
        const b1 = Iso.toScreen(w, 0, 0, ox, oy, tw, th);
        const b2 = Iso.toScreen(w, h, 0, ox, oy, tw, th);
        const b3 = Iso.toScreen(0, h, 0, ox, oy, tw, th);
        const t0 = Iso.toScreen(0, 0, d, ox, oy, tw, th);
        const t1 = Iso.toScreen(w, 0, d, ox, oy, tw, th);
        const t2 = Iso.toScreen(w, h, d, ox, oy, tw, th);
        const t3 = Iso.toScreen(0, h, d, ox, oy, tw, th);

        // 바닥
        g.beginPath();
        g.moveTo(b0.x, b0.y); g.lineTo(b1.x, b1.y);
        g.lineTo(b2.x, b2.y); g.lineTo(b3.x, b3.y); g.closePath();
        g.strokePath();
        // 윗면
        g.lineStyle(2, COLORS.primaryGlow, 0.4);
        g.beginPath();
        g.moveTo(t0.x, t0.y); g.lineTo(t1.x, t1.y);
        g.lineTo(t2.x, t2.y); g.lineTo(t3.x, t3.y); g.closePath();
        g.strokePath();
        // 수직선
        g.lineStyle(1, COLORS.primary, 0.2);
        g.lineBetween(b0.x, b0.y, t0.x, t0.y);
        g.lineBetween(b1.x, b1.y, t1.x, t1.y);
        g.lineBetween(b2.x, b2.y, t2.x, t2.y);
        g.lineBetween(b3.x, b3.y, t3.x, t3.y);
    }

    addLayer() {
        if (this.currentLayer >= this.boxD) return;

        const z = this.currentLayer;

        // 한 층의 큐브를 하나씩 애니메이션으로 추가
        let delay = 0;
        for (let gy = this.boxH - 1; gy >= 0; gy--) {
            for (let gx = 0; gx < this.boxW; gx++) {
                this.time.delayedCall(delay, () => {
                    const s = Iso.toScreen(gx, gy, z, this.originX, this.originY, this.tileW, this.tileH);
                    // 리얼 큐브를 그래픽으로 추가
                    const cube = this.add.graphics();
                    cube.setAlpha(0);
                    Iso.drawCube(cube, s.x, s.y, this.tileW, this.tileH, 0x0e7490, 0x0284c7, 0x0369a1, 0.85);
                    this.tweens.add({ targets: cube, alpha: 1, duration: 200 });
                });
                delay += 50;
            }
        }

        this.currentLayer++;
        const totalCubes = this.currentLayer * this.boxW * this.boxH;

        this.time.delayedCall(delay, () => {
            this.layerText.setText(`${this.currentLayer} / ${this.boxD}`);
            this.totalText.setText(`${totalCubes}개`);

            if (this.currentLayer >= this.boxD) {
                this.addBtn.setVisible(false);
                this.feedbackText.setText(`저장장치 가득 참! 4 × 3 × 2 = 24개`);

                // 파티클 효과
                for (let i = 0; i < 20; i++) {
                    const p = this.add.rectangle(300, 300, 5, 5, [COLORS.primary, COLORS.secondary, COLORS.success, COLORS.gold][i % 4]);
                    this.tweens.add({
                        targets: p,
                        x: Phaser.Math.Between(50, 550),
                        y: Phaser.Math.Between(50, 550),
                        alpha: 0,
                        rotation: Phaser.Math.FloatBetween(0, 6),
                        duration: 1200,
                        ease: 'Power2'
                    });
                }

                this.time.delayedCall(1500, () => {
                    this.createButton(300, 520, '공식 알아보기', 200, 50, () => {
                        this.cameras.main.fadeOut(300, 0, 0, 0);
                        this.time.delayedCall(300, () => this.scene.start('VisualizeScene'));
                    });
                });
            }
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

        // 단계 1: 바닥면
        const step1Box = this.add.graphics();
        UI.drawCyberBox(step1Box, 50, 100, 500, 80, COLORS.bgSecondary, 0.7, COLORS.primary);
        const s1 = this.add.text(300, 120, '바닥 한 층의 큐브 수 :', { fontFamily: 'Noto Sans KR', fontSize: '18px', color: '#94a3b8' }).setOrigin(0.5).setAlpha(0);
        const s1f = this.add.text(300, 150, '가로 × 세로 = 4 × 3 = 12개', { fontFamily: 'Noto Sans KR', fontSize: '20px', color: '#38bdf8', fontStyle: 'bold' }).setOrigin(0.5).setAlpha(0);

        // 단계 2: 층 쌓기
        const step2Box = this.add.graphics();
        UI.drawCyberBox(step2Box, 50, 200, 500, 80, COLORS.bgSecondary, 0.7, COLORS.secondary);
        const s2 = this.add.text(300, 220, '층을 쌓으면 :', { fontFamily: 'Noto Sans KR', fontSize: '18px', color: '#94a3b8' }).setOrigin(0.5).setAlpha(0);
        const s2f = this.add.text(300, 250, '한 층(12개) × 높이(2) = 24개', { fontFamily: 'Noto Sans KR', fontSize: '20px', color: '#e879f9', fontStyle: 'bold' }).setOrigin(0.5).setAlpha(0);

        // 최종 공식
        const formulaBox = this.add.graphics().setAlpha(0);
        UI.drawCyberBox(formulaBox, 100, 330, 400, 100, COLORS.bgCard, 0.9, COLORS.success);
        const formula = this.add.text(300, 360, '직육면체의 부피 (V)', { fontFamily: 'Noto Sans KR', fontSize: '18px', color: '#10b981' }).setOrigin(0.5).setAlpha(0);
        const formulaBig = this.add.text(300, 400, 'V = 가로 × 세로 × 높이', {
            fontFamily: 'Orbitron', fontSize: '26px', color: '#10b981', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0);

        // 순차 애니메이션
        this.tweens.add({ targets: [s1, s1f], alpha: 1, duration: 600, delay: 300 });
        this.tweens.add({ targets: [s2, s2f], alpha: 1, duration: 600, delay: 1200 });
        this.tweens.add({ targets: [formulaBox, formula, formulaBig], alpha: 1, duration: 800, delay: 2200 });

        this.time.delayedCall(3200, () => {
            this.createButton(300, 530, '연산 돌입 [도전]', 240, 50, () => {
                this.cameras.main.fadeOut(300, 0, 0, 0);
                this.time.delayedCall(300, () => this.scene.start('QuizScene'));
            });
        });
        this.cameras.main.fadeIn(500, 0, 0, 0);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. QuizScene - 부피 연산 퀴즈
// ═══════════════════════════════════════════════════════════════════════════
class QuizScene extends CyberScene {
    constructor() { super('QuizScene'); }
    create() {
        this.add.rectangle(300, 300, 600, 600, COLORS.bgPrimary);
        this.createHeader('TARGET DECRYPTION');

        this.add.text(300, 100, '다음 저장장치의 총 용량(부피)을 계산하라.', {
            fontFamily: 'Noto Sans KR', fontSize: '18px', color: '#ffffff'
        }).setOrigin(0.5);

        // 아이소메트릭 와이어프레임 (가로5 x 세로3 x 높이4)
        const boxG = this.add.graphics();
        const ox = 300, oy = 300, tw = 35, th = 18;
        const w = 5, h = 3, d = 4;

        // 와이어프레임
        boxG.lineStyle(2, COLORS.warning, 0.7);
        const b0 = Iso.toScreen(0, 0, 0, ox, oy, tw, th);
        const b1 = Iso.toScreen(w, 0, 0, ox, oy, tw, th);
        const b2 = Iso.toScreen(w, h, 0, ox, oy, tw, th);
        const b3 = Iso.toScreen(0, h, 0, ox, oy, tw, th);
        const t0 = Iso.toScreen(0, 0, d, ox, oy, tw, th);
        const t1 = Iso.toScreen(w, 0, d, ox, oy, tw, th);
        const t2 = Iso.toScreen(w, h, d, ox, oy, tw, th);
        const t3 = Iso.toScreen(0, h, d, ox, oy, tw, th);

        boxG.beginPath();
        boxG.moveTo(b0.x, b0.y); boxG.lineTo(b1.x, b1.y);
        boxG.lineTo(b2.x, b2.y); boxG.lineTo(b3.x, b3.y);
        boxG.closePath(); boxG.strokePath();
        boxG.beginPath();
        boxG.moveTo(t0.x, t0.y); boxG.lineTo(t1.x, t1.y);
        boxG.lineTo(t2.x, t2.y); boxG.lineTo(t3.x, t3.y);
        boxG.closePath(); boxG.strokePath();
        boxG.lineBetween(b0.x, b0.y, t0.x, t0.y);
        boxG.lineBetween(b1.x, b1.y, t1.x, t1.y);
        boxG.lineBetween(b2.x, b2.y, t2.x, t2.y);
        boxG.lineBetween(b3.x, b3.y, t3.x, t3.y);

        // 치수 라벨
        this.add.text((b0.x + b1.x) / 2, (b0.y + b1.y) / 2 + 18, '가로: 5cm', { fontFamily: 'Noto Sans KR', fontSize: '14px', color: '#38bdf8' }).setOrigin(0.5);
        this.add.text((b1.x + b2.x) / 2 + 30, (b1.y + b2.y) / 2, '세로: 3cm', { fontFamily: 'Noto Sans KR', fontSize: '14px', color: '#e879f9' }).setOrigin(0.5);
        this.add.text((b0.x + t0.x) / 2 - 30, (b0.y + t0.y) / 2, '높이: 4cm', { fontFamily: 'Noto Sans KR', fontSize: '14px', color: '#10b981' }).setOrigin(0.5);

        this.add.text(300, 390, '5 × 3 × 4 = ?', {
            fontFamily: 'Orbitron', fontSize: '24px', color: '#fcd34d', fontStyle: 'bold'
        }).setOrigin(0.5);

        // 옵션
        const options = [
            { text: '45 cm³', val: false },
            { text: '60 cm³', val: true },
            { text: '12 cm³', val: false }
        ];
        Phaser.Utils.Array.Shuffle(options);

        options.forEach((opt, idx) => {
            this.createButton(120 + idx * 180, 450, opt.text, 140, 50, () => this.checkAnswer(opt.val, 120 + idx * 180, 450));
        });

        this.feedback = this.add.text(300, 530, '', { fontFamily: 'Noto Sans KR', fontSize: '22px', fontStyle: 'bold' }).setOrigin(0.5);
        this.cameras.main.fadeIn(500, 0, 0, 0);
    }

    checkAnswer(isCorrect, x, y) {
        if (isCorrect) {
            this.feedback.setText('DECRYPTION SUCCESS!').setColor('#10b981');
            this.cameras.main.flash(500, 16, 185, 129);
            for (let i = 0; i < 20; i++) {
                const p = this.add.rectangle(x, y, 6, 6, COLORS.success);
                this.tweens.add({
                    targets: p, x: x + Phaser.Math.Between(-100, 100), y: y + Phaser.Math.Between(-100, 100),
                    alpha: 0, rotation: Phaser.Math.FloatBetween(0, 6), duration: 1000, ease: 'Power2'
                });
            }
            this.time.delayedCall(1500, () => {
                this.cameras.main.fadeOut(300, 0, 0, 0);
                this.time.delayedCall(300, () => this.scene.start('WrapScene'));
            });
        } else {
            this.feedback.setText('ACCESS DENIED. V = 가로 × 세로 × 높이').setColor('#f43f5e');
            this.cameras.main.shake(200, 0.01);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. WrapScene - 요약
// ═══════════════════════════════════════════════════════════════════════════
class WrapScene extends CyberScene {
    constructor() { super('WrapScene'); }
    create() {
        this.add.rectangle(300, 300, 600, 600, COLORS.bgPrimary);
        this.createHeader('MISSION COMPLETE');

        const box = this.add.graphics();
        UI.drawCyberBox(box, 50, 100, 500, 200, COLORS.bgSecondary, 0.8, COLORS.primary);

        this.add.text(300, 130, '[ SYSTEM LOG: 부피 공식 확보 ]', {
            fontFamily: 'Noto Sans KR', fontSize: '18px', color: '#0ea5e9', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(100, 170, '▶ 직육면체에 1cm³ 큐브를 채워 부피를 구할 수 있다.\n▶ 바닥 한 층 = 가로 × 세로\n▶ 전체 부피 = 가로 × 세로 × 높이', {
            fontFamily: 'Noto Sans KR', fontSize: '16px', color: '#ffffff', lineSpacing: 10
        });

        // 공식 하이라이트
        const fBox = this.add.graphics();
        UI.drawCyberBox(fBox, 150, 340, 300, 70, COLORS.bgCard, 0.9, COLORS.success);
        this.add.text(300, 360, '핵심 공식', { fontFamily: 'Noto Sans KR', fontSize: '14px', color: '#94a3b8' }).setOrigin(0.5);
        this.add.text(300, 390, 'V = a × b × c', {
            fontFamily: 'Orbitron', fontSize: '28px', color: '#10b981', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(300, 440, '단위: cm³ (세제곱센티미터)', {
            fontFamily: 'Noto Sans KR', fontSize: '16px', color: '#94a3b8'
        }).setOrigin(0.5);

        this.createButton(300, 530, '시스템 재부팅', 200, 50, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.time.delayedCall(300, () => this.scene.start('HookScene'));
        });
        this.cameras.main.fadeIn(500, 0, 0, 0);

        // 종료 파티클
        for (let i = 0; i < 30; i++) {
            const spark = this.add.rectangle(Phaser.Math.Between(0, 600), -20, 4, 10, COLORS.success);
            this.tweens.add({
                targets: spark, y: 620, alpha: 0,
                duration: Phaser.Math.Between(1500, 3500),
                delay: Phaser.Math.Between(0, 1000), repeat: -1
            });
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 게임 설정
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
