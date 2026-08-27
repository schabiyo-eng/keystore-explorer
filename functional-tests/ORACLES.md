# Oracles (`then`)

How drivers evaluate YAML `then`. Facts are **user-visible chrome** or **kernel** results. Do not assert DOM structure, CSS, React component names, or JCA/BouncyCastle bag-for-bag equality.

Kernel `reopenSucceeds` = `load` of the bytes `save` just wrote, same password (`.cursor/discovery/ARCH.md`).

## Required `then` keys

Every name below is frozen. Slice YAML may use a subset.

| key | value | how to evaluate |
|---|---|---|
| `aliases` | list of strings (order insignificant unless noted) | Kernel enumeration of the **active** store. Empty list `[]` is a valid empty PKCS#12 |
| `entryType` | `{ alias, type }` where `type` is `KEY_PAIR` \| `TRUSTED_CERT` \| `KEY` | Kernel type of that alias. Table type column must match |
| `entryCount` | integer | `aliases.length` of the active store |
| `dirty` | boolean | Active tab dirty indicator (unsaved `*`). Kernel session flag after `apply` |
| `fileExists` | `{ path, exists: true\|false }` | Bytes were written to the named destination (download/save-as or test FS). Required on every file-writing flow |
| `reopenSucceeds` | boolean | Kernel `load(savedBytes, samePassword)` succeeds and yields the same `aliases` / `entryType` / `entryCount`. **Not** bit-equal to a Swing/BouncyCastle file |
| `errorId` | enum below | User-visible failure. Absence of `errorId` means success |
| `dialogShown` | dialog id from [control-ids.md](control-ids.md) (`dialog.*`) or `null` | Modal currently shown via the shell dialog host |
| `clipboardContains` | `{ kind, fixture? }` | OS clipboard (examine/export-copy), **not** the internal cut/copy `buffer` |

## Additional frozen user-visible keys

| key | value | how to evaluate |
|---|---|---|
| `keystoreOpen` | boolean | At least one tab; Quick Start hidden |
| `type` | `PKCS12` | Active store type. Other types are disabled stubs |
| `tabCount` | integer | Open keystore tabs |
| `activeStore` | store id | Active tab |
| `selectedAliases` | list of strings | Table selection |
| `locked` | `{ alias, locked: boolean }` | Lock column / unlock state |
| `historyCanUndo` | boolean | Undo enabled |
| `historyCanRedo` | boolean | Redo enabled |
| `buffer` | `empty` \| `copy` \| `cut` | Internal clipboard (Edit Paste enabled iff not empty) |
| `controlEnabled` | `{ id, enabled }` | Menu/toolbar enabled state (user-visible). Id from control-ids.md |
| `examinedType` | string enum | Detect/examine result: `certificate` \| `csr` \| `crl` \| `jwt` \| `privateKey` \| `publicKey` \| `pkcs12` \| `unknown` |
| `verifyResult` | `valid` \| `invalid` \| `incomplete` | Verify certificate/JAR/signature outcome shown to the user |
| `appExited` | boolean | `exitApp` completed |

Do not add CSS/DOM oracles (`childCount`, `className`, `xpath`).

## `errorId` enum

| id | when to use |
|---|---|
| `wrongPassword` | Open, reload, unlock, set-password, protected generate/import/sign/export: MAC/decrypt fail. **Required** on mutating flows that prompt for a password |
| `cancelled` | User dismissed an abortable dialog or `confirm: false`. Store unchanged. **Required** on every abortable mutating flow |
| `duplicateAlias` | Generate/import/rename/paste into an alias that exists and was not replaced. **Required** on mutating flows that take an alias |
| `notFound` | Find miss; missing file path |
| `invalidFile` | Examine/import/open bytes are not a supported object |
| `unsupportedType` | Non-PKCS#12 target (disabled stub selected) or kernel reject |
| `emptySelection` | Action needs a selection and has none |
| `lockedEntry` | Details/sign/export private material while locked and no password supplied |
| `bufferEmpty` | Paste with empty internal buffer |
| `chainTooShort` | Remove from chain when length is 1 |
| `selfSigned` | Append to chain when end entity is self-signed |
| `passwordMismatch` | New password ≠ confirm |
| `verifyFailed` | Verify action completed with a negative result (also set `verifyResult`) |
| `networkError` | Examine SSL / check-update unreachable |
| `storeNotWritable` | Mutate while no writable active PKCS#12 |

Unknown testdata passwords are **not** an `errorId`. Those scenarios are `blocked: true` in YAML and never run.

## Mutating-flow contract

For each mutating inventory action, slice YAML (later tickets) must include oracles for:

1. Success: updated `aliases` / `entryType` / `entryCount` / `dirty` as appropriate. File writes also `fileExists` + `reopenSucceeds`.
2. Cancel: `errorId: cancelled`, prior `aliases` and `dirty` unchanged, `dialogShown: null` after dismiss.
3. Error: `wrongPassword` when a password dialog exists; `duplicateAlias` when an alias is chosen.

Read-only actions (details, examine, verify, chrome, find miss, compare) still need cancel-if-abortable and one representative error (`invalidFile`, `wrongPassword`, `notFound`, `networkError`).

## `reopenSucceeds` procedure

1. Let `bytes` be the octet string the SPA just saved (not a pre-existing Swing fixture).
2. Let `password` be the password used in that save (`TEST_PASSWORD` for tests).
3. Call kernel `load(bytes, password)`.
4. Oracle is true iff load succeeds and `aliases` / `entryCount` / per-alias `entryType` match the UI session after save (`dirty: false`).
5. Do **not** compare `bytes` to BouncyCastle output. Do **not** require opening a historical testdata `.p12` unless its password is documented in [schema.md](schema.md) (none are today).

## `clipboardContains`

| `kind` | meaning |
|---|---|
| `certificate` | PEM/DER cert text matching the exported/examined object |
| `publicKey` | Exported public key text |
| `jwt` | Signed JWT string |
| `csr` | CSR text |
| `empty` | OS clipboard empty / unused |

Internal cut/copy uses `buffer`, not this oracle.

## Evaluation rules

- All `then` items in a scenario must hold after the last `when`.
- `dialogShown: null` means no modal.
- `dirty: true` after generate/import/delete/rename/cut/paste/chain/set-password; `dirty: false` after successful save of that tab (unless another tab remains dirty — then assert per-tab via `activeStore`).
- Drivers must not inspect PKCS#12 bag attributes, MAC algorithms, or SafeBag order.

## Ownership

P3.schema freezes these names. `P3.yaml.*` must not introduce new `then` keys. If a slice needs a new oracle, Block that YAML ticket and comment on MOD-3.
