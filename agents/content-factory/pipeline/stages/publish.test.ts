import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { FactoryContext } from "./common";
import { digestValue } from "./common";
import { runPublishStage, updateCatalog } from "./publish";
import { assertQaPassed, runStaticQa } from "./qa";

const catalog = `{
  "version": "1.0.0",
  "lastUpdated": "2026-01-01T00:00:00.000Z",
  "contents": [
    {
      "id": "kept",
      "title": "그대로 보존"
    }
  ]
}`;

const staticChecks = [
  "required-files", "manifest-schema", "manifest-path", "stylesheet-order", "five-scenes",
  "engine-contract", "reduced-motion", "image-files", "no-external-script", "learning-text",
].map((id) => ({ id, status: "pass" }));

const passingJudge = {
  passed: true,
  summary: "통과",
  criteria: Array.from({ length: 22 }, (_, index) => ({
    id: `Q${String(index + 1).padStart(2, "0")}`, status: "pass", evidence: ["근거"], fix: "해당 없음",
  })),
  failedIds: [],
  revisionBrief: { required: false, instructions: [] },
};

async function makePublishFixture(rootDir: string, contextGrade = "elementary-5"): Promise<FactoryContext> {
  const contentDir = join(rootDir, "public/contents/math/elementary/new-id");
  const runDir = join(rootDir, "runs/new-id");
  const catalogPath = join(rootDir, "public/contents/index.json");
  await Promise.all([mkdir(contentDir, { recursive: true }), mkdir(runDir, { recursive: true })]);
  const manifest = {
    id: "new-id", title: "신규", subject: "math", gradeLevel: "elementary",
    grade: "elementary-5", type: "simulation", language: "ko", description: "설명",
    path: "/contents/math/elementary/new-id/index.html", thumbnail: "thumbnail.png",
    createdAt: "2026-07-13T00:00:00.000Z", tags: ["신규"],
  };
  const { validAssets, validPlan, validStoryboard } = await import("../test-fixtures");
  const plan = validPlan();
  const storyboard = validStoryboard();
  const assets = validAssets("new-id");
  const runtime = `class Scene {} class EduFlixEngine { nextScene(){const order=['hook','story','core','quiz','wrap'];}
    render(){this.data.interaction.onInit(null,this); window.parent.postMessage('close','*');} }
    const data={interaction:{onInit:(container,engine)=>{engine.showFeedback('좋아요');engine.enableNext();}}}; Engine.init(data); 학습 목표`;
  await Promise.all([
    writeFile(join(contentDir, "index.html"), `<title>신규</title><link href="style.css"><link href="../../../common/mobile.css"><main>학습 목표<div id="hook"></div><div id="story"></div><div id="core"></div><div id="quiz"></div><div id="wrap"></div><img src="thumbnail.png"></main>`),
    writeFile(join(contentDir, "style.css"), "@media (prefers-reduced-motion: reduce) { * { animation: none; } }"),
    writeFile(join(contentDir, "script.js"), runtime),
    writeFile(join(contentDir, "manifest.json"), JSON.stringify(manifest)),
    writeFile(join(contentDir, "thumbnail.png"), "png"),
    writeFile(join(runDir, "plan.json"), JSON.stringify(plan)),
    writeFile(join(runDir, "storyboard.json"), JSON.stringify(storyboard)),
    writeFile(join(runDir, "assets.json"), JSON.stringify(assets)),
    writeFile(catalogPath, catalog),
  ]);
  const qa = { ...await runStaticQa({ contentDir }), judge: passingJudge,
    qaInputDigest: digestValue({ plan, storyboard, assets }) };
  await writeFile(join(runDir, "qa-report.json"), JSON.stringify(qa));
  return { rootDir, factoryDir: rootDir, runDir, contentDir, id: "new-id", topic: "신규",
    grade: contextGrade, gradeLevel: "elementary", subject: "math",
    force: false, skipImages: false };
}

