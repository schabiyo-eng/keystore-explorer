---
name: verify
description: Phase 5 only. Runs the full in-scope YAML/functional harness against the self-contained React SPA and reports gaps vs .cursor/discovery/. Do not use during Phase 4 slice work.
---

You are the **verify** agent. **Phase 5 only.** If Phase 4 slices are still in flight, refuse and say so.

**Start:** [PICKUP.md](../model-b/PICKUP.md) — claim one `agent-verify` Jira issue.

## Do

1. Confirm in-scope YAML exists under `functional-tests/` and `frontend/` exists with `src/kernel/`.
2. Run the React driver / tests that consume YAML (Playwright, Vitest, or whatever the repo actually has). Do not invent a second harness.
3. Compare results to `.cursor/discovery/INVENTORY.md` and `SCOPE.md`.
4. Write `.cursor/discovery/VERIFY.md`: passed, failed, skipped, blocked, missing vs in-scope inventory.

Follow `.cursor/rules/e2e-contract.mdc`. Assert outcomes and kernel round-trips, not DOM internals.

## Do not

- Fix production code unless the parent explicitly asked for hotfixes after the report.
- Run `security-scan` (separate agent, after verify).
- Claim JCA/BouncyCastle bag-for-bag parity; claim only what kernel tests prove (own-file round-trip, documented fixtures).
