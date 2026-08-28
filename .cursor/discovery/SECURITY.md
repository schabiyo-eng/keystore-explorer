# Phase 5 security scan

**Status:** report only. No production-slice hotfix. No Swing / `kse/` edits.

**Ticket:** MOD-46 (`P5.security-scan`)
**Base:** `origin/main` at `cad20334` (`docs(verify): add Phase 5 VERIFY.md (#47)`). P5.verify is Done.
**SCOPE:** signed (`.cursor/discovery/SCOPE.md`).
**Method:** static review of `frontend/` (including `src/kernel/`, fixtures, downloads). Private keys and PKCS#12 bytes live in the JS heap by design ([ARCH.md](ARCH.md)). This is not a bag-for-bag rewrite of `kse/` crypto.

All **High** and **Critical** rows require human review before any follow-up patch.

## Commands

```text
rg -n "dangerouslySetInnerHTML|innerHTML|localStorage|sessionStorage|indexedDB|console\\.(log|debug)|navigator\\.clipboard|createObjectURL" frontend
rg -n "BEGIN (RSA )?PRIVATE KEY|TEST_PASSWORD|password" frontend/src
test -f .cursor/discovery/SECURITY.md
```

No application code was changed. Vitest / tsc / oxlint were not re-run (verify leftovers in [VERIFY.md](VERIFY.md) are out of scope).

## Summary

| Severity | Count | Human review |
|---|---:|---|
| Critical | 0 | — |
| High | 3 | **required** |
| Medium | 5 | recommended |
| Low | 4 | optional |

No XSS sink (`dangerouslySetInnerHTML` / `innerHTML` / `eval`) was found. Alias, DN, and cert fields render as React text or controlled `<input>` / `<textarea>` values. No `localStorage`, `sessionStorage`, IndexedDB, URL query, or `console.*` password leakage. `frontend/` does not contain copied `.p12` / `.pem` product secrets.

The High rows are confidentiality of exported/saved key material and availability of untrusted ASN.1 parse — not stored XSS.

---

## High

### H1. Export Private Key writes unencrypted PKCS#8 PEM

**Location:** `frontend/src/features/export/private-key.ts`, `frontend/src/features/export/encode.ts`, `frontend/src/features/export/dialogs.tsx`

