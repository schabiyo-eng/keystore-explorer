---
name: test-generation
description: Generates platform-neutral YAML functional tests for KeyStore Explorer user flows (Swing → React). Use in Phase 3 after .cursor/discovery/ exists. Writes functional-tests/; does not rewrite inventory.
---

You generate a **platform-neutral functional-test catalog** so Swing-documented behavior and React can run the **same scenarios**.

**Start:** [PICKUP.md](../model-b/PICKUP.md) — claim one `agent-test-generation` Jira issue.

This is **Phase 3** of [`.cursor/master-plan.md`](../master-plan.md). Follow `.cursor/rules/e2e-contract.mdc`.

You produce **specs and oracles**, not AssertJ-Swing or Playwright code, unless explicitly asked for a driver.

## Context

- Commands: `kse/src/main/java/org/kse/gui/actions/*Action.java` (`doAction()`), menus in `KseFrame`.
- **Read** `.cursor/discovery/INVENTORY.md` and `SCOPE.md`. Do **not** write `.cursor/discovery/` — that is the `inventory` agent.
- Abort if `SCOPE.md` is not `Status: signed`.
- If discovery files are missing, stop and tell the parent to run `inventory` first.
- Reuse `kse/src/test/resources/testdata/` as inputs. Do not treat existing JUnit as UI flows.
- Specs must not mention `JButton`, `JFileChooser`, CSS, or React component names.

## Out of scope

- Implementing runners (unless asked)
- Screenshot tests
- Combinatorial X.509 extension matrices
- Inventory `skip` and `platform` rows (no YAML)
- Full JCA/BouncyCastle vector suites (remain JUnit on `kse/`). YAML still requires kernel `reopenSucceeds` on files the SPA wrote.

## Execute

Honor the **claimed ticket** only:

### `P3.schema`

Write `functional-tests/schema.md`, `control-ids.md`, `ORACLES.md`, `STATUS.md`.

Freeze the **full** `when` vocabulary and every in-scope `data-testid` from signed `SCOPE.md` / `INVENTORY.md` / `KseFrame` menus — not just File/generate. Later YAML tickets must not invent commands.

`when` includes at least: `newKeyStore`, `openKeyStore`, `saveKeyStore`, `generateKeyPair`, `generateSecretKey`, `importTrustedCertificate`, `importKeyPair`, `deleteEntry`, `renameEntry`, `exportCertificate`, `sign*`, `verify*`, `examine*`, `setPassword`, `undo`, `redo`, `copy`/`cut`/`paste`, `cancel`, `selectEntries`, `openDetails`. Use kebab YAML keys; do not invent Swing class names. If an in-scope action needs a command, it belongs in this ticket.

`then`: `aliases`, `entryType`, `entryCount`, `dirty`, `fileExists`, `reopenSucceeds`, `errorId`, `dialogShown`, `clipboardContains`.

IDs: kebab-case. Control ids: `logical.dot.path` in `functional-tests/control-ids.md` for **every** in-scope menu/toolbar/dialog control (including items that stay disabled until a feature registers).

Do **not** write per-slice flow YAML on this ticket.

### `P3.yaml.<slice>`

Write only `functional-tests/flows/<slice>/*.yaml` for that slice. Do **not** edit `schema.md` or `control-ids.md`. If a command or control id is missing, set the Jira issue **Blocked** and comment on `P3.schema` — do not extend the vocabulary here.

For each in-scope inventory action in the slice: 1 happy, 1 cancel if abortable, 1 representative error. Cap **3 YAML per action**.

Unknown password → `blocked`. Do not guess.

File-writing scenarios must `fileExists` and `reopenSucceeds` via the **kernel**.

## YAML

`functional-tests/flows/<slice>/<id>.yaml`

```yaml
id: file-new-pkcs12
action: NewAction
slice: file
requires: []
tags: [core, file]
entry: file.new
skipOn: []
blocked: false
blockedReason: null
given:
  - appStarted: true
when:
  - newKeyStore:
      type: PKCS12
then:
  - keystoreOpen: true
  - type: PKCS12
  - aliases: []
  - dirty: true
```

## Working rules

- Read the Java for dialog steps. Prefer testdata over new keystores.
- Do not modify Swing. Do not add JUnit/npm in this pass.
- Stop if the claimed slice’s flows are inconsistent. No empty YAML stubs.
- `STATUS.md` under `functional-tests/` for counts; discovery STATUS stays with inventory.
- Cloud agents: one slice per ticket. Do not write another slice’s flows.
