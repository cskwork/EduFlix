import { join } from "node:path";
import { runFactoryText } from "../lib/engine";
import { assertPlan, stageOutputValidationError } from "../lib/validate";
import {
  DEFAULT_RENDER_MODE, type FactoryContext, readJson, readPrompt, shouldRunStage, writeStageMetadata,
} from "./common";

// 모드별 기획 프롬프트 파일 매핑
// - interest: 관심사 기반 학습 콘텐츠 기획 (기본)
// - problem: 사용자가 제시한 문제를 재미있고 entertaining한 학습 콘텐츠로 변환
const PLAN_PROMPT_BY_MODE: Record<string, string> = {
  interest: "01-plan.md",
  problem: "01-plan-entertain.md",
};

export async function runPlanStage(context: FactoryContext): Promise<void> {
  const outFile = join(context.runDir, "plan.json");
  const renderMode = context.renderMode ?? DEFAULT_RENDER_MODE;
  const mode = context.mode ?? "interest";
  const inputs = { topic: context.topic, grade: context.grade, subject: context.subject,
    type: context.type ?? null, renderMode, mode, language: context.language ?? "ko",
    interests: context.interests ?? [], additionalContext: context.additionalContext ?? null,
    problem: context.problem ?? null, difficulty: context.difficulty ?? null };
  const generated = await shouldRunStage(outFile, context.force, inputs);
  if (generated) {
    const promptFile = PLAN_PROMPT_BY_MODE[mode] ?? PLAN_PROMPT_BY_MODE.interest;
    const prompt = await readPrompt(context, promptFile);
    await runFactoryText({
      outFile,
      schemaFile: join(context.factoryDir, "schemas/plan.schema.json"),
      prompt: `${prompt}\nLearner-facing text must use language ${context.language ?? "ko"}.\n\n입력: ${JSON.stringify({
        language: context.language ?? "ko",
        topic: context.topic,
        grade: context.grade,
        subject: context.subject,
        type: context.type,
        renderMode,
        mode,
        interests: context.interests ?? [],
        additionalContext: context.additionalContext,
        problem: context.problem,
        difficulty: context.difficulty,
      })}\nJSON만 출력하세요.`,
      validateOutput: (text) => stageOutputValidationError("plan", text),
    });
  }
  assertPlan(await readJson(outFile));
  if (generated) await writeStageMetadata(outFile, inputs);
}
