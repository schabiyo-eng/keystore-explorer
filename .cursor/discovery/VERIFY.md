# Phase 5 verify

**Status:** report only. No production-slice hotfix. No security-scan. No JCA/BouncyCastle bag-for-bag claim.

**Ticket:** MOD-45 (`P5.verify`)
**Base:** `origin/main` at `eb3f9e9d` (`refactor(chain): idiomatic React after migrate (#46)`). All P4 `*-modernize` tickets are Done.
**SCOPE:** signed (`.cursor/discovery/SCOPE.md`).
**Harness:** existing React Vitest driver that consumes YAML. No second harness.

## Confirmations

| Check | Result |
|---|---|
| In-scope YAML under `functional-tests/flows/<slice>/` | **237** files across the 13 UI slices in SCOPE. No `kernel/` YAML directory (kernel is unit tests, not File YAML). |
| `frontend/` with `src/kernel/` | Present. PKCS#12 create/load/save, generate, import, `reopenSucceeds`. `frontend/src/dummy/` is absent. |
| Driver | `frontend/src/shell/yaml-driver.ts` plus per-slice `*-yaml.test.tsx` / `yaml.ts`. File flows: `frontend/src/shell/file-yaml.test.tsx`. Kernel: `frontend/src/kernel/{kernel,store}.test.ts`. |
| E2E contract | YAML `then` keys are user-visible / kernel oracles (`aliases`, `entryType`, `dirty`, `fileExists`, `reopenSucceeds`, `errorId`, `dialogShown`, `controlEnabled`, slice extras). Slice drivers honor `examinedType`, `verifyResult`, `buffer`, `clipboardContains`. No DOM-structure asserts in YAML. |
| Host-proof | `frontend/src/features/host-proof/index.ts` remains a thin re-export of real `generateKeyPair`. Plugin-host glob test passed. **Not deleted.** |

## Commands

```text
cd frontend && npm ci
cd frontend && npm test          # vitest run
cd frontend && npx tsc -b
cd frontend && npx oxlint
```

| Gate | Outcome |
|---|---|
| `vitest run` | **3 failed**, 369 passed, 0 skipped (372 tests, 34 files, 13.42s) |
| `tsc -b` | pass |
| `oxlint` | pass |

Did not invent Playwright (or any other) runner. Did not run P5.security-scan.

## Inventory vs YAML

Signed SCOPE maps **84** in-scope action rows + kernel primitives (no action class) + **14** out-of-scope rows.

Every in-scope inventory `id` has YAML under the matching `slice`. No extra in-scope entries. No YAML for out-of-scope ids (`platform` / `skip` / `preferences`). No YAML with `blocked: true` or non-empty `skipOn`.

| Slice | SCOPE action rows | YAML files | Missing ids |
|---|---:|---:|---|
| kernel | (no action class) | 0 (unit tests) | — |
| file | 10 | 30 | none |
| generate | 4 | 12 | none |
| import | 4 | 12 | none |
| delete-rename | 7 | 21 | none |
| details | 7 | 21 | none |
| export | 8 | 24 | none |
| sign | 8 | 24 | none |
| verify-sig | 3 | 9 | none |
| examine | 4 | 12 | none |
| clipboard | 7 | 15 | none |
| chain | 2 | 6 | none |
| session | 15 | 40 | none |
| chrome | 5 | 11 | none |
| **in-scope total** | **84** | **237** | **none** |

Out of scope (correctly absent from YAML): `open-pkcs11`, `open-windows-my`, `open-windows-root`, `open-apple-keychain`, `open-default`, `open-ms-capi`, `help`, `tip-of-the-day`, `show-hide-tool-bar`, `show-hide-status-bar`, `tab-style-wrap`, `tab-style-scroll`, `website`, `preferences`.

Coverage note (not missing ids): some non-abortable / read-only actions have two YAML files instead of three (e.g. `copy*` / `cut*` happy + empty-selection; `undo` / `redo` / `properties` happy + not-writable; chrome Help dialogs happy + cancel; `authority-certificates-verify` happy + not-found). Mutating abortable actions keep happy + cancel + one error.

## Passed

**236 / 237** YAML scenarios passed through the existing driver.

All slice YAML suites other than `file-new-pkcs12` passed, including generate, import, delete-rename, details, export *YAML flows*, sign, verify-sig, examine, clipboard, chain, session, chrome, and the remaining 29 file scenarios.

