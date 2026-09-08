import { open, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";

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

export async function acquireCatalogLock(lockPath: string) {
  try {
    const lock = await open(lockPath, "wx");
    try {
      await lock.writeFile(JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() }));
      const owned = await lock.stat();
      return {
        async release() {
          try {
            const current = await stat(lockPath).catch((error: NodeJS.ErrnoException) => {
              if (error.code === "ENOENT") return undefined;
              throw error;
            });
            if (current?.dev === owned.dev && current.ino === owned.ino) await unlink(lockPath);
          } finally { await lock.close(); }
        },
      };
    } catch (error) {
      await lock.close().catch(() => undefined);
      await unlink(lockPath).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    // Checking a PID and unlinking are not atomic. Two recoverers could remove
    // a newly acquired live lock, so recovery requires stopped writers.
    if (await lockOwnerIsDead(lockPath)) {
      throw new Error("종료된 프로세스의 카탈로그 락입니다. 모든 작성 프로세스를 중지한 뒤 락 파일을 제거하세요.");
    }
    throw new Error("다른 프로세스가 카탈로그를 갱신 중입니다. 잠시 후 다시 시도하세요.");
  }
}

export function validateCatalogSource(source: string): void {
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


export async function atomicWriteFile(path: string, content: string): Promise<void> {
  const temporary = `${path}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    await writeFile(temporary, content, { encoding: "utf8", flag: "wx" });
    await rename(temporary, path);
  } finally { await unlink(temporary).catch(() => undefined); }
}
