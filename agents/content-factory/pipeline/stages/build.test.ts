import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { chmod, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runBuildStage } from "./build";
import type { FactoryContext } from "./common";
import { validAssets, validPlan, validStoryboard } from "../test-fixtures";

const originalPath = process.env.PATH;
const originalProvider = process.env.FACTORY_LLM_PROVIDER;
const roots: string[] = [];

beforeEach(() => {
  process.env.FACTORY_LLM_PROVIDER = "codex";
});

afterEach(async () => {
  process.env.PATH = originalPath;
  if (originalProvider === undefined) delete process.env.FACTORY_LLM_PROVIDER;
  else process.env.FACTORY_LLM_PROVIDER = originalProvider;
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("빌드 산출물 격리", () => {
  test("빌드 프롬프트는 에셋 단계의 상대경로만 참조하고 이미지를 스테이징하지 않는다", async () => {
    const prompt = await readFile(join(import.meta.dir, "../../prompts/04-build.md"), "utf8");

    expect(prompt).toContain("이미지 에셋은 에셋 단계에서 이미 생성되거나 제공되었다");
    expect(prompt).toContain("이미지 파일을 새로 만들거나 복사하지 않는다");
    expect(prompt).toContain("제공된 상대경로만 참조한다");
    expect(prompt).toContain("https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js");
    expect(prompt).toContain("https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js");
  });

  test("빌드는 에셋 단계가 둔 이미지를 보존하고 네 핵심 파일만 승격한다", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "factory-build-assets-"));
    roots.push(rootDir);
    const runDir = join(rootDir, "agents/content-factory/runs/new-id");
    const contentDir = join(rootDir, "public/contents/math/elementary/new-id");
    const exampleDir = join(rootDir, "public/contents/math/middle/probability-coin");
    const binDir = join(rootDir, "bin");
    const promptDir = join(rootDir, "agents/content-factory/prompts");
    await Promise.all([mkdir(runDir, { recursive: true }), mkdir(contentDir, { recursive: true }),
      mkdir(exampleDir, { recursive: true }), mkdir(binDir, { recursive: true }),
      mkdir(promptDir, { recursive: true })]);
    const assets = validAssets("new-id");
    assets.generated.push({ assetId: "thumbnail", fileName: "thumbnail.png", scenes: ["hook"],
      purpose: "카탈로그", prompt: "대칭 도형", alt: "대칭 도형", width: 1200, height: 675 });
    await Promise.all([
      writeFile(join(runDir, "plan.json"), JSON.stringify(validPlan())),
      writeFile(join(runDir, "storyboard.json"), JSON.stringify(validStoryboard())),
      writeFile(join(runDir, "assets.json"), JSON.stringify(assets)),
      writeFile(join(contentDir, "thumbnail.png"), "asset-stage-image"),
      writeFile(join(exampleDir, "script.js"), "class EduFlixEngine {} class Scene {}"),
      writeFile(join(promptDir, "methodology.md"), "방법론"),
      writeFile(join(promptDir, "04-build.md"), "빌드"),
    ]);
    const executable = join(binDir, "codex");
    const capturedPrompt = join(rootDir, "captured-build-prompt.txt");
    await writeFile(executable, `#!/bin/sh
out=""
cwd=""
while [ "$#" -gt 0 ]; do
  last="$1"
  [ "$1" = "-o" ] && { shift; out="$1"; }
  [ "$1" = "-C" ] && { shift; cwd="$1"; }
  shift
done
for file in index.html style.css script.js manifest.json; do printf '%s' "new-$file" > "$cwd/$file"; done
printf '%s' "$last" > "${capturedPrompt}"
printf '%s' done > "$out"
exit 0
`);
    await chmod(executable, 0o755);
    process.env.PATH = `${binDir}:${originalPath ?? ""}`;
    const context = { rootDir, factoryDir: join(rootDir, "agents/content-factory"), runDir,
      contentDir, id: "new-id", topic: "신규", grade: "elementary-5",
      gradeLevel: "elementary", subject: "math", force: true, skipImages: false } satisfies FactoryContext;

    await runBuildStage(context);

    expect(await readFile(join(contentDir, "thumbnail.png"), "utf8")).toBe("asset-stage-image");
    expect((await readdir(contentDir)).sort()).toEqual([
      "index.html", "manifest.json", "script.js", "style.css", "thumbnail.png",
    ]);
    const buildPrompt = await readFile(capturedPrompt, "utf8");
    expect(buildPrompt).toContain('"sourcePath":"thumbnail.png"');
    expect(buildPrompt).not.toContain(join(contentDir, "thumbnail.png"));
  });

  test("force 빌드가 새 핵심 파일을 쓰지 않으면 기존 파일을 보존하고 실패한다", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "factory-build-"));
    roots.push(rootDir);
    const runDir = join(rootDir, "agents/content-factory/runs/new-id");
    const contentDir = join(rootDir, "public/contents/math/elementary/new-id");
    const exampleDir = join(rootDir, "public/contents/math/middle/probability-coin");
    const binDir = join(rootDir, "bin");
    const promptDir = join(rootDir, "agents/content-factory/prompts");
    await Promise.all([mkdir(runDir, { recursive: true }), mkdir(contentDir, { recursive: true }),
      mkdir(exampleDir, { recursive: true }), mkdir(binDir, { recursive: true }),
      mkdir(promptDir, { recursive: true })]);
    await Promise.all([
      writeFile(join(runDir, "plan.json"), JSON.stringify(validPlan())),
      writeFile(join(runDir, "storyboard.json"), JSON.stringify(validStoryboard())),
      writeFile(join(runDir, "assets.json"), JSON.stringify(validAssets("new-id"))),
      writeFile(join(exampleDir, "script.js"), "class EduFlixEngine {} class HookScene {}"),
      writeFile(join(promptDir, "methodology.md"), "방법론"),
      writeFile(join(promptDir, "04-build.md"), "빌드"),
    ]);
    const required = ["index.html", "style.css", "script.js", "manifest.json"];
    await Promise.all(required.map((file) => writeFile(join(contentDir, file), `old-${file}`)));
    const executable = join(binDir, "codex");
    await writeFile(executable, `#!/bin/sh
out=""
while [ "$#" -gt 0 ]; do [ "$1" = "-o" ] && { shift; out="$1"; }; shift; done
printf '%s' 'done' > "$out"
exit 0
`);
    await chmod(executable, 0o755);
    process.env.PATH = `${binDir}:${originalPath ?? ""}`;
    const context = { rootDir, factoryDir: join(rootDir, "agents/content-factory"), runDir,
      contentDir, id: "new-id", topic: "신규", grade: "elementary-5",
      gradeLevel: "elementary", subject: "math", force: true, skipImages: false } satisfies FactoryContext;

    await expect(runBuildStage(context)).rejects.toThrow("이번 빌드 산출물 누락");
    for (const file of required) expect(await readFile(join(contentDir, file), "utf8")).toBe(`old-${file}`);
  });

  test("잘못된 상위 JSON은 Codex 실행 전에 거부한다", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "factory-build-input-"));
    roots.push(rootDir);
    const runDir = join(rootDir, "agents/content-factory/runs/new-id");
    const contentDir = join(rootDir, "public/contents/math/elementary/new-id");
    const exampleDir = join(rootDir, "public/contents/math/middle/probability-coin");
    const promptDir = join(rootDir, "agents/content-factory/prompts");
    await Promise.all([mkdir(runDir, { recursive: true }), mkdir(contentDir, { recursive: true }),
      mkdir(exampleDir, { recursive: true }), mkdir(promptDir, { recursive: true })]);
    await Promise.all([
      writeFile(join(runDir, "plan.json"), "{}"),
      writeFile(join(runDir, "storyboard.json"), JSON.stringify(validStoryboard())),
      writeFile(join(runDir, "assets.json"), JSON.stringify(validAssets("new-id"))),
      writeFile(join(exampleDir, "script.js"), "class EduFlixEngine {} class Scene {}"),
      writeFile(join(promptDir, "methodology.md"), "방법론"),
      writeFile(join(promptDir, "04-build.md"), "빌드"),
    ]);
    const context = { rootDir, factoryDir: join(rootDir, "agents/content-factory"), runDir,
      contentDir, id: "new-id", topic: "신규", grade: "elementary-5",
      gradeLevel: "elementary", subject: "math", force: true, skipImages: false } satisfies FactoryContext;
    await expect(runBuildStage(context)).rejects.toThrow("plan JSON 검증 실패");
  });

  test("Codex가 계약의 4파일 외 산출물을 쓰면 승격하지 않고 실패한다", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "factory-build-extra-"));
    roots.push(rootDir);
    const runDir = join(rootDir, "agents/content-factory/runs/new-id");
    const contentDir = join(rootDir, "public/contents/math/elementary/new-id");
    const exampleDir = join(rootDir, "public/contents/math/middle/probability-coin");
    const binDir = join(rootDir, "bin");
    const promptDir = join(rootDir, "agents/content-factory/prompts");
    await Promise.all([mkdir(runDir, { recursive: true }), mkdir(contentDir, { recursive: true }),
      mkdir(exampleDir, { recursive: true }), mkdir(binDir, { recursive: true }),
      mkdir(promptDir, { recursive: true })]);
    await Promise.all([
      writeFile(join(runDir, "plan.json"), JSON.stringify(validPlan())),
      writeFile(join(runDir, "storyboard.json"), JSON.stringify(validStoryboard())),
      writeFile(join(runDir, "assets.json"), JSON.stringify(validAssets("new-id"))),
      writeFile(join(exampleDir, "script.js"), "class EduFlixEngine {} class Scene {}"),
      writeFile(join(promptDir, "methodology.md"), "방법론"),
      writeFile(join(promptDir, "04-build.md"), "빌드"),
    ]);
    const executable = join(binDir, "codex");
    await writeFile(executable, `#!/bin/sh
out=""
cwd=""
while [ "$#" -gt 0 ]; do
  [ "$1" = "-o" ] && { shift; out="$1"; }
  [ "$1" = "-C" ] && { shift; cwd="$1"; }
  shift
done
for file in index.html style.css script.js manifest.json unexpected.txt; do printf '%s' "new-$file" > "$cwd/$file"; done
printf '%s' done > "$out"
exit 0
`);
    await chmod(executable, 0o755);
    process.env.PATH = `${binDir}:${originalPath ?? ""}`;
    const context = { rootDir, factoryDir: join(rootDir, "agents/content-factory"), runDir,
      contentDir, id: "new-id", topic: "신규", grade: "elementary-5",
      gradeLevel: "elementary", subject: "math", force: true, skipImages: false } satisfies FactoryContext;

    await expect(runBuildStage(context)).rejects.toThrow("허용되지 않은 빌드 산출물");
    for (const file of ["index.html", "style.css", "script.js", "manifest.json"]) {
      expect(await Bun.file(join(contentDir, file)).exists()).toBe(false);
    }
  });

  test("숨김 도구 아티팩트(.playwright-cli 등)는 4파일 검사에서 무시되고 승격되지 않는다", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "factory-build-hidden-"));
    roots.push(rootDir);
    const runDir = join(rootDir, "agents/content-factory/runs/new-id");
    const contentDir = join(rootDir, "public/contents/math/elementary/new-id");
    const exampleDir = join(rootDir, "public/contents/math/middle/probability-coin");
    const binDir = join(rootDir, "bin");
    const promptDir = join(rootDir, "agents/content-factory/prompts");
    await Promise.all([mkdir(runDir, { recursive: true }), mkdir(contentDir, { recursive: true }),
      mkdir(exampleDir, { recursive: true }), mkdir(binDir, { recursive: true }),
      mkdir(promptDir, { recursive: true })]);
    await Promise.all([
      writeFile(join(runDir, "plan.json"), JSON.stringify(validPlan())),
      writeFile(join(runDir, "storyboard.json"), JSON.stringify(validStoryboard())),
      writeFile(join(runDir, "assets.json"), JSON.stringify(validAssets("new-id"))),
      writeFile(join(exampleDir, "script.js"), "class EduFlixEngine {} class Scene {}"),
      writeFile(join(promptDir, "methodology.md"), "방법론"),
      writeFile(join(promptDir, "04-build.md"), "빌드"),
    ]);
    const executable = join(binDir, "codex");
    await writeFile(executable, `#!/bin/sh
out=""
cwd=""
while [ "$#" -gt 0 ]; do
  [ "$1" = "-o" ] && { shift; out="$1"; }
  [ "$1" = "-C" ] && { shift; cwd="$1"; }
  shift
done
for file in index.html style.css script.js manifest.json; do printf '%s' "new-$file" > "$cwd/$file"; done
mkdir -p "$cwd/.playwright-cli"
printf '%s' state > "$cwd/.playwright-cli/session.json"
printf '%s' junk > "$cwd/.DS_Store"
printf '%s' done > "$out"
exit 0
`);
    await chmod(executable, 0o755);
    process.env.PATH = `${binDir}:${originalPath ?? ""}`;
    const context = { rootDir, factoryDir: join(rootDir, "agents/content-factory"), runDir,
      contentDir, id: "new-id", topic: "신규", grade: "elementary-5",
      gradeLevel: "elementary", subject: "math", force: true, skipImages: false } satisfies FactoryContext;

    await runBuildStage(context);
    for (const file of ["index.html", "style.css", "script.js", "manifest.json"]) {
      expect(await Bun.file(join(contentDir, file)).text()).toBe(`new-${file}`);
    }
    const promotedEntries = await readdir(contentDir);
    expect(promotedEntries).not.toContain(".DS_Store");
    expect(promotedEntries).not.toContain(".playwright-cli");
  });

  test("핵심 파일 승격 중 실패하면 기존 4파일을 모두 복원한다", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "factory-build-rollback-"));
    roots.push(rootDir);
    const runDir = join(rootDir, "agents/content-factory/runs/new-id");
    const contentDir = join(rootDir, "public/contents/math/elementary/new-id");
    const exampleDir = join(rootDir, "public/contents/math/middle/probability-coin");
    const binDir = join(rootDir, "bin");
    const promptDir = join(rootDir, "agents/content-factory/prompts");
    await Promise.all([mkdir(runDir, { recursive: true }), mkdir(contentDir, { recursive: true }),
      mkdir(exampleDir, { recursive: true }), mkdir(binDir, { recursive: true }),
      mkdir(promptDir, { recursive: true })]);
    await Promise.all([
      writeFile(join(runDir, "plan.json"), JSON.stringify(validPlan())),
      writeFile(join(runDir, "storyboard.json"), JSON.stringify(validStoryboard())),
      writeFile(join(runDir, "assets.json"), JSON.stringify(validAssets("new-id"))),
      writeFile(join(exampleDir, "script.js"), "class EduFlixEngine {} class Scene {}"),
      writeFile(join(promptDir, "methodology.md"), "방법론"),
      writeFile(join(promptDir, "04-build.md"), "빌드"),
    ]);
    const required = ["index.html", "style.css", "script.js", "manifest.json"];
    await Promise.all(required.map((file) => writeFile(join(contentDir, file), `old-${file}`)));
    await mkdir(join(contentDir, ".style.css.factory-next"));
    const executable = join(binDir, "codex");
    await writeFile(executable, `#!/bin/sh
out=""
cwd=""
while [ "$#" -gt 0 ]; do
  [ "$1" = "-o" ] && { shift; out="$1"; }
  [ "$1" = "-C" ] && { shift; cwd="$1"; }
  shift
done
for file in index.html style.css script.js manifest.json; do printf '%s' "new-$file" > "$cwd/$file"; done
printf '%s' done > "$out"
exit 0
`);
    await chmod(executable, 0o755);
    process.env.PATH = `${binDir}:${originalPath ?? ""}`;
    const context = { rootDir, factoryDir: join(rootDir, "agents/content-factory"), runDir,
      contentDir, id: "new-id", topic: "신규", grade: "elementary-5",
      gradeLevel: "elementary", subject: "math", force: true, skipImages: false } satisfies FactoryContext;

    await expect(runBuildStage(context)).rejects.toThrow();
    for (const file of required) expect(await readFile(join(contentDir, file), "utf8")).toBe(`old-${file}`);
    for (const file of required) expect(await Bun.file(join(contentDir, `.${file}.factory-next`)).exists()).toBe(false);
  });
});
