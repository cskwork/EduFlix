import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { resolveAssetPaths } from "./assets";
import type { FactoryContext } from "../stages/common";
import type { AssetPlan } from "./validate";

describe("빌드 에셋 경로 해석", () => {
  test("생성·재사용 에셋을 실존하는 절대경로로 전달하고 누락은 거부한다", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "factory-assets-resolve-"));
    const contentDir = join(rootDir, "public/contents/math/elementary/id");
    const shared = join(rootDir, "public/contents/backgrounds/shared.png");
    await mkdir(contentDir, { recursive: true });
    await mkdir(join(rootDir, "public/contents/backgrounds"), { recursive: true });
    await writeFile(join(contentDir, "thumbnail.png"), "png");
    await writeFile(shared, "png");
    const context = { rootDir, factoryDir: rootDir, runDir: rootDir, contentDir, id: "id", topic: "대칭",
      grade: "elementary-5", gradeLevel: "elementary", subject: "math",
      force: false, skipImages: false } satisfies FactoryContext;
    const plan = { contentId: "id", generated: [{ assetId: "thumbnail", fileName: "thumbnail.png", prompt: "그림" }],
      reused: [{ assetId: "shared", sourcePath: "/contents/backgrounds/shared.png" }],
      cssAlternatives: [], coverage: [] } as AssetPlan;
    try {
      const resolved = await resolveAssetPaths(context, plan);
      expect(resolved.map((item) => item.absolutePath)).toEqual([join(contentDir, "thumbnail.png"), shared]);
      plan.reused = [{ assetId: "missing", sourcePath: "/contents/backgrounds/missing.png" }];
      await expect(resolveAssetPaths(context, plan)).rejects.toThrow("없거나 비어");
    } finally { await rm(rootDir, { recursive: true, force: true }); }
  });
});
