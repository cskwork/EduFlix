import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runStaticQa } from "./qa";
import { canResumeQa } from "./qa";
import { digestValue, type FactoryContext } from "./common";
import { validAssets, validPlan, validStoryboard } from "../test-fixtures";

const passingJudge = {
  passed: true,
  summary: "통과",
  criteria: Array.from({ length: 22 }, (_, index) => ({
    id: `Q${String(index + 1).padStart(2, "0")}`, status: "pass", evidence: ["근거"], fix: "해당 없음",
  })),
  failedIds: [],
  revisionBrief: { required: false, instructions: [] },
};

describe("정적 QA 경로 일관성", () => {
  test("인라인 EduFlixEngine 핵심 런타임 계약이 없으면 실패한다", async () => {
    const root = await mkdtemp(join(tmpdir(), "factory-qa-runtime-"));
    const contentDir = join(root, "public/contents/math/elementary/runtime-id");
    await mkdir(contentDir, { recursive: true });
    const manifest = { id: "runtime-id", title: "대칭", subject: "math", gradeLevel: "elementary",
      grade: "elementary-5", type: "simulation", language: "ko", description: "설명",
      path: "/contents/math/elementary/runtime-id/index.html", thumbnail: "thumbnail.png",
      createdAt: "2026-07-13T00:00:00.000Z", tags: ["대칭"] };
    await Promise.all([
      writeFile(join(contentDir, "index.html"), `<title>대칭</title><link href="style.css"><link href="../../../common/mobile.css"><main>학습 목표<div id="hook"></div><div id="story"></div><div id="core"></div><div id="quiz"></div><div id="wrap"></div><img src="thumbnail.png"></main>`),
      writeFile(join(contentDir, "style.css"), "@media (prefers-reduced-motion: reduce) { * { animation: none; } }"),
      writeFile(join(contentDir, "script.js"), "학습 목표"),
      writeFile(join(contentDir, "manifest.json"), JSON.stringify(manifest)),
      writeFile(join(contentDir, "thumbnail.png"), "png"),
    ]);
    try {
      const report = await runStaticQa({ contentDir });
      expect(report.checks.find((item) => item.id === "engine-contract")?.status).toBe("fail");
    } finally { await rm(root, { recursive: true, force: true }); }
  });

  test("manifest가 실제 콘텐츠 디렉터리와 다른 id를 주장하면 실패한다", async () => {
    const root = await mkdtemp(join(tmpdir(), "factory-qa-"));
    const contentDir = join(root, "public/contents/math/elementary/actual-id");
    await mkdir(contentDir, { recursive: true });
    const manifest = {
      id: "claimed-id", title: "대칭", subject: "math", gradeLevel: "elementary",
      grade: "elementary-5", type: "simulation", language: "ko", description: "설명",
      path: "/contents/math/elementary/claimed-id/index.html", thumbnail: "thumbnail.png",
      createdAt: "2026-07-13T00:00:00.000Z", tags: ["대칭"],
    };
    await Promise.all([
      writeFile(join(contentDir, "index.html"), "<title>대칭</title>"),
      writeFile(join(contentDir, "style.css"), ""),
      writeFile(join(contentDir, "script.js"), "학습 목표"),
      writeFile(join(contentDir, "manifest.json"), JSON.stringify(manifest)),
      writeFile(join(contentDir, "thumbnail.png"), "png"),
    ]);
    try {
      const report = await runStaticQa({ contentDir });
      const pathCheck = report.checks.find((item) => item.id === "manifest-path");
      expect(pathCheck?.status).toBe("fail");
      expect(pathCheck?.errors.join(" ")).toContain("실제 콘텐츠 위치");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  test("manifest grade 형식과 gradeLevel 접두사가 잘못되면 실패한다", async () => {
    const root = await mkdtemp(join(tmpdir(), "factory-qa-grade-"));
    const contentDir = join(root, "public/contents/math/elementary/grade-id");
    await mkdir(contentDir, { recursive: true });
    const manifest = {
      id: "grade-id", title: "대칭", subject: "math", gradeLevel: "elementary",
      grade: "5학년", type: "simulation", language: "ko", description: "설명",
      path: "/contents/math/elementary/grade-id/index.html", thumbnail: "thumbnail.png",
      createdAt: "2026-07-13T00:00:00.000Z", tags: ["대칭"],
    };
    await Promise.all([
      writeFile(join(contentDir, "index.html"), "<title>대칭</title>"),
      writeFile(join(contentDir, "style.css"), ""),
      writeFile(join(contentDir, "script.js"), "학습 목표"),
      writeFile(join(contentDir, "manifest.json"), JSON.stringify(manifest)),
    ]);
    try {
      let report = await runStaticQa({ contentDir });
      expect(report.checks.find((item) => item.id === "manifest-schema")?.status).toBe("fail");
      await writeFile(join(contentDir, "manifest.json"), JSON.stringify({ ...manifest, grade: "middle-5" }));
      report = await runStaticQa({ contentDir });
      expect(report.checks.find((item) => item.id === "manifest-schema")?.status).toBe("fail");
    } finally { await rm(root, { recursive: true, force: true }); }
  });

  test("참조한 0바이트 이미지와 사용하지 않은 계획 이미지를 거부한다", async () => {
    const root = await mkdtemp(join(tmpdir(), "factory-qa-image-"));
    const contentDir = join(root, "public/contents/math/elementary/image-id");
    await mkdir(contentDir, { recursive: true });
    const manifest = {
      id: "image-id", title: "대칭", subject: "math", gradeLevel: "elementary",
      grade: "elementary-5", type: "simulation", language: "ko", description: "설명",
      path: "/contents/math/elementary/image-id/index.html", thumbnail: "thumbnail.png",
      createdAt: "2026-07-13T00:00:00.000Z", tags: ["대칭"],
    };
    await Promise.all([
      writeFile(join(contentDir, "index.html"), `<title>대칭</title><link href="style.css"><link href="../../../common/mobile.css"><main>학습 목표<div id="hook"></div><div id="story"></div><div id="core"></div><div id="quiz"></div><div id="wrap"></div></main>`),
      writeFile(join(contentDir, "style.css"), "@media (prefers-reduced-motion: reduce) { * { animation: none; } }"),
      writeFile(join(contentDir, "script.js"), "학습 목표"),
      writeFile(join(contentDir, "manifest.json"), JSON.stringify(manifest)),
      writeFile(join(contentDir, "thumbnail.png"), ""),
      writeFile(join(contentDir, "hook-visual.png"), "png"),
    ]);
    try {
      const report = await runStaticQa({ contentDir, assetPlan: {
        generated: [{ fileName: "thumbnail.png", prompt: "그림" }, { fileName: "hook-visual.png", prompt: "그림" }],
        coverage: [],
      } });
      const imageCheck = report.checks.find((item) => item.id === "image-files");
      expect(imageCheck?.status).toBe("fail");
      expect(imageCheck?.errors.join(" ")).toContain("비어");
      expect(imageCheck?.errors.join(" ")).toContain("사용되지");
    } finally { await rm(root, { recursive: true, force: true }); }
  });

  test("생성 PNG는 manifest가 아니라 콘텐츠 코드에서 하나 이상 참조해야 한다", async () => {
    const root = await mkdtemp(join(tmpdir(), "factory-qa-generated-image-"));
    const contentDir = join(root, "public/contents/math/elementary/generated-image-id");
    await mkdir(contentDir, { recursive: true });
    const manifest = {
      id: "generated-image-id", title: "대칭", subject: "math", gradeLevel: "elementary",
      grade: "elementary-5", type: "simulation", language: "ko", description: "설명",
      path: "/contents/math/elementary/generated-image-id/index.html", thumbnail: "thumbnail.png",
      createdAt: "2026-07-13T00:00:00.000Z", tags: ["대칭"],
    };
    await Promise.all([
      writeFile(join(contentDir, "index.html"), "<title>대칭</title>"),
      writeFile(join(contentDir, "style.css"), ""),
      writeFile(join(contentDir, "script.js"), "학습 목표"),
      writeFile(join(contentDir, "manifest.json"), JSON.stringify(manifest)),
      writeFile(join(contentDir, "thumbnail.png"), "png"),
    ]);
    const assetPlan = { generated: [{ fileName: "thumbnail.png", prompt: "그림" }], coverage: [] };
    try {
      const manifestOnly = await runStaticQa({ contentDir, assetPlan });
      expect(manifestOnly.checks.find((item) => item.id === "image-files")?.errors.join(" "))
        .toContain("콘텐츠 코드");

      await writeFile(join(contentDir, "script.js"), 'const image = new Image(); image.src = "thumbnail.png"; 학습 목표');
      const scriptReference = await runStaticQa({ contentDir, assetPlan });
      expect(scriptReference.checks.find((item) => item.id === "image-files")?.errors.join(" "))
        .not.toContain("콘텐츠 코드");
    } finally { await rm(root, { recursive: true, force: true }); }
  });

  test("입력과 대상 파일이 그대로인 성공 QA 보고서는 재개할 수 있다", async () => {
    const root = await mkdtemp(join(tmpdir(), "factory-qa-resume-"));
    const contentDir = join(root, "public/contents/math/elementary/resume-id");
    const runDir = join(root, "agents/content-factory/runs/resume-id");
    await Promise.all([mkdir(contentDir, { recursive: true }), mkdir(runDir, { recursive: true })]);
    const manifest = { id: "resume-id", title: "대칭", subject: "math", gradeLevel: "elementary",
      grade: "elementary-5", type: "simulation", language: "ko", description: "설명",
      path: "/contents/math/elementary/resume-id/index.html", thumbnail: "thumbnail.png",
      createdAt: "2026-07-13T00:00:00.000Z", tags: ["대칭"] };
    const runtime = `class Scene {} class EduFlixEngine { nextScene(){const order=['hook','story','core','quiz','wrap'];}
      render(){this.data.interaction.onInit(null,this); window.parent.postMessage('close','*');} }
      const data={interaction:{onInit:(container,engine)=>{engine.showFeedback('좋아요');engine.enableNext();}}}; Engine.init(data); 학습 목표`;
    const plan = validPlan();
    const storyboard = validStoryboard();
    const assets = validAssets("resume-id");
    await Promise.all([
      writeFile(join(contentDir, "index.html"), `<title>대칭</title><link href="style.css"><link href="../../../common/mobile.css"><main>학습 목표<div id="hook"></div><div id="story"></div><div id="core"></div><div id="quiz"></div><div id="wrap"></div><img src="thumbnail.png"></main>`),
      writeFile(join(contentDir, "style.css"), "@media (prefers-reduced-motion: reduce) { * { animation: none; } }"),
      writeFile(join(contentDir, "script.js"), runtime), writeFile(join(contentDir, "manifest.json"), JSON.stringify(manifest)),
      writeFile(join(contentDir, "thumbnail.png"), "png"), writeFile(join(runDir, "plan.json"), JSON.stringify(plan)),
      writeFile(join(runDir, "storyboard.json"), JSON.stringify(storyboard)),
      writeFile(join(runDir, "assets.json"), JSON.stringify(assets)),
    ]);
    const report = { ...await runStaticQa({ contentDir }), judge: passingJudge,
      qaInputDigest: digestValue({ plan, storyboard, assets }) };
    await writeFile(join(runDir, "qa-report.json"), JSON.stringify(report));
    const context = { rootDir: root, factoryDir: join(root, "agents/content-factory"), runDir,
      contentDir, id: "resume-id", topic: "대칭", grade: "elementary-5", gradeLevel: "elementary",
      subject: "math", force: false, skipImages: false } satisfies FactoryContext;
    try {
      expect(await canResumeQa(context)).toBe(true);
      await writeFile(join(contentDir, "script.js"), `${runtime}\n변경`);
      expect(await canResumeQa(context)).toBe(false);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
});
