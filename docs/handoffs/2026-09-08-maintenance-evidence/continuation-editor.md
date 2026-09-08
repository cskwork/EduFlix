# Editor/browser continuation — 2026-09-08

Engine: agent-browser Chromium, isolated session `continuation-editor`, Vite on `127.0.0.1:4183`. All mutations used disposable IndexedDB fixtures. No provider calls, deployment, dependencies, or real catalog mutations.

## Defects fixed

- Native browser Save of text plus color threw `DataCloneError: Failed to execute 'put' on 'IDBObjectStore': #<Object> could not be cloned.` The editor passed Vue-reactive style records through validation into IndexedDB. Validation now copies each text/style record into a plain object. The regression explicitly verifies that reactive input cannot be structured-cloned but validated output can. Fields in these records are scalar; arrays and their entries are copied.
- Valid DEFLATE archives with compression-speed bits 1/2 were rejected as unsupported. The codec now permits those bits only for method 8, retaining encryption/other-method rejection. The independent Python fixture test covers flags 2, 4, and 6.

Vite's file watcher did not refresh changed modules in this sandbox. Inspection of the served module exposed the stale version; the server was restarted after changes. Successful checks below used the updated served source.

## Browser acceptance

| Scenario | Observed result |
| --- | --- |
| First Save/reload | `Cycle one` and computed `--primary-color: #445566`; IndexedDB overrides contained exactly the changed second heading and color. |
| Second Save/reload | `Cycle two` and computed `#778899`. |
| Preserve original source/markup | Stored source still had `Edit me`; first heading remained `Other`; third heading innerHTML remained `Keep <em>markup</em>`. |
| Restore original text, mobile 390×844 | Editing `Cycle two` back to `Edit me` remained stable in the iframe, then survived Save/reload. Saved color stayed `#778899`. Screenshot: `continuation-editor-mobile.png`. |
| Mobile dirty route | Go back opened discard confirmation. Dismiss retained editor route/changes; accept returned to home. |
| Tablet 820×1180 | Cancel/dismiss retained edits; Cancel/accept closed panel and restored saved heading. Go back/dismiss retained dirty editor route; accept reached `/`. Screenshot: `continuation-editor-tablet.png`. |
| Delayed scene replay | A button created `#dynamic` with `Original` inside `#lesson-scene`; MutationObserver replay changed it to `Delayed saved`. Unrelated nested markup survived. |
| Local card preview | Scrolling the local card into view loaded a Blob iframe containing `Other / Edit me / Keep markup` from IndexedDB. |
| Blob cleanup | Instrumented native URL create/revoke functions: all four activated local card Blob URLs were revoked on card-tree unmount; fifth creation belonged to the opened viewer. `allRevoked: true`. |
| STORE ZIP UI round trip | Clicked Export using download API, then uploaded downloaded ZIP through the actual file input. Navigated to a new local ID; heading and computed `#778899` survived. |
| DEFLATE ZIP UI import | Python zipfile recompressed that downloaded ZIP with DEFLATE; compression-speed flag 2 set consistently in local/central headers. Upload navigated to another local ID with heading and `#778899` intact. Screenshot: `continuation-editor-deflate.png`. |

No uncaught page errors were reported by `agent-browser errors`. Console contained the reproduced pre-fix DataCloneError and the expected local recommendation API proxy failure (backend was intentionally not started). No general CPU/performance percentage is claimed.

## Verification

- `npx vitest run tests/unit/editor-overrides.test.ts tests/unit/editor-panel-save.test.ts`: 7 passed.
- `bun test server/content-storage.bun.test.ts`: 13 passed, 0 failed, 50 assertions, including coordinator/storage-agent changes already present in that file.
- Targeted ESLint on changed source/tests and `git diff --check`: exit 0.
- Full combined build/test/lint are the coordinator's responsibility after sequential owners finish.

## Reproduce

Start Vite on 4183 and use a disposable agent-browser session. Seed `editor-fixture.js` by wrapping its contents in an async IIFE for `agent-browser eval --stdin`. Open `/content/local-editor-qa`; click Edit mode, fill textbox `섹션 제목 2 Title`, click `S Style`, fill `.hex-input`, click Save. Wait for Saving to finish before reloading, then wait for the target iframe heading. Inspect actual iframe computed style and `getLocalContent` overrides. Repeat with a different heading/color. Download `.export-btn`, then upload through `input[type=file]` to exercise UI transfer.

Scope limits: synthetic lesson coverage proves editor mechanics, not every generated lesson's semantic editability. Export supports text lesson files and does not promise standalone external/shared assets. Browser tests used Chromium only. The existing font-size slider remains a display-only preview control, a possible later feature improvement outside this reliability checkpoint.
