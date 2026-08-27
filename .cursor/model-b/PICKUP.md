# Jira pickup (every specialist)

Jira is the queue. There is no dispatcher agent, no Python script, and no `backlog.json`.

You run **inside Cursor** with Jira MCP (or Atlassian MCP) already authenticated. Do not open Jira in a browser to shop tickets.

Replace `YOURKEY` after Phase 1 copy (see [RUNBOOK.md](../RUNBOOK.md)). PRs go to [schabiyo-eng/keystore-explorer](https://github.com/schabiyo-eng/keystore-explorer).

## You are one agent

Your `name` in the agent file is the **Agent** field / `agent-<name>` label. You may only claim issues for that agent.

## Claim (do this first)

1. Search Jira:

```
project = MOD AND status = "To Do" AND labels = agent-{{name}}
ORDER BY created ASC
```

Replace `{{name}}` with `inventory`, `test-generation`, `migrate`, `modernize`, `verify`, or `security-scan`.

1. For each hit, read issue links. Skip if any **is blocked by** issue is not Done.
2. Take the first remaining issue. If none, stop and say so. Do not implement a different agent’s ticket. Do not invent work.
3. Transition that issue to **In Progress** before editing the repo (claim). If the transition fails because someone else claimed it, go to the next issue. That is the lock when several cloud agents of the same type run.
4. Read the description (ticket template). Honor Ticket id, Slice, Acceptance.
5. Do only that issue. When code is ready: draft PR (`pr-composition`) against **schabiyo-eng/keystore-explorer** only, transition to **In Review** (or add label `status-in-review` if that status is missing), paste the **fork** PR URL on the issue. The user merges on the fork and sets **Done**. Never open a PR against public upstream. If the agent must stop, set **Blocked** or add `status-blocked`.

If the user pasted a Jira key, skip search and claim that issue only if Agent matches you.

## Do not

- Query the whole project unfiltered (migrate must not pick inventory).
- Start child tickets.
- Call other specialists.
- Use `scripts/model-b-next.py` or `.cursor/model-b/backlog.json`.
- Push or open a PR against public upstream.
- Skip Phase 1: if overlay files listed in `master-plan.md` Phase 1 are missing, stop and say scaffold is not done.

