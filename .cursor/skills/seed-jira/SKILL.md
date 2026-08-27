---
name: seed-jira
description: Seeds the empty MOD Jira project from .cursor/model-b/jira.md for the Java Swing → React migration (Workstream + every seed Task, labels, Blocks links, TICKET.template.md bodies). Use for Phase 1 step 4, "seed Jira", greenfield overlay, or when the rewrite board is empty.
---

# Seed Jira (Phase 1 step 4)

One-time board creation for the **KeyStore Explorer Java Swing → React migration**. Do not claim tickets. Do not write product code. Do not start inventory.

Sources:

- `.cursor/model-b/jira.md` — issue table, labels, Blocks DAG
- `.cursor/model-b/TICKET.template.md` — every description
- `.cursor/RUNBOOK.md` Phase 1 step 4

Project key is **MOD**. PRs stay on [schabiyo-eng/keystore-explorer](https://github.com/schabiyo-eng/keystore-explorer).

## Preconditions (stop if any fail)

1. Overlay files listed in `master-plan.md` Phase 1 exist.
2. Jira / Atlassian MCP is authenticated. Resolve `cloudId` from accessible resources.
3. Project `MOD` exists. Search `project = MOD AND summary ~ "P2.inventory"`. If hits exist, **do not duplicate** — report keys and only create missing rows if the user asked to repair.
4. Statuses **To Do**, **In Progress**, **Done** exist. Prefer **In Review** and **Blocked** (In Progress category). If those two are missing, say so and still create issues as To Do (later work uses labels `status-in-review` / `status-blocked`).
5. Issue types: parent **Workstream** (or **Epic** if Workstream is unavailable — say which). Children **Task**.
6. Link type **Blocks** exists. `createIssueLink`: `inwardIssue` = blocker, `outwardIssue` = blocked.

Do **not** copy keys or Done statuses from leftover `SKD` / syolab-kse-demo.

## Create

### 1. Parent

One Workstream (or Epic):

- Summary: `KeyStore Explorer: Java Swing → React migration`
- Description: Greenfield board for migrating KeyStore Explorer from Java Swing to a self-contained React SPA (real PKCS#12 in the client). Seeded from `.cursor/model-b/jira.md`. Phase 1 is the git overlay, not a Jira issue.

### 2. Tasks

Create **every** row in `jira.md` from P2 through P5. There is **no** P1 issue.

For each row:

| Jira field | Value |
| ---------- | ----- |
| Type | Task |
| Parent | Workstream/Epic key if the hierarchy allows it |
| Summary | ticket id exactly (`P2.inventory`, `P4.kernel`, …) |
| Labels | `agent-<Agent>`, `slice-<Slice>`, `phase-<n>` |
| Status | **To Do** |
| Description | `TICKET.template.md` filled from that row (markdown) |

Label map:

- Agent: `inventory` → `agent-inventory`; `test-generation` → `agent-test-generation`; `migrate` → `agent-migrate`; `modernize` → `agent-modernize`; `verify` → `agent-verify`; `security-scan` → `agent-security-scan`
- Slice: `all` → `slice-all`; `delete-rename` → `slice-delete-rename`; `verify-sig` → `slice-verify-sig`; otherwise `slice-<slice>`
- Phase from prefix: `P2` → `phase-2` … `P5` → `phase-5`

Do **not** add label `model-b`.

Fill the template header from the table; keep the rest of `TICKET.template.md` (gates, PR rules, fork-only). Example:

```
Ticket id: P2.inventory
Phase: 2
Slice: all
Agent: inventory
Acceptance: test -f .cursor/discovery/INVENTORY.md && test -f .cursor/discovery/SCOPE.md
```

Create in table order. Keep `ticket id → issue key`.

**Do not** set Done or In Progress. Discovery files already in git do not make P2/P3 Done.

### 3. Blocks links

After all Tasks exist, create **Blocks** links from **Blocked by**:

- Empty → none (`P2.inventory`)
- One id → that issue blocks this issue
- Two ids → two links (`P4.file` blocked by `P4.kernel-modernize` **and** `P3.yaml.file`)
- `P5.verify` blocked by **every** `P4.*-modernize` (kernel, file, session, generate, import, delete-rename, details, export, sign, verify-sig, examine, clipboard, chain, chrome)
- `P5.security-scan` blocked by `P5.verify`

`createIssueLink`: `type: Blocks`, `inwardIssue` = blocker key, `outwardIssue` = blocked key.

## Counts (must match)

| Group | Tasks |
| ----- | ----: |
| P2–P3 (inventory, schema, 13 YAML slices) | 15 |
| P4 trunk | 6 |
| P4 leaf | 22 |
| P4 clipboard/chain | 4 |
| P5 | 2 |
| **Total Tasks** | **49** |
| Workstream/Epic | 1 |

If short, create missing rows. Do not delete extras without asking.

## Verify

```
project = MOD AND status = "To Do" AND labels = agent-inventory
ORDER BY created ASC
```

Must return `P2.inventory` with no inbound Blocks from a non-Done issue.

Spot-check: `P3.yaml.file` blocked by `P3.schema`; `P4.file` has two blockers; a leaf migrate is blocked by `P4.session-modernize` and its `P3.yaml.*`.

## After seed

Stop. Tell the operator Phase 1 step 4 is done. Next is **inventory** with:

```
Jira is the queue. Claim the next issue for this agent. PRs only to schabiyo-eng/keystore-explorer.
```

Do not run inventory unless they ask in a new turn.
