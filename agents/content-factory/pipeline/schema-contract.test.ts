import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { validAssets, validPlan, validStoryboard } from "./test-fixtures";
import { validateStageOutput, type StageName } from "./lib/validate";

const factoryDir = join(import.meta.dir, "..");
const stages: StageName[] = ["plan", "storyboard", "assets", "judge"];
const allowedKeywords = new Set(["type", "properties", "required", "items", "enum", "additionalProperties"]);

interface Schema {
  type?: string;
  properties?: Record<string, Schema>;
  required?: string[];
  items?: Schema;
  enum?: unknown[];
  additionalProperties?: boolean;
}

type Path = Array<string | number>;

interface EnumContract {
  stage: StageName;
  path: Path;
  values: string[];
  fixtures: (value: string) => unknown[];
}

interface BoundaryContract {
  stage: StageName;
  path: Path;
  wrongType: unknown;
}

function matchesSchema(value: unknown, schema: Schema): boolean {
  if (schema.enum && !schema.enum.includes(value)) return false;
  if (schema.type === "object") {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
    const record = value as Record<string, unknown>;
    if (schema.required?.some((key) => !(key in record))) return false;
    if (schema.additionalProperties === false &&
        Object.keys(record).some((key) => !(key in (schema.properties ?? {})))) return false;
    return Object.entries(schema.properties ?? {}).every(([key, child]) =>
      !(key in record) || matchesSchema(record[key], child));
  }
  if (schema.type === "array") {
    return Array.isArray(value) && (!schema.items || value.every((item) => matchesSchema(item, schema.items!)));
  }
  return schema.type === undefined || typeof value === schema.type;
}

function expectStrictSubset(schema: Schema): void {
  for (const key of Object.keys(schema)) expect(allowedKeywords.has(key)).toBe(true);
  if (schema.type === "object") {
    expect(schema.additionalProperties).toBe(false);
    expect(new Set(schema.required)).toEqual(new Set(Object.keys(schema.properties ?? {})));
  }
  for (const child of Object.values(schema.properties ?? {})) expectStrictSubset(child);
  if (schema.items) expectStrictSubset(schema.items);
}

