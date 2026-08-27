---
name: react-migration
description: Cookbook for converting KeyStore Explorer Swing user flows into a self-contained React SPA with a real PKCS#12 kernel. Use during Phase 4 migrate/modernize and when adding frontend UI for YAML commands.
---

# React migration cookbook

Target: Vite + React + TypeScript in `frontend/`. Real PKCS#12 in `frontend/src/kernel/`. Follow `.cursor/rules/e2e-contract.mdc`, `.cursor/rules/no-java-swing.mdc`, `.cursor/rules/swing-visual-parity.mdc`, `.cursor/discovery/ARCH.md`, and `.cursor/discovery/UI.md`.

## Mapping

| Swing | React |
|-------|--------|
| `KeyStoreExplorerAction.doAction()` | Kernel command with the same YAML `when` name |
| `KseFrame` menus | Shell menubar; `data-testid` = control id |
| `KeyStoreHistory` / open tabs | Client session: open keystores, active id, selection, `dirty`, **real store bytes** |
| `JDialog` | Modal registered with the shell dialog host; still one logical `entry` id |
| `JFileChooser` | File input / save-as; tests pass fixture paths from YAML |
| ResourceBundle labels | Visible text; tests may use names/`data-testid` over copy that i18n will churn |

Do not name React components after Swing widgets (`JButton`, `DGetPassword`).

## Visual

The SPA must **look like KeyStore Explorer**, not a generic React app. Full spec: `.cursor/discovery/UI.md`. Rule: `swing-visual-parity.mdc`.

| Swing chrome | React |
|--------------|--------|
| `JMenuBar` File/Edit/View/Tools/Examine/Help | Same menus, same order; **all** in-scope items exist from the File slice |
| `JToolBar` (non-floatable, icon groups + separators) | Toolbar under the menubar; in-scope buttons exist from File |
| `JQuickStartPane` | Empty state until a store is open |
| `JKeyStoreTabbedPane` | One tab per open keystore; dirty indicator |
| `JTable` + etched `JScrollPane` | Entry table `keystore.table`; default columns in UI.md |
| `JDialog` | Modal over the frame via the shell dialog host |
| Status bar | Bottom status line |

Do not replace this with a sidebar shell, card dashboard, or marketing landing page. Idiomatic React means components and TypeScript, not a new look. Native L&F / Preferences are out of scope; match **layout and density**, not Metal pixels.

## Kernel

Implement YAML commands (`newKeyStore`, `openKeyStore`, …) as functions over the kernel:

- Parse and write PKCS#12 bytes (one library stack per ARCH.md)
- `type`, `aliases[]`, `entryType` per alias (`KEY_PAIR` \| `TRUSTED_CERT` \| `KEY`)
- `dirty`; `errorId` (`wrongPassword`, `cancelled`, …) from real load/MAC failure, not canned strings-only
- Generate RSA via Web Crypto; wrap into PKCS#12 with the same stack
- Import trusted cert from PEM/DER files (e.g. testdata cert)

Passwords: only documented test constants from `functional-tests/schema.md`. Never guess testdata `.p12` passwords.

Delete `frontend/src/dummy/` in the kernel slice. Point the YAML driver at the kernel.

## Selectors

`data-testid` **is** `functional-tests/control-ids.md` (e.g. `generateKeyPair.alias`). Also expose accessible names where cheap.

## Layout

- Kernel: `frontend/src/kernel/`
- File slice: `frontend/src/shell/` — the **plugin host** (frame, session, registry)
- Session slice: fills undo/history/password commands; does not replace the host
- Other slices: **only** `frontend/src/features/<slice>/index.ts` (and files beside it)

## Shell is the plugin host (File slice)

**File** means the `P4.file` slice, not a React component named `File`. That slice must land a host so later PRs add files without editing the menubar.

On `P4.file`, ship all of:

1. **Full menubar and toolbar** from `UI.md` / signed `SCOPE.md`. In-scope items exist with `data-testid`s from `control-ids.md`. They stay **disabled** until a feature registers a command. Out-of-scope items stay disabled forever. Do not add menu items in later slices.
2. **Glob loader** the shell owns and fan-out never touches:

```ts
// frontend/src/shell/loadFeatures.ts
const modules = import.meta.glob("../features/*/index.ts", { eager: true });
```

3. **Frozen session API** (one store, no second library). Features call this; they do not reshape the store:

- `getActive()` / `getSelection()`
- `apply(result)` — aliases, dirty, selection, store bytes
- `pushHistory()` / `undo()` / `redo()` — **stubs** until the session slice

4. **One dialog host** (`<DialogHost />`). Features register a dialog id; they do not each invent a portal.

A later slice enables Tools → Generate Key Pair by exporting commands from `frontend/src/features/generate/index.ts`. If adding a command still requires a diff in `MenuBar.tsx` / `Toolbar.tsx` / `loadFeatures.ts`, File is not done.

File tests must prove: a stub module under `features/` enables a command with **no** shell source change.

## Feature module shape

Each `frontend/src/features/<slice>/index.ts` exports commands (YAML `when` names) and optional dialogs. `run` uses the kernel then `apply(result)`.

Do not:

- Edit `frontend/src/shell/` on a non-File, non-session ticket
- Add a second session/store
- Invent `dispatchAction` in the feature folder

**session** (`P4.session`) may extend the session API implementation (real undo stack, set password, find). It still must not replace the glob host or add menu rows.

## Slice order

**Serial trunk:** kernel → File shell (plugin host) → session (fill history/undo/password stubs).

**Leaf fan-out** (parallel after session modernize): generate, import, delete-rename, details, export, sign, verify-sig, examine, chrome.

**Selection-heavy** (after a leaf that mutates selection): clipboard after delete-rename; chain after details.
---
