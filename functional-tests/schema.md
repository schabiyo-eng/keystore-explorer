# Functional-test schema (P3.schema)

Frozen `given` / `when` / `then` vocabulary for the PKCS#12 SPA rewrite. Drivers (React, optional Java model) consume the same YAML. Later `P3.yaml.*` tickets **must not** invent commands or control ids.

Sources: signed `.cursor/discovery/SCOPE.md`, `.cursor/discovery/INVENTORY.md`, `.cursor/discovery/ARCH.md`, `.cursor/discovery/UI.md`, `KseFrame` menus, and in-scope `*Action.doAction()`.

This ticket writes **no** `functional-tests/flows/**` YAML.

## Laws

- Scenario `id` values are kebab-case (`file-new-pkcs12`).
- `when` / `then` keys are camelCase (`newKeyStore`). Do not use toolkit class names (`JButton`, `JFileChooser` forbidden).
- Select by visible text, role, or `data-testid` from [control-ids.md](control-ids.md).
- Assert user-visible and kernel facts from [ORACLES.md](ORACLES.md). No DOM-structure asserts. No JCA bag-for-bag equality.
- Unknown fixture passwords: `blocked: true`, never guessed.
- Mutating flows require wrong-password, cancel, and duplicate-alias oracles (happy + cancel + one error, cap 3 YAML per action).
- File-writing scenarios must assert `fileExists` and `reopenSucceeds` (kernel `load` of bytes `save` just wrote, same password — ARCH.md).
- Kernel coverage is primarily `frontend/src/kernel/` tests plus save/reopen oracles. Do not put kernel primitives in File YAML.

## YAML shape

```yaml
id: file-new-pkcs12
action: NewAction
slice: file
requires: []
tags: [core, file]
entry: file.new
skipOn: []
blocked: false
blockedReason: null
given:
  - appStarted: true
when:
  - newKeyStore:
      type: PKCS12
then:
  - keystoreOpen: true
  - type: PKCS12
  - aliases: []
  - entryCount: 0
  - dirty: true
```

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Unique kebab-case scenario id |
| `action` | yes | Swing action class name from INVENTORY (`NewAction`). Driver maps it to a `when` command; do not invent a second name |
| `slice` | yes | One of the slice ids below |
| `requires` | yes | List of slice ids that must already be implemented. File uses `[]` |
| `tags` | no | Inventory tags (`core`, `entry-keypair`, …) plus slice |
| `entry` | yes | Inventory id (`file.new` → `new`) |
| `skipOn` | no | Empty unless a documented environment skip |
| `blocked` | yes | `true` only for unknown-password fixtures |
| `blockedReason` | when blocked | Why the password must not be guessed |
| `given` | yes | List of maps |
| `when` | yes | List of one-key maps; key is a frozen command |
| `then` | yes | List of one-key maps; key is a frozen oracle |

Cancel of an abortable dialog is a first-class scenario: either `when` ends with `cancel: {}` while a dialog is shown, or the command sets `confirm: false` / `cancel: true`.

## Slice / requires

`slice` is one of: `kernel` \| `file` \| `generate` \| `import` \| `delete-rename` \| `details` \| `export` \| `sign` \| `verify-sig` \| `examine` \| `clipboard` \| `chain` \| `session` \| `chrome`.

File-slice runners load `slice: file` with empty `requires`. Kernel is not File YAML.

| slice | requires | Why |
|---|---|---|
| `kernel` | `[]` | Unit tests under `frontend/src/kernel/`; save/reopen oracles |
| `file` | `[]` | Plugin host; New/Open/Save against that host |
| `generate` | `[file]` | Needs an open writable PKCS#12 (or New from Tools) |
| `import` | `[file]` | Needs an open writable PKCS#12 (or New) |
| `delete-rename` | `[file]` | Needs entries; YAML may also `generate`/`import` in `given`/`when` |
| `details` | `[file]` | Read-only against a selected entry |
| `export` | `[file]` | Writes files from selected entries |
| `sign` | `[file]` | Needs a signing-capable key pair |
| `verify-sig` | `[file]` | Optional open trust store |
| `examine` | `[]` | Examine File/Clipboard/Detect do not require a store; SSL may |
| `clipboard` | `[file, delete-rename]` | Cut/copy/paste mutate selection; after delete-rename modernize |
| `chain` | `[file, details]` | Append/remove chain; after details modernize |
| `session` | `[file]` | Fills File history/password stubs; does not replace the host |
| `chrome` | `[file]` | About/JARs/providers/system information/check-update |

