# v0.4.0 — reliable editing, lesson transfer, and catalog performance

Lesson edits now survive browser storage and reopening, learning progress has explicit completion and retry behavior, and catalog previews load as cards reach the viewport. This minor release completes the maintenance pass and pauses before new feature improvements.

## Changes

- Preserve text/style edits through repeated saves and ZIP transfer without replacing original lesson code or untouched nested markup. Normalize reactive editor records for native IndexedDB, replay delayed scene targets, and guard dirty navigation on mobile/tablet layouts.
- Support bounded STORE/DEFLATE lesson archives, including valid compression-speed flags. Validate checksums, filenames and extraction sizes; report unsupported assets or missing HTML. Bound server multipart input to 2 MiB plus 64 KiB framing overhead and reject oversized files before reading their contents.
- Protect catalog writes with a shared exclusive lock. Preserve corrupt catalogs and uncatalogued directories, retain replacement locks, and restore lesson files when a delete's catalog commit fails.
- Persist explicit learning completion, related-activity progress and prerequisite unlocks. Show storage failures and allow retry.
- Carry requested generation language through factory stages. Protect cancellation/restart from stale client results and open Live Preview subscriptions on initial mount, with cleanup on cancellation, completion and unmount.
- Activate catalog iframe previews on viewport intersection, cache click statistics per grouping calculation, expose custom subjects such as Coding, and release local Blob previews on unmount.
- Serve current lesson files before stale build copies and repair IRP lesson initialization order.
- Set package and npm lockfile root version metadata to `0.4.0` without changing dependency resolutions.

## Verification

- 370 Vitest tests across 33 files passed.
- 93 Bun tests across 17 files passed, with 837 assertions.
- Production build, ESLint, server TypeScript and whitespace checks passed.
- Real Chromium verified two text/color save cycles, original restoration, delayed edits, mobile/tablet discard prompts, local preview cleanup, and STORE/DEFLATE UI transfer.
- The learning/creator driver recorded 81 successful commands and 15 explicit assertions, including actual prerequisite unlock, persistence failure/retry, initial preview subscription, cancellation/restart and stale-result protection.
- At 1280×577 the current catalog showed 84 cards with zero initial iframe requests; browsing activated 10 previews. At 390×844 only the three initially visible previews loaded. Search/filter navigation and page-width checks passed. These observations do not establish a general speedup or production INP score.

Detailed evidence and reproduction steps are in [the maintenance handoff](../handoffs/2026-09-08-maintenance-pass.md).

## Operating limits

Stale catalog locks now fail safely instead of being removed automatically. An operator must stop all writers before cleaning up a stale lock. Filesystem/catalog operations handle ordinary write failures, but do not provide power-loss transactions or automatic crash recovery. Server filesystem symlink ancestors remain a trusted deployment boundary.

Exports bundle lesson text files, not arbitrary assets. Browser acceptance used local Chromium and mocked generation; live provider quality, real SSE transport, server-side cancellation and production browser behavior are not established. No dependencies, migrations, authentication-policy changes or Blender integration were added. Feature improvements are paused at this release checkpoint.
