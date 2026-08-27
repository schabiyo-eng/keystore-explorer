# Architecture lock — self-contained SPA

Phase 1. Inventory must not rewrite this file.

## Runtime

- Vite + React + TypeScript in `frontend/`.
- No Java HTTP API. No dummy in-memory keystore as product behavior.
- PKCS#12, key generation, and cert import run in the client.

## Shell (File slice)

`P4.file` owns `frontend/src/shell/`: menubar, toolbar, tabs, table, Quick Start, dialog host, and the session object. It is the **plugin host**. Later slices add `frontend/src/features/<slice>/index.ts`; the shell loads them with `import.meta.glob("../features/*/index.ts")`. Fan-out must not edit the menubar, toolbar, or glob loader. Session API: `getActive`, `getSelection`, `apply`, plus history stubs until `P4.session`.

## Kernel

All crypto and store bytes live in `frontend/src/kernel/`. YAML `when` commands call this module. UI does not parse PKCS#12 itself.

**Libraries (one PKCS#12 stack):**

- Key generation: Web Crypto `SubtleCrypto` (RSA first; other algorithms as the generate slice requires).
- PKCS#12 load/store and X.509 display: **pkijs** plus `@peculiar/webcrypto` in Node/Vitest.
- If kernel CI cannot open a documented fixture or bytes Swing can open, replace **only** this stack (e.g. `node-forge`) in the kernel ticket — do not add a second parser in a later slice.

## Files and passwords

- Tests pass fixture paths or bytes; UI uses file input and download/save-as. File System Access API is optional, not required.
- Store and entry passwords stay in memory for the open tab. Never `localStorage`, URLs, or logs.
- `reopenSucceeds` = kernel `load` of the bytes `save` just wrote, same password.

## Out of scope for the kernel

- JCA providers, PKCS#11, OS keystores, matching BouncyCastle bag encoding bit-for-bit.
- Guessing passwords for `testdata` files marked unknown in `functional-tests/schema.md`.

## Superseded code

`frontend/src/dummy/` is invalid. `P4.kernel` deletes it and points the YAML driver at the kernel.
