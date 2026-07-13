# CLI/state fresh-context probe

## Decision

Three grounded defects remain in auto-ID derivation, stage-only prerequisite handling, and QA resume. Invalid enums, unsafe IDs, blank topics, first-run `runs/` creation, and provenance checks behaved as designed. Duplicate-flag policy is unspecified and needs a user decision.

## Confirmed defects

### D1 — Mixed Korean/ASCII topics can silently share one auto-ID

- Severity: high; two distinct topics can target the same run/content/catalog identity.
- Reproduction: `--topic "대칭 A"` and `--topic "회전 A"` both resolve to `runs/a/`. The probe ran each with `--stage storyboard`; both errors referenced the same `runs/a/plan.json`. Pure Korean `"선대칭과 점대칭"` correctly used the fallback `content-1mmugab`.
- Cause: `slugify()` keeps any ASCII fragment and adds the hash only when the entire ASCII slug is empty. Removed Korean/special text therefore contributes nothing once one ASCII character remains. The same collision occurs for topics such as `abc!!!` and `abc???`.
- Impact: without `--force`, provenance metadata eventually blocks a mismatched reuse, but the user receives a collision instead of an independent run. With explicit `--force`, the shared identity can replace the other topic's artifacts/content.
- Minimal test: expose/test ID derivation with `slugify("대칭 A") !== slugify("회전 A")`, while preserving deterministic output and the safe-slug contract.
- Minimal fix: append a short hash of the original normalized topic whenever slugification discards any meaningful character, or always append the short hash to auto-generated IDs. Explicit `--id` remains unchanged.

### D2 — Stage-only prerequisite failure creates state first and reports raw file I/O

- Severity: medium; typo-free user commands leave empty run directories and do not explain the required predecessor stage.
- Reproduction: `bun agents/content-factory/pipeline/run.ts --topic first --grade elementary-5 --subject math --stage storyboard --id probe-cli-duplicate-topic` created `agents/content-factory/runs/probe-cli-duplicate-topic/`, then failed with `JSON 산출물을 읽을 수 없습니다 ... plan.json (Error: ENOENT...)`. The empty probe directory was removed afterward. `assets`, `build`, and `publish` follow the same direct-read pattern with more prerequisites.
- Cause: `createContext()` calls recursive `mkdir(runDir)` before `executeStage()` reads prerequisite artifacts; there is no stage preflight map.
- Minimal test: run a stage-only command in a fixture root with its predecessor absent; assert a Korean prerequisite message naming `plan`, exit 1, and no newly-created run directory.
- Minimal fix: preflight the selected stage before creating mutable run state. Define required artifacts per stage (`storyboard: plan`, `assets: storyboard`, `build: plan/storyboard/assets`, `publish: manifest/QA/upstream inputs`); retain the special static-QA path.

### D3 — Successful unchanged QA is not resumable

- Severity: medium-high; a retry after a transient publish failure re-runs static QA and the paid/slow Codex judge, and can fail despite an already-current passing report.
- Evidence: `executeStage("qa")` always calls `runQaStage()` when the three upstream JSON files exist. Unlike plan/storyboard/assets/build, QA has no `shouldRunStage` or current-report fast path. `qa-report.json` already carries `qaInputDigest` and artifact SHA-256 values, so the required freshness evidence exists.
- Reproduction condition: complete QA, then let publish fail transiently (for example, catalog lock contention). Re-run the full command without `--force`; earlier stages skip, but QA invokes `runJudge()` again before publish retry.
- Contract mismatch: PLAN and README state that stage artifacts support interruption/resume and that `--force` performs regeneration.
- Minimal test: seed a passing `qa-report.json` whose input/artifact digests match, mock the judge/Codex call, run the QA stage with `force: false`, and assert zero judge calls. Assert `force: true`, changed upstream input, or changed content invokes/rejects QA appropriately.
- Minimal fix: before `runQaStage`, validate the existing report's pass state, content path, upstream digest, and artifact digests; skip only when all are current and `force` is false. Share the freshness validator with publish rather than weakening publish checks.

## ASK-USER — unspecified CLI policy

### A1 — Conflicting duplicate value flags

`parseArgs()` accepts repeats and silently uses the last value (`--topic first --topic second`, likewise grade/subject/type/id/stage). Boolean repeats are harmless. Choose one policy:

1. Recommended: reject a repeated value flag with a clear ambiguity error.
2. Document last-value-wins as intentional shell override behavior.

If rejection is chosen, add table-driven parser tests for every value flag and allow repeated identical booleans.

### A2 — Help mixed with invalid arguments

Argument parsing completes before the help early return, so `--help --unknown` fails rather than displaying help. Either behavior is defensible. Recommended: when `--help`/`-h` is present, print help regardless of other tokens; otherwise document strict parsing.

## Behaviors verified as sound

- Invalid `subject`, `type`, and `stage` values fail before pipeline execution with specific Korean messages.
- Blank/whitespace topic and traversal/uppercase/hidden IDs are rejected.
- A pure Korean/special topic gets a deterministic safe fallback slug.
- First-run `runs/` creation uses recursive `mkdir`; the missing-parent case is covered by construction and no defect was found.
- Resume provenance rejects missing metadata or changed inputs unless `--force`; assets recover a missing/empty generated image without regenerating intact images; incomplete builds force a rebuild and staging preserves existing four core files on generation failure.
- `--skip-images` participates in the assets input digest and enforces a real shared PNG thumbnail, preventing silent reuse across image-mode changes.
- Publish rejects stale QA/content/upstream digests, duplicate IDs without `--force`, and concurrent catalog writers.

## Probe evidence

- CLI commands above were executed directly; all temporary empty probe run directories were removed.
- Focused regression suite: `bun test agents/content-factory/pipeline/stages/common.test.ts agents/content-factory/pipeline/stages/boundaries.test.ts agents/content-factory/pipeline/stages/build.test.ts agents/content-factory/pipeline/stages/publish.test.ts` — 15 pass, 0 fail, 42 assertions.
- No files under `src/`, `server/`, `public/contents/`, or tests were modified by this probe.
