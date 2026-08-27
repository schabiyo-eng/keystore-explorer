# Control ids (`data-testid`)

Frozen `logical.dot.path` values. The File plugin host renders **every** in-scope menubar/toolbar item with these ids. Items stay **disabled** until a feature module registers a command. Later slices must not add rows or rename ids.

Aligns with `.cursor/discovery/UI.md`. Drivers select by these ids (and accessible names). Do not select by toolkit class names.

Format: one id per row. `until` = slice that registers the command (`file` host always paints the control). `stub` = out-of-scope platform/skip item that SCOPE keeps in the shell, always disabled, **no YAML**.

## Frame / shell (File host)

| data-testid | until | notes |
|---|---|---|
| `app.frame` | file | Main window |
| `app.menubar` | file | File Edit View Tools Examine Help |
| `app.toolbar` | file | Non-floatable icon toolbar |
| `app.status-bar` | file | Bottom status line; hide/show is skip (stub menu only) |
| `app.quickstart` | file | Shown when no keystore is open |
| `app.dialog-host` | file | Single modal host; features register dialog ids |
| `app.tabs` | file | Tab strip when ≥1 store is open |
| `keystore.tab.active` | file | Active tab; dirty marked |
| `keystore.table` | file | Entry table (UI.md default columns) |
| `keystore.table.col.type` | file | Key pair / trusted cert / key |
| `keystore.table.col.lock` | file | Lock status |
| `keystore.table.col.expiry-status` | file | Cert expiry status |
| `keystore.table.col.alias` | file | Entry name |
| `keystore.table.col.algorithm` | file | Algorithm |
| `keystore.table.col.key-size` | file | Key size |
| `keystore.table.col.cert-expiry` | file | Certificate expiry |
| `keystore.table.col.last-modified` | file | Last modified |

## Quick Start

| data-testid | until | notes |
|---|---|---|
| `quickstart.new` | file | New shortcut |
| `quickstart.open` | file | Open shortcut |
| `quickstart.open-ca-certificates` | session | In-scope; disabled until session |
| `quickstart.examine-file` | examine | Examine File shortcut |
| `quickstart.open-default` | stub | JVM default store; always disabled |
| `quickstart.help` | stub | Help website; always disabled |

## Menubar — File

| data-testid | until | notes |
|---|---|---|
| `menu.file` | file | Menu |
| `menu.file.new` | file | New |
| `menu.file.open` | file | Open |
| `menu.file.open-special` | file | Submenu present; children mostly stubs |
| `menu.file.open-special.ca-certificates` | session | CA Certificates |
| `menu.file.open-special.default` | stub | Default KeyStore |
| `menu.file.open-special.pkcs11` | stub | PKCS#11 |
| `menu.file.open-special.windows-my` | stub | Windows-MY |
| `menu.file.open-special.windows-root` | stub | Windows-ROOT |
| `menu.file.open-special.apple-keychain` | stub | Apple Keychain |
| `menu.file.reload` | file | Reload |
| `menu.file.close` | file | Close |
| `menu.file.close-all` | file | Close All |
| `menu.file.save` | file | Save |
| `menu.file.save-as` | file | Save As |
| `menu.file.save-all` | file | Save All |
| `menu.file.recent-files` | file | Recent files submenu |
| `menu.file.exit` | file | Exit |

Close Others is tab-context only (`context.tab.close-others`).

## Menubar — Edit

| data-testid | until | notes |
|---|---|---|
| `menu.edit` | file | Menu |
| `menu.edit.undo` | session | Undo |
| `menu.edit.redo` | session | Redo |
| `menu.edit.cut` | clipboard | Cut |
| `menu.edit.copy` | clipboard | Copy |
| `menu.edit.paste` | clipboard | Paste |
| `menu.edit.compare` | session | Compare |
| `menu.edit.find` | session | Find |

## Menubar — View (skip stubs; menu stays in shell)

| data-testid | until | notes |
|---|---|---|
| `menu.view` | file | Menu present |
| `menu.view.tool-bar` | stub | Show/hide toolbar |
| `menu.view.status-bar` | stub | Show/hide status bar |
| `menu.view.tab-style` | stub | Submenu |
| `menu.view.tab-style.wrap` | stub | Wrap |
| `menu.view.tab-style.scroll` | stub | Scroll |

