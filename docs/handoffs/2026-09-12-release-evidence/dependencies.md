# Dependency audit, 2026-09-12

Updated affected packages within the existing direct dependency ranges. No direct dependency was added and package.json was not changed by this task. Vite remains major 7, Vitest major 4, and happy-dom major 20. Their required transitive changes include newer es-module-lexer/std-env majors and new @humanfs/types, buffer-image-size, and convert-source-map packages.

Both final audits return exit 0 and zero vulnerabilities:

- npm audit --json --cache /tmp/eduflix-release-npm-cache
- npm audit --omit=dev --json --cache /tmp/eduflix-release-npm-cache

The complete final receipts are dependencies-full-audit.json and dependencies-production-audit.json. The first production audit had 7 affected packages, including 2 high. After fixing PostCSS and nanoid, the full audit still had 16 affected development packages, including 1 critical and 11 high. The subsequent targeted updates resolved those findings too. Zero reported advisories is not proof that all possible security risks are absent.

Only affected packages and their required resolution changes were requested with npm update. Editorconfig needed a compatible update before its previously pinned minimatch could be updated. No npm audit fix --force was used. npm also refreshed optional platform records in its lock, which preserves installation on deployment platforms.

Bun 1.3.14 canonically generated bun.lock by migrating the final package-lock.json in /tmp/eduflix-release-bun-sync, using bun install --lockfile-only --ignore-scripts. This also aligns historical differences between the two lockfiles. bun install --frozen-lockfile --ignore-scripts --dry-run exits 0. The node_modules graph was installed with npm and matches the final npm lock.

## Changed versions

| Package path | Before | After |
| --- | --- | --- |
| @humanfs/core | 0.19.1 | 0.19.2 |
| @humanfs/node | 0.16.7 | 0.16.8 |
| @rollup/rollup-darwin-arm64 | 4.56.0 | 4.63.1 |
| @types/estree | 1.0.8 | 1.0.9 |
| @typescript-eslint/typescript-estree/node_modules/minimatch | 9.0.5 | 9.0.9 |
| @vitest/expect | 4.0.18 | 4.1.11 |
| @vitest/mocker | 4.0.18 | 4.1.11 |
| @vitest/pretty-format | 4.0.18 | 4.1.11 |
| @vitest/runner | 4.0.18 | 4.1.11 |
| @vitest/snapshot | 4.0.18 | 4.1.11 |
| @vitest/spy | 4.0.18 | 4.1.11 |
| @vitest/utils | 4.0.18 | 4.1.11 |
| ajv | 6.12.6 | 6.15.0 |
| brace-expansion | 1.1.12 | 1.1.18 |
| editorconfig | 1.0.4 | 1.0.7 |
| editorconfig/node_modules/brace-expansion | 2.0.2 | 2.1.4 |
| editorconfig/node_modules/minimatch | 9.0.1 | 9.0.9 |
| es-module-lexer | 1.7.0 | 2.3.2 |
| flatted | 3.3.3 | 3.4.4 |
| glob/node_modules/brace-expansion | 2.0.2 | 2.1.4 |
| glob/node_modules/minimatch | 9.0.5 | 9.0.9 |
| happy-dom | 20.4.0 | 20.14.5 |
| js-cookie | 3.0.5 | 3.0.8 |
| js-yaml | 4.1.1 | 4.3.2 |
| minimatch | 3.1.2 | 3.1.5 |
| nanoid | 3.3.11 | 3.3.19 |
| picomatch | 4.0.3 | 4.0.7 |
| postcss | 8.5.6 | 8.5.28 |
| postcss-selector-parser | 7.1.1 | 7.1.6 |
| rollup | 4.56.0 | 4.63.1 |
| std-env | 3.10.0 | 4.2.0 |
| tinyrainbow | 3.0.3 | 3.1.1 |
| vite | 7.3.1 | 7.3.6 |
| vitest | 4.0.18 | 4.1.11 |
| ws | 8.19.0 | 8.21.3 |

## Verification

The coordinator owns the final integrated build and full test suite after all edits finish. This task did not commit or deploy.

`npx vitest run tests/unit/editor-overrides.test.ts tests/unit/vercel-config.test.ts` passed 2 files and 9 tests under Vitest 4.1.11 and happy-dom 20.14.5. This checks the updated runner and DOM environment with existing application/configuration assertions. The captured output is `dependencies-targeted-tests.txt`. `git diff --check -- package-lock.json bun.lock` also exits 0.
