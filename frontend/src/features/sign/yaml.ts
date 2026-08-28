import { expect } from "vitest";
import { runCommand } from "../../shell/registry";
import { applyThen, loadSliceScenarios } from "../../shell/yaml-driver";
import type { CommandParams } from "../../shell/types";
import { getOsClipboard } from "./clipboard";

export function loadSignScenarios() {
  return loadSliceScenarios("sign");
}

/** Honor YAML `cancel: {}` as a following step without writing outputs first. */
export async function applySignWhen(when: Record<string, unknown>[]): Promise<void> {
  for (let index = 0; index < when.length; index += 1) {
    const step = when[index];
    const name = Object.keys(step ?? {})[0];
    if (!name || !step) {
      continue;
    }
    const params = { ...((step[name] ?? {}) as CommandParams) };
    const next = when[index + 1];
    const nextName = next ? Object.keys(next)[0] : undefined;
    if (nextName === "cancel") {
      params.cancel = true;
      await runCommand(name, params);
      index += 1;
      continue;
    }
    await runCommand(name, params);
  }
}

export async function applySignThen(then: Record<string, unknown>[]): Promise<void> {
  const rest: Record<string, unknown>[] = [];
  const clipboard: { kind: string }[] = [];
  for (const item of then) {
    if ("clipboardContains" in item) {
      clipboard.push(item.clipboardContains as { kind: string });
    } else {
      rest.push(item);
    }
  }
  await applyThen(rest);
  for (const spec of clipboard) {
    const text = getOsClipboard();
    if (spec.kind === "empty") {
      expect(text).toBe("");
    } else if (spec.kind === "csr") {
      expect(text).toMatch(/BEGIN CERTIFICATE REQUEST/);
    } else if (spec.kind === "jwt") {
      expect(text.split(".").length).toBe(3);
    } else {
      throw new Error(`unimplemented clipboard kind ${spec.kind}`);
    }
  }
}
