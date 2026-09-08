# Learning and creator acceptance

Completed locally on 2026-09-08. Supersedes `continuation-learning-checkpoint.md`.

## Fix

The creator mounted `LivePreview` after a job ID was assigned, but its change-only watchers never subscribed on that initial mount. Replaced the two watchers with one immediate watcher over job ID and active state. It opens the initial stream, closes the previous stream before a job/state transition, and retains unmount cleanup.

`tests/unit/live-preview.test.ts` reproduced the defect with two failures before the fix. All three tests pass after the fix: active initial mount/unmount, cancellation/restart, and initially inactive activation. Targeted ESLint and `git diff --check` passed. Coordinator owns combined build/full-suite verification.

## Browser result

`continuation-learning-browser.py` completed **81 successful automation commands and 15 explicit passing browser assertions**. It uses real Chromium and real rendered Vue UI through agent-browser, plus direct read-only store assertions for stale-result evidence. Learning progress uses actual browser localStorage.

- The real map showed **일차방정식** locked. Opened the existing `negative-addition` lesson directly, clicked **Mark complete**, reloaded, and confirmed disabled **Completed**. My Learning persisted Math **1/13**. Reopening the map showed **일차방정식** available without its locked overlay. Both map screenshots show the same target centered in view. No knowledge-map fixture was used.
- Completing `shapes-explorer` and reloading preserved completion while its two-activity topic remained in progress. The related **3D Shape Expedition** link opened the second activity.
- A temporary `Storage.prototype.setItem` quota failure displayed the persistence error and kept **Mark complete** enabled. Restoring storage and clicking again cleared the error. My Learning then showed Math **2/13**, two completed topics and three completed lessons, including the earlier prerequisite lesson. Stored IDs are included in the command log.
- Through the creator problem-mode UI, the initial job opened exactly one preview subscription. **Cancel** aborted both captured request signals, closed that subscription, and returned to render-mode selection.
- Restart opened exactly one new subscription. Releasing the cancelled run's deliberately abort-ignoring success left the new job active, last result empty, and history empty. Releasing the new job showed **Your lesson is ready!**, stored only `qa-2`, created one history entry, and closed both subscriptions.

Screenshots: `continuation-learning-map-locked.png`, `continuation-learning-map-unlocked.png`, `continuation-learning-retry.png`, `continuation-learning-my-learning.png`, `continuation-learning-creator-running.png`, `continuation-learning-creator-completed.png`.

## Reproduction and boundaries

Start Vite with `npm run dev -- --host 127.0.0.1 --port 4184 --strictPort`. Launch a disposable Chromium session, then run:

```sh
AGENT_BROWSER_SOCKET_DIR=/tmp/eduflix-learning-resume agent-browser --session learning --args '--no-sandbox' open http://127.0.0.1:4184/map
AGENT_BROWSER_SOCKET_DIR=/tmp/eduflix-learning-resume python3 docs/handoffs/2026-09-08-maintenance-evidence/continuation-learning-browser.py
```

Use only a disposable session. The driver removes its origin's learning progress and streak keys before running. `EDUFLIX_QA_URL` can override the local base URL. The mock and source-module inspection require a Vite development server. No repository catalog/lesson mutation occurs.

`continuation-learning-results.json` records commands, eval source, outputs and exit codes. Browser errors were empty. Captured network requests had no HTTP 4xx/5xx or failed-request lines. Console output contained expected injected quota errors, Vite connection messages, and preview-close messages. Console/network inventories accumulated across two successful driver runs in the same disposable browser; the assertion log describes the final run.

All creator `/api/` fetches and EventSource objects were replaced by `continuation-learning-generation-mock.js`. This proves UI/client cancellation, initial subscription and close calls, and store identity protection. It does **not** prove real SSE transport, server-side job cancellation, provider output quality, or live generation. No paid generation calls, dependencies, deployment, auth changes or curriculum expansion were made. Existing public fonts and lesson CDN resources were loaded normally.

Browser and port 4184 server were stopped after acceptance.
