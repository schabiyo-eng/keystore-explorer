# Jira (Model B)

Jira is the only tracker. Cursor agents claim work via MCP using [PICKUP.md](PICKUP.md). No Python. No `backlog.json`.

## Project

Create an **empty** Jira project for the rewrite. Set its key to `YOURKEY` (replace in this file and [PICKUP.md](PICKUP.md) after copy). Parent type: Workstream. Child type: Task.

Connect **Jira / Atlassian MCP** in Cursor before any agent session. Pickup JQL uses `project = MOD`.

This clone’s old board (`SKD` / syolab-kse-demo) is leftover MVP seeding. Do **not** copy those issue keys or Done statuses into a greenfield project.

## Fields and labels

Custom fields if the team allows them; otherwise put the same values in the description **and** labels.


| Meaning   | Label                                                                                                                 | Description / custom field             |
| --------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Agent     | `agent-inventory`, `agent-test-generation`, `agent-migrate`, `agent-modernize`, `agent-verify`, `agent-security-scan` | Who may claim (required for pickup)    |
| Slice     | `slice-kernel`, `slice-file`, `slice-generate`, …                                                                     | Slice (optional filter)                |
| Phase     | `phase-2` … `phase-5`                                                                                                 | Phase (optional filter)                |
| Ticket id | —                                                                                                                     | `P4.kernel` etc. in summary or a field |


Do **not** add a queue label (`model-b`). Pickup is `project = YOURKEY` plus `agent-`*.

**Issue links:** Blocks / is blocked by. Do not encode the DAG only in prose. Where the table lists two blockers, create both links.

## Workflow

Prefer statuses **To Do / In Progress / In Review / Blocked / Done**. Add **In Review** and **Blocked** (In Progress category) if missing. If they cannot be added, keep In Progress and add `status-in-review` or `status-blocked`.


| Jira                                    | Meaning                       |
| --------------------------------------- | ----------------------------- |
| To Do                                   | unclaimed, ready if unblocked |
| In Progress                             | claimed by an agent           |
| In Review (or label `status-in-review`) | PR open                       |
| Done                                    | merged                        |
| Blocked (or label `status-blocked`)     | agent stopped                 |




## Seed issues (create once, all To Do)

Phase 1 is the overlay git commit, **not** a Jira issue. Seed from P2 onward. Paste [TICKET.template.md](TICKET.template.md) into each description. Create a Workstream parent, then every Task below. Link **Blocks** as in **Blocked by**. Labels: `agent-<Agent>`, `slice-<Slice>`, `phase-<n>`.

YAML slices (cloud fan-out after schema): `file`, `generate`, `import`, `delete-rename`, `details`, `export`, `sign`, `verify-sig`, `examine`, `clipboard`, `chain`, `session`, `chrome`.

P4 order: **kernel → File (plugin host) → session**, then leaf fan-out, then clipboard/chain. Each slice: migrate then modernize.

`P3.schema` freezes `when`/`then` and `control-ids.md` for every in-scope action. YAML tickets only add `flows/<slice>/*.yaml`.

### Phase 2–3