Out-of-scope inventory (`platform`, `skip`, Preferences) gets **no** YAML. Disabled stubs may exist in the shell ([control-ids.md](control-ids.md)); do not write flows for them.

## Named fixtures (`kse/src/test/resources/testdata/`)

Reuse these as inputs. Paths are relative to `kse/src/test/resources/testdata/`. There is **no** checked-in PKCS#12 with a documented password. Happy open/save scenarios create a PKCS#12 at runtime with the documented test password, then round-trip through the kernel.

### Documented test password

| Constant | Value | Allowed use |
|---|---|---|
| `TEST_PASSWORD` | `password` | Only stores **the SPA/kernel created in this test**. Matches `KeyStoreUtilTest` (`char[] { 'p','a','s','s','w','o','r','d' }`). Never apply this string to an undocumented testdata file. |

### Usable named inputs (no store password)

| id | path | use |
|---|---|---|
| `cert-pem` | `CryptoFileUtilTest/cert.pem.cer` | import trusted cert; examine file; append chain |
| `cert-multi-pem` | `CryptoFileUtilTest/cert.multi.pem.cer` | multi-cert import / examine |
| `cert-base64` | `CryptoFileUtilTest/cert.base64.txt` | examine / detect |
| `cert-google-ec` | `PublicKeyFingerprintUtilTest/EC_P256_www.google.com.cer` | import / examine |
| `cert-digicert-ec` | `PublicKeyFingerprintUtilTest/EC_P384_DigiCertRootG5.cer` | import / examine |
| `cert-gts-rsa` | `PublicKeyFingerprintUtilTest/RSA_4096_GTS_Root_R1.cer` | import / examine |
| `cert-ed25519` | `PublicKeyFingerprintUtilTest/Ed25519_CA.cer` | import / examine |
| `csr-p10` | `CryptoFileUtilTest/csr.p10` | sign CSR; examine; generate-csr compare |
| `csr-spkac` | `CryptoFileUtilTest/csr.spkac` | sign CSR / examine |
| `crl-pem` | `CryptoFileUtilTest/test.pem.crl` | examine CRL |
| `jwt-sample` | `CryptoFileUtilTest/test.jwt` | examine JWT; sign JWT compare |
| `rsa-unenc-pkcs8` | `CryptoFileUtilTest/rsa.unenc.pem.pkcs8` | import key pair |
| `rsa-unenc-key` | `CryptoFileUtilTest/rsa.unenc.pem.key` | import key pair / examine |
| `rsa-pub` | `CryptoFileUtilTest/rsa.pem.pub` | examine public key |
| `rsa-unenc-json` | `CryptoFileUtilTest/rsa.unenc.json` | import / examine JWK |
| `ec-unenc-pkcs8` | `CryptoFileUtilTest/ec.unenc.pem.pkcs8` | import key pair |
| `ec-unenc-key` | `CryptoFileUtilTest/ec.unenc.pem.key` | import / examine |
| `ec-pub` | `CryptoFileUtilTest/ec.pem.pub` | examine public key |
| `ed25519-unenc-pkcs8` | `CryptoFileUtilTest/ed25519.unenc.pem.pkcs8` | import key pair |
| `ed25519-pub` | `CryptoFileUtilTest/ed25519.pem.pub` | examine public key |
| `unknown-txt` | `CryptoFileUtilTest/unknown.txt` | detect-file-type unknown |

Runtime (not testdata) fixtures YAML may name:

| id | how | password |
|---|---|---|
| `runtime-pkcs12` | kernel/SPA `newKeyStore` + `saveKeyStore` / `saveKeyStoreAs` | `TEST_PASSWORD` |
| `runtime-pkcs12-keypair` | `runtime-pkcs12` plus `generateKeyPair` | `TEST_PASSWORD` |

