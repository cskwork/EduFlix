import { existsSync } from "node:fs";
import { copyFile, mkdir, mkdtemp, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { runFactoryFiles } from "../lib/engine";
import { listSharedAssets, resolveAssetPaths } from "../lib/assets";
import {
  assertAssetPlan, assertAssetPlanContext, assertPlan, assertStoryboard, type AssetPlan,
} from "../lib/validate";
import {
  DEFAULT_RENDER_MODE, type FactoryContext, type RenderMode,
  readJson, readPrompt, shouldRunStage, writeStageMetadata,
} from "./common";

// 3D 방식은 Three.js 인라인 엔진 콘텐츠를, 나머지는 DOM 기반 콘텐츠를 모범 사례로 채택한다.
const EXAMPLE_CANDIDATES: Record<"3d" | "2d", string[]> = {
  "3d": [
    "public/contents/math/middle/space-diagonal",
    "public/contents/math/middle/3d-coordinate-system",
    "public/contents/math/elementary/3d-shapes-discovery",
  ],
  "2d": [
    "public/contents/math/middle/probability-coin",
    "public/contents/math/elementary/volume-explorer",
  ],
};

async function findExample(context: FactoryContext, renderMode: RenderMode): Promise<string> {
  const is3d = renderMode === "3d" || renderMode === "3d-game";
  const candidates = [...EXAMPLE_CANDIDATES[is3d ? "3d" : "2d"], ...EXAMPLE_CANDIDATES[is3d ? "2d" : "3d"]]
    .map((path) => join(context.rootDir, path));
  for (const dir of candidates) {
    const script = join(dir, "script.js");
    if (!existsSync(script)) continue;
    const source = await readFile(script, "utf8");
    if (source.includes("class EduFlixEngine") && source.includes("Scene")) return dir;
  }
  throw new Error("인라인 EduFlixEngine 모범 사례를 찾지 못했습니다.");
}

// 작성 시각은 모델 출력을 신뢰하지 않고 서버 시각으로 확정한다 (QA digest 이전 단계라 안전).
// manifest가 JSON이 아니면 그대로 두어 QA manifest-schema 검사가 명확한 오류로 잡게 한다.
async function normalizeManifestCreatedAt(manifestPath: string): Promise<void> {
  let manifest: Record<string, unknown>;
  try {
    const parsed = JSON.parse(await readFile(manifestPath, "utf8"));
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return;
    manifest = parsed as Record<string, unknown>;
  } catch {
    return;
  }
  manifest.createdAt = new Date().toISOString();
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

// subject/grade/gradeLevel/id/path는 저장 경로와 검증 계약에 묶인 구조적 값이라
// LLM이 창의적으로 바꾸면 안 된다. 컨텍스트 기준으로 확정해 덮어쓴다.
async function normalizeManifestStructuralFields(
  manifestPath: string, context: FactoryContext,
): Promise<void> {
  let manifest: Record<string, unknown>;
  try {
    const parsed = JSON.parse(await readFile(manifestPath, "utf8"));
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return;
    manifest = parsed as Record<string, unknown>;
  } catch {
    return;
  }
  manifest.id = context.id;
  manifest.subject = context.subject;
  manifest.grade = context.grade;
  manifest.gradeLevel = context.gradeLevel;
  manifest.path = `/contents/${context.subject}/${context.gradeLevel}/${context.id}/index.html`;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

async function promoteFiles(
  stagingDir: string, contentDir: string, runDir: string, required: string[],
): Promise<void> {
  const backupDir = await mkdtemp(join(runDir, "build-backup-"));
  const backedUp: string[] = [];
  const promoted: string[] = [];
  try {
    for (const file of required) {
      await copyFile(join(stagingDir, file), join(contentDir, `.${file}.factory-next`));
    }
    for (const file of required) {
      const current = join(contentDir, file);
      if (!existsSync(current)) continue;
      await rename(current, join(backupDir, file));
      backedUp.push(file);
    }
    for (const file of required) {
      await rename(join(contentDir, `.${file}.factory-next`), join(contentDir, file));
      promoted.push(file);
    }
  } catch (error) {
    let rollbackError: unknown;
    try {
      for (const file of promoted.reverse()) await rm(join(contentDir, file), { force: true });
      for (const file of backedUp.reverse()) {
        await rename(join(backupDir, file), join(contentDir, file));
      }
    } catch (caught) { rollbackError = caught; }
    if (rollbackError) throw new Error(`빌드 승격 실패 후 복원에도 실패했습니다: ${String(rollbackError)}`, { cause: error });
    throw error;
  } finally {
    await Promise.all(required.map((file) =>
      rm(join(contentDir, `.${file}.factory-next`), { recursive: true, force: true })));
    await rm(backupDir, { recursive: true, force: true });
  }
}

export async function runBuildStage(context: FactoryContext, revision = ""): Promise<void> {
  const required = ["index.html", "style.css", "script.js", "manifest.json"];
  const renderMode = context.renderMode ?? DEFAULT_RENDER_MODE;
  const [plan, storyboard, assets, prompt, exampleDir, sharedAssets] = await Promise.all([
    readJson(join(context.runDir, "plan.json")),
    readJson(join(context.runDir, "storyboard.json")),
    readJson(join(context.runDir, "assets.json")),
    readPrompt(context, "04-build.md"),
    findExample(context, renderMode),
    listSharedAssets(context.rootDir),
  ]);
  assertPlan(plan);
  assertStoryboard(storyboard);
  assertAssetPlan(assets);
  assertAssetPlanContext(assets as AssetPlan, storyboard, sharedAssets,
    { skipImages: context.skipImages, contentId: context.id });
  const resolvedAssets = await resolveAssetPaths(context, assets as AssetPlan);
  const assetReferences = resolvedAssets.map(({ assetId, kind, sourcePath }) =>
    ({ assetId, kind, sourcePath }));
  const responseFile = join(context.runDir, "build-response.txt");
  const inputs = { plan, storyboard, assets, resolvedAssets, id: context.id, grade: context.grade,
    subject: context.subject, type: context.type ?? null, renderMode };
  const incomplete = !required.every((file) => existsSync(join(context.contentDir, file)));
  if (!revision && !await shouldRunStage(responseFile, context.force || incomplete, inputs)) return;

  await mkdir(context.contentDir, { recursive: true });
  const stagingDir = await mkdtemp(join(context.runDir, "build-staging-"));
  try {
    const availableExamples = required.filter((file) => existsSync(join(exampleDir, file)));
    const exampleFiles = Object.fromEntries(await Promise.all(availableExamples.map(async (file) =>
      [file, await readFile(join(exampleDir, file), "utf8")])));
    // 재빌드는 처음부터 다시 만들지 않고 기존 산출물에 수정 지시만 반영해야 수렴한다
    const currentFiles = revision ? Object.fromEntries(await Promise.all(
      required.filter((file) => existsSync(join(context.contentDir, file))).map(async (file) =>
        [file, await readFile(join(context.contentDir, file), "utf8")]))) : {};
    const revisionHeader = revision
      ? `[최우선 수정 지시] 아래 기존 산출물을 기반으로 다음 QA 미달 항목만 반영해 4개 파일 전체를 다시 작성하세요. 다른 부분은 유지합니다.\n${revision}\n\n기존 산출물: ${JSON.stringify(currentFiles)}\n\n`
      : "";
    await runFactoryFiles({
      responseFile,
      stagingDir,
      requiredFiles: required,
      // 4파일 전체 생성은 기본 10분보다 오래 걸릴 수 있어 코드 생성 단계만 상향
      timeoutMs: 40 * 60 * 1000,
      prompt: `${revisionHeader}${prompt}\n\n출력 디렉터리: ${stagingDir}\n최종 콘텐츠 디렉터리: ${context.contentDir}\n제작 방식(renderMode): ${renderMode}\n모범 사례 파일 본문: ${JSON.stringify(exampleFiles)}\n기획: ${JSON.stringify(plan)}\nmanifest 메타데이터(반드시 그대로 사용, 임의 변경 금지): ${JSON.stringify({ id: context.id, title: plan.title, description: plan.description, subject: context.subject, grade: context.grade, gradeLevel: context.gradeLevel, path: `/contents/${context.subject}/${context.gradeLevel}/${context.id}/index.html` })}\n스토리보드: ${JSON.stringify(storyboard)}\n에셋 계획: ${JSON.stringify(assets)}\n검증된 에셋 참조 경로: ${JSON.stringify(assetReferences)}\n반드시 출력 디렉터리에 4개 계약 파일을 직접 작성하세요.`,
    });
    const missing: string[] = [];
    for (const file of required) {
      const path = join(stagingDir, file);
      if (!existsSync(path) || (await stat(path)).size === 0) missing.push(file);
    }
    if (missing.length) throw new Error(`이번 빌드 산출물 누락: ${missing.join(", ")}`);
    const entries = await readdir(stagingDir, { withFileTypes: true });
    // 숨김 항목(.playwright-cli 등)은 생성 도구의 상태 파일 — 승격 대상이 아니므로 검사에서 제외
    const unexpected = entries.filter((entry) =>
      !entry.name.startsWith(".") && (!entry.isFile() || !required.includes(entry.name)));
    if (unexpected.length > 0) {
      throw new Error(`허용되지 않은 빌드 산출물: ${unexpected.map((entry) => entry.name).join(", ")}`);
    }
    await promoteFiles(stagingDir, context.contentDir, context.runDir, required);
    await normalizeManifestCreatedAt(join(context.contentDir, "manifest.json"));
    await normalizeManifestStructuralFields(join(context.contentDir, "manifest.json"), context);
    await writeStageMetadata(responseFile, inputs);
  } finally {
    await rm(stagingDir, { recursive: true, force: true });
  }
}
