Ticket id: (e.g. P4.kernel)
Phase:
Slice:
Agent: (must match the Cursor subagent that will claim this)
Acceptance: (shell command)

Use this agent only. Follow .cursor/model-b/PICKUP.md, .cursor/master-plan.md, .cursor/ORCHESTRATION.md, .cursor/discovery/ARCH.md.

Gates:
- Read .cursor/discovery/SCOPE.md. Abort if not "Status: signed" (unless agent is inventory).
- YAML: functional-tests/flows/<slice>/ matching slice; honor slice and requires. Kernel: kernel tests, not File YAML. Schema ticket: schema.md + control-ids.md only.
- Skills: react-migration, pr-composition
- Rules: e2e-contract.mdc, no-java-swing.mdc, swing-visual-parity.mdc (UI slices)
- No dummy store. Do not extend frontend/src/dummy/.
- Isolate UI: kernel → frontend/src/kernel/; File → frontend/src/shell/ (plugin host: glob features, full menubar stubs, session apply, dialog host); session may implement undo/history but must not replace the host; other slices → frontend/src/features/<slice>/ only (no shell edits).
- P3.yaml.* must not edit functional-tests/schema.md or control-ids.md (P3.schema owns those).

If code changed: branch, draft PR with pr-composition against schabiyo-eng/keystore-explorer only (never public upstream), paste the fork PR URL on this issue, transition In Review (or add label status-in-review).
If blocked: set status Blocked or add label status-blocked and stop. Do not start child tickets.
