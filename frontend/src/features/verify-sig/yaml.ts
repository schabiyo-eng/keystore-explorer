import { expect } from "vitest";
import { applyThen, loadSliceScenarios, type Scenario } from "../../shell/yaml-driver";
import { getVerifyResult } from "./report";

export function loadVerifySigScenarios() {
  return loadSliceScenarios("verify-sig");
}

/**
 * Schema driver primitive: `when` may end with `cancel: {}` while a dialog
 * would be shown. Fold that into `cancel: true` on the preceding command so
 * verify does not run, without editing the shared File yaml-driver.
 */
export function foldCancel(when: Scenario["when"]): Scenario["when"] {
  if (when.length < 2) {
    return when;
  }
  const last = when[when.length - 1];
  if (!last || !("cancel" in last)) {
    return when;
  }
  const prior = when[when.length - 2];
  if (!prior) {
    return when;
  }
  const name = Object.keys(prior)[0];
  if (!name || name === "cancel") {
    return when;
  }
  const params = prior[name];
  const merged =
    params && typeof params === "object" && !Array.isArray(params)
      ? { ...(params as Record<string, unknown>), cancel: true }
      : { cancel: true };
  return [...when.slice(0, -2), { [name]: merged }];
}

/** Honor `verifyResult` in this slice; the File yaml-driver does not implement it. */
export async function applyVerifyThen(then: Record<string, unknown>[]): Promise<void> {
  const rest: Record<string, unknown>[] = [];
  let expected: unknown;
  for (const item of then) {
    if ("verifyResult" in item) {
      expected = item.verifyResult;
    } else {
      rest.push(item);
    }
  }
  await applyThen(rest);
  if (expected !== undefined) {
    expect(getVerifyResult()).toBe(expected);
  }
}