## Menubar — Tools

| data-testid | until | notes |
|---|---|---|
| `menu.tools` | file | Menu |
| `menu.tools.generate-key-pair` | generate | Generate Key Pair |
| `menu.tools.generate-secret-key` | generate | Generate Secret Key |
| `menu.tools.generate-dh-parameters` | generate | Generate DH Parameters |
| `menu.tools.import-trusted-certificate` | import | Import Trusted Certificate |
| `menu.tools.import-key-pair` | import | Import Key Pair |
| `menu.tools.store-passphrase` | generate | Store Passphrase |
| `menu.tools.verify-signature` | verify-sig | Verify Signature |
| `menu.tools.verify-jar` | verify-sig | Verify JAR |
| `menu.tools.set-password` | session | Set KeyStore Password |
| `menu.tools.change-type` | session | Change KeyStore Type submenu |
| `menu.tools.change-type.pkcs12` | session | PKCS#12 (only implemented target) |
| `menu.tools.change-type.jceks` | stub | JCEKS |
| `menu.tools.change-type.jks` | stub | JKS |
| `menu.tools.change-type.bks` | stub | BKS |
| `menu.tools.change-type.uber` | stub | UBER |
| `menu.tools.change-type.bcfks` | stub | BCFKS |
| `menu.tools.change-type.pem` | stub | PEM |
| `menu.tools.change-type.kdb` | stub | KDB |
| `menu.tools.properties` | session | Properties |
| `menu.tools.export-csv` | export | Export KeyStore as CSV |
| `menu.tools.preferences` | stub | Preferences / L&F |

## Menubar — Examine

| data-testid | until | notes |
|---|---|---|
| `menu.examine` | file | Menu |
| `menu.examine.file` | examine | Examine File |
| `menu.examine.clipboard` | examine | Examine Clipboard |
| `menu.examine.ssl` | examine | Examine SSL |
| `menu.examine.detect-file-type` | examine | Detect File Type |

## Menubar — Help

| data-testid | until | notes |
|---|---|---|
| `menu.help` | file | Menu |
| `menu.help.help` | stub | Help website |
| `menu.help.tip-of-the-day` | stub | Tip of the day |
| `menu.help.online-resources` | stub | Submenu (website/GitHub/tracker) |
| `menu.help.online-resources.website` | stub | Website |
| `menu.help.online-resources.github` | stub | GitHub |
| `menu.help.online-resources.issue-tracker` | stub | Issue tracker |
| `menu.help.check-update` | chrome | Check for Updates |
| `menu.help.security-providers` | chrome | Security Providers |
| `menu.help.jars` | chrome | JARs |
| `menu.help.system-information` | chrome | System Information |
| `menu.help.about` | chrome | About |

## Toolbar

Order matches `KseFrame.initToolBar` (groups + separators).

| data-testid | until | notes |
|---|---|---|
| `toolbar.new` | file | New |
| `toolbar.open` | file | Open |
| `toolbar.save` | file | Save |
| `toolbar.undo` | session | Undo |
| `toolbar.redo` | session | Redo |
| `toolbar.cut` | clipboard | Cut |
| `toolbar.copy` | clipboard | Copy |
| `toolbar.paste` | clipboard | Paste |
| `toolbar.generate-key-pair` | generate | Generate Key Pair |
| `toolbar.generate-secret-key` | generate | Generate Secret Key |
| `toolbar.import-trusted-certificate` | import | Import Trusted Certificate |
| `toolbar.import-key-pair` | import | Import Key Pair |
| `toolbar.verify-signature` | verify-sig | Verify Signature |
| `toolbar.verify-jar` | verify-sig | Verify JAR |
| `toolbar.set-password` | session | Set KeyStore Password |
| `toolbar.properties` | session | Properties |
| `toolbar.export-csv` | export | Export CSV |
| `toolbar.examine-file` | examine | Examine File |
| `toolbar.examine-clipboard` | examine | Examine Clipboard |
| `toolbar.examine-ssl` | examine | Examine SSL |
| `toolbar.help` | stub | HelpAction on toolbar |

