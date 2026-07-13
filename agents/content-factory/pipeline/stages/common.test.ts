import { describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { assertSafeContentId, shouldRunStage, writeStageMetadata } from "./common";

describe("콘텐츠 ID 경계", () => {
  test("slug만 허용하고 경로·빈 값·숨김 경로를 거부한다", () => {
    expect(() => assertSafeContentId("symmetry-lines")).not.toThrow();
    for (const id of ["", " ", "../outside", "nested/id", ".hidden", "UPPER_CASE"]) {
      expect(() => assertSafeContentId(id)).toThrow("slug");
    }
  });
});

describe("단계 재개 입력 동일성", () => {
  test("동일 입력만 재사용하고 변경된 입력은 명확히 거부한다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "factory-resume-"));
    const output = join(dir, "plan.json");
    await writeFile(output, "{}", "utf8");
    await writeStageMetadata(output, { topic: "대칭", grade: "elementary-5" });
    try {
      expect(await shouldRunStage(output, false, { topic: "대칭", grade: "elementary-5" })).toBe(false);
      await expect(shouldRunStage(output, false, { topic: "회전", grade: "elementary-5" }))
        .rejects.toThrow("입력이 이전 실행과 달라");
    } finally { await rm(dir, { recursive: true, force: true }); }
  });
});
