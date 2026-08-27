# Discovery status

Recrawl complete for `P2.inventory` (MOD-2). Leftover copied discovery files were re-derived from Swing `doAction()` / `KseFrame` wiring. `ARCH.md` and `UI.md` were not modified. `SCOPE.md` remains **Status: proposal** (unsigned).

## Coverage

- Action source files found: **99**
- Excluded shared base: **1** (`KeyStoreExplorerAction`)
- Inventoried action classes: **98**
- Blocked items: **0**

Every `*Action` class except `KeyStoreExplorerAction` has one row in `INVENTORY.md`, including abstract support classes `AuthorityCertificatesAction`, `AuthorityCertificatesVerifyAction`, and `OpenMsCapiAction`.

## Counts by tag

| tag | count |
|---|---:|
| core | 35 |
| entry-keypair | 27 |
| entry-trusted | 9 |
| entry-key | 7 |
| platform | 6 |
| chrome | 7 |
| skip | 7 |
| **total** | **98** |

## In vs out of scope

From `SCOPE.md` row mapping (proposal):

| | count |
|---|---:|
| in-scope action rows | **84** |
| out-of-scope action rows | **14** |
| **total** | **98** |

Out-of-scope breakdown: `platform` 6 + `skip` 7 + Preferences/L&F 1 (`preferences`).

Kernel has no action class; store primitives are `P4.kernel`.

In-scope by YAML slice:

| slice | action rows |
|---|---:|
| file | 10 |
| generate | 4 |
| import | 4 |
| delete-rename | 7 |
| details | 7 |
| export | 8 |
| sign | 8 |
| verify-sig | 3 |
| examine | 4 |
| clipboard | 7 |
| chain | 2 |
| session | 15 |
| chrome | 5 |
| **in-scope total** | **84** |

## Blocked items

None. Dialog construction and delegated behavior were identifiable from each `doAction()` path and its directly invoked helpers/base implementation. Classes that do not override `doAction()` (`CopyKeyPairAction`, `CopyTrustedCertificateAction`, `CutKeyPairAction`, `CutTrustedCertificateAction`) inherit the parent path.

## Next 10 rows for test-generation

Grouped by YAML slice. Each seed should include cancel/error as well as success. Do not start YAML in this ticket.

### file

| order | id | action | seed focus |
|---:|---|---|---|
| 1 | new | NewAction | create an unsaved PKCS#12 tab; cancel type selection |
| 2 | open | OpenAction | open PKCS#12 with documented password; wrong password then retry; cancel leaves no tab |
| 3 | save | SaveAction | save a dirty file-backed store (real bytes) and clear dirty |
| 4 | save-as | SaveAsAction | assign filename; cancel preserves path and dirty |

### generate

| order | id | action | seed focus |
|---:|---|---|---|
| 5 | generate-key-pair | GenerateKeyPairAction | create RSA key pair via kernel; cancel/duplicate alias is atomic |

### import

| order | id | action | seed focus |
|---:|---|---|---|
| 6 | import-trusted-certificate | ImportTrustedCertificateAction | import canned certificate; cancel/duplicate alias is atomic |

### delete-rename

| order | id | action | seed focus |
|---:|---|---|---|
| 7 | delete-key-pair | DeleteKeyPairAction | confirm/cancel delete and dirty transition |
| 8 | delete-trusted-certificate | DeleteTrustedCertificateAction | confirm/cancel delete and dirty transition |
| 9 | delete-key | DeleteKeyAction | kind-dispatched delete and cancel |
| 10 | rename-key-pair | RenameKeyPairAction | successful rename, duplicate alias, and cancel |

After these ten, continue with `rename-trusted-certificate`, `rename-key`, then the remaining in-scope slices per `SCOPE.md` (details, export, sign, verify-sig, examine, clipboard, chain, session, chrome). `P3.schema` freezes `when`/`then` before slice YAML.

## Constraints carried forward

- Discovery wrote only `.cursor/discovery/{INVENTORY,DOMAIN,SCOPE,STATUS}.md`.
- Did not overwrite `ARCH.md` or `UI.md`.
- No functional-test YAML, React scaffold, or Swing production change.
- The SPA uses a PKCS#12 kernel (`ARCH.md`). Dummy store is rejected. `P4.kernel` before File UI.
- `SCOPE.md` is unsigned proposal; operator signs after merge.
