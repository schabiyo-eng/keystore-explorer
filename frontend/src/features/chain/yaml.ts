import { loadSliceScenarios, type Scenario } from "../../shell/yaml-driver";

export function loadChainScenarios() {
  return loadSliceScenarios("chain");
}

/**
 * Schema driver primitive: `when` may end with `cancel: {}` while a dialog
 * would be shown. Fold that into `cancel: true` on the preceding command so
 * chain does not depend on who last-wins the shared `cancel` registry entry.
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
