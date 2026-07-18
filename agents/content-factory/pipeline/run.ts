#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { mkdir, readdir } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { runAssetsStage } from "./stages/assets";
import { runBuildStage } from "./stages/build";
import {
  assertSafeContentId, DEFAULT_RENDER_MODE, DIFFICULTY_TO_GRADE, RENDER_MODES,
  type Difficulty, type FactoryContext, type RenderMode,
} from "./stages/common";
import { runPlanStage } from "./stages/plan";
import { runPublishStage } from "./stages/publish";
import { runQaStage, runStaticQa } from "./stages/qa";
import { runStoryboardStage } from "./stages/storyboard";
import { getFactoryLlmConfig } from "./lib/engine";

const HELP = `AI 콘텐츠 팩토리

사법 1 (interest 모드, 기본):
  bun run factory -- --topic <주제> --grade <학년> --subject <교과> [옵션]

사법 2 (problem 모드, 문제 → 재미있게 변환):
  bun run factory -- --mode problem --problem "<문제 텍스트>" --difficulty <쉬움|보통|어려움> [옵션]

필수 인자 (interest 모드):
  --topic <문자열>       학습 주제
  --grade <학년>         elementary-1..6, middle-1..3, high-1..3
  --subject <교과>       kebab-case slug (math, science, english, coding, toeic, ...)

필수 인자 (problem 모드):
  --problem <문자열>     변환할 원본 문제 텍스트
  --difficulty <난이도>  easy | medium | hard
  --subject <교과>       선택 (생략 시 AI가 problem에서 추론)

옵션 (공통):
  --mode <모드>          interest | problem (기본값 interest)
  --type <유형>          simulation | game | quiz | exploration | story
  --render-mode <방식>   3d | 3d-game | canvas-game | svg | dom (기본값 3d)
  --id <슬러그>          콘텐츠 고유 id
  --skip-images          신규 이미지 생성을 건너뜀
  --stage <단계>         plan | storyboard | assets | build | qa | publish만 실행
  --force                기존 단계 산출물을 다시 생성(퍼블리시는 같은 id 교체)
  --help                 도움말 표시

개발용: --stage qa --id <기존 콘텐츠 id>는 기존 콘텐츠에 QA를 적용합니다.`;

const STAGES = ["plan", "storyboard", "assets", "build", "qa", "publish"] as const;
type Stage = (typeof STAGES)[number];
type ContentType = "simulation" | "game" | "quiz" | "exploration" | "story";
type CliMode = "interest" | "problem";

