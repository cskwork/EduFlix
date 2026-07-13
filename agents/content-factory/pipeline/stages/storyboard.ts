import { join } from "node:path";
import { runCodexText } from "../lib/codex";
import { assertPlan, assertStoryboard, stageOutputValidationError } from "../lib/validate";
import { type FactoryContext, readJson, readPrompt, shouldRunStage, writeStageMetadata } from "./common";

export async function runStoryboardStage(context: FactoryContext): Promise<void> {
  const plan = await readJson(join(context.runDir, "plan.json"));
  assertPlan(plan);
  const outFile = join(context.runDir, "storyboard.json");
  const generated = await shouldRunStage(outFile, context.force, { plan });
  if (generated) {
    const prompt = await readPrompt(context, "02-storyboard.md");
    await runCodexText({
      outFile,
      schemaFile: join(context.factoryDir, "schemas/storyboard.schema.json"),
      prompt: `${prompt}\n\n기획 JSON:\n${JSON.stringify(plan)}\nJSON만 출력하세요.`,
      validateOutput: (text) => stageOutputValidationError("storyboard", text),
    });
  }
  assertStoryboard(await readJson(outFile));
  if (generated) await writeStageMetadata(outFile, { plan });
}
