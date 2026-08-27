# Rewrite scope

**Status: proposal.** Human must change this to `Status: signed` before Phase 3/4. Inventory writes this file; do not treat a copied tree as signed.

Full Swing → React rewrite of **in-scope** actions. There is no MVP subset. Out-of-scope rows stay out because they cannot run in a self-contained PKCS#12 browser SPA (`ARCH.md`), not because they are “later.”

## In scope (must port)

PKCS#12 file and entry workflows that Swing exposes and the kernel can implement in-browser:

| Slice | Inventory actions (representative) |
|-------|--------------------------------------|
| kernel | PKCS#12 create/load/save, RSA generate primitives, password fail (no UI chrome) |
| file | New/Open/Save/Close/Reload **and** the shell plugin host (full menubar stubs, glob loader, session `apply`, dialog host) |
| generate | GenerateKeyPairAction, GenerateSecretKeyAction, GenerateDHParametersAction, StorePassphraseAction |
| import | ImportTrustedCertificateAction, ImportKeyPairAction, ImportCaReplyFromFileAction, ImportCaReplyFromClipboardAction |
| delete-rename | Delete* / Rename* / DeleteMultipleEntriesAction |
| details | kind-specific details (including selected-certs chain) |
| export | Export* certificate/key/CSV |
| sign | SignCsr, SignFile, SignJar, SignJwt, SignCrl, SignMidlet, SignNewKeyPair, GenerateCsr |
| verify-sig | VerifyCertificate, VerifyJar, VerifySignature |
| examine | ExamineFile, ExamineClipboard, ExamineSsl, DetectFileType |
| clipboard | Copy/Cut/Paste and kind-specific copy/cut |
| chain | AppendToCertificateChain, RemoveFromCertificateChain |
| session | Undo, Redo, Find, CompareCertificate, Properties, SetPassword, SetKeyPassword, SetKeyPairPassword, Unlock*, ChangeType, ConvertToJavaP12, OpenCaCertificates, AuthorityCertificates* — implements File’s session stubs; does not replace the plugin host |
| chrome | About, Jars, SecurityProviders, SystemInformation, CheckUpdate (informational) |

Wrong password, cancel, and duplicate-alias remain required oracles on every mutating flow.

## Out of scope (never a slice)

| Tag / area | Why |
|------------|-----|
| `platform` | PKCS#11, Windows-MY/ROOT, Apple Keychain, JVM default store — not available in a browser SPA |
| `skip` | Help website, tip of the day, toolbar/status-bar hide, tab wrap/scroll |
| Preferences / L&F | Look-and-feel prefs are Swing-specific |
| JCA / BouncyCastle bag-for-bag PKCS#12 | `ARCH.md`; kernel round-trips its own bytes |
| Java sidecar / remote crypto | Rewrite stays self-contained |

Disabled menu items may remain in the shell for out-of-scope entries. Do not implement those flows.

## Sign-off

- [ ] Product/design owner confirms in-scope vs out-of-scope.
- [ ] Engineering owner accepts in-browser PKCS#12 (not JCA parity); dummy store is rejected.
- [ ] Test-generation owner will cover every in-scope slice (happy, cancel if abortable, one error).
---
