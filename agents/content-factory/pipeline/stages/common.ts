import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";

export interface FactoryContext {
  rootDir: string;
  factoryDir: string;
  runDir: string;
  contentDir: string;
  id: string;
  topic: string;
  grade: string;
  gradeLevel: "elementary" | "middle" | "high";
  subject: "math" | "science" | "english";
  type?: "simulation" | "game" | "quiz" | "exploration" | "story";
  force: boolean;
  skipImages: boolean;
  existingContentQa?: boolean;
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
