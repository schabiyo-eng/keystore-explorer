# Functional-tests status (P3.schema)

Phase 3 schema freeze for MOD-3 / `P3.schema`. Per-slice YAML is **later tickets** (`P3.yaml.file`, `P3.yaml.generate`, …). This directory has **no** `flows/` YAML.

Discovery `.cursor/discovery/STATUS.md` is inventory-owned and was not modified.

## Files

| path | role |
|---|---|
| [schema.md](schema.md) | Frozen `given` / `when` / `then` shape, slice/`requires`, fixtures, full `when` vocabulary |
| [control-ids.md](control-ids.md) | Frozen `data-testid` values (`logical.dot.path`) |
| [ORACLES.md](ORACLES.md) | How drivers evaluate `then` (kernel + user-visible) |
| [STATUS.md](STATUS.md) | This file |

## Counts

| item | count |
|---|---:|
| `when` commands (action + driver primitives) | **74** |
| in-scope inventory ids mapped to a `when` | **84** |
| driver primitives (`cancel`, `selectEntries`, `selectTab`, `setClipboard`) | **4** |
| control ids (`data-testid`) | **363** |
| of which always-disabled SCOPE stubs | **41** |
| `then` oracle keys | **22** |
| of which required by the e2e contract | **9** |
| `errorId` values | **15** |
| named testdata fixtures (usable, no store password) | **21** |
| unknown-password fixtures (`blocked`, never guess) | **16** |
| `flows/**/*.yaml` | **0** |

### `when` commands by slice

| slice | commands |
|---|---:|
| (driver) | 4 |
| file | 10 |
| generate | 4 |
| import | 4 |
| delete-rename | 2 |
| details | 1 |
| export | 5 |
| sign | 8 |
| verify-sig | 3 |
| examine | 4 |
| clipboard | 7 |
| chain | 2 |
| session | 15 |
| chrome | 5 |
| **total** | **74** |

Shared commands (`deleteEntry`, `renameEntry`, `openDetails`, `exportCertificate`, `exportPublicKey`) cover multiple inventory actions via `action:` + selection / `kind` / `source`. Mapping is complete in schema.md.

### Required `then` keys (9)

`aliases`, `entryType`, `entryCount`, `dirty`, `fileExists`, `reopenSucceeds`, `errorId`, `dialogShown`, `clipboardContains`

### Required mutating oracles

Wrong-password, cancel (`cancelled`), and duplicate-alias — documented in ORACLES.md. Slice YAML tickets must emit those scenarios; this ticket only freezes the names.

## Later tickets

Do not edit `schema.md` or `control-ids.md` on `P3.yaml.*`. If a command or control id is missing, Block that issue and comment on MOD-3.

Kernel tests live under `frontend/src/kernel/` (`P4.kernel`), not File YAML.
