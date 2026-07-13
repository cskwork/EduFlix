import { open, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { validateManifest } from "../lib/validate";
import { type FactoryContext } from "./common";
import { assertQaArtifactsCurrent, assertQaPassed } from "./qa";

interface CatalogEntry { id: string; [key: string]: unknown }

function findMatchingBracket(text: string, openAt: number): number {
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = openAt; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === "[") depth += 1;
    else if (char === "]" && --depth === 0) return index;
  }
  throw new Error("카탈로그 contents 배열의 끝을 찾지 못했습니다.");
}

function findJsonStringEnd(text: string, openAt: number): number {
  let escaped = false;
  for (let index = openAt + 1; index < text.length; index += 1) {
    if (escaped) escaped = false;
    else if (text[index] === "\\") escaped = true;
    else if (text[index] === '"') return index;
  }
  throw new Error("카탈로그 문자열의 끝을 찾지 못했습니다.");
}

function findRootStringValue(source: string, key: string): [number, number] {
  let objectDepth = 0;
  let arrayDepth = 0;
  let found: [number, number] | undefined;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === '"') {
      const end = findJsonStringEnd(source, index);
      let cursor = end + 1;
      while (/\s/.test(source[cursor] ?? "")) cursor += 1;
      const isRootKey = objectDepth === 1 && arrayDepth === 0 && source[cursor] === ":" &&
        JSON.parse(source.slice(index, end + 1)) === key;
      if (isRootKey) {
        cursor += 1;
        while (/\s/.test(source[cursor] ?? "")) cursor += 1;
        if (source[cursor] !== '"') throw new Error(`카탈로그 루트 ${key}는 문자열이어야 합니다.`);
        const valueEnd = findJsonStringEnd(source, cursor);
        if (found) throw new Error(`카탈로그 루트 ${key}가 중복되었습니다.`);
        found = [cursor, valueEnd + 1];
      }
      index = end;
    } else if (char === "{") objectDepth += 1;
    else if (char === "}") objectDepth -= 1;
    else if (char === "[") arrayDepth += 1;
    else if (char === "]") arrayDepth -= 1;
  }
  if (!found) throw new Error(`카탈로그 루트 ${key}를 찾지 못했습니다.`);
  return found;
}

function findRootArray(source: string, key: string): [number, number] {
  let objectDepth = 0;
  let arrayDepth = 0;
  let found: [number, number] | undefined;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === '"') {
      const end = findJsonStringEnd(source, index);
      let cursor = end + 1;
      while (/\s/.test(source[cursor] ?? "")) cursor += 1;
      const isRootKey = objectDepth === 1 && arrayDepth === 0 && source[cursor] === ":" &&
        JSON.parse(source.slice(index, end + 1)) === key;
      if (isRootKey) {
        cursor += 1;
        while (/\s/.test(source[cursor] ?? "")) cursor += 1;
        if (source[cursor] !== "[") throw new Error(`카탈로그 루트 ${key}는 배열이어야 합니다.`);
        if (found) throw new Error(`카탈로그 루트 ${key}가 중복되었습니다.`);
        found = [cursor, findMatchingBracket(source, cursor)];
      }
      index = end;
    } else if (char === "{") objectDepth += 1;
    else if (char === "}") objectDepth -= 1;
    else if (char === "[") arrayDepth += 1;
    else if (char === "]") arrayDepth -= 1;
  }
  if (!found) throw new Error(`카탈로그 루트 ${key}를 찾지 못했습니다.`);
  return found;
}

function replaceRootLastUpdated(source: string): string {
  const [start, end] = findRootStringValue(source, "lastUpdated");
  return source.slice(0, start) + JSON.stringify(new Date().toISOString()) + source.slice(end);
}

function objectRanges(arrayText: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  let depth = 0;
  let start = -1;
  let quoted = false;
  let escaped = false;
  for (let index = 0; index < arrayText.length; index += 1) {
    const char = arrayText[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === "{") { if (depth === 0) start = index; depth += 1; }
    else if (char === "}" && --depth === 0 && start >= 0) ranges.push([start, index + 1]);
  }
  return ranges;
}

function formatEntry(entry: CatalogEntry): string {
  return JSON.stringify(entry, null, 2).split("\n").map((line) => `    ${line}`).join("\n");
}

export function updateCatalog(source: string, entry: CatalogEntry, force: boolean): string {
  validateCatalogSource(source);
  const [open, close] = findRootArray(source, "contents");
  const body = source.slice(open + 1, close);
  const ranges = objectRanges(body);
  const duplicate = ranges.find(([start, end]) => {
    try { return (JSON.parse(body.slice(start, end)) as CatalogEntry).id === entry.id; }
    catch { throw new Error("카탈로그 항목 JSON이 손상되었습니다."); }
  });
  const formatted = formatEntry(entry);
  let result: string;
  if (duplicate) {
    if (!force) throw new Error(`카탈로그에 같은 id가 있습니다: ${entry.id}`);
    result = source.slice(0, open + 1 + duplicate[0]) + formatted.trimStart()
      + source.slice(open + 1 + duplicate[1]);
  } else {
    const insertion = `${body.trim().length > 0 ? "," : ""}\n${formatted}\n  `;
    result = source.slice(0, close) + insertion + source.slice(close);
  }
  return replaceRootLastUpdated(result);
}

