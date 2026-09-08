# Learning and creator browser checkpoint

Paused at user request for sequential work. No source changes made by this agent.

## Verified observations

Browser: agent-browser Chromium, disposable session `learning`, socket directory `/tmp/eduflix-learning-fresh`, Vite `http://127.0.0.1:4184`. Initial sandbox launch failed before navigation; a fresh daemon outside the sandbox launched successfully.

- Opened `/content/shapes-explorer`, clicked **Mark complete**, reloaded. The button became disabled **Completed**. Stored `shapes-2d-3d` remained `in_progress` with only `shapes-explorer` completed.
- Clicked related activity **3D Shape Expedition**. Temporarily replaced `Storage.prototype.setItem` to throw `QuotaExceededError` only for `eduflix_learning_progress`. Clicking **Mark complete** displayed **Progress could not be saved on this browser.** and retained enabled **Mark complete**. Screenshot: `continuation-learning-retry.png`.
- Restored original storage method and clicked **Mark complete** again. Opened `/my-learning` through a full navigation. UI showed **1 Topics completed**, **0 In progress**, **2 Lessons completed**, and Math **1/13**. Screenshot: `continuation-learning-my-learning.png`.
- Entered creator problem mode with `What is two plus three?`, advanced to render mode, installed `continuation-learning-generation-mock.js`, clicked **Start creating!**. Mock captured English problem request and held first status response.
- Clicked **Cancel**. Render mode and **Start creating!** returned. Both captured request signals were aborted.
- Restarted through **Start creating!**, then released first run's deliberately abort-ignoring success. Store remained `currentJobId: qa-2`, status `queued`, `lastResult: null`. Released second success and UI showed **Your lesson is ready!**, **Open the lesson**, **Improve it**, **Create another lesson**.

## Defect found, not yet repaired

`src/components/creator/LivePreview.vue` only watches changes to job ID and active state. The parent mounts it after a job ID already exists, so neither watcher runs initially. The real browser rendered the live-preview iframe but mock EventSource constructor count stayed zero for both generation attempts. Add an initial subscription and regression covering mounting with an active job, cancel/unmount cleanup, and restart. No source edit or regression test had begun when sequential-work pause arrived.

## Remaining acceptance

- Exact learning-map locked-to-available UI comparison for a prerequisite topic.
- Repeatable, assertion-bearing browser driver and final report. Current mock is reusable, but above results were interactive commands.
- Repair and browser-check initial preview subscription and cleanup on cancellation/restart.
- Collect final console/network side effects. Expected injected storage failure occurred. Generator traffic was replaced in-page and did not contact providers; mock SSE did not verify real stream transport. No server-side cancellation or provider quality claim is supported.

To resume, start Vite on port 4184 and a fresh disposable browser. Apply fixture only on local `/create`; it replaces all `/api/` fetches and EventSource. Do not use real generation. No production lessons or catalog were edited.
