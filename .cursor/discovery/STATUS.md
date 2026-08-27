# Discovery status

## Coverage

- Action source files found: **99**
- Excluded shared base: **1** (`KeyStoreExplorerAction`)
- Inventoried action classes: **98**
- Blocked items: **0**

Every `*Action` class except `KeyStoreExplorerAction` has one row in `INVENTORY.md`, including the abstract support classes `AuthorityCertificatesAction`, `AuthorityCertificatesVerifyAction`, and `OpenMsCapiAction`.

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

## Blocked items

None. Dialog construction and delegated behavior were identifiable from each `doAction()` path and its directly invoked helpers/base implementation. This does not mean post-MVP workflows are implementation-ready; it only means no inventory row required an invented dialog.

## Next 10 rows for test-generation

Ordered to establish the master-plan’s file shell first, then the first entry slices. Tests should include the listed cancellation/error boundary in addition to success.

| order | id | action | seed focus |
|---:|---|---|---|
| 1 | new | NewAction | create an unsaved PKCS#12 tab; cancel type selection |
| 2 | open | OpenAction | open PKCS#12 with documented password; wrong password then retry; cancel leaves no tab |
| 3 | save | SaveAction | save a dirty file-backed store (real bytes) and clear dirty |
| 4 | save-as | SaveAsAction | assign filename; cancel preserves path and dirty |
| 5 | generate-key-pair | GenerateKeyPairAction | create RSA key pair via kernel; cancel/duplicate alias is atomic |
| 6 | import-trusted-certificate | ImportTrustedCertificateAction | import canned certificate; cancel/duplicate alias is atomic |
| 7 | delete-key-pair | DeleteKeyPairAction | confirm/cancel delete and dirty transition |
| 8 | delete-trusted-certificate | DeleteTrustedCertificateAction | confirm/cancel delete and dirty transition |
| 9 | delete-key | DeleteKeyAction | kind-dispatched delete and cancel |
| 10 | rename-key-pair | RenameKeyPairAction | successful rename, duplicate alias, and cancel |

After these ten, continue with `rename-trusted-certificate`, `rename-key`, and the read-only details actions. `MVP.md` is signed for kernel (not dummy) implementation.

## Constraints carried forward

- Discovery wrote only `.cursor/discovery/`.
- No functional-test YAML, React scaffold, or Swing production change was made.
- The SPA uses a PKCS#12 kernel (`ARCH.md`). Dummy store is rejected. `P4.kernel` before File UI.

