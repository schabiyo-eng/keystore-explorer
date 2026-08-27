# Visual chrome (Swing → React)

Phase 1 lock for **how the SPA should look**. Inventory must not overwrite this file. YAML tests do not assert this; migrate/modernize must.

Source: `KseFrame`, `JQuickStartPane`, `KeyStoreTableModel` / `KeyStoreTableColumns`. Run the Swing app if a screenshot is missing.

## Frame

```
[ File | Edit | View | Tools | Examine | Help ]
[ New Open Save | Undo Redo | Cut Copy Paste | GenKP … ImportCert … | … ]
[ Quick Start  —or—  tabs: Untitled-1* | store.p12 ]
[ entry table (scroll, etched border)                 ]
[ status bar                                          ]
```

- Menubar on top; **non-floatable** toolbar under it; status bar at the bottom.
- No keystore open → Quick Start (New / Open shortcuts), not an empty marketing hero.
- One or more stores → tabbed pane; dirty tab marked (Swing uses `*` / unsaved name). Active tab = `keystore.tab.active`.

## In-scope menubar

The **File slice** (`P4.file`) must render **every** in-scope item below with the matching `data-testid`. Items stay **disabled** until a feature module registers a command. Later slices do not add menu rows.

| Menu | In-scope items (representative) |
|------|-----------|
| File | New, Open, Save, Save As, Close / Close All / Close Others, Reload |
| Tools | Generate Key Pair / Secret Key / DH params, Store Passphrase, Import trusted cert / key pair / CA reply, Sign/verify as listed in SCOPE.md |
| Examine | File, Clipboard, SSL, Detect file type |
| Edit | Undo, Redo, Cut, Copy, Paste, Find, Compare |
| Help | About, JARs, Providers, System information, Check update |

Out-of-scope items (Open Special / PKCS#11 / OS stores, Preferences / L&F, help website, tip of the day) stay **disabled**. Do not build those flows. See `SCOPE.md`.

## Toolbar

The File slice places the in-scope icon buttons (New, Open, Save, Generate Key Pair, Import Trusted Certificate, plus other SCOPE actions). They stay disabled until registered. Do not invent a different toolbar in a later slice.

## Entry table (default columns)

Fixed first three, then the Swing defaults (`KeyStoreTableColumns`):

1. Type (key pair / trusted cert / key)
2. Lock status
3. Cert expiry status
4. Entry name (alias)
5. Algorithm
6. Key size
7. Certificate expiry
8. Last modified

`data-testid="keystore.table"`. Extra DN/fingerprint columns may wait until the details/export slices need them.

## Dialogs

Modal over the main frame via the **shell dialog host** (File slice): type picker, password, alias, generate options, read-only details. Features register a dialog id; they do not each invent a portal. OK / Cancel. Not a wizard unless Swing already used one for that action.

## Look

Light, dense, utilitarian. Native-ish fonts. Do not introduce a separate design system. Do not pixel-match a specific L&F.

## Not visual (out of scope)

Preferences / Look and Feel, toolbar/status-bar hide, tab wrap vs scroll, help website, tip of the day. About/JARs/providers/system information **are** in-scope chrome. See `SCOPE.md`.
---
