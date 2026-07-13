import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { assertStagePrerequisites, slugify } from "./run";

describe("CLI 입력 경계", () => {
  test("한글이 섞인 주제는 ASCII 조각이 같아도 서로 다른 안전한 slug를 만든다", () => {
    const first = slugify("대칭 AI");
    const second = slugify("회전 AI");
    expect(first).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(second).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(first).not.toBe(second);
  });

  test("단계 단독 실행은 누락된 선행 산출물을 단계 이름과 함께 알린다", async () => {
    const runDir = await mkdtemp(join(tmpdir(), "factory-prerequisite-"));
    try {
      expect(() => assertStagePrerequisites("build", runDir, false)).toThrow(
        "build 단계 선행 산출물이 없습니다: plan.json, storyboard.json, assets.json",
      );
    } finally { await rm(runDir, { recursive: true, force: true }); }
  });

  test("선행 산출물이 없는 단계 단독 실행은 빈 run 디렉터리를 만들지 않는다", async () => {
    const id = `missing-prerequisite-${process.pid}-${Date.now()}`;
    const runDir = join(import.meta.dir, "../runs", id);
    const processResult = Bun.spawn([
      "bun", join(import.meta.dir, "run.ts"), "--topic", "대칭", "--grade", "elementary-5",
      "--subject", "math", "--stage", "build", "--id", id,
    ], { stdin: "ignore", stdout: "ignore", stderr: "pipe" });
    try {
      expect(await processResult.exited).toBe(1);
      expect(await processResult.stderr.text()).toContain("build 단계 선행 산출물이 없습니다");
      expect(existsSync(runDir)).toBe(false);
    } finally { await rm(runDir, { recursive: true, force: true }); }
  });
});
