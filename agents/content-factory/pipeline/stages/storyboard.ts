import { join } from "node:path";
import { runFactoryText } from "../lib/engine";
import { assertPlan, assertStoryboard, stageOutputValidationError } from "../lib/validate";
import {
  DEFAULT_RENDER_MODE, type FactoryContext, readJson, readPrompt, shouldRunStage, writeStageMetadata,
} from "./common";

export async function runStoryboardStage(context: FactoryContext): Promise<void> {
  const plan = await readJson(join(context.runDir, "plan.json"));
  assertPlan(plan);
  const outFile = join(context.runDir, "storyboard.json");
  const renderMode = context.renderMode ?? DEFAULT_RENDER_MODE;
  const generated = await shouldRunStage(outFile, context.force, { plan, renderMode, language: context.language ?? "ko" });
  if (generated) {
    const prompt = await readPrompt(context, "02-storyboard.md");
    await runFactoryText({
      outFile,
      schemaFile: join(context.factoryDir, "schemas/storyboard.schema.json"),
      prompt: `${prompt}\nLearner-facing text must use language ${context.language ?? "ko"}.\n\n기획 JSON:\n${JSON.stringify(plan)}\n제작 방식(renderMode): ${renderMode}\nJSON만 출력하세요.`,
      validateOutput: (text) => stageOutputValidationError("storyboard", text),
    });
  }
  assertStoryboard(await readJson(outFile));
  if (generated) await writeStageMetadata(outFile, { plan, renderMode, language: context.language ?? "ko" });
}
