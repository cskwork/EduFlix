# Publish edge-case probe

## Scope and model

Goal: a publish either exposes one QA-approved content generation and its matching catalog entry, or leaves the previously published generation untouched. Reviewed `PLAN.md`, `GOAL.md`, `pipeline/stages/publish.ts`, `publish.test.ts`, `qa.ts`, `qa.test.ts`, `build.ts`, and `run.ts`. No product code or tests were changed.

The normal catalog-only commit has a sound shape: write a unique temp file in the catalog directory, parse-check it, then rename it over `index.json`. A write or rename failure before the commit point leaves the old catalog in place, and the `finally` normally removes the temp file. Existing publish tests pass, but do not inject write/rename/cleanup failures.

## Grounded defects

### P1 — Textual `contents` lookup can report success without registering the entry

Evidence: `publish.ts:157-179` validates the parsed root wrapper, but then mutates the first textual occurrence of `"contents"` (`source.indexOf`) rather than the unique root property validated by `JSON.parse`. `validateCatalogSource` does not reject duplicate root `contents` keys or earlier nested `contents` properties.

Reproduction executed:

```ts
const source = JSON.stringify({
  version: "1",
  lastUpdated: "2026-01-01",
  metadata: { contents: [] },
  contents: [{ id: "kept" }],
}, null, 2);
const parsed = JSON.parse(updateCatalog(source, { id: "new" }, false));
// parsed.metadata.contents === [{ id: "new" }]
// parsed.contents === [{ id: "kept" }]
```

The same failure occurs with duplicate root keys: `{"contents":[],"contents":[{"id":"kept"}]}`. The first, shadowed array is edited; `JSON.parse(updated).contents` still omits `new`. `lastUpdated` nevertheless changes, so the operation looks successful.

Impact: silent missed publication on a catalog that the current validator accepts. The existing corrupted/duplicate-ID test does not cover duplicate keys or nested same-name properties.

Minimal fix: extend the existing JSON scanner to locate exactly one root-level `contents` key and its array bounds; reject zero/multiple root occurrences. Do not fall back to parse/stringify, because the frozen plan requires byte preservation of existing entries.

Minimal tests:

- A valid wrapper with `metadata.contents` before root `contents` must append only to root `contents`.
- Duplicate root `contents` must throw before changing `lastUpdated`.
- A string value containing `"contents"` before the root key must not redirect the mutation.

### P1 — Forced replacement and concurrent same-ID publication are not transactional

Evidence:

- `build.ts:47-66` writes the four required files into the live content directory one rename at a time.
- `run.ts:180-184` performs build, QA, and publish as separate stages with no run/content lock.
- `publish.ts:215-226` reads and verifies the manifest and QA artifacts before acquiring the catalog lock at `publish.ts:227-236`.
- The lock protects only `index.json`; it does not protect `contentDir` from another forced build.

Failure modes:

1. A failure on the second through fourth build rename leaves a mixed old/new live generation even though QA and publish never complete.
2. On `--force`, all new content files are already live when the catalog temp write/rename runs. If catalog write/rename fails, the old catalog entry remains but now points to replaced content; there is no rollback.
3. Two same-ID runs can interleave. Run A can finish its digest check, run B can replace live files, and run A can then commit a catalog entry derived from A while B's files are live. The pre-lock digest check is a time-of-check/time-of-use gap.

Impact: failed or concurrent forced publication can expose a generation that did not correspond to the successful QA/catalog commit. Per-file rename protects individual files, not the content generation as a unit.

Minimal sustainable fix: keep generated content in a sibling generation directory through QA. Acquire a per-content-ID lock before the final digest verification, then acquire the catalog lock in a fixed order. Commit with a rollback-capable directory swap: current directory to backup, staged directory to live, catalog temp to catalog; restore the backup if either live-directory or catalog rename fails. Release locks only after the final verification/rollback completes. A small transaction journal is preferable if crash recovery across the two rename commit points is required.

Minimal tests (filesystem operations should be injectable):

- Fail each content rename in turn; the original directory must remain byte-identical.
- Fail catalog temp write and catalog rename during force; original content and catalog must both remain byte-identical.
- Pause run A after digest verification, let run B attempt the same ID, then resume A; exactly one matching generation/catalog pair may commit.

### P1 — One crash or cleanup failure can block every later publication forever

Evidence: `publish.ts:227-236` treats every existing `.lock` as an active publisher. The lock is empty, has no owner/timestamp, and has no stale-lock recovery. A process death bypasses `finally`. In addition, `publish.ts:245-247` suppresses lock unlink failure, so a publish can return success while leaving a lock that permanently rejects all future runs.

The existing test creates a lock and confirms rejection; it also demonstrates that there is no distinction between a live and stale owner.

Impact: an interrupted publish or transient unlink/permission failure turns the fully automated CLI into a permanently fail-fast workflow requiring manual filesystem repair.

Minimal fix: put owner PID, creation time, and a random ownership token in the lock; retry fresh locks for a bounded interval; reclaim an expired lock with an atomic rename-to-quarantine before reacquiring. Cleanup must verify ownership. If the publish itself succeeded but owned-lock removal fails, surface an error rather than fake success. Keep temp cleanup best-effort, but structure cleanup so `lock.close()` failure cannot skip both unlinks.

Minimal tests:

- A fresh live lock blocks without changing catalog or lock.
- An expired/dead-owner lock is reclaimed and publication succeeds.
- Inject lock `unlink` failure after catalog commit; the call must report the cleanup failure.
- Inject `close` failure; temp and owned lock cleanup must still be attempted and the primary failure must not be lost.

## ASK-USER — concurrent different-ID policy

Current behavior is safe but fail-fast: if two different IDs publish concurrently, one wins the catalog lock and the other immediately exits with “잠시 후 다시 시도하세요”; the CLI has no retry (`publish.ts:230-234`, `run.ts:181-184`). The plan does not define whether this is acceptable.

Recommended policy: serialize with bounded retry and jitter so both independent publications normally succeed. If fail-fast is intentional, document it as an operator retry contract and return a distinct retryable error/exit code.

## Checks performed

- `bun test agents/content-factory/pipeline/stages/publish.test.ts` — 9 pass, 0 fail.
- Direct `bun -e` reproduction for nested and duplicate root `contents` — both returned an updated document whose effective root `contents` omitted the new entry.
- Static failure-path review for temp write, catalog rename, cleanup, forced replacement, and lock acquisition.

## Verdict

Request changes. Catalog-only rename is atomic on the ordinary POSIX path, and existing duplicate IDs are rejected, but the three P1 cases above permit silent non-publication, non-transactional forced replacement, or permanent publication outage.
