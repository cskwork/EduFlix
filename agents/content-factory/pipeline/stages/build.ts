import { existsSync } from "node:fs";
import { copyFile, mkdir, mkdtemp, readFile, readdir, rename, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { runCodexText } from "../lib/codex";
import { listSharedAssets, resolveAssetPaths } from "../lib/assets";
import {
  assertAssetPlan, assertAssetPlanContext, assertPlan, assertStoryboard, type AssetPlan,
} from "../lib/validate";
import { type FactoryContext, readJson, readPrompt, shouldRunStage, writeStageMetadata } from "./common";

async function findExample(context: FactoryContext): Promise<string> {
  const candidates = [
    join(context.rootDir, "public/contents/math/middle/probability-coin"),
    join(context.rootDir, "public/contents/math/elementary/volume-explorer"),
  ];
  for (const dir of candidates) {
    const script = join(dir, "script.js");
    if (!existsSync(script)) continue;
    const source = await readFile(script, "utf8");
    if (source.includes("class EduFlixEngine") && source.includes("Scene")) return dir;
  }
  throw new Error("인라인 EduFlixEngine 모범 사례를 찾지 못했습니다.");
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
  const [plan, storyboard, assets, prompt, exampleDir, sharedAssets] = await Promise.all([
    readJson(join(context.runDir, "plan.json")),
    readJson(join(context.runDir, "storyboard.json")),
    readJson(join(context.runDir, "assets.json")),
    readPrompt(context, "04-build.md"),
    findExample(context),
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
    subject: context.subject, type: context.type ?? null };
  const incomplete = !required.every((file) => existsSync(join(context.contentDir, file)));
  if (!revision && !await shouldRunStage(responseFile, context.force || incomplete, inputs)) return;

  await mkdir(context.contentDir, { recursive: true });
  const stagingDir = await mkdtemp(join(context.runDir, "build-staging-"));
  try {
    await runCodexText({
      outFile: responseFile,
      workspaceWrite: true,
      cwd: stagingDir,
      // 4파일 전체 생성은 기본 15분으로 부족(2026-07-13 E2E에서 2회 초과) — 코드 생성 단계만 상향
      timeoutMs: 40 * 60 * 1000,
      prompt: `${prompt}\n\n출력 디렉터리: ${stagingDir}\n최종 콘텐츠 디렉터리: ${context.contentDir}\n모범 사례 디렉터리: ${exampleDir}\n기획: ${JSON.stringify(plan)}\n스토리보드: ${JSON.stringify(storyboard)}\n에셋 계획: ${JSON.stringify(assets)}\n검증된 에셋 참조 경로: ${JSON.stringify(assetReferences)}\n${revision ? `QA 수정 지시: ${revision}` : ""}\n반드시 출력 디렉터리에 4개 계약 파일을 직접 작성하세요.`,
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
    await writeStageMetadata(responseFile, inputs);
  } finally {
    await rm(stagingDir, { recursive: true, force: true });
  }
}
