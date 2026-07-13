import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { runCodexText } from "../lib/codex";
import { listSharedAssets } from "../lib/assets";
import {
  assertAssetPlan, assertAssetPlanContext, assertPlan, assertStoryboard, validateManifest, validateStageOutput,
  stageOutputValidationError,
  type ContentManifest, type JudgeOutput,
  type AssetPlan,
} from "../lib/validate";
import { digestValue, readJson, readPrompt, type FactoryContext } from "./common";

export type QaCheckStatus = "pass" | "fail";

export interface QaCheck {
  id: string;
  name: string;
  status: QaCheckStatus;
  errors: string[];
}

export interface QaReport {
  passed: boolean;
  contentDir: string;
  checkedAt: string;
  checks: QaCheck[];
  errors: string[];
  judge?: JudgeOutput;
  attempt?: number;
  artifacts: Array<{ path: string; sha256: string }>;
  qaInputDigest?: string;
}

export interface StaticQaOptions {
  contentDir: string;
  reportPath?: string;
  assetPlan?: AssetPlan;
}

const REQUIRED_FILES = ["index.html", "style.css", "script.js", "manifest.json"];
const SCENES = ["hook", "story", "core", "quiz", "wrap"];
const IMAGE_EXTENSIONS = /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i;
const STATIC_CHECK_IDS = new Set([
  "required-files", "manifest-schema", "manifest-path", "stylesheet-order", "five-scenes",
  "engine-contract", "reduced-motion", "image-files", "no-external-script", "learning-text",
]);

async function exists(path: string): Promise<boolean> {
  try {
    const value = await stat(path);
    return value.isFile() && value.size > 0;
  } catch {
    return false;
  }
}

function check(id: string, name: string, errors: string[]): QaCheck {
  return { id, name, status: errors.length === 0 ? "pass" : "fail", errors };
}

function extractAttributeSources(text: string): string[] {
  const sources: string[] = [];
  for (const match of text.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) sources.push(match[1]);
  for (const match of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) sources.push(match[1]);
  return sources;
}

function isLocalImage(source: string): boolean {
  return IMAGE_EXTENSIONS.test(source) &&
    !/^(?:data:|blob:|https?:|\/\/)/i.test(source) && !source.startsWith("#");
}

