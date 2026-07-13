# Codex/build fresh-context edge probe

## Decision

**Request changes: one grounded build-isolation defect remains.** Codex JSON validation, retry cleanup, timeout process-group termination, unexpected staging entries, and path-shaped asset names are defended in the current snapshot; the four required build files are still promoted one by one without rollback.

Reviewed intent: a successful Codex run must produce validated stage output, a failed run must preserve the previous good artifact and leave no temporary/process residue, and build output must be confined to the staged content set before it replaces existing content.

## Major finding

### P1 — A promotion error can leave a mixed old/new content version

- Evidence: `agents/content-factory/pipeline/stages/build.ts:67-71` copies and renames each of `index.html`, `style.css`, `script.js`, and `manifest.json` sequentially. There is no backup or rollback around the loop.
- Reproduction: create valid old versions of all four destination files and make `.style.css.factory-next` a directory before a forced build. Fake Codex writes four valid non-empty staged files. `index.html` is promoted, the next `copyFile` fails with `EISDIR`, and the final state is:

```json
{
  "index.html": "new-index.html",
  "style.css": "old-style.css",
  "script.js": "old-script.js",
  "manifest.json": "old-manifest.json"
}
```

- Impact: a failed build can corrupt an existing content version into a cross-version combination. This violates the preservation and build-isolation contract even though the staging directory itself is removed by the `finally` block.
- Minimal failing test: extend `stages/build.test.ts` with the setup above; assert rejection and assert all four destination contents remain byte-identical to their old values. Also assert no `.factory-next` artifact remains.
- Minimal sustainable fix: prepare a complete sibling candidate directory, including existing generated images, then swap directories with a backup/rollback sequence. If a directory swap is intentionally avoided, back up all four old files before the first promotion and roll back every changed file on any copy/rename error. Merely pre-copying four `.factory-next` files reduces copy failures but does not make the four final renames atomic.

## Probed boundaries with no grounded product defect

| Boundary | Current evidence | Result |
|---|---|---|
| Malformed/fenced JSON: plan | `plan.ts:12-21` supplies `stageOutputValidationError("plan", text)` to the Codex retry boundary | Strictly rejected and retried |
| Malformed/fenced JSON: storyboard | `storyboard.ts:13-17` uses the storyboard validator | Strictly rejected and retried |
| Malformed/fenced JSON: assets | `assets.ts:20-27` uses the assets validator; semantic context is checked after parsing | Strictly rejected and retried |
| Malformed/fenced JSON: judge | `qa.ts:278-281` uses the 22-item judge validator | Strictly rejected and retried |
| Build response/manifest | Build response is only a process artifact; the generated manifest is later parsed and schema-checked by static QA | No JSON fence acceptance path found |
| Retry exhaustion / previous output | `codex.ts:67-97` writes to a unique temporary file, validates it, renames only on success, and removes it in `finally` | Previous output preserved; partial temp removed |
| Image retry exhaustion | `codex.ts:108-133` applies the same temporary-output promotion pattern | Previous PNG preserved; partial temp removed |
| Timeout child cleanup | `codex.ts:22-43` spawns a detached process group and kills the group with `SIGKILL` on non-Windows | Focused child-cleanup test passed |
| Build staging cleanup | `build.ts:48-75` removes the unique staging directory in `finally` | Cleanup occurs on success and failure |
| Extra files/directories/symlinks | `build.ts:62-66` rejects every staging entry that is not one of the four regular required files; a symlink is not `Dirent.isFile()` | Confined and rejected |
| Generated/reused asset path escape | `validate.ts:206-229` allowlists generated filenames and constrains reused sources; `assertAssetPlanContext` also requires injected-list membership | No escape found through validated pipeline input |

## ASK-USER

Fenced JSON policy is the only semantic choice worth confirming if tolerance is desired. The current implementation treats Markdown fences as invalid output and spends the one retry; this matches the prompts' “JSON only” contract and is the recommended behavior. If operators instead want fence stripping, define that explicitly and normalize only one complete fenced JSON document before schema validation—never extract a JSON-looking substring from arbitrary prose.

## Verification

- `bun test agents/content-factory/pipeline/lib/codex.test.ts agents/content-factory/pipeline/stages/build.test.ts` → **8 pass, 0 fail**.
- Isolated atomic-promotion reproduction → **failed with `EISDIR` after `index.html` had already changed**, proving the finding above.
- `bun test agents/content-factory/pipeline` → **37 pass, 4 fail, 1 module export error** at the observed snapshot. Those failures were in concurrent publish/QA work and are outside this Codex/build probe; they were not used as evidence for the finding.
- No product code, tests, `src/`, `server/`, `public/contents/`, or `public/contents/index.json` were modified by this probe.

## Positive notes

- Stage-specific validators are now attached at the retry boundary instead of validating only after Codex is considered successful.
- Text and image generation use promote-on-success temporary files, preventing failed regeneration from destroying a prior valid artifact.
- Build staging rejects unexpected regular files, directories, and symlinks before promotion and always removes its temporary directory.
