# Rewrite scope

**Status: proposal.** Human must change this to `Status: signed` before Phase 3/4. Inventory recrawled Swing for this PR; do not treat a copied tree as signed.

Full Swing → React rewrite of **in-scope** PKCS#12 SPA-capable actions. There is no MVP subset. Out-of-scope rows stay out because they cannot run in a self-contained PKCS#12 browser SPA ([ARCH.md](ARCH.md)), not because they are “later.”

Wrong password, cancel, and duplicate-alias remain required oracles on every mutating flow.

## In scope (must port)

PKCS#12 file and entry workflows that Swing exposes and the kernel can implement in-browser.

| Slice | Inventory ids |
|---|---|
| kernel | (no action class) PKCS#12 create/load/save, key-generation primitives, password fail — owned by `P4.kernel`, not File YAML |
| file | `new`, `open`, `close`, `close-all`, `close-others`, `save`, `save-as`, `save-all`, `reload`, `exit` — **and** the shell plugin host (full menubar stubs, glob loader, session `apply`, dialog host) |
| generate | `generate-key-pair`, `generate-secret-key`, `generate-dh-parameters`, `store-passphrase` |
| import | `import-trusted-certificate`, `import-key-pair`, `import-ca-reply-from-file`, `import-ca-reply-from-clipboard` |
| delete-rename | `delete-key`, `delete-key-pair`, `delete-multiple-entries`, `delete-trusted-certificate`, `rename-key`, `rename-key-pair`, `rename-trusted-certificate` |
| details | `key-details`, `key-pair-certificate-chain-details`, `key-pair-private-key-details`, `key-pair-public-key-details`, `trusted-certificate-details`, `trusted-certificate-public-key-details`, `selected-certificates-chain-details` |
| export | `export-csv`, `export-key-pair`, `export-key-pair-certificate-chain`, `export-key-pair-private-key`, `export-key-pair-public-key`, `export-selected-certificates`, `export-trusted-certificate`, `export-trusted-certificate-public-key` |
| sign | `sign-csr`, `sign-file`, `sign-jar`, `sign-jwt`, `sign-crl`, `sign-midlet`, `sign-new-key-pair`, `generate-csr` |
| verify-sig | `verify-certificate`, `verify-jar`, `verify-signature` |
| examine | `examine-file`, `examine-clipboard`, `examine-ssl`, `detect-file-type` |
| clipboard | `copy`, `copy-key-pair`, `copy-trusted-certificate`, `cut`, `cut-key-pair`, `cut-trusted-certificate`, `paste` |
| chain | `append-to-certificate-chain`, `remove-from-certificate-chain` |
| session | `undo`, `redo`, `find`, `compare-certificate`, `properties`, `set-password`, `set-key-password`, `set-key-pair-password`, `unlock-key`, `unlock-key-pair`, `change-type`, `convert-to-java-p12`, `open-ca-certificates`, `authority-certificates`, `authority-certificates-verify` — fills File session stubs (undo/history/password); does not replace the plugin host |
| chrome | `about`, `jars`, `security-providers`, `system-information`, `check-update` |

`NewAction` still presents `DNewKeyStoreType`. The SPA only **implements** PKCS#12; other type radio items stay disabled stubs in the File shell.

`ChangeTypeAction` is in session so the host can keep the Tools > Change KeyStore Type menu. Non-PKCS#12 target types stay disabled; there is no second store format in the kernel.

## Out of scope (never a slice)

| Tag / area | Why | Inventory ids |
|---|---|---|
| `platform` | PKCS#11, Windows-MY/ROOT, Apple Keychain, JVM default store — not available in a browser SPA | `open-pkcs11`, `open-windows-my`, `open-windows-root`, `open-apple-keychain`, `open-default`, `open-ms-capi` |
| `skip` | Help website, tip of the day, toolbar/status-bar hide, tab wrap/scroll | `help`, `tip-of-the-day`, `show-hide-tool-bar`, `show-hide-status-bar`, `tab-style-wrap`, `tab-style-scroll`, `website` |
| Preferences / L&F | Look-and-feel prefs are Swing-specific (`DPreferences`) | `preferences` |
| JCA / BouncyCastle bag-for-bag PKCS#12 | [ARCH.md](ARCH.md); kernel round-trips its own bytes | (not an action row) |
| Java sidecar / remote crypto | Rewrite stays self-contained | (not an action row) |