| Ticket id             | Agent           | Slice         | Blocked by   | Acceptance                                                                                                            |
| --------------------- | --------------- | ------------- | ------------ | --------------------------------------------------------------------------------------------------------------------- |
| P2.inventory          | inventory       | all           | —            | `test -f .cursor/discovery/INVENTORY.md && test -f .cursor/discovery/SCOPE.md`                                        |
| P3.schema             | test-generation | all           | P2.inventory | `test -f functional-tests/schema.md && test -f functional-tests/control-ids.md && test -f functional-tests/STATUS.md` |
| P3.yaml.file          | test-generation | file          | P3.schema    | `test -n "$(ls functional-tests/flows/file/*.yaml 2>/dev/null)"`                                                      |
| P3.yaml.generate      | test-generation | generate      | P3.schema    | `test -n "$(ls functional-tests/flows/generate/*.yaml 2>/dev/null)"`                                                  |
| P3.yaml.import        | test-generation | import        | P3.schema    | `test -n "$(ls functional-tests/flows/import/*.yaml 2>/dev/null)"`                                                    |
| P3.yaml.delete-rename | test-generation | delete-rename | P3.schema    | `test -n "$(ls functional-tests/flows/delete-rename/*.yaml 2>/dev/null)"`                                             |
| P3.yaml.details       | test-generation | details       | P3.schema    | `test -n "$(ls functional-tests/flows/details/*.yaml 2>/dev/null)"`                                                   |
| P3.yaml.export        | test-generation | export        | P3.schema    | `test -n "$(ls functional-tests/flows/export/*.yaml 2>/dev/null)"`                                                    |
| P3.yaml.sign          | test-generation | sign          | P3.schema    | `test -n "$(ls functional-tests/flows/sign/*.yaml 2>/dev/null)"`                                                      |
| P3.yaml.verify-sig    | test-generation | verify-sig    | P3.schema    | `test -n "$(ls functional-tests/flows/verify-sig/*.yaml 2>/dev/null)"`                                                |
| P3.yaml.examine       | test-generation | examine       | P3.schema    | `test -n "$(ls functional-tests/flows/examine/*.yaml 2>/dev/null)"`                                                   |
| P3.yaml.clipboard     | test-generation | clipboard     | P3.schema    | `test -n "$(ls functional-tests/flows/clipboard/*.yaml 2>/dev/null)"`                                                 |
| P3.yaml.chain         | test-generation | chain         | P3.schema    | `test -n "$(ls functional-tests/flows/chain/*.yaml 2>/dev/null)"`                                                     |
| P3.yaml.session       | test-generation | session       | P3.schema    | `test -n "$(ls functional-tests/flows/session/*.yaml 2>/dev/null)"`                                                   |
| P3.yaml.chrome        | test-generation | chrome        | P3.schema    | `test -n "$(ls functional-tests/flows/chrome/*.yaml 2>/dev/null)"`                                                    |




### Phase 4 trunk (serial)

File is the **plugin host** (`frontend/src/shell/`): full SCOPE menubar (disabled until registered), `import.meta.glob("../features/*/index.ts")`, frozen session `apply` API, dialog host. Session fills undo/history/password stubs; it does not replace the host.


| Ticket id            | Agent     | Slice   | Blocked by                         | Acceptance                |
| -------------------- | --------- | ------- | ---------------------------------- | ------------------------- |
| P4.kernel            | migrate   | kernel  | P3.schema                          | `cd frontend && npm test` |
| P4.kernel-modernize  | modernize | kernel  | P4.kernel                          | `cd frontend && npm test` |
| P4.file              | migrate   | file    | P4.kernel-modernize, P3.yaml.file  | `cd frontend && npm test` |
| P4.file-modernize    | modernize | file    | P4.file                            | `cd frontend && npm test` |
| P4.session           | migrate   | session | P4.file-modernize, P3.yaml.session | `cd frontend && npm test` |
| P4.session-modernize | modernize | session | P4.session                         | `cd frontend && npm test` |




### Phase 4 leaf fan-out (parallel after session)

Each migrate is blocked by **P4.session-modernize** and that slice’s **P3.yaml.***. Each modernize is blocked by its migrate. Leaves add **only** `frontend/src/features/<slice>/` — no shell edits.


