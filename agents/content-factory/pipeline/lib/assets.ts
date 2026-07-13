import { existsSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import type { AssetPlan } from "./validate";
import type { FactoryContext } from "../stages/common";

const SHARED_GROUPS = ["backgrounds", "icons", "diagrams", "illustrations"];

export interface ResolvedAsset {
  assetId: string;
  kind: "generated" | "reused";
  sourcePath: string;
  absolutePath: string;
}

export async function listSharedAssets(rootDir: string): Promise<string[]> {
  const base = join(rootDir, "public", "contents");
  const files: string[] = [];
  for (const group of SHARED_GROUPS) {
    const dir = join(base, group);
    if (!existsSync(dir)) continue;
    for (const file of await readdir(dir)) {
      const path = join(dir, file);
      if ((await stat(path)).isFile() && (await stat(path)).size > 0) files.push(`/contents/${group}/${file}`);
    }
  }
  return files;
}

async function requireFile(path: string, label: string): Promise<void> {
  try {
    const value = await stat(path);
    if (value.isFile() && value.size > 0) return;
  } catch { /* handled below */ }
  throw new Error(`계획된 ${label} 에셋이 없거나 비어 있습니다: ${path}`);
}

export async function resolveAssetPaths(context: FactoryContext, plan: AssetPlan): Promise<ResolvedAsset[]> {
  const result: ResolvedAsset[] = [];
  for (const asset of plan.generated) {
    const absolutePath = join(context.contentDir, asset.fileName);
    await requireFile(absolutePath, "생성");
    result.push({ assetId: asset.assetId ?? asset.fileName, kind: "generated",
      sourcePath: asset.fileName, absolutePath });
  }
  for (const item of plan.reused) {
    const asset = item as { assetId: string; sourcePath: string };
    const absolutePath = join(context.rootDir, "public", asset.sourcePath.replace(/^\//, ""));
    await requireFile(absolutePath, "재사용");
    result.push({ assetId: asset.assetId, kind: "reused", sourcePath: asset.sourcePath, absolutePath });
  }
  return result;
}