## Tab context menu

| data-testid | until | notes |
|---|---|---|
| `context.tab` | file | Tab popup |
| `context.tab.save` | file | Save |
| `context.tab.save-all` | file | Save All |
| `context.tab.paste` | clipboard | Paste |
| `context.tab.close` | file | Close |
| `context.tab.close-others` | file | Close Others |
| `context.tab.close-all` | file | Close All |
| `context.tab.properties` | session | Properties |
| `context.tab.export-csv` | export | Export CSV |

## Keystore (empty-table) context menu

| data-testid | until | notes |
|---|---|---|
| `context.keystore` | file | Background popup |
| `context.keystore.generate-key-pair` | generate | Generate Key Pair |
| `context.keystore.generate-secret-key` | generate | Generate Secret Key |
| `context.keystore.import-trusted-certificate` | import | Import Trusted Certificate |
| `context.keystore.import-key-pair` | import | Import Key Pair |
| `context.keystore.store-passphrase` | generate | Store Passphrase |
| `context.keystore.verify-signature` | verify-sig | Verify Signature |
| `context.keystore.verify-jar` | verify-sig | Verify JAR |
| `context.keystore.set-password` | session | Set Password |
| `context.keystore.change-type` | session | Change Type submenu |
| `context.keystore.change-type.pkcs12` | session | PKCS#12 |
| `context.keystore.change-type.jceks` | stub | JCEKS |
| `context.keystore.change-type.jks` | stub | JKS |
| `context.keystore.change-type.bks` | stub | BKS |
| `context.keystore.change-type.uber` | stub | UBER |
| `context.keystore.change-type.bcfks` | stub | BCFKS |
| `context.keystore.change-type.pem` | stub | PEM |
| `context.keystore.change-type.kdb` | stub | KDB |
| `context.keystore.properties` | session | Properties |
| `context.keystore.export-csv` | export | Export CSV |

## Key Pair context menu

| data-testid | until | notes |
|---|---|---|
| `context.keypair` | file | Popup |
| `context.keypair.details` | details | View Details submenu |
| `context.keypair.details.certificate-chain` | details | Certificate Chain |
| `context.keypair.details.private-key` | details | Private Key |
| `context.keypair.details.public-key` | details | Public Key |
| `context.keypair.cut` | clipboard | Cut |
| `context.keypair.copy` | clipboard | Copy |
| `context.keypair.export` | export | Export submenu |
| `context.keypair.export.key-pair` | export | Export Key Pair |
| `context.keypair.export.certificate-chain` | export | Export Certificate Chain |
| `context.keypair.export.private-key` | export | Export Private Key |
| `context.keypair.export.public-key` | export | Export Public Key |
| `context.keypair.generate-csr` | sign | Generate CSR |
| `context.keypair.verify-certificate` | verify-sig | Verify Certificate |
| `context.keypair.import-ca-reply` | import | Import CA Reply submenu |
| `context.keypair.import-ca-reply.from-file` | import | From File |
| `context.keypair.import-ca-reply.from-clipboard` | import | From Clipboard |
| `context.keypair.edit-chain` | chain | Edit Certificate Chain submenu |
| `context.keypair.edit-chain.append` | chain | Append Certificate |
| `context.keypair.edit-chain.remove` | chain | Remove Certificate |
| `context.keypair.sign` | sign | Sign submenu |
| `context.keypair.sign.csr` | sign | CSR |
| `context.keypair.sign.file` | sign | File |
| `context.keypair.sign.jar` | sign | JAR |
| `context.keypair.sign.jwt` | sign | JWT |
| `context.keypair.sign.crl` | sign | CRL |
| `context.keypair.sign.midlet` | sign | MIDlet |
| `context.keypair.sign.new-key-pair` | sign | New Key Pair |
| `context.keypair.unlock` | session | Unlock |
| `context.keypair.set-password` | session | Set Password |
| `context.keypair.delete` | delete-rename | Delete |
| `context.keypair.rename` | delete-rename | Rename |

## Trusted Certificate context menu