function schemaAtPath(schema: Schema, path: Path): Schema {
  return path.reduce((current, part) => {
    const next = typeof part === "number" ? current.items : current.properties?.[part];
    if (!next) throw new Error(`스키마 경로를 찾을 수 없습니다: ${path.join(".")}`);
    return next;
  }, schema);
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function valueAtPath(value: unknown, path: Path): unknown {
  return path.reduce<unknown>((current, part) => (current as Record<string | number, unknown>)[part], value);
}

function setAtPath(value: unknown, path: Path, replacement: unknown): void {
  const parent = valueAtPath(value, path.slice(0, -1)) as Record<string | number, unknown>;
  parent[path.at(-1)!] = replacement;
}

function deleteAtPath(value: unknown, path: Path): void {
  const parent = valueAtPath(value, path.slice(0, -1)) as Record<string | number, unknown>;
  delete parent[path.at(-1)!];
}

function validJudge() {
  return {
    passed: true,
    summary: "모든 항목 통과",
    criteria: Array.from({ length: 22 }, (_, index) => ({
      id: `Q${String(index + 1).padStart(2, "0")}`,
      status: "pass",
      evidence: ["구체적 근거"],
    })),
    failedIds: [],
    revisionBrief: { required: false, instructions: [] },
  };
}

function validAssetsWithItems() {
  return {
    ...validAssets(),
    generated: [{
      assetId: "thumbnail", fileName: "thumbnail.png", scenes: ["hook"], purpose: "대표 이미지",
      prompt: "텍스트 없는 밝은 그림", alt: "대칭 도형", width: 1200, height: 630,
    }],
    coverage: [{ storyboardAssetId: "hero", resolvedBy: "generated", resolvedAssetId: "thumbnail" }],
  };
}

function fixtureFor(stage: StageName): unknown {
  if (stage === "plan") return validPlan();
  if (stage === "storyboard") return validStoryboard();
  if (stage === "assets") return validAssetsWithItems();
  return validJudge();
}

const grades = [
  "elementary-1", "elementary-2", "elementary-3", "elementary-4", "elementary-5", "elementary-6",
  "middle-1", "middle-2", "middle-3", "high-1", "high-2", "high-3",
];
const sceneNames = ["hook", "story", "core", "quiz", "wrap"];
const qualityIds = Array.from({ length: 22 }, (_, index) => `Q${String(index + 1).padStart(2, "0")}`);

const enumContracts: EnumContract[] = [
  { stage: "plan", path: ["grade"], values: grades, fixtures: (value) => [{ ...validPlan(), grade: value }] },
  { stage: "plan", path: ["subject"], values: ["math", "science", "english"],
    fixtures: (value) => [{ ...validPlan(), subject: value }] },
  { stage: "plan", path: ["lessonFlow", 0, "scene"], values: sceneNames,
    fixtures: () => [validPlan()] },
  { stage: "plan", path: ["contentType", "selected"],
    values: ["simulation", "game", "quiz", "exploration", "story"],
    fixtures: (value) => [{ ...validPlan(), contentType: { selected: value, rationale: "선택 근거" } }] },
  { stage: "storyboard", path: ["scenes", 0, "id"], values: sceneNames,
    fixtures: () => [validStoryboard()] },
  { stage: "storyboard", path: ["quiz", "sceneId"], values: ["quiz"],
    fixtures: () => [validStoryboard()] },
  { stage: "assets", path: ["generated", 0, "fileName"], values: ["thumbnail.png", "hook-visual.png"],
    fixtures: (value) => {
      const fixture = validAssetsWithItems();
      fixture.generated[0].fileName = value;
      return [fixture];
    } },
  { stage: "assets", path: ["coverage", 0, "resolvedBy"], values: ["reuse", "generated", "css"],
    fixtures: (value) => {
      const fixture = validAssetsWithItems();
      fixture.coverage[0].resolvedBy = value;
      return [fixture];
    } },
  { stage: "judge", path: ["criteria", 0, "id"], values: qualityIds,
    fixtures: () => [validJudge()] },
  { stage: "judge", path: ["criteria", 0, "status"], values: ["pass", "fail"],
    fixtures: (value) => {
      const fixture = validJudge();
      if (value === "fail") {
        fixture.criteria[0].status = "fail";
        fixture.passed = false;
        fixture.failedIds = ["Q01"];
        fixture.revisionBrief = { required: true, instructions: ["Q01 수정"] };
      }
      return [fixture];
    } },
  { stage: "judge", path: ["failedIds", 0], values: qualityIds,
    fixtures: (value) => {
      const fixture = validJudge();
      const index = qualityIds.indexOf(value);
      fixture.criteria[index].status = "fail";
      fixture.passed = false;
      fixture.failedIds = [value];
      fixture.revisionBrief = { required: true, instructions: [`${value} 수정`] };
      return [fixture];
    } },
];

const boundaryContracts: BoundaryContract[] = [
  { stage: "plan", path: ["topic"], wrongType: 1 },
  { stage: "plan", path: ["achievementStandard", "estimated"], wrongType: "true" },
  { stage: "plan", path: ["learningObjectives"], wrongType: {} },
  { stage: "plan", path: ["contentType", "selected"], wrongType: 1 },
  { stage: "storyboard", path: ["scenes"], wrongType: {} },
  { stage: "storyboard", path: ["scenes", 0, "interaction"], wrongType: [] },
  { stage: "storyboard", path: ["quiz", "questions", 0, "choices"], wrongType: {} },
  { stage: "assets", path: ["generated"], wrongType: {} },
  { stage: "assets", path: ["generated", 0, "height"], wrongType: "630" },
  { stage: "assets", path: ["coverage", 0, "resolvedBy"], wrongType: 1 },
  { stage: "judge", path: ["passed"], wrongType: "true" },
  { stage: "judge", path: ["criteria"], wrongType: {} },
  { stage: "judge", path: ["criteria", 0, "status"], wrongType: 1 },
  { stage: "judge", path: ["revisionBrief", "required"], wrongType: "false" },
];

describe("Codex 출력 스키마와 사후 검증 계약", () => {
  test("네 단계 스키마가 strict subset이며 validator의 유효 산출물을 허용한다", async () => {
    const fixtures = { plan: validPlan(), storyboard: validStoryboard(), assets: validAssets(), judge: validJudge() };
    for (const stage of stages) {
      const schema = JSON.parse(await readFile(join(factoryDir, "schemas", `${stage}.schema.json`), "utf8")) as Schema;
      expectStrictSubset(schema);
      expect(matchesSchema(fixtures[stage], schema)).toBe(true);
      expect(validateStageOutput(stage, fixtures[stage]).valid).toBe(true);
    }
  });

  test("generated 이미지 필수 필드 누락을 schema와 validator가 함께 거부한다", async () => {
    const schema = JSON.parse(await readFile(join(factoryDir, "schemas/assets.schema.json"), "utf8")) as Schema;
    const invalid = validAssets();
    invalid.generated = [{
      assetId: "thumbnail", fileName: "thumbnail.png", scenes: ["hook"], purpose: "대표 이미지",
      prompt: "텍스트 없는 밝은 그림", alt: "대칭 도형", width: 1200,
    } as never];
    expect(matchesSchema(invalid, schema)).toBe(false);
    expect(validateStageOutput("assets", invalid).valid).toBe(false);
  });

  test("validator가 허용하는 모든 명시 enum 값을 스키마도 허용한다", async () => {
    for (const contract of enumContracts) {
      const schema = JSON.parse(await readFile(
        join(factoryDir, "schemas", `${contract.stage}.schema.json`), "utf8",
      )) as Schema;
      expect(schemaAtPath(schema, contract.path).enum).toEqual(contract.values);
      for (const value of contract.values) {
        for (const fixture of contract.fixtures(value)) {
          expect(matchesSchema(fixture, schema)).toBe(true);
          expect(validateStageOutput(contract.stage, fixture).valid).toBe(true);
        }
      }
    }
  });

  test("핵심 required/type 경계를 schema와 validator가 함께 거부한다", async () => {
    for (const contract of boundaryContracts) {
      const schema = JSON.parse(await readFile(
        join(factoryDir, "schemas", `${contract.stage}.schema.json`), "utf8",
      )) as Schema;
      const valid = fixtureFor(contract.stage);
      expect(matchesSchema(valid, schema)).toBe(true);
      expect(validateStageOutput(contract.stage, valid).valid).toBe(true);

      const missing = clone(valid);
      deleteAtPath(missing, contract.path);
      expect(matchesSchema(missing, schema)).toBe(false);
      expect(validateStageOutput(contract.stage, missing).valid).toBe(false);

      const wrongType = clone(valid);
      setAtPath(wrongType, contract.path, contract.wrongType);
      expect(matchesSchema(wrongType, schema)).toBe(false);
      expect(validateStageOutput(contract.stage, wrongType).valid).toBe(false);
    }
  });

  test("judge 선택 fix 없이도 schema와 validator가 같은 산출물을 허용한다", async () => {
    const schema = JSON.parse(await readFile(join(factoryDir, "schemas/judge.schema.json"), "utf8")) as Schema;
    const valid = validJudge();
    expect(matchesSchema(valid, schema)).toBe(true);
    expect(validateStageOutput("judge", valid).valid).toBe(true);
  });

  test("JSON 생성 단계가 각 스키마 파일을 Codex 호출에 전달한다", async () => {
    const files = { plan: "plan.ts", storyboard: "storyboard.ts", assets: "assets.ts", judge: "qa.ts" };
    for (const [stage, file] of Object.entries(files)) {
      const source = await readFile(join(factoryDir, "pipeline/stages", file), "utf8");
      expect(source).toContain(`schemaFile: join(context.factoryDir, "schemas/${stage}.schema.json")`);
    }
  });
});
