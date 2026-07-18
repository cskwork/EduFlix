#!/bin/bash
# EduFlix 마스코트 생성 스크립트 (GPT Image 2 via Codex CLI)
# 첫 이미지를 레퍼런스로 삼아 포즈 파생 생성 → 캐릭터 일관성 유지
set -u

GEN="/Users/danny/.claude/skills/gpt-image-2/scripts/gen.sh"
OUT_DIR="/Users/danny/Documents/PARA/Resource/EduFlix/public/mascot"
mkdir -p "$OUT_DIR"

BASE_CHAR="An original cute fluffy monster mascot for a kids' education app (original design, NOT any existing IP). Soft cream-colored plush fur, tall pointed bunny-like ears, huge round sparkling dark-brown eyes with big highlights, a wide mischievous grin showing a neat row of tiny rounded white teeth, small chubby body with a pastel-peach round belly, short stubby arms and legs. Collectible designer art-toy aesthetic, soft 3D render, soft studio lighting, detailed fur texture, vibrant and kid-friendly. Full body, centered, isolated on a plain pure white background."

echo "[1/5] master (wave)"
bash "$GEN" --prompt "$BASE_CHAR Pose: standing and waving hello with one paw raised high, friendly welcoming smile." \
  --out "$OUT_DIR/mascot-wave.png" || { echo "FAIL wave"; exit 1; }

REF="$OUT_DIR/mascot-wave.png"
SAME="Same exact character as the reference image - keep the fur color, ear shape, eye style, teeth grin, body proportions and art-toy 3D render style perfectly identical. Plain pure white background, full body, centered. Change ONLY the pose:"

echo "[2/5] cheer"
bash "$GEN" --prompt "$SAME jumping mid-air with both arms raised in celebration, super happy open-mouth smile, a few colorful confetti pieces floating around." \
  --ref "$REF" --out "$OUT_DIR/mascot-cheer.png" || echo "FAIL cheer"

echo "[3/5] think"
bash "$GEN" --prompt "$SAME sitting and tilting its head in curiosity, one paw touching its chin, puzzled cute expression, a big glossy 3D question mark floating beside its head." \
  --ref "$REF" --out "$OUT_DIR/mascot-think.png" || echo "FAIL think"

echo "[4/5] book"
bash "$GEN" --prompt "$SAME sitting cross-legged happily reading a big open colorful picture book, wearing tiny round glasses, delighted expression." \
  --ref "$REF" --out "$OUT_DIR/mascot-book.png" || echo "FAIL book"

echo "[5/5] rocket"
bash "$GEN" --prompt "$SAME riding a small cartoon rocket flying diagonally upward, one paw stretched forward like a superhero, excited expression, tiny stars around." \
  --ref "$REF" --out "$OUT_DIR/mascot-rocket.png" || echo "FAIL rocket"

echo "DONE"
ls -la "$OUT_DIR"
