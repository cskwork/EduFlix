# Catalog performance/responsiveness continuation — 2026-09-08

No new defect was found in the focused catalog checks; no production source changed in this stage.

Chromium via isolated `agent-browser --session continuation-performance`, current source served by Vite on `127.0.0.1:4183`. No local lesson fixtures were created. Popularity used disposable localStorage click statistics only; no shared recommendation data was changed. Backend recommendation endpoints were unavailable by design, so shared recommendation ranking was not accepted in this run.

## Measurements

| Scenario | Result |
| --- | --- |
| Desktop initial hero, 1280×577 | 84 cards in DOM; **0 iframes and 0 iframe resource requests**. No document horizontal overflow. |
| Desktop Browse content | 10 active iframe previews: 5 Math, 5 English; 0 for remaining rows. 10 iframe resource requests; scrollY 592 at observation. |
| Desktop Math right arrow | 12 total frames, 7 Math frames. Horizontal scrollLeft 458 at observation during smooth scroll. |
| Science navigation | URL `?subject=science`; 8 cards, only Science row. Previous Math/English iframe elements removed. |
| Desktop Python search | URL `?q=Python`; one Coding result. Captured Enter keydown → result DOM update **6.2 ms**; next animation-frame callback **6.6 ms**. |
| Custom subject | `?subject=coding` showed one result, heading Coding, correct Python lesson route. |
| Popularity fixture | Set `shapes-explorer` count 100 with current lastClickedAt, then reload. Shape Explorer moved ahead of Fraction Pizza. Initial typo `shape-explorer` was ignored as an unknown ID, then corrected using actual catalog ID. |
| Mobile initial hero, 390×844 | 84 cards; **3 iframes and 3 iframe resource requests**, corresponding to the visible first Math row below the hero. No document horizontal overflow. |
| Mobile Browse content | 12 activated frames: Math 3, English 3, Science 3, World history 2, Coding 1. Frames activated during scroll remain mounted by design, including rows just outside the final viewport. |
| Mobile Math horizontal scroll | scrollLeft 296; 5 Math frames and 14 total frames after observer completion. |
| Mobile Python search | One card, one iframe after filtering; previous 13 other frames removed. Enter → DOM update **11.0 ms**, next animation-frame callback **12.2 ms**. Search input was within viewport (x 162.6, width 160); no document overflow. |
| Open search result | Opened `/content/python-list-comprehension-factory`; iframe source `/contents/coding/middle/python-list-comprehension-factory/index.html`; zero catalog cards, one viewer iframe. |

The search timings are single warm local development observations using a keydown capture listener, MutationObserver on `.content-sections`, and requestAnimationFrame. They are not INP, paint completion, statistical benchmarks, production network latency, CPU measurements, or a promised speedup. Browser automation wait timings were not used as page-performance measurements.

Baseline attribution: the earlier maintenance handoff records 83 cards/83 eager iframe requests at 1280×577 before the checkpoint. That unchanged baseline was not rebuilt here. The current run independently confirms viewport activation with 84 catalog lessons; no percentage or general page-speed claim is made.

## UI and cleanup

Screenshots were captured for desktop hero, search, mobile hero, and mobile rows as `continuation-performance-*.png`. Mobile hero and rows were visually inspected: navigation and card strips remain within the viewport, and horizontal scrolling stays within a row. Parent `agent-browser errors` output remained empty. Recommendation requests produced expected local proxy errors because no backend was started; no lesson-wide resource/error sweep was repeated.

Filtering removed prior iframe elements; opening a viewer unmounted the catalog tree. Native Blob URL revocation for local previews was already proven on final editor code in `continuation-editor.md` (four of four activated local-preview URLs revoked). This stage did not repeat those IndexedDB tests.

Search intentionally combines with an active subject: `?subject=science&q=Python` returns zero results. Clearing the subject via Home then submitting Python finds the Coding lesson. A later UX feature could make this filter scope/empty-result explanation clearer; no redesign was included before the release checkpoint.

## Repeat

1. Launch fresh session, set viewport 1280×577, open `/`, wait for 84 `.content-card` elements; count `iframe` elements and performance resource entries with initiatorType `iframe`.
2. Click Browse content; inspect iframe counts per `.content-row`. Click `#section-math .scroll-right`, wait for scroll movement, inspect new active count.
3. Click Science navigation, submit Python search; verify combined-filter empty result. Click Home and submit Python; verify one result and correct route. Open `/?subject=coding` for custom subject coverage.
4. Set disposable `eduflix_click_stats` with actual `shapes-explorer` ID/count 100; reload and verify first Math card.
5. Repeat at 390×844; count initial visible previews, use Browse content and horizontal row scroll, submit Python, check document width and frame cleanup.
6. Open the Python card and verify catalog unmount and the viewer source.

`npx vitest run tests/unit/content-performance.test.ts`: **4 passed**, exit 0. Full combined checks and release belong to the coordinator. Browser session and Vite server were stopped after this report.