| Ticket id                  | Agent     | Slice         | Blocked by                                  | Acceptance                |
| -------------------------- | --------- | ------------- | ------------------------------------------- | ------------------------- |
| P4.generate                | migrate   | generate      | P4.session-modernize, P3.yaml.generate      | `cd frontend && npm test` |
| P4.generate-modernize      | modernize | generate      | P4.generate                                 | `cd frontend && npm test` |
| P4.import                  | migrate   | import        | P4.session-modernize, P3.yaml.import        | `cd frontend && npm test` |
| P4.import-modernize        | modernize | import        | P4.import                                   | `cd frontend && npm test` |
| P4.delete-rename           | migrate   | delete-rename | P4.session-modernize, P3.yaml.delete-rename | `cd frontend && npm test` |
| P4.delete-rename-modernize | modernize | delete-rename | P4.delete-rename                            | `cd frontend && npm test` |
| P4.details                 | migrate   | details       | P4.session-modernize, P3.yaml.details       | `cd frontend && npm test` |
| P4.details-modernize       | modernize | details       | P4.details                                  | `cd frontend && npm test` |
| P4.export                  | migrate   | export        | P4.session-modernize, P3.yaml.export        | `cd frontend && npm test` |
| P4.export-modernize        | modernize | export        | P4.export                                   | `cd frontend && npm test` |
| P4.sign                    | migrate   | sign          | P4.session-modernize, P3.yaml.sign          | `cd frontend && npm test` |
| P4.sign-modernize          | modernize | sign          | P4.sign                                     | `cd frontend && npm test` |
| P4.verify-sig              | migrate   | verify-sig    | P4.session-modernize, P3.yaml.verify-sig    | `cd frontend && npm test` |
| P4.verify-sig-modernize    | modernize | verify-sig    | P4.verify-sig                               | `cd frontend && npm test` |
| P4.examine                 | migrate   | examine       | P4.session-modernize, P3.yaml.examine       | `cd frontend && npm test` |
| P4.examine-modernize       | modernize | examine       | P4.examine                                  | `cd frontend && npm test` |
| P4.chrome                  | migrate   | chrome        | P4.session-modernize, P3.yaml.chrome        | `cd frontend && npm test` |
| P4.chrome-modernize        | modernize | chrome        | P4.chrome                                   | `cd frontend && npm test` |




### Phase 4 selection-heavy (after a mutating leaf)

Clipboard and chain share selection/history. Do not launch them in the first leaf wave.


| Ticket id              | Agent     | Slice     | Blocked by                                    | Acceptance                |
| ---------------------- | --------- | --------- | --------------------------------------------- | ------------------------- |
| P4.clipboard           | migrate   | clipboard | P4.delete-rename-modernize, P3.yaml.clipboard | `cd frontend && npm test` |
| P4.clipboard-modernize | modernize | clipboard | P4.clipboard                                  | `cd frontend && npm test` |
| P4.chain               | migrate   | chain     | P4.details-modernize, P3.yaml.chain           | `cd frontend && npm test` |
| P4.chain-modernize     | modernize | chain     | P4.chain                                      | `cd frontend && npm test` |




### Phase 5


| Ticket id        | Agent         | Slice | Blocked by             | Acceptance                              |
| ---------------- | ------------- | ----- | ---------------------- | --------------------------------------- |
| P5.verify        | verify        | all   | every `P4.*-modernize` | `test -f .cursor/discovery/VERIFY.md`   |
| P5.security-scan | security-scan | all   | P5.verify              | `test -f .cursor/discovery/SECURITY.md` |


Link P5.verify as blocked by: kernel, file, generate, import, delete-rename, details, export, sign, verify-sig, examine, clipboard, chain, session, chrome **modernize** tickets.

## JQL

Next work for **migrate** (specialist pickup):

```
project = YOURKEY AND status = "To Do" AND labels = agent-migrate
ORDER BY created ASC
```

Then skip issues still blocked by a non-Done link (MCP: read `issuelinks`). Same pattern for other agents (`agent-inventory`, `agent-test-generation`, `agent-modernize`, …).

After P3.schema is Done, many `agent-test-generation` To Dos are unblocked — launch multiple cloud agents. After **P4.session-modernize** is Done, leaf `agent-migrate` To Dos are unblocked — same. Do not start clipboard/chain until their extra blockers are Done.

Do not auto-merge `frontend/` PRs until kernel, File, and session have had one human review each. Open PRs only on [schabiyo-eng/keystore-explorer](https://github.com/schabiyo-eng/keystore-explorer), never public upstream.