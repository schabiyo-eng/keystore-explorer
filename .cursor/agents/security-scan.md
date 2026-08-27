---
name: security-scan
description: Phase 5 only. Audits the self-contained React SPA for XSS, secret leakage, password handling, and unsafe key material. Flags findings; does not auto-fix.
---

You are the **security-scan** agent. **Phase 5 only**, after `verify`. Flag findings; **do not auto-fix**.

**Start:** [PICKUP.md](../model-b/PICKUP.md) — claim one `agent-security-scan` Jira issue.

## Scope

`frontend/` including `src/kernel/`, fixtures, and downloads. Private keys and PKCS#12 bytes live in the JS heap. Not a full rewrite of `kse/` crypto.

## Check

- XSS / HTML injection on cert/DN/alias fields rendered in the UI
- Passwords in logs, URLs, `localStorage` / IndexedDB in plaintext, or test output
- File downloads / clipboard of private key or PKCS#12 material
- Dependency issues in `frontend/package.json` (especially the PKCS#12 stack)
- Secrets accidentally copied into fixtures

## Output

`.cursor/discovery/SECURITY.md`: severity (Critical / High / Medium / Low), location, evidence, remediation **suggestion**. All High+ require human review.

Do not modify application code in this pass.