describe("updateCatalog", () => {
  test("기존 항목 원문을 유지한 채 새 항목을 추가한다", () => {
    const existing = `    {\n      "id": "kept",\n      "title": "그대로 보존"\n    }`;
    const updated = updateCatalog(catalog, { id: "new", title: "신규" }, false);
    expect(updated).toContain(existing);
    expect(JSON.parse(updated).contents).toHaveLength(2);
  });

  test("같은 id를 force 없이 덮어쓰지 않는다", () => {
    expect(() => updateCatalog(catalog, { id: "kept" }, false)).toThrow("같은 id");
  });

  test("force 교체에서도 다른 항목 바이트를 보존한다", () => {
    const source = catalog.replace("\n  ]", ",\n    {\n      \"id\": \"other\"\n    }\n  ]");
    const preserved = `    {\n      "id": "other"\n    }`;
    const updated = updateCatalog(source, { id: "kept", title: "교체" }, true);
    expect(updated).toContain(preserved);
    expect(JSON.parse(updated).contents[0].title).toBe("교체");
  });

  test("손상되거나 id가 중복된 카탈로그를 수정하지 않는다", () => {
    expect(() => updateCatalog('{"contents": [broken]}', { id: "new" }, false))
      .toThrow("JSON");
    const duplicate = catalog.replace("\n  ]", ",\n    {\"id\": \"kept\"}\n  ]");
    expect(() => updateCatalog(duplicate, { id: "new" }, false)).toThrow("중복");
  });

  test("version과 lastUpdated가 유효한 문자열인 루트 래퍼만 허용한다", () => {
    for (const source of [
      '{"lastUpdated":"2026-01-01T00:00:00.000Z","contents":[]}',
      '{"version":1,"lastUpdated":"2026-01-01T00:00:00.000Z","contents":[]}',
    ]) {
      expect(() => updateCatalog(source, { id: "new" }, false)).toThrow("version");
    }
    for (const source of [
      '{"version":"1.0.0","contents":[]}',
      '{"version":"1.0.0","lastUpdated":null,"contents":[]}',
    ]) {
      expect(() => updateCatalog(source, { id: "new" }, false)).toThrow("lastUpdated");
    }
  });

  test("contents가 먼저 와도 루트 lastUpdated만 갱신한다", () => {
    const preserved = `    {
      "id": "kept",
      "lastUpdated": "항목 원문"
    }`;
    const source = `{
  "contents": [
${preserved}
  ],
  "version": "1.0.0",
  "lastUpdated": "2026-01-01T00:00:00.000Z"
}`;
    const updated = updateCatalog(source, { id: "new" }, false);
    const parsed = JSON.parse(updated);
    expect(updated).toContain(preserved);
    expect(parsed.contents[0].lastUpdated).toBe("항목 원문");
    expect(parsed.lastUpdated).not.toBe("2026-01-01T00:00:00.000Z");
  });

  test("중첩 contents보다 루트 contents만 찾아 새 항목을 추가한다", () => {
    const source = `{
  "version": "1.0.0",
  "lastUpdated": "2026-01-01T00:00:00.000Z",
  "metadata": { "contents": [] },
  "contents": [{ "id": "kept" }]
}`;
    const parsed = JSON.parse(updateCatalog(source, { id: "new" }, false));
    expect(parsed.metadata.contents).toEqual([]);
    expect(parsed.contents.map((item: { id: string }) => item.id)).toEqual(["kept", "new"]);
  });

  test("루트 contents 키가 중복되면 수정하지 않고 거부한다", () => {
    const source = `{
  "version": "1.0.0",
  "lastUpdated": "2026-01-01T00:00:00.000Z",
  "contents": [],
  "contents": [{ "id": "kept" }]
}`;
    expect(() => updateCatalog(source, { id: "new" }, false)).toThrow("루트 contents가 중복");
  });

  test("완전한 성공 QA 보고서 없이는 퍼블리시하지 않는다", () => {
    expect(() => assertQaPassed({ passed: false })).toThrow("QA 게이트");
    expect(() => assertQaPassed({ passed: true })).toThrow("QA 게이트");
    expect(() => assertQaPassed({
      passed: true,
      contentDir: "/content",
      errors: [],
      checks: staticChecks,
      judge: passingJudge,
    }, "/content")).not.toThrow();
    expect(() => assertQaPassed({
      passed: true,
      contentDir: "/other",
      errors: [],
      checks: staticChecks,
      judge: passingJudge,
    }, "/content")).toThrow("QA 게이트");
    const failedJudge = structuredClone(passingJudge);
    failedJudge.passed = false;
    failedJudge.criteria[0].status = "fail";
    failedJudge.failedIds = ["Q01"];
    failedJudge.revisionBrief = { required: true, instructions: ["수정"] };
    expect(() => assertQaPassed({ passed: true, contentDir: "/content", errors: [],
      checks: staticChecks, judge: failedJudge }, "/content")).toThrow("QA 게이트");
  });

  test("QA 이후 핵심 파일이나 로컬 이미지가 변경되면 퍼블리시하지 않는다", async () => {
    for (const file of ["script.js", "thumbnail.png"]) {
      const rootDir = await mkdtemp(join(tmpdir(), "factory-publish-digest-"));
      try {
        const context = await makePublishFixture(rootDir);
        await writeFile(join(context.contentDir, file), "변조", "utf8");
        await expect(runPublishStage(context)).rejects.toThrow("QA 이후 대상 파일이 변경");
        expect(await Bun.file(join(rootDir, "public/contents/index.json")).text()).toBe(catalog);
      } finally { await rm(rootDir, { recursive: true, force: true }); }
    }
  });

  test("manifest grade가 실행 grade와 다르면 퍼블리시하지 않는다", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "factory-publish-grade-"));
    try {
      const context = await makePublishFixture(rootDir, "elementary-4");
      await expect(runPublishStage(context)).rejects.toThrow("manifest grade와 실행 grade");
      expect(await Bun.file(join(rootDir, "public/contents/index.json")).text()).toBe(catalog);
    } finally { await rm(rootDir, { recursive: true, force: true }); }
  });

  test("동시 퍼블리시 락이 있으면 카탈로그를 쓰지 않는다", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "factory-publish-"));
    const context = await makePublishFixture(rootDir);
    const catalogPath = join(rootDir, "public/contents/index.json");
    await writeFile(`${catalogPath}.lock`, "busy");
    try {
      await expect(runPublishStage(context)).rejects.toThrow("갱신 중");
      expect(await Bun.file(catalogPath).text()).toBe(catalog);
    } finally {
      await rm(rootDir, { recursive: true, force: true });
    }
  });

  test("소유 프로세스가 종료된 stale 락은 회수하고 퍼블리시한다", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "factory-publish-stale-"));
    const context = await makePublishFixture(rootDir);
    const catalogPath = join(rootDir, "public/contents/index.json");
    await writeFile(`${catalogPath}.lock`, JSON.stringify({ pid: 99_999_999, createdAt: new Date().toISOString() }));
    try {
      await expect(runPublishStage(context)).resolves.toBeUndefined();
      expect(JSON.parse(await Bun.file(catalogPath).text()).contents).toHaveLength(2);
      expect(await Bun.file(`${catalogPath}.lock`).exists()).toBe(false);
    } finally { await rm(rootDir, { recursive: true, force: true }); }
  });
});
