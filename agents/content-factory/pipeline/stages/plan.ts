import { join } from "node:path";
import { runCodexText } from "../lib/codex";
import { assertPlan, stageOutputValidationError } from "../lib/validate";
import { type FactoryContext, readJson, readPrompt, shouldRunStage, writeStageMetadata } from "./common";

export async function runPlanStage(context: FactoryContext): Promise<void> {
  const outFile = join(context.runDir, "plan.json");
  const inputs = { topic: context.topic, grade: context.grade, subject: context.subject, type: context.type ?? null };
  const generated = await shouldRunStage(outFile, context.force, inputs);
  if (generated) {
    const prompt = await readPrompt(context, "01-plan.md");
    await runCodexText({
      outFile,
      schemaFile: join(context.factoryDir, "schemas/plan.schema.json"),
      prompt: `${prompt}\n\n입력: ${JSON.stringify({
        topic: context.topic,
        grade: context.grade,
        subject: context.subject,
        type: context.type,
      })}\nJSON만 출력하세요.`,
      validateOutput: (text) => stageOutputValidationError("plan", text),
    });
  }
  assertPlan(await readJson(outFile));
  if (generated) await writeStageMetadata(outFile, inputs);
}
