# MVP parity proposal

> **Superseded.** Do not copy this file into a greenfield repo. The rewrite gate is [SCOPE.md](SCOPE.md) (full PKCS#12 SPA, not an MVP cut). This document is leftover from an earlier clone seed.

**Status: signed (historical).** Human sign-off boxes below are checked. Phase 4 may proceed. Implementation is a **self-contained PKCS#12 kernel**, not a dummy store. See [ARCH.md](ARCH.md).

## In MVP

| capability | inventory actions | minimum observable parity |
|---|---|---|
| New PKCS#12 | NewAction | choose PKCS#12, create and select an empty unsaved tab; cancel creates nothing |
| Open PKCS#12 | OpenAction | choose a file, prompt for password, open into a selected tab; wrong password offers retry/cancel; cancel creates nothing |
| Save PKCS#12 | SaveAction; SaveAsAction | save uses existing path or Save As; writes PKCS#12 bytes; successful save clears dirty; cancel/failure preserves dirty state and path; `reopenSucceeds` via kernel |
| Generate RSA key pair | GenerateKeyPairAction | collect the Swing-visible basic choices and alias, support cancel/duplicate alias, add a real key-pair entry, mark dirty |
| Import trusted certificate | ImportTrustedCertificateAction | choose a certificate file, show confirmation/alias behavior, support cancel/duplicate alias, add a trusted-certificate row, mark dirty |
| Delete | DeleteKeyPairAction; DeleteTrustedCertificateAction; DeleteKeyAction; DeleteMultipleEntriesAction | confirm, remove selected row(s), update selection, append history/mark dirty; cancel is atomic |
| Rename | RenameKeyPairAction; RenameTrustedCertificateAction; RenameKeyAction | collect unique alias, preserve entry kind/details/password state, mark dirty; cancel and conflicts do not mutate |
| Details, read-only | KeyPairCertificateChainDetailsAction; KeyPairPrivateKeyDetailsAction; KeyPairPublicKeyDetailsAction; TrustedCertificateDetailsAction; TrustedCertificatePublicKeyDetailsAction; KeyDetailsAction; SelectedCertificatesChainDetailsAction | kind-specific read-only metadata dialogs; no export/edit controls required for MVP |
| Password failure and cancellation | OpenAction plus inherited password helpers used by entry actions | correct/wrong password handling against kernel load, retry/cancel, no mutation or secret leakage on failure |

The MVP store type is PKCS#12 only. Save must produce bytes the kernel can load with the same password.

## Post-MVP

- Signing and verification workflows: file signatures, CSR signing, JAR/MIDlet, JWT, CRL, certificate/path/status verification.
- CSR generation and CA-reply import.
- PKCS#11, Windows MS CAPI stores, Apple Keychain, default JVM/platform stores, and other non-PKCS#12 store types.
- JCA provider parity and bit-for-bit BouncyCastle PKCS#12 encoding.
- Key-pair/secret-key import and export, certificate/public/private-key export, CSV export, clipboard examine/import, SSL examine, and file-type inspection.
- Certificate-chain append/remove and extension editors.
- Secret-key/passphrase generation and editing.
- Cut/copy/paste, compare, find, reload/external-modification handling, properties, undo/redo UI, close-all refinements, and recent-file refinements not needed by seed flows.
- Password-manager initialization/unlock/persistence and password-change workflows.
- Preferences, look and feel, toolbar/status-bar toggles, tab wrap/scroll, tips, help/web links, update checks, diagnostics, and About/JAR/provider/system dialogs.
- A Java backend or remote crypto service (this rewrite stays self-contained).

## Sign-off

- [x] Product/design owner confirms the in-MVP list.
- [x] Engineering owner accepts in-browser PKCS#12 (not JCA/BouncyCastle parity); dummy store is rejected.
- [x] Test-generation owner confirms the seed flows cover wrong password and every cancel boundary.
