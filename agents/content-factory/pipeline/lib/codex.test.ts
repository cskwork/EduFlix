import { afterEach, describe, expect, test } from "bun:test";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runCodexImage, runCodexText } from "./codex";

const originalPath = process.env.PATH;
const tempDirs: string[] = [];

afterEach(async () => {
  process.env.PATH = originalPath;
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("Codex 출력 복구", () => {
  test("새 출력을 쓰지 않은 성공 프로세스가 이전 파일을 재사용하지 못한다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "factory-codex-"));
    tempDirs.push(dir);
    const executable = join(dir, "codex");
    const outFile = join(dir, "result.json");
    await writeFile(executable, "#!/bin/sh\nexit 0\n", "utf8");
    await chmod(executable, 0o755);
    await writeFile(outFile, "stale", "utf8");
    process.env.PATH = `${dir}:${originalPath ?? ""}`;

    await expect(runCodexText({ prompt: "test", outFile, timeoutMs: 1_000 }))
      .rejects.toThrow("출력 파일이 비어");
  });

  test("첫 성공 프로세스의 빈 출력도 한 번 재시도한다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "factory-codex-retry-"));
    tempDirs.push(dir);
    const executable = join(dir, "codex");
    const counter = join(dir, "count");
    const outFile = join(dir, "result.json");
    await writeFile(executable, `#!/bin/sh
count=0
[ -f "${counter}" ] && count=$(sed -n '1p' "${counter}")
count=$((count + 1))
printf '%s' "$count" > "${counter}"
out=""
while [ "$#" -gt 0 ]; do [ "$1" = "-o" ] && { shift; out="$1"; }; shift; done
[ "$count" -eq 2 ] && printf '%s' 'fresh' > "$out"
exit 0
`, "utf8");
    await chmod(executable, 0o755);
    process.env.PATH = `${dir}:${originalPath ?? ""}`;

    await expect(runCodexText({ prompt: "test", outFile, timeoutMs: 1_000 })).resolves.toBeUndefined();
    expect(await readFile(outFile, "utf8")).toBe("fresh");
    expect(await readFile(counter, "utf8")).toBe("2");
  });

  test("오염된 JSON 재생성이 두 번 실패해도 이전 산출물을 보존한다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "factory-codex-invalid-"));
    tempDirs.push(dir);
    const executable = join(dir, "codex");
    const outFile = join(dir, "result.json");
    await writeFile(executable, `#!/bin/sh
out=""
while [ "$#" -gt 0 ]; do [ "$1" = "-o" ] && { shift; out="$1"; }; shift; done
printf '%s' '\`\`\`json\n{"bad":true}\n\`\`\`' > "$out"
exit 0
`, "utf8");
    await chmod(executable, 0o755);
    await writeFile(outFile, '{"valid":true}', "utf8");
    process.env.PATH = `${dir}:${originalPath ?? ""}`;

    await expect(runCodexText({
      prompt: "test", outFile, timeoutMs: 1_000,
      validateOutput: (text) => {
        try { JSON.parse(text); return undefined; } catch { return "JSON 형식 오류"; }
      },
    })).rejects.toThrow("JSON 형식 오류");
    expect(await readFile(outFile, "utf8")).toBe('{"valid":true}');
  });

  test("이미지 재생성이 실패해도 이전 PNG를 보존한다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "factory-codex-image-"));
    tempDirs.push(dir);
    const executable = join(dir, "codex");
    const outFile = join(dir, "thumbnail.png");
    await writeFile(executable, "#!/bin/sh\nexit 1\n", "utf8");
    await chmod(executable, 0o755);
    await writeFile(outFile, "old-png", "utf8");
    process.env.PATH = `${dir}:${originalPath ?? ""}`;

    await expect(runCodexImage("그림", outFile, 1_000)).rejects.toThrow("이미지 생성 실패");
    expect(await readFile(outFile, "utf8")).toBe("old-png");
  });

  test("시간 제한으로 종료할 때 Codex가 만든 자식 프로세스도 남기지 않는다", async () => {
    if (process.platform === "win32") return;
    const dir = await mkdtemp(join(tmpdir(), "factory-codex-timeout-"));
    tempDirs.push(dir);
    const executable = join(dir, "codex");
    const pidFile = join(dir, "children");
    const outFile = join(dir, "result.json");
    await writeFile(executable, `#!/bin/sh
sleep 30 &
printf '%s\n' "$!" >> "${pidFile}"
wait
`, "utf8");
    await chmod(executable, 0o755);
    process.env.PATH = `${dir}:${originalPath ?? ""}`;
    const living: number[] = [];
    try {
      await expect(runCodexText({ prompt: "test", outFile, timeoutMs: 500 }))
        .rejects.toThrow("시간 제한 초과");
      await Bun.sleep(50);
      const pids = (await readFile(pidFile, "utf8")).trim().split("\n").map(Number);
      for (const pid of pids) {
        try { process.kill(pid, 0); living.push(pid); } catch { /* expected */ }
      }
      expect(living).toEqual([]);
    } finally {
      for (const pid of living) { try { process.kill(pid, "SIGKILL"); } catch { /* already gone */ } }
    }
  });
});