interface CliOptions {
  mode: CliMode;
  topic?: string;
  grade?: string;
  subject?: string;
  type?: ContentType;
  renderMode?: RenderMode;
  id?: string;
  stage?: Stage;
  // problem mode
  problem?: string;
  difficulty?: Difficulty;
  skipImages: boolean;
  force: boolean;
  help: boolean;
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = { mode: "interest", skipImages: false, force: false, help: false };
  const valueFlags = new Set([
    "--mode", "--topic", "--grade", "--subject", "--type", "--render-mode",
    "--id", "--stage", "--problem", "--difficulty",
  ]);
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (flag === "--skip-images") options.skipImages = true;
    else if (flag === "--force") options.force = true;
    else if (flag === "--help" || flag === "-h") options.help = true;
    else if (valueFlags.has(flag)) {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${flag} 값이 필요합니다.`);
      index += 1;
      if (flag === "--mode") {
        if (value !== "interest" && value !== "problem") throw new Error(`--mode는 interest 또는 problem이어야 합니다.`);
        options.mode = value;
      }
      else if (flag === "--topic") options.topic = value;
      else if (flag === "--grade") options.grade = value;
      else if (flag === "--subject") options.subject = value;
      else if (flag === "--type") options.type = value as ContentType;
      else if (flag === "--render-mode") options.renderMode = value as RenderMode;
      else if (flag === "--id") options.id = value;
      else if (flag === "--problem") options.problem = value;
      else if (flag === "--difficulty") {
        if (!["easy", "medium", "hard"].includes(value)) {
          throw new Error(`--difficulty는 easy | medium | hard 중 하나여야 합니다.`);
        }
        options.difficulty = value as Difficulty;
      }
      else options.stage = value as Stage;
    } else throw new Error(`알 수 없는 인자입니다: ${flag}`);
  }
  return options;
}

function hash(value: string): string {
  let result = 2166136261;
  for (const char of value) result = Math.imul(result ^ char.codePointAt(0)!, 16777619);
  return (result >>> 0).toString(36);
}

export function slugify(topic: string): string {
  const normalized = topic.trim().normalize("NFKD").toLowerCase();
  const ascii = normalized
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!ascii) return `content-${hash(normalized)}`;
  const hasNonAscii = Array.from(normalized).some((char) => (char.codePointAt(0) ?? 0) > 127);
  return hasNonAscii ? `${ascii}-${hash(normalized)}` : ascii;
}

function gradeLevel(grade: string): FactoryContext["gradeLevel"] {
  const level = grade.split("-")[0];
  if (level === "elementary" || level === "middle" || level === "high") return level;
  throw new Error(`지원하지 않는 학년입니다: ${grade}`);
}

async function findDirectoryById(base: string, id: string): Promise<string | undefined> {
  for (const entry of await readdir(base, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const path = join(base, entry.name);
    if (entry.name === id && existsSync(join(path, "index.html"))) return path;
    const nested = await findDirectoryById(path, id);
    if (nested) return nested;
  }
}

function validateOptions(options: CliOptions): void {
  if (options.stage && !STAGES.includes(options.stage)) throw new Error(`지원하지 않는 단계입니다: ${options.stage}`);
  // CLI도 임의의 kebab-case subject 슬러그를 허용 (math, science, english, coding, toeic, ...)
  if (options.subject && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(options.subject)) {
    throw new Error(`지원하지 않는 교과 형태입니다(kebab-case slug 필요): ${options.subject}`);
  }
  if (options.type && !["simulation", "game", "quiz", "exploration", "story"].includes(options.type)) {
    throw new Error(`지원하지 않는 콘텐츠 유형입니다: ${options.type}`);
  }
  if (options.renderMode && !RENDER_MODES.includes(options.renderMode)) {
    throw new Error(`지원하지 않는 제작 방식입니다: ${options.renderMode}`);
  }
  if (options.grade && !/^(elementary-[1-6]|middle-[1-3]|high-[1-3])$/.test(options.grade)) {
    throw new Error(`학년 형식이 올바르지 않습니다: ${options.grade}`);
  }
  if (options.topic !== undefined && options.topic.trim().length === 0) {
    throw new Error("--topic은 비어 있지 않은 문자열이어야 합니다.");
  }
  if (options.id !== undefined) assertSafeContentId(options.id);

  // 모드별 필수 필드 검증
  if (options.mode === "problem") {
    if (!options.problem || options.problem.trim().length < 5) {
      throw new Error("--mode problem에는 --problem(5자 이상)이 필요합니다.");
    }
    if (!options.difficulty) {
      throw new Error("--mode problem에는 --difficulty(easy|medium|hard)가 필요합니다.");
    }
    if (options.topic) {
      throw new Error("--mode problem에서는 --topic 대신 --problem을 사용하세요.");
    }
    if (options.grade) {
      throw new Error("--mode problem에서는 --grade 대신 --difficulty를 사용하세요.");
    }
  } else {
    // interest 모드 (기본)
    if (!options.topic) {
      throw new Error("interest 모드에는 --topic이 필요합니다. problem 모드는 --mode problem을 추가하세요.");
    }
  }
}

async function createContext(options: CliOptions): Promise<FactoryContext> {
  const rootDir = resolve(import.meta.dir, "../../..");
  const factoryDir = join(rootDir, "agents/content-factory");
  const llmProvider = getFactoryLlmConfig().provider;

  // 모드별 topic/grade/subject 도출
  let topic: string;
  let grade: string;
  let subject: string | undefined;
  let difficulty: Difficulty | undefined;
  let problem: string | undefined;

  if (options.mode === "problem") {
    problem = options.problem!.trim();
    topic = problem;
    grade = DIFFICULTY_TO_GRADE[options.difficulty!];
    difficulty = options.difficulty;
    subject = options.subject; // 선택 (없으면 'general'로 시작, plan LLM이 추론)
  } else {
    topic = options.topic!.trim();
    if (!options.grade) throw new Error("interest 모드에는 --grade가 필요합니다.");
    grade = options.grade;
    if (!options.subject) throw new Error("interest 모드에는 --subject가 필요합니다.");
    subject = options.subject;
  }

  const id = options.id ?? slugify(topic);
  let level = gradeLevel(grade);
  let contentDir: string | undefined;

  if (options.stage === "qa" && options.id && (!subject || !level)) {
    contentDir = await findDirectoryById(join(rootDir, "public/contents"), options.id);
    if (!contentDir) throw new Error(`기존 콘텐츠를 찾지 못했습니다: ${options.id}`);
    const parts = relative(join(rootDir, "public/contents"), contentDir).split(/[\\/]/);
    subject = parts[0];
    level = parts[1] as FactoryContext["gradeLevel"];
    grade = grade === DIFFICULTY_TO_GRADE[options.difficulty ?? "medium"]
      ? `${level}-1`
      : grade;
  }

  // problem 모드에서 subject가 없으면 임시 'general'로 시작 (plan 이후 보정)
  const effectiveSubject = subject ?? "general";
  contentDir ??= join(rootDir, "public/contents", effectiveSubject, level, id);
  const runDir = join(factoryDir, "runs", id);
  const isExistingQa = options.stage === "qa" && options.id && !topic;
  if (!isExistingQa && existsSync(contentDir) && !options.force &&
      !existsSync(join(runDir, "plan.json"))) {
    throw new Error(`기존 콘텐츠를 보호하기 위해 중단했습니다: ${contentDir} (--force 필요)`);
  }
  if (options.stage) assertStagePrerequisites(options.stage, runDir, isExistingQa);
  await mkdir(runDir, { recursive: true });
  return {
    rootDir, factoryDir, runDir, contentDir, id,
    topic,
    grade, gradeLevel: level, subject: effectiveSubject, type: options.type,
    renderMode: options.renderMode ?? DEFAULT_RENDER_MODE,
    force: options.force, skipImages: options.skipImages || llmProvider === "zai", llmProvider,
    existingContentQa: isExistingQa,
    // problem 모드 메타데이터 (plan.ts가 분기에 사용)
    mode: options.mode,
    problem,
    difficulty,
  };
}

export function assertStagePrerequisites(stage: Stage, runDir: string, existingContentQa: boolean): void {
  const required = stage === "storyboard" ? ["plan.json"]
    : stage === "assets" ? ["storyboard.json"]
      : stage === "build" || (stage === "qa" && !existingContentQa)
        ? ["plan.json", "storyboard.json", "assets.json"]
        : stage === "publish"
          ? ["plan.json", "storyboard.json", "assets.json", "qa-report.json"] : [];
  const missing = required.filter((file) => !existsSync(join(runDir, file)));
  if (missing.length > 0) {
    throw new Error(`${stage} 단계 선행 산출물이 없습니다: ${missing.join(", ")}`);
  }
}

async function executeStage(stage: Stage, context: FactoryContext): Promise<void> {
  if (stage === "plan") await runPlanStage(context);
  else if (stage === "storyboard") await runStoryboardStage(context);
  else if (stage === "assets") await runAssetsStage(context);
  else if (stage === "build") await runBuildStage(context);
  else if (stage === "qa") {
    if (context.existingContentQa) {
      const report = await runStaticQa({
        contentDir: context.contentDir,
        reportPath: join(context.runDir, "qa-report.json"),
      });
      if (!report.passed) throw new Error(`기존 콘텐츠 정적 QA 실패:\n- ${report.errors.join("\n- ")}`);
    } else await runQaStage(context, (revision) => runBuildStage(context, revision));
  }
  else await runPublishStage(context);
}

async function main(): Promise<void> {
  const options = parseArgs(Bun.argv.slice(2));
  if (options.help) { console.log(HELP); return; }
  validateOptions(options);
  // 기존 콘텐츠 QA 단독 실행은 topic/problem 없이 --stage qa --id <id>로 진입 허용
  if (!options.topic && !options.problem &&
      !(options.stage === "qa" && options.id)) {
    throw new Error("interest 모드는 --topic이, problem 모드는 --problem이 필요합니다. --help로 확인하세요.");
  }
  const context = await createContext(options);
  const stages = options.stage ? [options.stage] : [...STAGES];
  for (const stage of stages) {
    assertStagePrerequisites(stage, context.runDir, context.existingContentQa === true);
    console.log(`[팩토리] ${stage} 단계 시작`);
    await executeStage(stage, context);
    console.log(`[팩토리] ${stage} 단계 완료`);
  }
  console.log(`[팩토리] 완료: ${context.contentDir}`);
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(`[팩토리] 실패: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
