# Classroom product improvement

Date: 2026-09-12. Audience confirmed by the user: elementary, middle and high school teachers and students.

## Scope and evidence plan

Improve the existing product in place. Preserve the catalog, generated lesson playback, bilingual UI and current LLM providers. No public deployment, account system or provider upgrade is authorized by this work.

| Claim | Owner | Required evidence |
| --- | --- | --- |
| Teachers can set a real grade independently from difficulty, activity type and learning goals | Implementation agent | Focused request/validation/prompt tests for both generation paths; browser form check |
| Browsing does not start every lesson's JavaScript | Implementation agent; coordinator verifies | Card tests; browser iframe count and thumbnail/fallback inspection |
| Teachers can edit lesson structure, answers and explanations without editing code | Implementation agent; coordinator verifies | Typed validation/renderer/storage tests; browser edit, preview, save and reload |
| Materials remain portable | Implementation agent; coordinator verifies | JSON round trip, invalid import rejection, standalone HTML browser playback |
| Starters provide usable learning activities across age groups and subjects | Implementation agent; coordinator reviews | Per-lesson objectives, explanation, original example/activity, explained checks, reflection and references; no claimed curriculum certification |
| AI receives the teacher's intended lesson brief | Implementation agent; coordinator verifies | Request/prompt tests and one bounded real-provider smoke if credentials are available |
| The changed UI is usable on desktop and mobile | Coordinator | Batched screenshots and interaction checks at 1440 px and 390 px; no horizontal page overflow |

Minimum final repository checks: production build, lint, Vitest, relevant Bun server/pipeline tests. Repeat only checks whose relevant code changes or whose failure needs investigation.

## Verified baseline

- Working tree was clean on `dev` at task start.
- Base commit: `bbe09c75c3bb8ecb78c1f7adcd98d0acadb66df2`. Changes in this task are local and have not been committed or deployed.
- Catalog: 84 lessons. Math 50, English 23, science 8, world history 2, coding 1. Elementary 47, middle 34, high school 3.
- Only 34 catalog entries have an existing thumbnail; 50 have an empty thumbnail.
- Production build passed before editing. Entry JavaScript was 146.78 kB, 55.72 kB gzip. Home route JavaScript was 9.26 kB, 3.71 kB gzip.
- Real Chromium browser, local Vite, 1440 × 1000: 84 cards, 12 mounted lesson iframes, 76 resource entries, no horizontal page overflow. Resource count is a diagnostic snapshot, not a controlled latency benchmark.
- Creator maps difficulty to elementary-5, middle-2 and high-2. Problem-mode backends also override an explicit grade with that mapping.
- Legacy quiz editing has no shared scoring contract and is explicitly disabled. New structured lessons must own both answer data and scoring.

## Confirmed operational decisions

- User confirmed teacher authoring and file distribution as the operating scope. School accounts and device sync are outside this delivery.
- User explicitly chose to preserve legacy iframe behavior and record stronger isolation as a pre-public-operation task. Existing `allow-scripts allow-same-origin` permits same-origin lesson scripts to access the host; existing editor injection depends on direct document access. This remains a limitation. New structured previews use an opaque-origin sandbox.

## Final results

The agreed teacher-authoring and file-distribution scope is implemented locally. No commit, merge, release or public deployment was performed.

- `/studio` supports a real school grade, learning objectives, prerequisites, teaching notes, sources, and editable explanation/activity/quiz/reflection blocks. Teachers can reorder blocks and change choices, the correct answer and feedback together.
- JSON preserves editable lesson data. Exported HTML includes that data, runs without external libraries, and can be imported as a new copy. Invalid imports preserve the current draft. Saved lessons use the existing IndexedDB store; no migration or account system was added.
- Ten original Korean starter lessons provide 70 blocks and 20 explained questions across seven subjects: four elementary, three middle and three high school lessons. These are suggested teaching materials, not certified curriculum alignments.
- The creator accepts grade independently of difficulty, lesson purpose, duration and objectives. Failure/retry retains the teacher's input. Structured AI drafting in Studio writes editable data and uses the application's own scoring renderer.
- Catalog cards use lazy images or a deliberate title fallback. The same desktop catalog now mounts zero lesson iframes, compared with 12 at baseline. The resulting 89 cards include five recommendations: 39 images and 50 title fallbacks. The high-school filter returns the three matching catalog lessons. No controlled latency or production Web Vitals claim is made.
- Final production build: entry JavaScript 149.07 kB / 56.44 kB gzip; lazy Studio chunk 68.44 kB / 24.78 kB gzip. Build and lint passed, as did 395 Vitest tests in 38 files, 93 Bun tests in 17 files with 837 assertions, and all 40 content-quality execution groups. Logs are in the [evidence directory](2026-09-12-classroom-evidence/).

Browser verification covered editing a starter's question, choices, answer and block order; saving, reopening and exporting JSON/HTML; importing an exported HTML as a new copy; rejecting malformed JSON without losing the current draft; and dismissing a dirty-draft replacement. The standalone fractions lesson made no external resource requests and showed both wrong and correct feedback. A mocked generation failure verified input recovery; it is not evidence of real model quality.