function resolveAsset(contentDir: string, sourceFile: string, source: string): string | null {
  const clean = source.replace(/[?#].*$/, "");
  const path = isAbsolute(clean)
    ? resolve(contentDir, "../../../..", `.${clean}`)
    : resolve(dirname(sourceFile), clean);
  const publicRoot = resolve(contentDir, "../../../..");
  return relative(publicRoot, path).startsWith("..") ? null : path;
}

function sceneExists(name: string, html: string, script: string): boolean {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:id|data-scene)\\s*=\\s*["'][^"']*${escaped}[^"']*["']`, "i").test(html) ||
    new RegExp(`["']${escaped}["']\\s*[:),]`, "i").test(script) ||
    new RegExp(`(?:class|function)\\s+${escaped}Scene\\b`, "i").test(script);
}

function engineContractErrors(script: string): string[] {
  const requirements: Array<[RegExp, string]> = [
    [/class\s+Scene\b/, "class Scene이 인라인되어야 합니다."],
    [/class\s+EduFlixEngine\b/, "class EduFlixEngine이 인라인되어야 합니다."],
    [/\bEngine\.init\s*\(/, "Engine.init(data) 호출이 필요합니다."],
    [/\[\s*["']hook["']\s*,\s*["']story["']\s*,\s*["']core["']\s*,\s*["']quiz["']\s*,\s*["']wrap["']\s*\]/,
      "씬 순서는 hook→story→core→quiz→wrap이어야 합니다."],
    [/interaction\.onInit/, "interaction.onInit(container, engine) 호출이 필요합니다."],
    [/\bonInit\s*:\s*(?:function\s*)?\(?\s*\w+\s*,\s*\w+/, "onInit은 container와 engine을 받아야 합니다."],
    [/\.showFeedback\s*\(/, "core 상호작용은 showFeedback을 호출해야 합니다."],
    [/\.enableNext\s*\(/, "core 완료 시 enableNext를 호출해야 합니다."],
    [/postMessage\s*\(\s*["']close["']\s*,\s*["']\*["']\s*\)/,
      "wrap 홈 버튼은 postMessage('close', '*')를 호출해야 합니다."],
  ];
  return requirements.flatMap(([pattern, message]) => pattern.test(script) ? [] : [message]);
}

async function readRequiredFiles(contentDir: string): Promise<{
  html: string; css: string; script: string; manifestText: string; checks: QaCheck[];
}> {
  const missing: string[] = [];
  for (const file of REQUIRED_FILES) {
    if (!(await exists(resolve(contentDir, file)))) missing.push(`필수 파일이 없습니다: ${file}`);
  }
  const checks = [check("required-files", "필수 파일 4종", missing)];
  const read = async (name: string) => exists(resolve(contentDir, name))
    ? readFile(resolve(contentDir, name), "utf8") : "";
  const [html, css, script, manifestText] = await Promise.all([
    read("index.html"), read("style.css"), read("script.js"), read("manifest.json"),
  ]);
  return { html, css, script, manifestText, checks };
}

function parseManifest(text: string): { manifest?: ContentManifest; errors: string[] } {
  if (!text) return { errors: ["manifest.json을 읽을 수 없습니다."] };
  try {
    const result = validateManifest(JSON.parse(text));
    return { manifest: result.value, errors: result.errors };
  } catch (error) {
    return { errors: [`manifest.json이 올바른 JSON이 아닙니다: ${error instanceof Error ? error.message : String(error)}`] };
  }
}

async function imageErrors(
  contentDir: string, html: string, css: string, script: string,
  manifest?: ContentManifest, assetPlan?: AssetPlan,
): Promise<string[]> {
  const htmlPath = resolve(contentDir, "index.html");
  const cssPath = resolve(contentDir, "style.css");
  const scriptPath = resolve(contentDir, "script.js");
  const contentSources = [
    ...extractAttributeSources(html).filter(isLocalImage).map((source) => [htmlPath, source] as const),
    ...extractAttributeSources(css).filter(isLocalImage).map((source) => [cssPath, source] as const),
    ...extractAttributeSources(script).filter(isLocalImage).map((source) => [scriptPath, source] as const),
  ];
  const sources = [...contentSources];
  if (manifest?.thumbnail && isLocalImage(manifest.thumbnail)) {
    sources.push([resolve(contentDir, "manifest.json"), manifest.thumbnail]);
  }
  const errors: string[] = [];
  for (const [sourceFile, source] of sources) {
    const path = resolveAsset(contentDir, sourceFile, source);
    if (!path) errors.push(`공개 디렉터리 밖의 이미지는 참조할 수 없습니다: ${source}`);
    else if (!(await exists(path))) errors.push(`참조한 이미지 파일이 없거나 비어 있습니다: ${source}`);
  }
  if (assetPlan) {
    const contentUsed = new Set(contentSources.map(([sourceFile, source]) =>
      resolveAsset(contentDir, sourceFile, source)).filter((path): path is string => path !== null));
    const generatedPngs = assetPlan.generated.filter((asset) => /\.png$/i.test(asset.fileName))
      .map((asset) => join(contentDir, asset.fileName));
    if (generatedPngs.length > 0 && !generatedPngs.some((path) => contentUsed.has(path))) {
      errors.push("생성 PNG 중 하나 이상을 index.html, script.js 또는 style.css 콘텐츠 코드에서 참조해야 합니다.");
    }
    const used = new Set(sources.map(([sourceFile, source]) => resolveAsset(contentDir, sourceFile, source))
      .filter((path): path is string => path !== null));
    const planned = [
      ...assetPlan.generated.map((asset) => join(contentDir, asset.fileName)),
      ...(Array.isArray(assetPlan.reused) ? assetPlan.reused.flatMap((asset) =>
        typeof asset === "object" && asset !== null && typeof (asset as { sourcePath?: unknown }).sourcePath === "string"
          ? [resolveAsset(contentDir, resolve(contentDir, "manifest.json"), (asset as { sourcePath: string }).sourcePath)] : []) : []),
    ].filter((path): path is string => path !== null);
    for (const path of planned) if (!used.has(path)) {
      errors.push(`계획된 이미지가 실제 콘텐츠에서 사용되지 않았습니다: ${relative(contentDir, path)}`);
    }
  }
  return errors;
}

async function artifactDigests(
  contentDir: string, html: string, css: string, manifest?: ContentManifest,
): Promise<Array<{ path: string; sha256: string }>> {
  const publicRoot = resolve(contentDir, "../../../..");
  const paths = new Set(REQUIRED_FILES.map((file) => resolve(contentDir, file)));
  const sources = [
    ...extractAttributeSources(html).filter(isLocalImage).map((source) => [resolve(contentDir, "index.html"), source] as const),
    ...extractAttributeSources(css).filter(isLocalImage).map((source) => [resolve(contentDir, "style.css"), source] as const),
  ];
  if (manifest?.thumbnail && isLocalImage(manifest.thumbnail)) {
    sources.push([resolve(contentDir, "manifest.json"), manifest.thumbnail]);
  }
  for (const [sourceFile, source] of sources) {
    const path = resolveAsset(contentDir, sourceFile, source);
    if (path) paths.add(path);
  }
  const result: Array<{ path: string; sha256: string }> = [];
  for (const path of [...paths].sort()) {
    if (!await exists(path)) continue;
    result.push({ path: relative(publicRoot, path).split(/[\\/]/).join("/"),
      sha256: createHash("sha256").update(await readFile(path)).digest("hex") });
  }
  return result;
}

export function assertQaPassed(report: unknown, contentDir?: string): void {
  const value = report as {
    passed?: unknown; contentDir?: unknown; errors?: unknown; checks?: unknown; judge?: unknown;
  };
  const checkIds = Array.isArray(value?.checks)
    ? value.checks.map((item) => String((item as { id?: unknown })?.id)) : [];
  const checksPass = Array.isArray(value?.checks) && value.checks.length === STATIC_CHECK_IDS.size &&
    new Set(checkIds).size === STATIC_CHECK_IDS.size &&
    value.checks.every((item) => typeof item === "object" && item !== null &&
      (item as { status?: unknown }).status === "pass" &&
      STATIC_CHECK_IDS.has(String((item as { id?: unknown }).id)));
  const judge = validateStageOutput<{ passed: boolean }>("judge", value?.judge);
  const sameContent = !contentDir || (typeof value?.contentDir === "string" &&
    resolve(value.contentDir) === resolve(contentDir));
  if (typeof report !== "object" || report === null || value.passed !== true ||
      !Array.isArray(value.errors) || value.errors.length !== 0 || !checksPass ||
      !judge.valid || judge.value?.passed !== true || !sameContent) {
    throw new Error("성공한 QA 게이트 보고서가 없어 퍼블리시할 수 없습니다.");
  }
}

export async function assertQaArtifactsCurrent(report: unknown, context: FactoryContext): Promise<void> {
  const value = report as { artifacts?: unknown; qaInputDigest?: unknown };
  if (!Array.isArray(value.artifacts) || value.artifacts.length < 4) {
    throw new Error("QA 대상 파일 digest가 없어 퍼블리시할 수 없습니다.");
  }
  const publicRoot = resolve(context.rootDir, "public");
  const seen = new Set<string>();
  for (const item of value.artifacts) {
    const path = typeof item === "object" && item !== null ? (item as { path?: unknown }).path : undefined;
    const expected = typeof item === "object" && item !== null ? (item as { sha256?: unknown }).sha256 : undefined;
    if (typeof path !== "string" || typeof expected !== "string" || seen.has(path)) {
      throw new Error("QA 대상 파일 digest 목록이 손상되었습니다.");
    }
    seen.add(path);
    const absolute = resolve(publicRoot, path);
    if (relative(publicRoot, absolute).startsWith("..")) throw new Error("QA digest 경로가 공개 디렉터리를 벗어납니다.");
    let actual: string;
    try { actual = createHash("sha256").update(await readFile(absolute)).digest("hex"); }
    catch { throw new Error(`QA 이후 대상 파일이 없어졌습니다: ${path}`); }
    if (actual !== expected) throw new Error(`QA 이후 대상 파일이 변경되었습니다: ${path}`);
  }
  const required = REQUIRED_FILES
    .map((file) => relative(publicRoot, join(context.contentDir, file)).split(/[\\/]/).join("/"));
  if (!required.every((path) => seen.has(path))) throw new Error("QA 핵심 파일 digest가 불완전합니다.");
  const [plan, storyboard, assets] = await Promise.all([
    readJson(join(context.runDir, "plan.json")), readJson(join(context.runDir, "storyboard.json")),
    readJson(join(context.runDir, "assets.json")),
  ]);
  if (value.qaInputDigest !== digestValue({ plan, storyboard, assets })) {
    throw new Error("QA 이후 상위 단계 입력이 변경되었습니다.");
  }
}

export async function canResumeQa(context: FactoryContext): Promise<boolean> {
  if (context.force || !await exists(join(context.runDir, "qa-report.json"))) return false;
  try {
    const report = await readJson(join(context.runDir, "qa-report.json"));
    assertQaPassed(report, context.contentDir);
    await assertQaArtifactsCurrent(report, context);
    return true;
  } catch {
    return false;
  }
}

async function appendStaticChecks(
  contentDir: string, html: string, css: string, script: string,
  manifest: ContentManifest | undefined, checks: QaCheck[], assetPlan?: AssetPlan,
): Promise<void> {
  const pathErrors: string[] = [];
  if (manifest) {
    const expected = `/contents/${manifest.subject}/${manifest.gradeLevel}/${manifest.id}/index.html`;
    if (manifest.path !== expected) {
      pathErrors.push(`manifest.path는 '${expected}'여야 합니다.`);
    }
    const publicRoot = resolve(contentDir, "../../../..");
    const actualPath = `/${relative(publicRoot, contentDir).split(/[\\/]/).join("/")}/index.html`;
    if (manifest.path !== actualPath) {
      pathErrors.push(`manifest.path가 실제 콘텐츠 위치 '${actualPath}'와 일치해야 합니다.`);
    }
  } else pathErrors.push("manifest가 유효하지 않아 path 규칙을 확인할 수 없습니다.");
  checks.push(check("manifest-path", "manifest 경로 규칙", pathErrors));

  const styleIndex = html.search(/href\s*=\s*["'][^"']*style\.css[^"']*["']/i);
  const mobileIndex = html.search(/href\s*=\s*["']\.\.\/\.\.\/\.\.\/common\/mobile\.css["']/i);
  const linkErrors = styleIndex >= 0 && mobileIndex > styleIndex
    ? [] : ["index.html에서 style.css 다음에 ../../../common/mobile.css를 링크해야 합니다."];
  checks.push(check("stylesheet-order", "공통 모바일 CSS 링크 순서", linkErrors));

  const missingScenes = SCENES.filter((name) => !sceneExists(name, html, script));
  checks.push(check("five-scenes", "필수 장면 5종", missingScenes.map((name) => `'${name}' 장면이 없습니다.`)));
  checks.push(check("engine-contract", "인라인 EduFlixEngine 런타임 계약", engineContractErrors(script)));

  const reducedMotion = /@media\s*\([^)]*prefers-reduced-motion\s*:\s*reduce[^)]*\)/i.test(css) ||
    /matchMedia\s*\(\s*["'][^"']*prefers-reduced-motion/i.test(script);
  checks.push(check("reduced-motion", "동작 줄이기 접근성", reducedMotion ? [] : ["prefers-reduced-motion 처리가 없습니다."]));

  checks.push(check("image-files", "이미지 참조·계획 완결성",
    await imageErrors(contentDir, html, css, script, manifest, assetPlan)));

  const externalScripts = [...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["'](https?:\/\/|\/\/)[^"']+["'][^>]*>/gi)];
  checks.push(check("no-external-script", "외부 CDN 스크립트 금지",
    externalScripts.length === 0 ? [] : ["외부 CDN 스크립트 의존성이 있습니다."]));

  const titleText = html.match(/<title\b[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
  const objectiveExists = /학습\s*목표|배울\s*내용|오늘의\s*목표/.test(`${html}\n${script}`);
  const textErrors: string[] = [];
  if (!titleText) textErrors.push("비어 있지 않은 <title> 텍스트가 필요합니다.");
  if (!objectiveExists) textErrors.push("학습목표 텍스트가 필요합니다.");
  checks.push(check("learning-text", "제목과 학습목표 텍스트", textErrors));
}

export async function runStaticQa(options: StaticQaOptions): Promise<QaReport> {
  const contentDir = resolve(options.contentDir);
  const { html, css, script, manifestText, checks } = await readRequiredFiles(contentDir);
  const parsed = parseManifest(manifestText);
  checks.push(check("manifest-schema", "manifest 12필드 스키마", parsed.errors));
  await appendStaticChecks(contentDir, html, css, script, parsed.manifest, checks, options.assetPlan);

  const errors = checks.flatMap((item) => item.errors.map((error) => `[${item.name}] ${error}`));
  const report: QaReport = {
    passed: errors.length === 0,
    contentDir,
    checkedAt: new Date().toISOString(),
    checks,
    errors,
    artifacts: await artifactDigests(contentDir, html, css, parsed.manifest),
  };
  if (options.reportPath) {
    await writeFile(resolve(options.reportPath), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  return report;
}

function judgeFailureInstructions(judge: JudgeOutput): string[] {
  return judge.criteria.flatMap((item) => {
    if (item.status === "pass") return [];
    return [`품질 체크 ${item.id} 미달${item.fix ? `: ${item.fix}` : ""}`];
  });
}

async function runJudge(context: FactoryContext, attempt: number, staticReport: QaReport): Promise<JudgeOutput> {
  const judgePath = join(context.runDir, `qa-judge-${attempt}.json`);
  const prompt = [
    await readPrompt(context, "05-judge.md"),
    "",
    "다음 생성물을 직접 읽고 품질 체크리스트 22항목을 심사하세요.",
    `콘텐츠 디렉터리: ${context.contentDir}`,
    `기획 JSON: ${join(context.runDir, "plan.json")}`,
    `스토리보드 JSON: ${join(context.runDir, "storyboard.json")}`,
    `에셋 계획 JSON: ${join(context.runDir, "assets.json")}`,
    `체크리스트 JSON: ${join(context.factoryDir, "checklists/quality-gate.json")}`,
    `정적 검사 결과: ${JSON.stringify(staticReport)}`,
    "05-judge.md에 정의한 passed, summary, criteria, failedIds, revisionBrief 형식의 JSON만 반환하세요.",
  ].join("\n");
  await runCodexText({
    prompt, outFile: judgePath,
    schemaFile: join(context.factoryDir, "schemas/judge.schema.json"),
    validateOutput: (text) => stageOutputValidationError("judge", text),
  });
  let value: unknown;
  try {
    value = JSON.parse(await readFile(judgePath, "utf8"));
  } catch (error) {
    throw new Error(`LLM 심사 결과 JSON을 읽을 수 없습니다: ${String(error)}`);
  }
  const validated = validateStageOutput<JudgeOutput>("judge", value);
  if (!validated.valid || !validated.value) {
    throw new Error(`LLM 심사 결과 검증 실패:\n- ${validated.errors.join("\n- ")}`);
  }
  return validated.value;
}

async function saveReport(context: FactoryContext, report: QaReport): Promise<void> {
  const path = join(context.runDir, "qa-report.json");
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

export async function runQaStage(
  context: FactoryContext,
  rebuild?: (revision: string) => Promise<void>,
): Promise<void> {
  if (await canResumeQa(context)) return;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const [plan, storyboard, assets] = await Promise.all([
      readJson(join(context.runDir, "plan.json")), readJson(join(context.runDir, "storyboard.json")),
      readJson<AssetPlan>(join(context.runDir, "assets.json")),
    ]);
    assertPlan(plan);
    assertStoryboard(storyboard);
    assertAssetPlan(assets);
    assertAssetPlanContext(assets, storyboard, await listSharedAssets(context.rootDir),
      { skipImages: context.skipImages, contentId: context.id });
    const staticReport = await runStaticQa({ contentDir: context.contentDir, assetPlan: assets });
    const judge = await runJudge(context, attempt, staticReport);
    const judgeErrors = judgeFailureInstructions(judge);
    const errors = [...staticReport.errors, ...judgeErrors];
    const report: QaReport = {
      ...staticReport,
      passed: errors.length === 0,
      errors,
      judge,
      attempt,
      qaInputDigest: digestValue({ plan, storyboard, assets }),
    };
    await saveReport(context, report);
    if (report.passed) return;

    if (attempt === 3 || !rebuild) {
      throw new Error(`QA 게이트 실패:\n- ${errors.join("\n- ")}`);
    }
    const judgeRevision = judge.revisionBrief.instructions.join("\n");
    const revision = [
      `QA ${attempt}차 검사 미달 항목을 수정하세요.`,
      ...errors.map((error) => `- ${error}`),
      judgeRevision.trim() ? `\nLLM 심사 수정 지시:\n${judgeRevision}` : "",
    ].filter(Boolean).join("\n");
    await rebuild(revision);
  }
}

async function main(): Promise<void> {
  const contentDir = process.argv[2];
  const reportFlag = process.argv.indexOf("--report");
  if (!contentDir) {
    console.error("사용법: bun qa.ts <콘텐츠 디렉터리> [--report <qa-report.json>]");
    process.exitCode = 2;
    return;
  }
  const reportPath = reportFlag >= 0 ? process.argv[reportFlag + 1] : undefined;
  if (reportFlag >= 0 && !reportPath) {
    console.error("--report 뒤에 리포트 경로가 필요합니다.");
    process.exitCode = 2;
    return;
  }
  const report = await runStaticQa({ contentDir, reportPath });
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.passed ? 0 : 1;
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(`QA 실행 실패: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