Non-YAML kernel / host tests that passed (claim only these):

- Empty PKCS#12 create; non-PKCS#12 `unsupportedType`.
- Own-bytes `save` / `load` with `TEST_PASSWORD` and `reopenSucceeds`.
- MAC failure → `errorId: wrongPassword`. Garbage bytes → `invalidFile`.
- RSA `KEY_PAIR` generate + own-file round-trip; `duplicateAlias` on reuse.
- Testdata PEM → `TRUSTED_CERT` import + own-file round-trip.
- Secret `KEY` bag + own-file round-trip.
- Store snapshot clone/append does not mutate the previous object.
- No dummy store on disk (`frontend/src/dummy` missing).
- Plugin host glob-loads `features/*/index.ts`, including host-proof; menubar/toolbar stubs paint from `menu-config.ts`.
- Generate / chrome / examine enablement tests for *their own* menus passed (Tools → Generate Key Pair on a file-backed store; Help chrome with no store; Examine File always on).

Typecheck and oxlint passed.

## Failed

Three Vitest failures. All are **leftover enablement oracles** written before later slices landed. Production generate / About / Examine were **not** disabled to make them pass.

### 1. `file-new-pkcs12` (`frontend/src/shell/file-yaml.test.tsx`)

YAML still asserts a File-era host snapshot after `NewAction` PKCS#12:

| control | YAML | Runtime after generate + chrome |
|---|---|---|
| `menu.tools.generate-key-pair` | `enabled: false` | Still `false` on an untitled empty dirty tab via `frontend/src/features/generate/gate.ts` (`canGenerate` special-case). Oracle holds only because of that gate, not because generate is unimplemented. |
| `menu.tools.import-trusted-certificate` | `enabled: false` | Still `false`: import `canExecute` is hard-`false` while `run()` still executes YAML. Same leftover pattern. |
| `menu.help.about` | `enabled: false` | **`true`**. Chrome registers `about` with `canExecute: alwaysEnabled`. **This is the assertion that fails.** |

Do not disable Help → About (or Tools → Generate Key Pair on a writable store) to green this scenario. The YAML leftover is the gap.

`file-new-cancel` still asserts `toolbar.generate-key-pair` disabled; that passes because cancel leaves no tab.

### 2–3. Export leftover Examine File disabled

Not YAML `then` rows. Extra tests in the export slice still pin a pre-examine host:

- `frontend/src/features/export/export-yaml.test.tsx` — “enables Tools → Export CSV via glob…” then `expect(menu.examine.file).toBeDisabled()`.
- `frontend/src/features/export/export-ui.test.tsx` — CSV/key-pair enablement then `expect(isControlEnabled("menu.examine.file")).toBe(false)`.

Examine File is `alwaysEnabled` after P4.examine. Export *YAML scenarios* (24) still pass. Do not disable Examine File to green these two tests.

## Skipped

None. No `it.skip` / `describe.skip` in `frontend/`. No YAML `skipOn`.

## Blocked

None. No `blocked: true` YAML (unknown-password fixtures were not seeded as runnable scenarios). Kernel does not guess undocumented `testdata` store passwords.

## Missing vs in-scope inventory

**No missing in-scope action ids.** Kernel has no YAML by contract; coverage is `frontend/src/kernel/` tests plus save/`reopenSucceeds` oracles on file-writing flows.

Not claimed (out of SCOPE / ARCH):

- JCA or BouncyCastle bag-for-bag PKCS#12 equality.
- PKCS#11, Windows-MY/ROOT, Apple Keychain, JVM default store.
- Help website, tip of the day, toolbar/status-bar hide, tab wrap/scroll, Look-and-Feel preferences.

## Leftover oracles (do not “fix” in this ticket)

Documented, not patched:

1. `file-new-pkcs12` still expects Tools → Generate Key Pair and Help → About **disabled** after generate and chrome landed. About fails the suite. Generate stays disabled only on untitled empty dirty tabs (`canGenerate`). Host-proof must keep re-exporting real `generateKeyPair`.
2. Export extra tests still assert Examine File (historically also Generate Key Pair on empty host) **disabled**.
3. Import Trusted Certificate menu `canExecute: () => false` is the same File-snapshot workaround as (1); YAML still calls `run()`.

## Security

Not scanned. That is MOD-46 (`P5.security-scan`), after this report is accepted.
