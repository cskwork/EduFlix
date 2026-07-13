import { existsSync, statSync } from "node:fs";
import { mkdir, readFile, rename, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;

export interface CodexTextOptions {
  prompt: string;
  outFile: string;
  schemaFile?: string;
  workspaceWrite?: boolean;
  cwd?: string;
  timeoutMs?: number;
  validateOutput?: (text: string) => string | undefined;
}

interface SpawnResult {
  exitCode: number;
  timedOut: boolean;
}

async function spawnWithTimeout(args: string[], timeoutMs: number): Promise<SpawnResult> {
  const subprocess = Bun.spawn(args, {
    env: process.env,
    stdin: "ignore",
    stdout: "ignore",
    stderr: "ignore",
    detached: true,
  });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    if (process.platform !== "win32") {
      try { process.kill(-subprocess.pid, "SIGKILL"); return; } catch { /* fall through */ }
    }
    subprocess.kill("SIGKILL");
  }, timeoutMs);

  try {
    return { exitCode: await subprocess.exited, timedOut };
  } finally {
    clearTimeout(timer);
  }
}

async function runWithRetry(
  args: string[], label: string, timeoutMs: number, beforeAttempt?: () => Promise<void>,
  afterAttempt?: () => Promise<string | undefined>,
): Promise<void> {
  let lastMessage = "알 수 없는 오류";
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await beforeAttempt?.();
    const result = await spawnWithTimeout(args, timeoutMs);
    const validationError = result.exitCode === 0 && !result.timedOut
      ? await afterAttempt?.() : undefined;
    if (result.exitCode === 0 && !result.timedOut && !validationError) return;
    lastMessage = result.timedOut
      ? `${Math.round(timeoutMs / 1000)}초 시간 제한 초과`
      : validationError ?? `종료 코드 ${result.exitCode}`;
  }
  throw new Error(`${label} 실패(재시도 1회 포함): ${lastMessage}`);
}

export async function runCodexText(options: CodexTextOptions): Promise<void> {
  const outFile = resolve(options.outFile);
  await mkdir(dirname(outFile), { recursive: true });
  const temporaryOutFile = `${outFile}.${process.pid}.${crypto.randomUUID()}.tmp`;
  const args = [
    "codex", "exec", "--skip-git-repo-check",
    "--sandbox", options.workspaceWrite ? "workspace-write" : "read-only",
  ];
  if (options.cwd) args.push("-C", resolve(options.cwd));
  args.push(
    "-m", "gpt-5.6-sol",
    "--config", 'model_reasoning_effort="high"',
    "-o", temporaryOutFile,
  );
  if (options.schemaFile) args.push("--output-schema", resolve(options.schemaFile));
  args.push(options.prompt);

  try {
    await runWithRetry(
      args,
      "Codex 생성",
      options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      () => rm(temporaryOutFile, { force: true }),
      async () => {
        if (!existsSync(temporaryOutFile) || statSync(temporaryOutFile).size === 0) {
          return `출력 파일이 비어 있습니다: ${outFile}`;
        }
        return options.validateOutput?.(await readFile(temporaryOutFile, "utf8"));
      },
    );
    await rename(temporaryOutFile, outFile);
  } finally {
    await rm(temporaryOutFile, { force: true });
  }
}

export async function runCodexImage(
  spec: string,
  outFile: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<void> {
  const absoluteOutFile = resolve(outFile);
  const outDir = dirname(absoluteOutFile);
  await mkdir(outDir, { recursive: true });
  const temporaryOutFile = `${absoluteOutFile}.${process.pid}.${crypto.randomUUID()}.tmp.png`;
  const prompt = [
    `Use the image_gen tool to generate: ${spec}.`,
    `Save the final PNG to ${temporaryOutFile}.`,
    "이미지 안에는 글자를 넣지 마세요.",
  ].join(" ");
  const args = [
    "codex", "exec", "--sandbox", "workspace-write",
    "--skip-git-repo-check", "-C", outDir,
    "-m", "gpt-5.6-sol", "--config", 'model_reasoning_effort="high"',
    prompt,
  ];

  try {
    await runWithRetry(
      args,
      "이미지 생성",
      timeoutMs,
      () => rm(temporaryOutFile, { force: true }),
      async () => !existsSync(temporaryOutFile) || statSync(temporaryOutFile).size === 0
        ? `이미지 결과가 비어 있습니다: ${absoluteOutFile}` : undefined,
    );
    await rename(temporaryOutFile, absoluteOutFile);
  } finally {
    await rm(temporaryOutFile, { force: true });
  }
  if (!existsSync(absoluteOutFile) || statSync(absoluteOutFile).size === 0) {
    throw new Error(`이미지 생성 결과가 없거나 비어 있습니다: ${absoluteOutFile}`);
  }
}
