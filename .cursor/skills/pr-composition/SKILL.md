---
name: pr-composition
description: Packages KeyStore Explorer migration work as a reviewable PR with a consistent title, body, and atomicity rules. Use when opening a pull request after migrate, modernize, test-generation, or discovery merges.
---

# PR composition

Every code-producing agent uses this format. Do not mix unrelated slices.

## Remote (locked)

PRs go **only** to [schabiyo-eng/keystore-explorer](https://github.com/schabiyo-eng/keystore-explorer).

```bash
git remote -v   # origin must be schabiyo-eng/keystore-explorer
gh pr create --repo schabiyo-eng/keystore-explorer ...
```

Do **not** `gh pr create` against `kaikramer/keystore-explorer` or any other public upstream. If origin is not the personal fork, stop. Solo operator: the user merges on the fork; do not auto-merge.

## Atomicity

- One phase/slice per PR (e.g. `P4 generate`, not generate + import).
- No Swing UI changes in a React slice PR (see `no-java-swing.mdc`).
- Do not include `verify`/`security-scan` report-only markdown in a migrate PR unless that is the whole PR.

## Title

```
<type>(<slice>): <imperative summary>
```

Types: `test`, `feat`, `refactor`, `docs`, `chore`.

Examples:

- `docs(discovery): add Phase 2 inventory`
- `test(file): seed YAML for new/open/save`
- `feat(kernel): PKCS#12 load/store round-trip`
- `feat(generate): generate RSA key pair slice`
- `refactor(generate): idiomatic React after migrate`
- `chore(p1): Cursor rewrite overlay`

## Body

```markdown
## Summary
- 

## Phase / slice
- Master plan phase:
- Discovery / YAML refs:

## Test results
- Commands run:
- Outcome:

## Modernization notes
- (or n/a)

## Security status
- Not scanned (Phase 5) | See .cursor/discovery/SECURITY.md

## Backlog
- Jira issue key:
- Ticket id (P4.file, …):
```

## Checklist

- [ ] Matches signed SCOPE / YAML for this slice
- [ ] PR is on schabiyo-eng/keystore-explorer, not public upstream
- [ ] `data-testid` / control-ids unchanged unless YAML updated in the same PR
- [ ] No secrets in fixtures
- [ ] No new Swing UI
- [ ] UI slices match Swing chrome (`.cursor/discovery/UI.md`); not a SaaS shell
- [ ] Feature PRs add only `frontend/src/features/<slice>/` (no `shell/` menubar/toolbar/glob edits except File/session tickets)
- [ ] P3.yaml PRs do not edit `schema.md` / `control-ids.md`
