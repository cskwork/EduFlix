# Independent catalog and archive review

Reviewed checkpoint `1de25dc..70eac3a` and the continuation changes on 2026-09-08. Scope was catalog lock ownership, write failure paths, archive bounds, path handling, and compatibility. All mutation tests used disposable temporary fixtures. No real catalog writes, auth changes, dependencies, migrations, deployments, or paid calls were performed.

## Findings corrected

| Severity | Finding | Correction and evidence |
|---|---|---|
| High | Two stale-lock recoverers could both observe a dead PID, then the second could unlink the first process's newly acquired lock. Concurrent catalog read/modify/write could lose an update. | Removed automatic stale-lock recovery. Two concurrent acquisitions now both reject and preserve the stale lock. Live acquisitions retain exclusive `wx` creation. Factory and CRUD use the same implementation. |
| Medium | Callers unconditionally removed the lock path when finishing, even if its inode had been replaced. | Added `release()` that compares device/inode before removing the lock and closes the handle in a `finally`. A test replaces the original lock, releases the original owner, and proves the replacement survives until its owner releases it. |
| High | DELETE with `deleteFiles=true` removed the lesson before saving the catalog. A failed catalog commit left an entry pointing at deleted files. | Rename the directory to a unique temporary sibling, commit the catalog, then clean up. Catalog failure restores the original directory. An injected atomic-write failure proves catalog and lesson preservation, followed by a successful retry. Non-ENOENT rename failures now report failure. |
| Medium | Import buffered the full multipart request before checking the ZIP limit. | Read the request into a fixed 2 MiB + 64 KiB buffer before parsing; cancel and return 413 on overflow. Check File.size before arrayBuffer. Tests prove exact-limit ZIP compatibility, streaming cancellation, early file rejection, and malformed multipart handling. |
| Medium | Export swallowed every file-read error and could return a successful ZIP without required HTML. | Required HTML read failures now fail the export. Optional CSS/JS/manifest are skipped only for ENOENT. Tests cover missing optional files and missing required HTML. |

Stale-lock recovery now requires an operator to confirm all writers are stopped before removing the lock file. This intentional compatibility change avoids unsafe automatic recovery. PID reuse or an invalid lock body also fails closed. The inode check does not provide an atomic compare-and-unlink against an external process replacing the path between stat and unlink. External lock cleanup must never run while writers are active.

## Archive and path assessment

The shared codec limits the compressed archive to 2 MiB, entries to 32, and declared and actual extracted totals to 2 MiB. It rejects traversal components, backslashes, duplicate names, unsupported text filenames, mismatched central/local names, payload overlap with the central directory, incorrect sizes, and CRC mismatch. Bun inflation uses `maxOutputLength`; browser inflation counts streamed output and cancels on overflow. STORE and Python-generated DEFLATE with an enclosing folder both pass the existing independent fixture tests. CSS and JS remain optional.

Extraction writes only the four allowed filenames. Import derives the destination from validated subject/grade/id and allocates a new directory, preserving uncatalogued directories. Ordinary write or catalog failures remove only that newly created directory. Files are written before the catalog entry is committed, so incomplete imports do not become listed entries during normal exception handling.

The filesystem confinement check is lexical. Existing symlink ancestors under `public/contents` are trusted; ZIP input cannot create symlinks through this codec. This review does not prove confinement against a hostile process modifying the server filesystem. Realpath/openat-style hardening would be a separate filesystem trust change.

## Remaining limits

- The handler now bounds retained request bytes to 2 MiB + 64 KiB before multipart parsing. The 64 KiB allowance covers framing, headers, and filenames for the normal single-file upload; excessive fields or header overhead are rejected with 413. Multipart parsing and ZIP decoding still allocate additional bounded buffers. This is not a measurement of total process memory or a bound on upstream transport buffering and individual incoming chunk allocation. No upload timeout or concurrency policy was changed.
- Atomic rename protects individual catalog/HTML replacement from partial writes. It is not a multi-file transaction or power-loss durability guarantee. A process crash between directory rename and catalog commit can leave a temporary deletion directory and an old catalog entry. A crash during import can leave an unlisted directory. No crash journal, startup recovery, or fsync protocol was added.
- A deletion cleanup failure after catalog commit logs an error and preserves the unlisted temporary directory for later operator cleanup. It does not misreport a completed catalog deletion as a retryable request failure.
- The frontend archive owner corrected the DEFLATE compression-speed flag compatibility finding. The codec now accepts option values 2/4/6 for DEFLATE while continuing to reject inappropriate STORE flags. Browser evidence belongs to the editor review.
- Text-only exports do not bundle shared/external assets. Unsupported visible files in the server lesson directory correctly reject export. Browser portability and editor round trips belong to the separate browser review.

## Verification

`bun test server/content-storage.bun.test.ts agents/content-factory/pipeline/stages/publish.test.ts` passed with 30 tests, zero failures, and 94 assertions after the final backend changes. Expected error logs come from corrupt-catalog, missing-HTML, and injected-write-failure fixtures. Full output was saved locally at `/tmp/eduflix-storage-review-tests.log`.

Targeted ESLint passed for all five initial changed TypeScript files and again for the upload continuation files. Server TypeScript checking with `npx tsc --noEmit -p tsconfig.server.json` passed. `git diff --check` passed. The coordinator owns final combined tests, build, lint, browser acceptance, and delivery. No completion claim is made for those broader checks in this report.

The upload compatibility investigation reproduced Bun 1.3.14 lazy FormData header behavior. Accessing `req.body` before materializing `req.headers` produced multipart bytes but left the generated Content-Type boundary absent when reparsing. The bounded reader snapshots headers first and parses a reconstructed Request. The existing Python DEFLATE fixture and an exact 2 MiB STORE archive both import successfully through this reader.