Disabled menu items may remain in the shell for out-of-scope entries. Do not implement those flows.

## Every inventory row → slice or out reason

| id | mapping |
|---|---|
| about | in: chrome |
| append-to-certificate-chain | in: chain |
| authority-certificates | in: session |
| authority-certificates-verify | in: session |
| change-type | in: session (PKCS#12-only target; other types disabled stubs) |
| check-update | in: chrome |
| close | in: file |
| close-all | in: file |
| close-others | in: file |
| compare-certificate | in: session |
| convert-to-java-p12 | in: session |
| copy | in: clipboard |
| copy-key-pair | in: clipboard |
| copy-trusted-certificate | in: clipboard |
| cut | in: clipboard |
| cut-key-pair | in: clipboard |
| cut-trusted-certificate | in: clipboard |
| delete-key | in: delete-rename |
| delete-key-pair | in: delete-rename |
| delete-multiple-entries | in: delete-rename |
| delete-trusted-certificate | in: delete-rename |
| detect-file-type | in: examine |
| examine-clipboard | in: examine |
| examine-file | in: examine |
| examine-ssl | in: examine |
| exit | in: file |
| export-csv | in: export |
| export-key-pair | in: export |
| export-key-pair-certificate-chain | in: export |
| export-key-pair-private-key | in: export |
| export-key-pair-public-key | in: export |
| export-selected-certificates | in: export |
| export-trusted-certificate | in: export |
| export-trusted-certificate-public-key | in: export |
| find | in: session |
| generate-csr | in: sign |
| generate-dh-parameters | in: generate |
| generate-key-pair | in: generate |
| generate-secret-key | in: generate |
| help | out: skip (help website) |
| import-ca-reply-from-clipboard | in: import |
| import-ca-reply-from-file | in: import |
| import-key-pair | in: import |
| import-trusted-certificate | in: import |
| jars | in: chrome |
| key-details | in: details |
| key-pair-certificate-chain-details | in: details |
| key-pair-private-key-details | in: details |
| key-pair-public-key-details | in: details |
| new | in: file |
| open | in: file |
| open-apple-keychain | out: platform (Apple Keychain) |
| open-ca-certificates | in: session |
| open-default | out: platform (JVM default store) |
| open-ms-capi | out: platform (MS CAPI base) |
| open-pkcs11 | out: platform (PKCS#11) |
| open-windows-my | out: platform (Windows-MY) |
| open-windows-root | out: platform (Windows-ROOT) |
| paste | in: clipboard |
| preferences | out: Look-and-Feel prefs (`DPreferences`) |
| properties | in: session |
| redo | in: session |
| reload | in: file |
| remove-from-certificate-chain | in: chain |
| rename-key | in: delete-rename |
| rename-key-pair | in: delete-rename |
| rename-trusted-certificate | in: delete-rename |
| save | in: file |
| save-all | in: file |
| save-as | in: file |
| security-providers | in: chrome |
| selected-certificates-chain-details | in: details |
| set-key-pair-password | in: session |
| set-key-password | in: session |
| set-password | in: session |
| show-hide-status-bar | out: skip (status-bar hide) |
| show-hide-tool-bar | out: skip (toolbar hide) |
| sign-crl | in: sign |
| sign-csr | in: sign |
| sign-file | in: sign |
| sign-jar | in: sign |
| sign-jwt | in: sign |
| sign-midlet | in: sign |
| sign-new-key-pair | in: sign |
| store-passphrase | in: generate |
| system-information | in: chrome |
| tab-style-scroll | out: skip (tab scroll) |
| tab-style-wrap | out: skip (tab wrap) |
| tip-of-the-day | out: skip (tip of the day) |
| trusted-certificate-details | in: details |
| trusted-certificate-public-key-details | in: details |
| undo | in: session |
| unlock-key | in: session |
| unlock-key-pair | in: session |
| verify-certificate | in: verify-sig |
| verify-jar | in: verify-sig |
| verify-signature | in: verify-sig |
| website | out: skip (help/website links) |

## Sign-off

- [ ] Product/design owner confirms in-scope vs out-of-scope.
- [ ] Engineering owner accepts in-browser PKCS#12 (not JCA parity); dummy store is rejected.
- [ ] Test-generation owner will cover every in-scope slice (happy, cancel if abortable, one error).
