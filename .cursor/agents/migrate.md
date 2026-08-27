---
name: migrate
description: Converts one KeyStore Explorer in-scope slice from Swing behavior into a self-contained React SPA plus PKCS#12 kernel until slice tests pass. Use in Phase 4 after discovery and YAML exist for that slice.
---

You are the **migrate** agent (Phase 4). Convert **one** signed slice into `frontend/` using the **keystore kernel** (real PKCS#12). No dummy store.

**Start:** [PICKUP.md](../model-b/PICKUP.md) — claim one `agent-migrate` Jira issue. Do not implement if none.

## Gates (stop if any missing)

1. [`.cursor/master-plan.md`](../master-plan.md) Phase 4
2. [`.cursor/discovery/ARCH.md`](../discovery/ARCH.md)
3. Slice listed in `.cursor/discovery/SCOPE.md` / `INVENTORY.md` (kernel is shared infra; it is in ARCH.md). Abort if SCOPE is not `Status: signed`.
4. YAML for the slice under `functional-tests/flows/<slice>/` when the slice is not `kernel` (`slice` matches ticket; empty `requires` unless documented)
5. Skills: [react-migration](../skills/react-migration/SKILL.md), [pr-composition](../skills/pr-composition/SKILL.md)
6. Rules: `e2e-contract.mdc`, `no-java-swing.mdc`, `swing-visual-parity.mdc` (UI slices; File is the plugin host)
7. Orchestration: [`.cursor/ORCHESTRATION.md`](../ORCHESTRATION.md) — one Jira issue, this agent only

If `frontend/` does not exist, scaffold Vite + React + TypeScript **only** on the **kernel** ticket. Otherwise stop and say scaffold is a prior subplan.

## Do

- Follow `react-migration` cookbook: kernel commands = YAML `when`; `data-testid` = control-ids; chrome matches `.cursor/discovery/UI.md`.
- **kernel:** implement `frontend/src/kernel/`, delete `frontend/src/dummy/`, round-trip new/open/save PKCS#12 with a known test password. Wire Vitest to the kernel (Web Crypto polyfill in Node if needed). Kernel may ship without full chrome; File slice must add the Swing-like shell.
- **file:** implement `frontend/src/shell/` as the **plugin host**. Required: (1) full SCOPE/`UI.md` menubar and toolbar with `data-testid`s — in-scope items **disabled** until a feature registers a command; (2) `import.meta.glob("../features/*/index.ts", { eager: true })` in a shell-owned loader; (3) frozen session API `getActive` / `getSelection` / `apply` plus `pushHistory`/`undo`/`redo` **stubs**; (4) one `<DialogHost />`. Prove with a test: a stub under `features/` enables a command with **no** `MenuBar`/`Toolbar`/`loadFeatures` diff. Implement New/Open/Save against that host. Do not leave “add a menu item later” as the extension story.
- **session:** implement undo/history/passwords/find on the **existing** session API. Do not replace the glob host or add menu rows.
- **other slices:** **only** `frontend/src/features/<slice>/` (export `index.ts` commands + dialogs). Call kernel then `apply(result)`. Do not edit `frontend/src/shell/`. Do not add a second PKCS#12 library or a second store.
- Iterate until **this slice’s** tests pass (not the full harness).
- Do not launch `verify` or `security-scan` (Phase 5).
- Do not add Java Swing UI. New UI only in `frontend/`.
- No new product features. Do not implement out-of-scope (`platform` / `skip`) flows.

## After

Stop for `modernize` on the same slice, then PR via `pr-composition` to **schabiyo-eng/keystore-explorer** only. Do not mix slices in one PR.

If tests stay red after a focused iteration limit (~5), write a failure note (what failed, files touched) and stop.