The final real AI science lesson was independently reviewed, then edited through the actual teacher UI to improve experimental controls and explanations. The first quiz's correct choice moved from index 1 to index 0. The saved/reopened JSON retained that change, and the opaque-origin Studio preview showed wrong feedback for index 1 and correct feedback for index 0. The downloadable before/after lesson files and browser receipt record the result.

The final exported science HTML also showed the expected wrong and correct feedback when opened directly as a local file, with zero external resource requests. Final desktop (1440 × 1000) and mobile (390 × 844) screenshots were visually inspected; the mobile document width was exactly 390 pixels with no horizontal overflow. The temporary fractions QA copy was removed by its exact ID after confirming its title; the useful AI science lesson remains saved locally.

- [Teacher guide](../lesson-studio.md)
- [Final browser receipt](2026-09-12-classroom-evidence/studio-final-browser.json)
- [Editable science lesson](2026-09-12-classroom-evidence/ai-lesson-edited.json) and [student HTML](2026-09-12-classroom-evidence/ai-lesson-student.html)
- [Desktop](2026-09-12-classroom-evidence/studio-final-desktop.png) and [mobile](2026-09-12-classroom-evidence/studio-final-mobile.png) screenshots

## Extended content review

The user also requested subagent review and improvement of every existing lesson. Three disjoint assignments covered 25 math lessons, another 25 math lessons, and 34 science/language/history/coding lessons. All 84 catalog IDs are accounted for, and a source diff confirms changes inside every one of their directories. This is not a claim of expert curriculum certification or full browser completion of every activity.

Focused behavior regressions now have a durable command, `npm run test:content-quality`. The three groups cover 22, 11 and 7 behavior checks, including equivalent fractions, sequential quiz navigation, fair distribution, invalid calculator inputs, zero coefficients, repeated scoring, neutralization, Newtonian motion and Python evaluation order.

The [84-item review](2026-09-12-content-review.md) records individual changes. Browser receipts cover loading all 84 lessons and available entry controls, with targeted deeper checks for fair fraction distribution/reset/reentry, two-question manual feedback, neutralization, Python evaluation order and a mobile angle quiz. The angle check used a focused quiz-scene setup after entering the lesson; it does not prove the entire natural scene sequence. Every scene, device and accessibility mode has not been exhaustively tested.

World Quiz Battle's broken external character images were replaced with embedded project mascots while keeping its four-file archive contract. Real browser verification confirmed both portraits and both HP background images decoded at 512 pixels, with no remote image dependency for those assets.

## Live generation findings

The existing GLM-5.3-Flash model and endpoint were retained. A small connectivity probe succeeded. Full generation using the provider-default `max` and an experimental `high` each reached the 285-second timeout. An experimental `low` completed in 61.223 seconds. After explicit feedback/restart prompt requirements and syntax validation were added, a canonical request completed in 84.150 seconds, but manual review found a false claim that the inside of a water-filled cup was dry. Neither speed nor valid JavaScript established educational accuracy.

The serverless path now defaults GLM-5.3 models to `low`, supports a validated `ZAI_REASONING_EFFORT` override, and checks classic JavaScript syntax without executing it. A mandatory educational review and one correction attempt share the same 285-second request deadline. The provider documents the supported settings in its [Deep Thinking reference](https://docs.z.ai/guides/capabilities/thinking).

The live reviewer rejected the known contradictory sample. A fresh raw-code generation exhausted its correction attempt and failed explicitly after 218 seconds because the reviewer still found a blocked wrong-answer flow and a content error. This is evidence of rejection behavior, not successful educational generation.

The structured Studio path subsequently succeeded through the real local `/api/generate` in 108.604 seconds with the configured GLM-5.3-Flash provider. It produced six blocks, including three questions, for an elementary grade 4 condensation lesson. The response preserves the teacher's title, grade, objectives and source. AI drafts must contain 5–10 blocks, at least two questions, an explanation, an activity and a reflection; ordinary manually authored lessons retain the flexible 1–40 block limit. Both paths retain existing authentication; the structured path reports unsupported Codex-only configuration explicitly.

Automatic review still missed an unsupported inference about water transferred from hands and incomplete experimental controls. A subagent and coordinator identified these, and the coordinator corrected the lesson through the editor. This is why the product displays an unsaved-draft review notice and does not claim automatic factual or curriculum certification. The condensation and rain connection was checked against the lesson's [NOAA source](https://www.nesdis.noaa.gov/about/k-12-education/atmosphere/what-makes-it-rain); it is teacher reference material and is not a Korean curriculum alignment source.

## Remaining limits and pre-public-operation work

- Preserve the user's explicit decision about legacy iframe behavior. Before accepting arbitrary untrusted generated content in public operation, isolate legacy execution and redesign the editor bridge. This task did not change those permissions.
- Review school-level placement of advanced fraction division, negative-coordinate activities and mixed review lessons with classroom teachers. Exact official achievement-standard alignment remains unproven.
- Raw generated code and model review can still fail. The structured teacher-editable path is the verified authoring route; one successful live request does not establish provider reliability at scale.
- School accounts, class distribution, device synchronization, student submission collection and live collaboration are outside the agreed scope. Student answers and notes in the exported lesson are temporary and are not collected.
- All verification used local source/builds. Production behavior and deployment of these changes are not proven.