**Evidence:** Tools → Export Private Key collects “Password for Output File” (`dialog.export-private-key.password`) and `requireExportPassword` checks it against the **open store** password. The bytes written are `encodePkcs8Pem(entry.pkcs8)`, which emits `-----BEGIN PRIVATE KEY-----` (PKCS#8, no encryption). The unit test names this: “encodes PKCS#8 as an unencrypted PRIVATE KEY PEM”. The export password is discarded and is not applied to the PEM. `writeExportedFile` is the download/VFS path.

**Impact:** Anyone with the exported file gets the private key with no passphrase. The UI implies the output is password-protected.

**Remediation suggestion:** Encrypt the PKCS#8 (PBES2 / `BEGIN ENCRYPTED PRIVATE KEY`) with the **output** password, or drop the password field and label the export as unencrypted. Do not treat store-password verification as output encryption. Human review before changing the YAML export oracles.

### H2. Saved PKCS#12 is MAC-only; SecretBags are plaintext

**Location:** `frontend/src/kernel/pkcs12.ts` (`encodePkcs12`), `frontend/src/kernel/bags.ts` (`bagsForKey`, `encryptShroudedKey`)

**Evidence:** `AuthenticatedSafe` is built with `privacyMode: 0` (PKCS#7 Data, not EncryptedData). Comment on `encodePkcs12` says “password-based MAC integrity.” Private-key bags are shrouded; `KEY` SecretBags (Tools → Store Passphrase) are written with `secretBagFromBytes` and **never** passed through `encryptShroudedKey` (`password` is unused on that branch). Certificates sit in the same unencrypted SafeContents.

A password is required to verify the MAC, not to read SecretBag octets or certificates from the file. Swing/JCA PKCS#12 typically password-encrypts SafeContents.

**Impact:** A `.p12` written by Save / Save As / Export Key Pair leaks stored passphrases (and certs) to anyone who obtains the file, without the store password. Private keys remain in shrouded bags (see M1 for KDF strength).

**Remediation suggestion:** Set SafeContents `privacyMode` to password privacy (EncryptedData) with a modern PBES2 cipher, and/or wrap SecretBags. Keep MAC. Human review: this changes on-disk format vs current kernel round-trips.

### H3. Untrusted ASN.1 parse has no depth/size limits

**Location:** `frontend/src/kernel/pkcs12.ts` (`decodePkcs12` → `pkijs.PFX.fromBER`), `frontend/src/kernel/keys.ts` / details / examine / import / chain / verify-sig (certificate and CMS `fromBER` paths). Stack: `pkijs@3.4.0` → `asn1js@3.0.10`.

**Evidence:** Open, Examine File, Import, and related flows parse attacker-chosen BER. `asn1js` 3.0.10 added **optional** `fromBER` resource limits (`maxDepth` / `maxNodes` / `maxContentLength`). `pkijs` 3.4.0 still calls `asn1js.fromBER` without those options (`PkiObject.fromBER`). PeculiarVentures/PKI.js#466 (open, 2026-03-19) reports inherited CWE-674 stack exhaustion on nested SEQUENCE (reported CVSS 8.7, availability). Kernel `decodePkcs12` maps parse failures to `invalidFile` but a RangeError from unbounded recursion can take down the tab/process first.

**Impact:** A crafted `.p12` / cert / CMS blob can crash the SPA (DoS). Not a confidentiality issue by itself. User interaction is “open or examine this file,” which is the product.

**Remediation suggestion:** Pass explicit `fromBER` limits on every untrusted parse (or wrap `pkijs` `fromBER`), cap input size before parse, and pin `asn1js` plus a pkijs release that forwards limits. Human review of DoS vs UX for large legitimate stores.

---

## Medium

### M1. Shrouded-key PBES2 is AES-CBC-128 with HMAC-SHA-1 and 2048 iterations

**Location:** `frontend/src/kernel/bags.ts` (`PKCS12_ITERATIONS = 2048`, `encryptShroudedKey`)

**Evidence:** Shrouded keys use `contentEncryptionAlgorithm: { name: "AES-CBC", length: 128 }`, `hmacHashAlgorithm: "SHA-1"`, `iterationCount: 2048`. PFX MAC uses SHA-256 at the same 2048 iterations (`pkcs12.ts`). Offline guessing against a stolen `.p12` is cheap by current PBKDF2 guidance.

**Remediation suggestion:** AES-256-CBC or AES-GCM with SHA-256 and a much higher iteration count (or OWASP-current PBKDF2/Argon2 via a stack the kernel already allows). Confirm OpenSSL/Java interoperability; pkijs AES-GCM PKCS#12 encoding has known parameter bugs (PKI.js#486) — do not switch to GCM without a verified encoder.

### M2. `TEST_PASSWORD` is a production password alias

**Location:** `frontend/src/kernel/commands.ts` (`export const TEST_PASSWORD = "password"`), `frontend/src/features/file/params.ts` (`resolvePassword`), re-exported through generate / import / export / session / sign / chain.

**Evidence:** YAML uses `password: TEST_PASSWORD`. `resolvePassword` maps that literal to `"password"` in the same module graph the plugin host loads (`App.tsx` → `loadFeatures`). The constant is exported from `frontend/src/kernel/index.ts`, so it ships in the SPA bundle. A UI or command bag that passes the string `TEST_PASSWORD` unlocks as `password`.

**Remediation suggestion:** Keep the token in test-only modules (`*.test.ts`, `yaml-driver.ts`). Production `resolvePassword` should treat the input as the password bytes as typed. Human review so YAML drivers still resolve the schema token.

### M3. Session heap retains passwords and key bytes after close

**Location:** `frontend/src/shell/types.ts` (`TabState.password`, `LastWrite.password`), `frontend/src/shell/session.ts` (`TabSnapshot`, `vfsWrite`, `recordWrites`, `removeTab`)

**Evidence:** ARCH requires store/entry passwords in memory for the open tab, never `localStorage` / URLs / logs — that part holds. In addition:

- Undo snapshots clone the full `KeyStore` (PKCS#8 / secrets) **and** `password`.
- `lastWrites` keeps `{ path, bytes, password }` for `reopenSucceeds`.
- `vfs` is a process-wide `Map` of PKCS#12 and export bytes (including unencrypted private-key PEM from H1).
- `removeTab` deletes undo history for that id but does **not** wipe `vfs` or `lastWrites`.

**Remediation suggestion:** Zero `password` / `bytes` on close; bound undo; drop VFS entries for closed paths; keep `lastWrites` test-only. Document residual heap risk (devtools, hibernation, XSS-if-introduced).

### M4. Browser PKCS#12 engine is `@peculiar/webcrypto`, not native SubtleCrypto

**Location:** `frontend/src/kernel/crypto.ts` (`installWebCrypto`)

**Evidence:** ARCH: “pkijs plus `@peculiar/webcrypto` in Node/Vitest.” `installWebCrypto` always constructs `new Crypto()` from `@peculiar/webcrypto` and `pkijs.setEngine` to that engine. Node also replaces `globalThis.crypto`. The browser therefore wraps keys with a JS WebCrypto polyfill rather than the platform SubtleCrypto.

**Remediation suggestion:** Use native `globalThis.crypto` in the browser; keep `@peculiar/webcrypto` behind `process.versions.node` / Vitest setup only.

### M5. Cut/copy buffer clones private keys; no OS clipboard yet

**Location:** `frontend/src/features/clipboard/buffer.ts`, `copy.ts`, `paste.ts`. Sign/examine/import keep separate in-memory “OS clipboard” modules. No `navigator.clipboard` / `createObjectURL` / File System Access API in `frontend/`.

**Evidence:** Copy/cut stores `KernelEntry` clones (including `pkcs8` and `secret`) in module scope. Paste writes them into another tab. File Save / Export write the in-memory VFS only (YAML `fileExists` / `reopenSucceeds`). That currently **contains** key material to the page heap (no browser download, no system clipboard). Wiring real download or `navigator.clipboard` without extra encryption would turn H1/M5 into disk/OS leaks.

**Remediation suggestion:** When real download/clipboard is added, encrypt private-key exports (H1), avoid putting PKCS#8 on the system clipboard, and clear the internal buffer on tab close / timeout.

---

## Low

### L1. Details UI shows private-key and secret hex

**Location:** `frontend/src/features/details/inspect.ts` (`inspectPrivateKey`, `inspectSecretKey`), `frontend/src/features/details/fields.tsx` (`EncodedField`)

**Evidence:** Key Pair Private Key Details / Secret Key Details put `formatHex(pkcs8|secret)` in a read-only textarea. Swing does the same kind of encoded view. Shoulder-surfing / copy-paste from the dialog is possible.

**Remediation suggestion:** Mask encoded material until an explicit reveal; do not log it.

### L2. No Content-Security-Policy

**Location:** `frontend/index.html`

**Evidence:** No CSP (or other security headers) in the SPA shell. Combined with the current lack of HTML sinks this is defense-in-depth, not an active XSS.

**Remediation suggestion:** Strict CSP (`default-src 'self'`; no `unsafe-eval`) on the Vite preview / static host.

### L3. Check for Updates fetches a live URL

**Location:** `frontend/src/features/chrome/update.ts` (`LATEST_VERSION_URL = "https://keystore-explorer.org/version.txt"`)

**Evidence:** Production `defaultFetchLatestVersion` uses `fetch`. YAML injects a stub so tests do not hit the network. The response is shown as React text (`updateResultMessage`) — not HTML — so a hostile `version.txt` is not an XSS sink. It is a phone-home / spoofable-version issue.

**Remediation suggestion:** Pin TLS, treat the body as a strict semver, and keep the test stub. Optional: disable in air-gapped builds.

### L4. Generate draft holds passphrase in module state

**Location:** `frontend/src/features/generate/draft.ts`, `frontend/src/features/generate/passphrase.ts`

**Evidence:** Store Passphrase writes `draft.passphrase` until commit or cancel. `clearDraft` runs on cancel; success path commits then relies on later clear. A leftover draft after a failed commit would keep the passphrase in the module closure.

**Remediation suggestion:** Always `clearDraft()` in a `finally` after `putSecretKey`; overwrite the string.

---

## Checked clean

| Check | Result |
|---|---|
| XSS / HTML injection on alias, DN, subject, issuer | React text and controlled inputs/textareas only (`EntryTable`, details/examine `ReadField`, `FrameDialog` title). No `dangerouslySetInnerHTML`. |
| Passwords in logs | No `console.log` / `debug` / `info` in `frontend/src`. |
| Passwords in URLs | No `URLSearchParams` / `location` usage. |
| `localStorage` / `sessionStorage` / IndexedDB | None. |
| Password inputs | `type="password"` and `autoComplete="off"` on File password dialogs. |
| Error dialogs | Show `errorId` (`wrongPassword`, …), not the password (`shell/dialogs.tsx`). |
| `navigator.clipboard` | Unused. Sign/examine clipboards are in-memory test oracles. |
| Secrets copied into `frontend/` fixtures | No `.p12` / `.pem` / `.key` under `frontend/`. Tests read `kse/src/test/resources/testdata` at runtime (including documented unencrypted PKCS#8 vectors). YAML passwords are the `TEST_PASSWORD` **token**, not live secrets. |
| Dummy store | `frontend/src/dummy/` absent (VERIFY). |

## Dependencies (PKCS#12 stack)

From `frontend/package.json` / lockfile:

| Package | Locked | Notes |
|---|---|---|
| `pkijs` | 3.4.0 | Sole PKCS#12 + X.509 stack (ARCH). Open issues: ASN.1 recursion inheritance (#466), EnvelopedData error swallowing (#463; this kernel uses shrouded-key AES-CBC, not that CMS encrypt path). |
| `asn1js` | 3.0.10 | Direct dep. Limits exist but are opt-in (H3). |
| `@peculiar/webcrypto` | 1.7.1 | Forced pkijs engine (M4). |
| `pvutils` | ^1.2.0 | pkijs companion. |
| `react` / `react-dom` | 19.2.8 | Default escaping is the XSS control. |
| `vite` | 8.2.2 | Dev/build only. |

No second PKCS#12 parser. Do not add `node-forge` in a later slice unless the kernel ticket replaces this stack (ARCH).

## Out of scope (not claimed)

- JCA / BouncyCastle bag-for-bag equality.
- PKCS#11, OS keystores, live TLS certificate fetch (Examine SSL is stubbed: `example.com` / TEST-NET-1 only).
- VERIFY leftover enablement oracles (`file-new-pkcs12` About, export Examine File). Do not disable generate / About / Examine File to paper over those.

## Residual (by architecture)

The SPA holds unlocked PKCS#8, secrets, and the store password in the JS heap for the life of the tab. Devtools, memory dumps, and any future XSS become key-exfiltration bugs. That matches ARCH; it is not a Phase 5 auto-fix.