async function lockOwnerIsDead(lockPath: string): Promise<boolean> {
  try {
    const value = JSON.parse(await readFile(lockPath, "utf8")) as { pid?: unknown };
    if (!Number.isSafeInteger(value.pid) || Number(value.pid) <= 0) return false;
    try { process.kill(Number(value.pid), 0); return false; }
    catch (error) { return (error as NodeJS.ErrnoException).code === "ESRCH"; }
  } catch {
    return false;
  }
}

async function acquireCatalogLock(lockPath: string) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const lock = await open(lockPath, "wx");
      try {
        await lock.writeFile(JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() }));
        return lock;
      } catch (error) {
        await lock.close().catch(() => undefined);
        await unlink(lockPath).catch(() => undefined);
        throw error;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      if (attempt === 0 && await lockOwnerIsDead(lockPath)) {
        await unlink(lockPath);
        continue;
      }
      throw new Error("다른 프로세스가 카탈로그를 갱신 중입니다. 잠시 후 다시 시도하세요.");
    }
  }
  throw new Error("카탈로그 락을 획득할 수 없습니다.");
}

function validateCatalogSource(source: string): void {
  let catalog: unknown;
  try {
    catalog = JSON.parse(source);
  } catch (error) {
    throw new Error(`카탈로그 JSON이 손상되었습니다: ${String(error)}`);
  }
  if (typeof catalog !== "object" || catalog === null || Array.isArray(catalog)) {
    throw new Error("카탈로그 루트 래퍼가 JSON 객체가 아닙니다.");
  }
  const wrapper = catalog as { version?: unknown; lastUpdated?: unknown; contents?: unknown };
  if (typeof wrapper.version !== "string" || wrapper.version.trim().length === 0) {
    throw new Error("카탈로그 루트 version은 비어 있지 않은 문자열이어야 합니다.");
  }
  if (typeof wrapper.lastUpdated !== "string" || wrapper.lastUpdated.trim().length === 0) {
    throw new Error("카탈로그 루트 lastUpdated는 비어 있지 않은 문자열이어야 합니다.");
  }
  if (!Array.isArray(wrapper.contents)) {
    throw new Error("카탈로그 contents[] 래퍼가 없습니다.");
  }
  const existingIds = wrapper.contents.map((item) =>
    typeof item === "object" && item !== null ? (item as { id?: unknown }).id : undefined);
  if (existingIds.some((id) => typeof id !== "string" || id.length === 0)) {
    throw new Error("카탈로그 항목 id가 손상되었습니다.");
  }
  if (new Set(existingIds).size !== existingIds.length) {
    throw new Error("카탈로그에 중복 id가 있어 안전하게 수정할 수 없습니다.");
  }
}

export async function runPublishStage(context: FactoryContext): Promise<void> {
  const manifestPath = join(context.contentDir, "manifest.json");
  const catalogPath = join(context.rootDir, "public/contents/index.json");
  const [manifestText, qaText] = await Promise.all([
    readFile(manifestPath, "utf8"), readFile(join(context.runDir, "qa-report.json"), "utf8"),
  ]);
  const qaReport = JSON.parse(qaText);
  assertQaPassed(qaReport, context.contentDir);
  await assertQaArtifactsCurrent(qaReport, context);
  const manifest = validateManifest(JSON.parse(manifestText));
  if (!manifest.valid || !manifest.value) {
    throw new Error(`manifest 검증 실패:\n- ${manifest.errors.join("\n- ")}`);
  }
  const entry = manifest.value as CatalogEntry;
  if (entry.id !== context.id) throw new Error("manifest id와 실행 id가 다릅니다.");
  if (entry.grade !== context.grade) throw new Error("manifest grade와 실행 grade가 다릅니다.");
  const lockPath = `${catalogPath}.lock`;
  const lock = await acquireCatalogLock(lockPath);
  const tempPath = `${catalogPath}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    const source = await readFile(catalogPath, "utf8");
    const updated = updateCatalog(source, entry, context.force);
    JSON.parse(updated);
    await writeFile(tempPath, updated, { encoding: "utf8", flag: "wx" });
    await rename(tempPath, catalogPath);
  } finally {
    try { await lock.close(); }
    finally {
      await unlink(lockPath);
      await unlink(tempPath).catch(() => undefined);
    }
  }
}
