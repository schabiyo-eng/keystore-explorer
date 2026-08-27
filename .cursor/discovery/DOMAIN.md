# Domain model for the React keystore kernel

This describes observable Swing behavior that the rewrite must implement with **real PKCS#12 bytes** in `frontend/src/kernel/`. See [ARCH.md](ARCH.md) for the library lock.

## Open keystores and tabs

- `KseFrame` keeps parallel, display-ordered collections of `KeyStoreHistory` objects and entry tables. The selected tab index identifies the active history; no tabs means no active keystore.
- A newly created store has a display name but no backing file. A file-opened store has a file, uses its filename as the tab name, starts at a saved state, and appears in recent files.
- Opening rejects missing/non-files and a file that is already open. A protected store loops through password entry, load failure, and a “try again?” decision. Cancel leaves the open-tab set unchanged.
- A successful open adds a new selected tab. Close can first invoke save for a dirty store; cancellation must stop the close. Closing clears passwords held by every state in that history.
- Each store exposes at least: stable store id, display name, optional path, type (`PKCS12` for MVP), file-backed flag, externally-modified flag, ordered entries, history cursor, saved cursor, and active selection.

## Entries and selection

- Entry identity is its alias within one keystore. Aliases must be unique; rename and import/generate flows reject or confirm replacement when an alias already exists.
- The UI distinguishes three observable entry kinds:
  - `key-pair`: a protected private key plus a certificate chain.
  - `trusted-certificate`: a certificate-only entry.
  - `key`: a non-key-pair key entry, including secret keys/passphrases and potentially public/private key forms.
- One tab has one table selection. The selection may be empty, one alias, or multiple aliases. Menus and context menus are enabled from both selection cardinality and entry kinds.
- Single-entry dispatch tests key pair first, then trusted certificate, then key. Multiple selection enables certificate details/export/compare when any selected row has a certificate, and unlock when any selected row is a key or key pair.
- Double-click/Enter opens the kind-specific details action. MVP details are read-only even where Swing’s broader dialogs expose export or editing controls.

## Dirty state, history, undo, and redo

- `KeyStoreHistory` owns an initial state, current state, optional saved state, optional file, name, and external-modification flags.
- File-based stores use linked snapshots. A mutation copies the current store, store password, entry-password cache, and password-manager flag into a new state, records the responsible action, appends it after the current state, and makes it current.
- Dirty is identity-based: `currentState != savedState`. Saving writes the current state (PKCS#12 bytes to the path) and then marks that exact state as saved. Undoing away from it is dirty; redoing back to it is clean.
- Undo moves to `previous`; redo moves to `next`. Passwords learned after an older snapshot was created may propagate only when they still unlock the same entry.
- Non-file stores use an always-identical state because their contents cannot safely be snapshotted. They are post-MVP.
- The SPA should keep snapshots as immutable serializable data (including store bytes or an equivalent kernel snapshot) plus a history index and saved index. Mutating after undo should discard/replace the redo branch.

## Password behavior

- Store passwords and per-entry passwords are distinct cached values on each state.
- For PKCS#12, entry protection usually uses the store password. Entry access first tries a cached entry password, then a password-manager value, then the store password when the type says they are shared, and finally prompts.
- A successful entry unlock validates the password against the kernel and caches it for the current state. A wrong password shows a problem and does not unlock or mutate the entry. Cancel returns `null` and leaves state unchanged.
- New/changed passwords are collected in modal flows. Cancel must abort the containing generate/import/save/change operation without appending a history state.
- The optional password manager is a singleton keyed by keystore file path, with an encrypted main-password gate and per-alias values. Password-manager initialization, persistence, and preferences are post-MVP.
- Never persist plaintext passwords to logs, fixtures, `localStorage`, or IndexedDB. Clear session values when a store closes.

## What the kernel must implement

### Store operations

- Create empty PKCS#12; open PKCS#12 from bytes/path with password; save/save-as writing interoperable-enough PKCS#12 for the kernel to reopen (and, where fixtures allow, files Swing can open).
- Wrong password and cancel: same retry/cancel choices; no mutation.
- File-picker results as real paths or test-injected bytes.

### Entry operations

Each entry: alias, kind, timestamps where Swing shows them, locked state, and kind-specific read-only metadata derived from real keys/certs (not canned rows).

Generate-RSA and import-trusted-certificate create real key-pair / certificate entries.

### State transitions and errors

- `new`, `open`, `save`, `save as`, `close`, active-tab selection.
- selection by alias; empty/single/multiple selection.
- append mutation snapshots for generate, import, delete, and rename; accurate dirty marker.
- duplicate alias, missing selection, unsupported entry kind, locked entry, wrong store/entry password, unreadable file, cancelled modal/file picker.
- Every cancel path is atomic.

## Boundary

The kernel is not a JCA provider. It must round-trip its own PKCS#12. Matching every BouncyCastle bag encoding is post-MVP unless a documented fixture with a known password exists.