| data-testid | until | notes |
|---|---|---|
| `context.trusted` | file | Popup |
| `context.trusted.details` | details | View Details submenu |
| `context.trusted.details.certificate` | details | Certificate |
| `context.trusted.details.public-key` | details | Public Key |
| `context.trusted.cut` | clipboard | Cut |
| `context.trusted.copy` | clipboard | Copy |
| `context.trusted.export` | export | Export submenu |
| `context.trusted.export.certificate` | export | Export Certificate |
| `context.trusted.export.public-key` | export | Export Public Key |
| `context.trusted.verify-certificate` | verify-sig | Verify Certificate |
| `context.trusted.delete` | delete-rename | Delete |
| `context.trusted.rename` | delete-rename | Rename |

## Key context menu

| data-testid | until | notes |
|---|---|---|
| `context.key` | file | Popup |
| `context.key.details` | details | Details |
| `context.key.cut` | clipboard | Cut |
| `context.key.copy` | clipboard | Copy |
| `context.key.unlock` | session | Unlock |
| `context.key.set-password` | session | Set Password |
| `context.key.delete` | delete-rename | Delete |
| `context.key.rename` | delete-rename | Rename |

## Multi-entry context menu

| data-testid | until | notes |
|---|---|---|
| `context.multi` | file | Popup |
| `context.multi.details` | details | Details |
| `context.multi.cut` | clipboard | Cut |
| `context.multi.copy` | clipboard | Copy |
| `context.multi.delete` | delete-rename | Delete |
| `context.multi.compare` | session | Compare |
| `context.multi.export` | export | Export selected certificates |
| `context.multi.unlock` | session | Unlock |

## Shared dialogs (dialog host)

OK / Cancel on every abortable dialog. Password manager / stash controls are not SPA product; omit.

| data-testid | until | notes |
|---|---|---|
| `dialog.new-keystore` | file | Type picker (`NewAction`) |
| `dialog.new-keystore.type.pkcs12` | file | Implemented radio |
| `dialog.new-keystore.type.jceks` | stub | Disabled radio |
| `dialog.new-keystore.type.jks` | stub | Disabled radio |
| `dialog.new-keystore.type.bks` | stub | Disabled radio |
| `dialog.new-keystore.type.uber` | stub | Disabled radio |
| `dialog.new-keystore.type.bcfks` | stub | Disabled radio |
| `dialog.new-keystore.type.pem` | stub | Disabled radio |
| `dialog.new-keystore.type.kdb` | stub | Disabled radio |
| `dialog.new-keystore.ok` | file | OK |
| `dialog.new-keystore.cancel` | file | Cancel |
| `dialog.password` | file | Unlock / open password |
| `dialog.password.value` | file | Password field |
| `dialog.password.ok` | file | OK |
| `dialog.password.cancel` | file | Cancel |
| `dialog.new-password` | file | First save / set store password |
| `dialog.new-password.value` | file | Password |
| `dialog.new-password.confirm` | file | Confirm |
| `dialog.new-password.ok` | file | OK |
| `dialog.new-password.cancel` | file | Cancel |
| `dialog.change-password` | session | Entry password change |
| `dialog.change-password.old` | session | Current password |
| `dialog.change-password.value` | session | New password |
| `dialog.change-password.confirm` | session | Confirm |
| `dialog.change-password.ok` | session | OK |
| `dialog.change-password.cancel` | session | Cancel |
| `dialog.alias` | generate | Alias entry (generate/import/rename) |
| `dialog.alias.value` | generate | Alias field (`generateKeyPair.alias` is an alias of this id — use **this** id) |
| `generateKeyPair.alias` | generate | Same node as `dialog.alias.value` during generate key pair |
| `dialog.alias.ok` | generate | OK |
| `dialog.alias.cancel` | generate | Cancel |
| `dialog.confirm` | file | Confirm delete / replace / discard |
| `dialog.confirm.ok` | file | Confirm |
| `dialog.confirm.cancel` | file | Cancel |
| `dialog.file-open` | file | Open-file prompt (tests pass fixture paths) |
| `dialog.file-open.ok` | file | Approve |
| `dialog.file-open.cancel` | file | Cancel |
| `dialog.file-save` | file | Save-as / export path |
| `dialog.file-save.path` | file | Destination |
| `dialog.file-save.ok` | file | Approve |
| `dialog.file-save.cancel` | file | Cancel |
| `dialog.problem` | file | Password/load problem |
| `dialog.problem.ok` | file | Dismiss |
| `dialog.error` | file | Error |
| `dialog.error.ok` | file | Dismiss |