### Unknown password — `blocked`, never guess

Set `blocked: true` and `blockedReason: unknown-password`. Do **not** try `password`, empty, or any other guess.

| id | path |
|---|---|
| `rsa-enc-key` | `CryptoFileUtilTest/rsa.enc.pem.key` |
| `rsa-enc-pkcs8` | `CryptoFileUtilTest/rsa.enc.pem.pkcs8` |
| `rsa-enc-json` | `CryptoFileUtilTest/rsa.enc.json` |
| `rsa-enc-jwe` | `CryptoFileUtilTest/rsa.enc.jwe` |
| `ec-enc-pkcs8` | `CryptoFileUtilTest/ec.enc.der.pkcs8` |
| `ec-enc-pem-pkcs8` | `CryptoFileUtilTest/ec.enc.pem.pkcs8` |
| `ec-enc-key` | `CryptoFileUtilTest/ec.enc.pem.key` |
| `ec-enc-json` | `CryptoFileUtilTest/ec.enc.json` |
| `ec-enc-jwe` | `CryptoFileUtilTest/ec.enc.jwe` |
| `ed25519-enc-pkcs8` | `CryptoFileUtilTest/ed25519.enc.pem.pkcs8` |
| `ed25519-enc-json` | `CryptoFileUtilTest/ed25519.enc.json` |
| `ed25519-enc-jwe` | `CryptoFileUtilTest/ed25519.enc.jwe` |
| `ed448-enc-json` | `CryptoFileUtilTest/ed448.enc.json` |
| `ed448-enc-jwe` | `CryptoFileUtilTest/ed448.enc.jwe` |
| `pem-rsa-encrypted` | `PemUtilTest/rsa-encrypted.pem` |
| `keystore-bcfks` | `CryptoFileUtilTest/keystore.bcfks` (not PKCS#12 **and** password unknown) |

If a `.p12` / `.pfx` later appears under testdata without a password recorded **in this file**, it is blocked.

## `given`

Each item is a one-key map.

| key | value | meaning |
|---|---|---|
| `appStarted` | `true` | Shell is up (Quick Start if no tabs) |
| `openStores` | list of store maps | Prefill tabs. Each map: `id`, `type` (`PKCS12`), `password` (`TEST_PASSWORD` or omitted for empty new), `dirty`, `path` (optional), `entries` (optional list of `{ alias, entryType }`) |
| `activeStore` | store `id` | Active tab |
| `selection` | list of aliases | Table selection |
| `buffer` | `empty` \| `copy` \| `cut` | Internal cut/copy buffer (not OS clipboard) |
| `osClipboard` | fixture id or string | System clipboard for examine/import-from-clipboard |
| `history` | `{ canUndo, canRedo }` | Session undo stack |
| `dialog` | dialog id or `null` | Already-open dialog (rare; prefer opening via `when`) |

Do not put Swing widget trees in `given`.

## `when` vocabulary

Every in-scope inventory action maps to exactly one command. Driver primitives (`cancel`, `selectEntries`, `selectTab`, `setClipboard`) are also frozen here.

Parameters are YAML maps. Omit optional keys. Passwords in YAML use `TEST_PASSWORD` or the literal `wrong` for the wrong-password oracle — never a guessed testdata secret.

### Driver primitives

| command | params | abortable | notes |
|---|---|---|---|
| `cancel` | `{}` | n/a | Dismiss the current dialog without applying. `then.errorId: cancelled` |
| `selectEntries` | `aliases: [string]` | no | Table selection. Empty list clears selection |
| `selectTab` | `id` or `index` | no | Active keystore tab |
| `setClipboard` | `fixture` or `text` | no | OS clipboard for examine/import CA reply |

### file (`NewAction` … `ExitAction`)

| command | inventory id | action | params | abortable |
|---|---|---|---|---|
| `newKeyStore` | `new` | `NewAction` | `type` (`PKCS12` only implemented; other radios are disabled stubs) | yes (type dialog) |
| `openKeyStore` | `open` | `OpenAction` | `path` or `fixture`; `password` | yes (file pick, password) |
| `closeKeyStore` | `close` | `CloseAction` | `saveDirty: true\|false` | yes (save prompt) |
| `closeAllKeyStores` | `close-all` | `CloseAllAction` | `saveDirty: true\|false` | yes |
| `closeOtherKeyStores` | `close-others` | `CloseOthersAction` | `saveDirty: true\|false` | yes |
| `saveKeyStore` | `save` | `SaveAction` | `password` if first save; may fall through to save-as | yes |
| `saveKeyStoreAs` | `save-as` | `SaveAsAction` | `path`; `password` | yes |
| `saveAllKeyStores` | `save-all` | `SaveAllAction` | `password` as needed | yes |
| `reloadKeyStore` | `reload` | `ReloadAction` | `password`; `discardDirty: true\|false` | yes |
| `exitApp` | `exit` | `ExitAction` | `saveDirty: true\|false` | yes (close-all) |

`NewAction` still presents the type dialog. SPA **implements** PKCS#12 only.

### generate

| command | inventory id | action | params | abortable |
|---|---|---|---|---|
| `generateKeyPair` | `generate-key-pair` | `GenerateKeyPairAction` | `algorithm` (`RSA` first); `keySize`; `alias`; `password` (store/entry) | yes |
| `generateSecretKey` | `generate-secret-key` | `GenerateSecretKeyAction` | `algorithm`; `keySize`; `alias` | yes |
| `generateDhParameters` | `generate-dh-parameters` | `GenerateDHParametersAction` | `size` | yes |
| `storePassphrase` | `store-passphrase` | `StorePassphraseAction` | `passphrase`; `alias` | yes |

Duplicate alias → `errorId: duplicateAlias`. Cancel type/alias/generate dialog → `cancelled`.

### import

| command | inventory id | action | params | abortable |
|---|---|---|---|---|
| `importTrustedCertificate` | `import-trusted-certificate` | `ImportTrustedCertificateAction` | `fixture` or `path`; `alias` | yes |
| `importKeyPair` | `import-key-pair` | `ImportKeyPairAction` | `fixture`; `password` if encrypted **and documented**; `alias` | yes |
| `importCaReplyFromFile` | `import-ca-reply-from-file` | `ImportCaReplyFromFileAction` | `fixture`; `password` if entry locked | yes |
| `importCaReplyFromClipboard` | `import-ca-reply-from-clipboard` | `ImportCaReplyFromClipboardAction` | uses `osClipboard`; `password` if locked | yes |

Encrypted import fixtures without a documented password are `blocked`.

### delete-rename

Selection (`selectEntries`) chooses which inventory action the driver is exercising. YAML still sets `action:` to the specific class.

| command | inventory ids | actions | params | abortable |
|---|---|---|---|---|
| `deleteEntry` | `delete-key`, `delete-key-pair`, `delete-trusted-certificate`, `delete-multiple-entries` | `DeleteKeyAction`, `DeleteKeyPairAction`, `DeleteTrustedCertificateAction`, `DeleteMultipleEntriesAction` | `confirm: true\|false` (false = cancel) | yes |
| `renameEntry` | `rename-key`, `rename-key-pair`, `rename-trusted-certificate` | `RenameKeyAction`, `RenameKeyPairAction`, `RenameTrustedCertificateAction` | `newAlias`; `password` if required | yes |

### details

| command | inventory ids | params | abortable |
|---|---|---|---|
| `openDetails` | `key-details`, `key-pair-certificate-chain-details`, `key-pair-private-key-details`, `key-pair-public-key-details`, `trusted-certificate-details`, `trusted-certificate-public-key-details`, `selected-certificates-chain-details` | `kind`: `key` \| `keyPairChain` \| `keyPairPrivateKey` \| `keyPairPublicKey` \| `trustedCertificate` \| `trustedCertificatePublicKey` \| `selectedCertificatesChain`; `password` if unlocking | yes (password) |

Map `action:` to the matching `*DetailsAction`. Close with `cancel` (read-only dismiss).

### export

| command | inventory id | action | params | abortable |
|---|---|---|---|---|
| `exportCsv` | `export-csv` | `ExportCsvAction` | `path` | yes |
| `exportKeyPair` | `export-key-pair` | `ExportKeyPairAction` | `path`; `format`; `password` | yes |
| `exportCertificate` | `export-key-pair-certificate-chain`, `export-trusted-certificate`, `export-selected-certificates` | `ExportKeyPairCertificateChainAction`, `ExportTrustedCertificateAction`, `ExportSelectedCertificatesAction` | `path`; `format`; `source` (`chain` \| `trusted` \| `selected`) | yes |
| `exportPrivateKey` | `export-key-pair-private-key` | `ExportKeyPairPrivateKeyAction` | `path`; `format`; `password` | yes |
| `exportPublicKey` | `export-key-pair-public-key`, `export-trusted-certificate-public-key` | `ExportKeyPairPublicKeyAction`, `ExportTrustedCertificatePublicKeyAction` | `path`; `format`; `source` (`keyPair` \| `trusted`) | yes |

Exported bytes: `fileExists`. Do not assert JCA encoding equality.

### sign

| command | inventory id | action | params | abortable |
|---|---|---|---|---|
| `generateCsr` | `generate-csr` | `GenerateCsrAction` | `path`; `format`; `password` | yes |
| `signCsr` | `sign-csr` | `SignCsrAction` | `fixture`; `path`; `password` | yes |
| `signFile` | `sign-file` | `SignFileAction` | `fixture`; `path`; `password` | yes |
| `signJar` | `sign-jar` | `SignJarAction` | `fixture`; `path`; `password` | yes |
| `signJwt` | `sign-jwt` | `SignJwtAction` | claims map; `password` | yes |
| `signCrl` | `sign-crl` | `SignCrlAction` | `path`; `password` | yes |
| `signMidlet` | `sign-midlet` | `SignMidletAction` | `jad`; `jar`; `password` | yes |
| `signNewKeyPair` | `sign-new-key-pair` | `SignNewKeyPairAction` | same as `generateKeyPair` plus issuer from selection; `alias` | yes |

### verify-sig

| command | inventory id | action | params | abortable |
|---|---|---|---|---|
| `verifyCertificate` | `verify-certificate` | `VerifyCertificateAction` | selection; optional trust options | yes |
| `verifyJar` | `verify-jar` | `VerifyJarAction` | `fixture` | yes |
| `verifySignature` | `verify-signature` | `VerifySignatureAction` | `signature`; `content` if detached | yes |

### examine

| command | inventory id | action | params | abortable |
|---|---|---|---|---|
| `examineFile` | `examine-file` | `ExamineFileAction` | `fixture` or `path`; `password` only if **documented** | yes |
| `examineClipboard` | `examine-clipboard` | `ExamineClipboardAction` | uses `osClipboard`; `password` if documented | yes |
| `examineSsl` | `examine-ssl` | `ExamineSslAction` | `host`; `port`; optional client store | yes |
| `detectFileType` | `detect-file-type` | `DetectFileTypeAction` | `fixture` | yes |

### clipboard

| command | inventory id | action | params | abortable |
|---|---|---|---|---|
| `copy` | `copy` | `CopyAction` | selection | no |
| `copyKeyPair` | `copy-key-pair` | `CopyKeyPairAction` | selection (delegates to copy) | no |
| `copyTrustedCertificate` | `copy-trusted-certificate` | `CopyTrustedCertificateAction` | selection | no |
| `cut` | `cut` | `CutAction` | selection | no (failure dialog only) |
| `cutKeyPair` | `cut-key-pair` | `CutKeyPairAction` | selection | no |
| `cutTrustedCertificate` | `cut-trusted-certificate` | `CutTrustedCertificateAction` | selection | no |
| `paste` | `paste` | `PasteAction` | `replaceExisting: true\|false` on duplicate alias | yes (replace confirm) |

Internal `buffer` is not the OS clipboard. `clipboardContains` is for OS clipboard / exported text (see ORACLES.md).

### chain

| command | inventory id | action | params | abortable |
|---|---|---|---|---|
| `appendToCertificateChain` | `append-to-certificate-chain` | `AppendToCertificateChainAction` | `fixture`; `password` | yes |
| `removeFromCertificateChain` | `remove-from-certificate-chain` | `RemoveFromCertificateChainAction` | `password`; `confirm` | yes |

### session

| command | inventory id | action | params | abortable |
|---|---|---|---|---|
| `undo` | `undo` | `UndoAction` | `{}` | no |
| `redo` | `redo` | `RedoAction` | `{}` | no |
| `find` | `find` | `FindAction` | `query` | yes |
| `compareCertificate` | `compare-certificate` | `CompareCertificateAction` | two selected aliases | no |
| `properties` | `properties` | `PropertiesAction` | `{}` | no |
| `setPassword` | `set-password` | `SetPasswordAction` | `newPassword`; `confirm` | yes |
| `setKeyPassword` | `set-key-password` | `SetKeyPasswordAction` | `oldPassword`; `newPassword` | yes |
| `setKeyPairPassword` | `set-key-pair-password` | `SetKeyPairPasswordAction` | `oldPassword`; `newPassword` | yes |
| `unlockKey` | `unlock-key` | `UnlockKeyAction` | `password` | yes |
| `unlockKeyPair` | `unlock-key-pair` | `UnlockKeyPairAction` | `password` | yes |
| `changeType` | `change-type` | `ChangeTypeAction` | `type: PKCS12` only implemented; other targets are disabled stubs | yes |
| `convertToJavaP12` | `convert-to-java-p12` | `ConvertToJavaP12Action` | `confirm` | yes |
| `openCaCertificates` | `open-ca-certificates` | `OpenCaCertificatesAction` | `password` if file exists; may `newKeyStore` PKCS#12 | yes |
| `authorityCertificates` | `authority-certificates` | `AuthorityCertificatesAction` | internal trust load; `password` if protected | yes |
| `authorityCertificatesVerify` | `authority-certificates-verify` | `AuthorityCertificatesVerifyAction` | internal; optional CA/Windows roots unused in SPA | no |

PKCS#12 entries share the store password (no independent entry password). `unlock*` / `setKey*Password` still exist in the shell; YAML covers the dialog + `errorId` when the store reports the entry locked or the password is wrong.

### chrome

| command | inventory id | action | params | abortable |
|---|---|---|---|---|
| `about` | `about` | `AboutAction` | `{}` | yes (dismiss) |
| `jars` | `jars` | `JarsAction` | `{}` | yes |
| `securityProviders` | `security-providers` | `SecurityProvidersAction` | `{}` | yes |
| `systemInformation` | `system-information` | `SystemInformationAction` | `{}` | yes |
| `checkUpdate` | `check-update` | `CheckUpdateAction` | `{}` | yes |

## Inventory id → `when` (complete)

Every **in-scope** SCOPE.md row. Out-of-scope rows have no command.

| inventory id | when |
|---|---|
| about | `about` |
| append-to-certificate-chain | `appendToCertificateChain` |
| authority-certificates | `authorityCertificates` |
| authority-certificates-verify | `authorityCertificatesVerify` |
| change-type | `changeType` |
| check-update | `checkUpdate` |
| close | `closeKeyStore` |
| close-all | `closeAllKeyStores` |
| close-others | `closeOtherKeyStores` |
| compare-certificate | `compareCertificate` |
| convert-to-java-p12 | `convertToJavaP12` |
| copy | `copy` |
| copy-key-pair | `copyKeyPair` |
| copy-trusted-certificate | `copyTrustedCertificate` |
| cut | `cut` |
| cut-key-pair | `cutKeyPair` |
| cut-trusted-certificate | `cutTrustedCertificate` |
| delete-key | `deleteEntry` |
| delete-key-pair | `deleteEntry` |
| delete-multiple-entries | `deleteEntry` |
| delete-trusted-certificate | `deleteEntry` |
| detect-file-type | `detectFileType` |
| examine-clipboard | `examineClipboard` |
| examine-file | `examineFile` |
| examine-ssl | `examineSsl` |
| exit | `exitApp` |
| export-csv | `exportCsv` |
| export-key-pair | `exportKeyPair` |
| export-key-pair-certificate-chain | `exportCertificate` |
| export-key-pair-private-key | `exportPrivateKey` |
| export-key-pair-public-key | `exportPublicKey` |
| export-selected-certificates | `exportCertificate` |
| export-trusted-certificate | `exportCertificate` |
| export-trusted-certificate-public-key | `exportPublicKey` |
| find | `find` |
| generate-csr | `generateCsr` |
| generate-dh-parameters | `generateDhParameters` |
| generate-key-pair | `generateKeyPair` |
| generate-secret-key | `generateSecretKey` |
| import-ca-reply-from-clipboard | `importCaReplyFromClipboard` |
| import-ca-reply-from-file | `importCaReplyFromFile` |
| import-key-pair | `importKeyPair` |
| import-trusted-certificate | `importTrustedCertificate` |
| jars | `jars` |
| key-details | `openDetails` |
| key-pair-certificate-chain-details | `openDetails` |
| key-pair-private-key-details | `openDetails` |
| key-pair-public-key-details | `openDetails` |
| new | `newKeyStore` |
| open | `openKeyStore` |
| open-ca-certificates | `openCaCertificates` |
| paste | `paste` |
| properties | `properties` |
| redo | `redo` |
| reload | `reloadKeyStore` |
| remove-from-certificate-chain | `removeFromCertificateChain` |
| rename-key | `renameEntry` |
| rename-key-pair | `renameEntry` |
| rename-trusted-certificate | `renameEntry` |
| save | `saveKeyStore` |
| save-all | `saveAllKeyStores` |
| save-as | `saveKeyStoreAs` |
| security-providers | `securityProviders` |
| selected-certificates-chain-details | `openDetails` |
| set-key-pair-password | `setKeyPairPassword` |
| set-key-password | `setKeyPassword` |
| set-password | `setPassword` |
| sign-crl | `signCrl` |
| sign-csr | `signCsr` |
| sign-file | `signFile` |
| sign-jar | `signJar` |
| sign-jwt | `signJwt` |
| sign-midlet | `signMidlet` |
| sign-new-key-pair | `signNewKeyPair` |
| store-passphrase | `storePassphrase` |
| system-information | `systemInformation` |
| trusted-certificate-details | `openDetails` |
| trusted-certificate-public-key-details | `openDetails` |
| undo | `undo` |
| unlock-key | `unlockKey` |
| unlock-key-pair | `unlockKeyPair` |
| verify-certificate | `verifyCertificate` |
| verify-jar | `verifyJar` |
| verify-signature | `verifySignature` |

Out of scope (no `when`, no YAML): `help`, `tip-of-the-day`, `show-hide-tool-bar`, `show-hide-status-bar`, `tab-style-wrap`, `tab-style-scroll`, `website`, `preferences`, `open-pkcs11`, `open-windows-my`, `open-windows-root`, `open-apple-keychain`, `open-default`, `open-ms-capi`.

## `then`

See [ORACLES.md](ORACLES.md). Required names: `aliases`, `entryType`, `entryCount`, `dirty`, `fileExists`, `reopenSucceeds`, `errorId`, `dialogShown`, `clipboardContains`. Additional user-visible keys listed there are also frozen.

## Mutating-flow oracle requirement

Every mutating `when` (create/open-with-password/save/generate/import/delete/rename/export-that-prompts/sign/cut/paste/chain/set-password/unlock/change-type/convert) must have YAML (on the slice ticket, not here) covering:

1. Happy path.
2. Cancel (`cancel` or `confirm: false`) → no store mutation; `errorId: cancelled`.
3. One representative error: `wrongPassword` and/or `duplicateAlias` as the action allows.

Wrong password is required whenever the action shows a password dialog.

## Ownership

| File | Owner |
|---|---|
| `functional-tests/schema.md` | P3.schema (this ticket) |
| `functional-tests/control-ids.md` | P3.schema |
| `functional-tests/ORACLES.md` | P3.schema |
| `functional-tests/STATUS.md` | P3.schema |
| `functional-tests/flows/<slice>/*.yaml` | `P3.yaml.<slice>` only — do not add in this ticket |
