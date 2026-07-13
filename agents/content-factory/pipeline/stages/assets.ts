import { existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { join } from "node:path";
import { runCodexImage, runCodexText } from "../lib/codex";
import { listSharedAssets } from "../lib/assets";
import {
  assertAssetPlan, assertAssetPlanContext, assertStoryboard, stageOutputValidationError, type AssetPlan,
} from "../lib/validate";
import { type FactoryContext, readJson, readPrompt, shouldRunStage, writeStageMetadata } from "./common";

export async function runAssetsStage(context: FactoryContext): Promise<void> {
  const storyboard = await readJson(join(context.runDir, "storyboard.json"));
  assertStoryboard(storyboard);
  const outFile = join(context.runDir, "assets.json");
  const sharedAssets = await listSharedAssets(context.rootDir);
  const inputs = { storyboard, skipImages: context.skipImages, sharedAssets };
  const generated = await shouldRunStage(outFile, context.force, inputs);
  if (generated) {
    const prompt = await readPrompt(context, "03-assets.md");
    await runCodexText({
      outFile,
      schemaFile: join(context.factoryDir, "schemas/assets.schema.json"),
      prompt: `${prompt}\n\n입력:\n${JSON.stringify({
        contentId: context.id,
        skipImages: context.skipImages,
      })}\n\n스토리보드:\n${JSON.stringify(storyboard)}\n\n공용 에셋 목록:\n${sharedAssets.join("\n")}\nJSON만 출력하세요.`,
      validateOutput: (text) => stageOutputValidationError("assets", text),
    });
  }
  const assetPlan = await readJson<AssetPlan>(outFile);
  assertAssetPlan(assetPlan);
  assertAssetPlanContext(assetPlan, storyboard, sharedAssets,
    { skipImages: context.skipImages, contentId: context.id });
  if (generated) await writeStageMetadata(outFile, inputs);
  if (context.skipImages) {
    if (assetPlan.generated.length > 0) {
      throw new Error("--skip-images에서는 generated 에셋을 계획할 수 없습니다.");
    }
    return;
  }

  if (!assetPlan.generated.some((asset) => asset.fileName === "thumbnail.png")) {
    throw new Error("기본 실행은 PoC 증명용 thumbnail.png 생성 계획이 필요합니다.");
  }

  for (const asset of assetPlan.generated) {
    const target = join(context.contentDir, asset.fileName);
    let needsImage = context.force || !existsSync(target);
    if (!needsImage && (await stat(target)).size === 0) needsImage = true;
    if (needsImage) await runCodexImage(asset.prompt, target);
    if (!existsSync(target) || (await stat(target)).size === 0) {
      throw new Error(`계획된 이미지가 없거나 비어 있습니다: ${asset.fileName}`);
    }
  }
}