`generateKeyPair.alias` is listed because migrate cookbook cites it; it **is** `dialog.alias.value` when that dialog is opened from Generate Key Pair. Drivers may use either id; implementers set both on the same node.

## Generate dialogs

| data-testid | until | notes |
|---|---|---|
| `dialog.generate-key-pair` | generate | Algorithm / size |
| `dialog.generate-key-pair.type.rsa` | generate | RSA (implemented first) |
| `dialog.generate-key-pair.type.dsa` | generate | DSA |
| `dialog.generate-key-pair.type.ec` | generate | EC |
| `dialog.generate-key-pair.size.2048` | generate | 2048 |
| `dialog.generate-key-pair.size.3072` | generate | 3072 |
| `dialog.generate-key-pair.size.4096` | generate | 4096 |
| `dialog.generate-key-pair.size.manual` | generate | Manual size |
| `dialog.generate-key-pair.ok` | generate | OK |
| `dialog.generate-key-pair.cancel` | generate | Cancel |
| `dialog.generate-key-pair-cert` | generate | Self-signed cert options |
| `dialog.generate-key-pair-cert.ok` | generate | OK |
| `dialog.generate-key-pair-cert.cancel` | generate | Cancel |
| `dialog.generating-key-pair` | generate | Progress |
| `dialog.generate-secret-key` | generate | Secret-key options |
| `dialog.generate-secret-key.ok` | generate | OK |
| `dialog.generate-secret-key.cancel` | generate | Cancel |
| `dialog.generate-dh-parameters` | generate | DH size |
| `dialog.generate-dh-parameters.ok` | generate | OK |
| `dialog.generate-dh-parameters.cancel` | generate | Cancel |
| `dialog.generating-dh-parameters` | generate | Progress |
| `dialog.view-dh-parameters` | generate | Read-only result |
| `dialog.view-dh-parameters.ok` | generate | Close |
| `dialog.store-passphrase` | generate | Passphrase to store |
| `dialog.store-passphrase.value` | generate | Passphrase |
| `dialog.store-passphrase.ok` | generate | OK |
| `dialog.store-passphrase.cancel` | generate | Cancel |

## Import / details / examine view dialogs

| data-testid | until | notes |
|---|---|---|
| `dialog.import-key-pair` | import | Source format + file |
| `dialog.import-key-pair.ok` | import | OK |
| `dialog.import-key-pair.cancel` | import | Cancel |
| `dialog.view-certificate` | details | Certificate details (import preview, details, examine, compare) |
| `dialog.view-certificate.ok` | details | Close |
| `dialog.view-private-key` | details | Private-key details |
| `dialog.view-private-key.ok` | details | Close |
| `dialog.view-public-key` | details | Public-key details |
| `dialog.view-public-key.ok` | details | Close |
| `dialog.view-secret-key` | details | Secret-key / passphrase details |
| `dialog.view-secret-key.ok` | details | Close |
| `dialog.view-csr` | examine | CSR |
| `dialog.view-csr.ok` | examine | Close |
| `dialog.view-crl` | examine | CRL |
| `dialog.view-crl.ok` | examine | Close |
| `dialog.view-jwt` | examine | JWT |
| `dialog.view-jwt.ok` | examine | Close |
| `dialog.pkcs12-info` | examine | PKCS#12 info (examine file) |
| `dialog.pkcs12-info.ok` | examine | Close |
| `dialog.examine-ssl` | examine | Host / port |
| `dialog.examine-ssl.host` | examine | Host |
| `dialog.examine-ssl.port` | examine | Port |
| `dialog.examine-ssl.ok` | examine | OK |
| `dialog.examine-ssl.cancel` | examine | Cancel |
| `dialog.detect-file-type` | examine | Detected type message |
| `dialog.detect-file-type.ok` | examine | Close |
| `dialog.find` | session | Find alias |
| `dialog.find.query` | session | Query |
| `dialog.find.ok` | session | Find |
| `dialog.find.cancel` | session | Cancel |
| `dialog.compare-certificates` | session | Side-by-side compare |
| `dialog.compare-certificates.ok` | session | Close |
| `dialog.properties` | session | Store properties |
| `dialog.properties.ok` | session | Close |

