import { expect } from "vitest";
import { getActive, getSelection } from "../../shell/session";
import {
  applyGiven,
  applyThen,
  applyWhen,
  loadSliceScenarios,
  type Scenario,
} from "../../shell/yaml-driver";
import { getBufferMode, resetBuffer, setBuffer, snapshotEntries } from "./buffer";

export function loadClipboardScenarios() {
  return loadSliceScenarios("clipboard");
}

/**
 * Schema driver primitive: `when` may end with `cancel: {}` after paste
 * opens replace-confirm. Fold that into `cancel: true` so this slice does
 * not depend on who last-wins the shared `cancel` registry entry.
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

export async function applyClipboardGiven(given: Record<string, unknown>[]): Promise<void> {
  resetBuffer();
  await applyGiven(given);
  for (const item of given) {
    if (item.buffer === "empty") {
      resetBuffer();
    } else if (item.buffer === "copy" || item.buffer === "cut") {
      const active = getActive();
      if (active) {
        setBuffer(snapshotEntries(active.store, getSelection()), item.buffer);
      }
    }
  }
}

export async function applyClipboardWhen(when: Scenario["when"]): Promise<void> {
  await applyWhen(foldCancel(when));
}

export async function applyClipboardThen(then: Record<string, unknown>[]): Promise<void> {
  const rest: Record<string, unknown>[] = [];
  const buffers: string[] = [];
  const clipboard: { kind: string }[] = [];
  for (const item of then) {
    const key = Object.keys(item)[0];
    if (key === "buffer") {
      buffers.push(item.buffer as string);
    } else if (key === "clipboardContains") {
      clipboard.push(item.clipboardContains as { kind: string });
    } else {
      rest.push(item);
    }
  }
  await applyThen(rest);
  for (const mode of buffers) {
    expect(getBufferMode()).toBe(mode);
  }
  for (const spec of clipboard) {
    expect(spec.kind).toBe("empty");
  }
}
