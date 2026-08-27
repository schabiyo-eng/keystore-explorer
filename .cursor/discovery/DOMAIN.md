# Domain model for the React keystore kernel

Observable Swing behavior the rewrite must implement with **real PKCS#12 bytes** in `frontend/src/kernel/`. Library lock is [ARCH.md](ARCH.md); this file does not pick a second crypto stack.

## Open keystores and tabs

`KseFrame` keeps a display-ordered `ArrayList<KeyStoreHistory>` parallel to the tab strip. The selected tab index is the active history. An empty list means no active keystore (`getActiveKeyStoreHistory()` returns null).

Two constructors on `KeyStoreHistory`:

- Unsaved: display `name`, no `File`, `savedState` is null. `NewAction` uses untitled names (`Untitled N`).
- File-backed: `file` set, tab name is `file.getName()`, `savedState` starts as the initial state, and `AutoReloadWatcher` registers the path.

`OpenAction.openKeyStore`:

1. Reject if the path is not a file.
2. Reject if that file is already open (`isKeyStoreFileOpen`).
3. If `PasswordManager` knows the path, unlock the manager and reuse the stored password; otherwise start with an optional default or null.
4. Detect type (`CryptoFileUtil.detectKeyStoreType`) then loop: prompt (`DGetPassword` / new-password + password-manager decision), `KeyStoreUtil.load`, on `KeyStoreLoadException` show `DProblem` and ask to retry. Cancel leaves the tab set unchanged.
5. Success: `addKeyStoreHistory`, select the new tab, record recent files. PKCS#12 with “invisible certs” may then run `ConvertToJavaP12Action`.

`CloseAction` asks to save when the current state is not saved and not the unsaved initial empty state (`!isSavedState() && !isInitialState()`). Yes delegates to save; No closes; Cancel/close aborts. Close removes the history and calls `nullPasswords()` on every state.

Each open store the SPA must expose: stable store id, display name, optional path, type (`PKCS12` for the kernel), file-backed flag, externally-modified flag, ordered aliases, history cursor, saved cursor, and selection.

## Entries and selection

Entry identity is the **alias** inside one keystore. Aliases must be unique. Rename / generate / import prompt `DGetAlias` and, if the alias exists, confirm replace (`JOptionPane.YES_NO`) or abort.

`KeyStoreUtil` kinds (used by `KseFrame` double-click and menu enablement):

| kind | test | typical contents |
|---|---|---|
| `key-pair` | `isKeyEntry` and a non-empty certificate chain | protected private key + chain |
| `trusted-certificate` | `isCertificateEntry` | certificate only |
| `key` | `isKeyEntry` and empty/null chain | secret key, passphrase, or key-without-chain |

Dispatch for a single selection tests key-pair first, then trusted certificate, then key. Multiple selection enables certificate details / export / compare when any selected row has a certificate, and Unlock (`UnlockKeyAction`) when any selected row is a key entry (`keyStore.isKeyEntry`). Empty selection uses the keystore/tab context menus (generate, import, paste, properties, CSV, change type).

Double-click / Enter runs the kind-specific details action.

## Dirty state, history, undo, and redo

`KeyStoreHistory` holds `initialState`, `currentState`, optional `savedState`, optional `file`, `name`, and external-modification flags.

File-based types (`KeyStoreType.isFileBased()`, including PKCS#12) use `KeyStoreState`. A mutation:

1. `createBasisForNextState(action)` copies the `KseKeyStore`, store `Password`, per-alias entry-password map, and password-manager flag.
2. Mutates the copy.
3. `currentState.append(newState)` links previous/next and sets current.

Dirty is identity: `currentState.isSavedState()` is `this == history.savedState`. `KseFrame` enables Save when `!currentState.isSavedState()`. Saving writes current PKCS#12 bytes then `setAsSavedState()`. Undo away from that object is dirty; redo back to it is clean.

Undo: `setPreviousStateAsCurrentState()` (propagates newly learned entry passwords if they still unlock the same private key). Redo: `setNextStateAsCurrentState()`. Mutating after undo replaces the redo branch (`append` overwrites `next`).

Non-file types (PKCS#11, MS CAPI, Apple Keychain) use `AlwaysIdenticalKeyStoreState`: `append` is a no-op, `isSavedState()` is always true. Those stores are `platform` / out of scope for the SPA.

The kernel should keep immutable snapshots (store bytes or an equivalent snapshot), a history index, and a saved index.

## Passwords

Store password and per-entry passwords are distinct caches on each `KeyStoreState`.

For PKCS#12, `KeyStoreType.entrySameAsKeyStorePassword()` is true: `KeyStoreExplorerAction.unlockEntry` tries, in order:

1. Cached entry password on the state.
2. Password-manager value for `(file, alias)` if the store is file-backed.
3. Store password, tested with `keyStore.getKey(alias, …)`.
4. `DGetPassword`.

Success: `getKey` validates, cache on the current state, optional password-manager update, `updateControls(true)`. Wrong password: `DProblem`, return null, no mutation. Dialog cancel: return null, no mutation.

New/changed passwords (`DGetNewPassword`, `DChangePassword`, `getNewKeyStorePassword`) are modal. Cancel must abort generate / import / save / set-password without appending a history state.

Swing’s `PasswordManager` singleton encrypts store and entry passwords keyed by file path, gated by a main password (`DInitPasswordManager` / `DUnlockPasswordManager`). The SPA follows [ARCH.md](ARCH.md): store and entry passwords stay in memory for the open tab. Never `localStorage`, URLs, or logs. Clear them when the tab closes.

## What the browser kernel must do

### Store

- Create empty PKCS#12.
- Load PKCS#12 from bytes/path with password.
- Save / save-as writing bytes the kernel can reopen with the same password (`reopenSucceeds`). Interop with files Swing wrote is a kernel acceptance test, not bag-for-bag JCA equality.
- Wrong password and cancel: retry/cancel; no tab or mutation.
- Tests inject paths or bytes; UI uses file input and download.

### Entries

Each entry: alias, kind (`key-pair` | `trusted-certificate` | `key`), timestamps where Swing shows them, locked vs unlocked, and kind-specific metadata from real keys/certs.

Generate and import must insert real entries. Delete/rename must update aliases and the password cache.

### Observable errors

- wrong store password; wrong entry password
- cancelled modal or file picker (atomic)
- duplicate alias (confirm replace or abort)
- missing selection / wrong entry kind
- locked entry when a password is required
- unreadable / missing file; file already open
- save to an already-open path; unwritable file

## Boundary

The kernel is not a JCA provider and must not match BouncyCastle bag encoding bit-for-bit. PKCS#11, MS CAPI, Apple Keychain, and the JVM default store are out of scope (`platform`). Do not add a second PKCS#12 library in a later slice.