## Export dialogs

| data-testid | until | notes |
|---|---|---|
| `dialog.export-csv` | export | CSV destination |
| `dialog.export-csv.ok` | export | OK |
| `dialog.export-csv.cancel` | export | Cancel |
| `dialog.export-key-pair` | export | Key-pair export format |
| `dialog.export-key-pair.ok` | export | OK |
| `dialog.export-key-pair.cancel` | export | Cancel |
| `dialog.export-certificates` | export | Certificate export |
| `dialog.export-certificates.ok` | export | OK |
| `dialog.export-certificates.cancel` | export | Cancel |
| `dialog.export-private-key-type` | export | Private-key format picker |
| `dialog.export-private-key-type.ok` | export | OK |
| `dialog.export-private-key-type.cancel` | export | Cancel |
| `dialog.export-public-key` | export | Public-key export |
| `dialog.export-public-key.ok` | export | OK |
| `dialog.export-public-key.cancel` | export | Cancel |

## Sign / verify dialogs

| data-testid | until | notes |
|---|---|---|
| `dialog.generate-csr` | sign | CSR options |
| `dialog.generate-csr.ok` | sign | OK |
| `dialog.generate-csr.cancel` | sign | Cancel |
| `dialog.sign-csr` | sign | Sign CSR |
| `dialog.sign-csr.ok` | sign | OK |
| `dialog.sign-csr.cancel` | sign | Cancel |
| `dialog.sign-file` | sign | Sign file |
| `dialog.sign-file.ok` | sign | OK |
| `dialog.sign-file.cancel` | sign | Cancel |
| `dialog.sign-jar` | sign | Sign JAR |
| `dialog.sign-jar.ok` | sign | OK |
| `dialog.sign-jar.cancel` | sign | Cancel |
| `dialog.sign-jwt` | sign | Sign JWT |
| `dialog.sign-jwt.ok` | sign | OK |
| `dialog.sign-jwt.cancel` | sign | Cancel |
| `dialog.sign-crl` | sign | Sign CRL |
| `dialog.sign-crl.ok` | sign | OK |
| `dialog.sign-crl.cancel` | sign | Cancel |
| `dialog.sign-midlet` | sign | Sign MIDlet |
| `dialog.sign-midlet.ok` | sign | OK |
| `dialog.sign-midlet.cancel` | sign | Cancel |
| `dialog.verify-certificate` | verify-sig | Verify options |
| `dialog.verify-certificate.ok` | verify-sig | OK |
| `dialog.verify-certificate.cancel` | verify-sig | Cancel |
| `dialog.view-signed-jar` | verify-sig | JAR report |
| `dialog.view-signed-jar.ok` | verify-sig | Close |
| `dialog.view-signature` | verify-sig | Signature report |
| `dialog.view-signature.ok` | verify-sig | Close |

## Chrome dialogs

| data-testid | until | notes |
|---|---|---|
| `dialog.about` | chrome | About |
| `dialog.about.ok` | chrome | Close |
| `dialog.jars` | chrome | JAR list |
| `dialog.jars.ok` | chrome | Close |
| `dialog.security-providers` | chrome | Providers |
| `dialog.security-providers.ok` | chrome | Close |
| `dialog.system-information` | chrome | System information |
| `dialog.system-information.ok` | chrome | Close |
| `dialog.check-update` | chrome | Update result |
| `dialog.check-update.ok` | chrome | Close |

## Rules for later tickets

- `P3.yaml.*` and `P4.*` must not add or rename ids in this file.
- Feature slices enable existing ids; they do not invent menu rows.
- Out-of-scope stubs stay disabled forever.
