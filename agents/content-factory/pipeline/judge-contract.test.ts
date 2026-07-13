import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const factoryDir = join(import.meta.dir, "..");

describe("Q21 정적 심사 계약", () => {
  test("입력·포커스·키보드 코드만으로 판정 가능하다", async () => {
    const [gateSource, judgePrompt] = await Promise.all([
      readFile(join(factoryDir, "checklists/quality-gate.json"), "utf8"),
      readFile(join(factoryDir, "prompts/05-judge.md"), "utf8"),
    ]);
    const gate = JSON.parse(gateSource) as {
      criteria: Array<{ id: string; evidence: string }>;
    };
    const evidence = gate.criteria.find(({ id }) => id === "Q21")?.evidence ?? "";

    expect(evidence).toContain("입력 이벤트 핸들러");
    expect(evidence).toContain("포커스 가능한 조작 요소");
    expect(evidence).toContain("키보드 처리 코드");
    expect(evidence).not.toContain("브라우저");
    expect(evidence).not.toContain("스모크");

    expect(judgePrompt).toContain("Q21");
    expect(judgePrompt).toContain("입력 이벤트 핸들러");
    expect(judgePrompt).toContain("포커스 가능한 조작 요소");
    expect(judgePrompt).toContain("키보드 처리 코드");
    expect(judgePrompt).toContain("SC9");
  });
});
