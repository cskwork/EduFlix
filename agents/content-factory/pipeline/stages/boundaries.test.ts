import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { validAssets, validStoryboard } from "../test-fixtures";
import type { FactoryContext } from "./common";
import { writeStageMetadata } from "./common";
import { runAssetsStage } from "./assets";
import { runStoryboardStage } from "./storyboard";

function context(rootDir: string): FactoryContext {
  return { rootDir, factoryDir: join(rootDir, "agents/content-factory"),
    runDir: join(rootDir, "agents/content-factory/runs/id"),
    contentDir: join(rootDir, "public/contents/math/elementary/id"), id: "id", topic: "대칭",
    grade: "elementary-5", gradeLevel: "elementary", subject: "math", force: false, skipImages: true };
}

describe("단계 소비 경계", () => {
  test("storyboard는 저장된 plan을 사용하기 전에 검증한다", async () => {
    const root = await mkdtemp(join(tmpdir(), "factory-storyboard-boundary-"));
    const ctx = context(root);
    await mkdir(ctx.runDir, { recursive: true });
    const plan = {};
    const output = join(ctx.runDir, "storyboard.json");
    await writeFile(join(ctx.runDir, "plan.json"), JSON.stringify(plan));
    await writeFile(output, JSON.stringify(validStoryboard()));
    await writeStageMetadata(output, { plan });
    try { await expect(runStoryboardStage(ctx)).rejects.toThrow("plan JSON 검증 실패"); }
    finally { await rm(root, { recursive: true, force: true }); }
  });

  test("assets는 저장된 storyboard를 사용하기 전에 검증한다", async () => {
    const root = await mkdtemp(join(tmpdir(), "factory-assets-boundary-"));
    const ctx = context(root);
    await mkdir(ctx.runDir, { recursive: true });
    const storyboard = {};
    const output = join(ctx.runDir, "assets.json");
    await writeFile(join(ctx.runDir, "storyboard.json"), JSON.stringify(storyboard));
    await writeFile(output, JSON.stringify(validAssets()));
    await writeStageMetadata(output, { storyboard, skipImages: true, sharedAssets: [] });
    try { await expect(runAssetsStage(ctx)).rejects.toThrow("storyboard JSON 검증 실패"); }
    finally { await rm(root, { recursive: true, force: true }); }
  });
});
