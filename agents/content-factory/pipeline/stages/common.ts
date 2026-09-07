import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import type { FactoryLlmProvider } from "../lib/engine";

// 콘텐츠 제작(렌더링) 방식. 3d(Three.js 시뮬레이션)가 기본값이다.
export const RENDER_MODES = ["3d", "3d-game", "canvas-game", "svg", "dom"] as const;
export type RenderMode = (typeof RENDER_MODES)[number];
export const DEFAULT_RENDER_MODE: RenderMode = "3d";

// 생성 모드: 'interest'(관심사 기반) | 'problem'(문제를 재미있게 변환)
export type CreatorMode = "interest" | "problem";
export const DEFAULT_CREATOR_MODE: CreatorMode = "interest";

// 과목 슬러그 패턴 (kebab-case). public/contents/{subject}/ 경로에 직접 사용.
export const SUBJECT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// 기본 제공 과목 (UI 카드용)
export const BUILTIN_SUBJECTS = ["math", "science", "english"] as const;

// 난이도 → 학년 매핑 (저장 경로와 기존 검증을 그대로 활용)
export const DIFFICULTY_TO_GRADE = {
  easy: "elementary-5",
  medium: "middle-2",
  hard: "high-2",
} as const;
export type Difficulty = keyof typeof DIFFICULTY_TO_GRADE;

export function isSubjectSlug(value: unknown): value is string {
  return typeof value === "string" && SUBJECT_SLUG_PATTERN.test(value);
}

export interface FactoryContext {
  rootDir: string;
  factoryDir: string;
  runDir: string;
  contentDir: string;
  id: string;
  topic: string;
  language?: "ko" | "en";
  grade: string;
  gradeLevel: "elementary" | "middle" | "high";
  subject: string; // kebab-case slug (math, science, english, coding, toeic, ...)
  type?: "simulation" | "game" | "quiz" | "exploration" | "story";
  renderMode?: RenderMode;
  force: boolean;
  skipImages: boolean;
  existingContentQa?: boolean;
  interests?: string[];
  additionalContext?: string;
  llmProvider?: FactoryLlmProvider;
  // Option 2 (problem mode) 추가 필드
  mode?: CreatorMode;
  problem?: string;       // 사용자가 입력한 원본 문제
  difficulty?: Difficulty; // UI에서 선택한 난이도
}

export function assertSafeContentId(id: string): void {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    throw new Error("콘텐츠 id는 영문 소문자·숫자·하이픈으로 된 slug여야 합니다.");
  }
}

export async function readPrompt(context: FactoryContext, name: string): Promise<string> {
  const methodology = await readFile(join(context.factoryDir, "prompts", "methodology.md"), "utf8");
  const prompt = await readFile(join(context.factoryDir, "prompts", name), "utf8");
  return `${methodology}\n\n${prompt}`;
}

export function shouldRun(path: string, force: boolean): boolean {
  return force || !existsSync(path);
}

export function digestValue(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export async function shouldRunStage(path: string, force: boolean, inputs: unknown): Promise<boolean> {
  if (force || !existsSync(path)) return true;
  const metadataPath = `${path}.meta.json`;
  if (!existsSync(metadataPath)) {
    throw new Error(`재개 메타데이터가 없어 기존 산출물을 안전하게 재사용할 수 없습니다: ${path} (--force 필요)`);
  }
  const metadata = await readJson<{ inputDigest?: unknown }>(metadataPath);
  if (metadata.inputDigest !== digestValue(inputs)) {
    throw new Error(`단계 입력이 이전 실행과 달라 기존 산출물을 재사용할 수 없습니다: ${path} (--force 필요)`);
  }
  return false;
}

export async function writeStageMetadata(path: string, inputs: unknown): Promise<void> {
  await writeFile(`${path}.meta.json`, `${JSON.stringify({ inputDigest: digestValue(inputs) }, null, 2)}\n`, "utf8");
}

export async function readJson<T>(path: string): Promise<T> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as T;
  } catch (error) {
    throw new Error(`JSON 산출물을 읽을 수 없습니다: ${path} (${String(error)})`);
  }
}
