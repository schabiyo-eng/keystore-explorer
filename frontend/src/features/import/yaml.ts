import { readFileSync } from "node:fs";
import path from "node:path";
import { expect } from "vitest";
import { getActive, getSelection, host } from "../../shell/session";
import { runCommand } from "../../shell/registry";
import {
  applyGiven,
  applyThen,
  loadSliceScenarios,
  type Scenario,
} from "../../shell/yaml-driver";
import type { CommandParams } from "../../shell/types";
import { clipboardKind, setOsClipboard } from "./clipboard";

const testdata = path.resolve(process.cwd(), "../kse/src/test/resources/testdata");

const NAMED_FIXTURES: Record<string, string> = {
  "cert-pem": "CryptoFileUtilTest/cert.pem.cer",
  "rsa-unenc-pkcs8": "CryptoFileUtilTest/rsa.unenc.pem.pkcs8",
  "unknown-txt": "CryptoFileUtilTest/unknown.txt",
};

export function loadImportScenarios() {
  return loadSliceScenarios("import");
}

/**
 * Schema driver primitive: `when` may end with `cancel: {}` after a mutate
 * or an open dialog. Fold that into `cancel: true` on the preceding command
 * so this slice does not depend on who last-wins the shared `cancel` registry.
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

export function seedNamedFixtures(): void {
  for (const [id, rel] of Object.entries(NAMED_FIXTURES)) {
    host.vfsWrite(id, new Uint8Array(readFileSync(path.join(testdata, rel))));
  }
}

function exportSelectedCertificate(params: CommandParams): void {
  const dest = typeof params.path === "string" ? params.path : undefined;
  const active = getActive();
  const alias = getSelection()[0];
  const entry = active?.store.entries.find((item) => item.alias === alias);
  if (!dest || !entry || entry.entryType !== "KEY_PAIR" || !entry.certificates[0]) {
    return;
  }
  host.vfsWrite(dest, entry.certificates[0]);
}

export async function applyImportGiven(given: Record<string, unknown>[]): Promise<void> {
  await applyGiven(given);
  for (const item of given) {
    if (typeof item.osClipboard !== "string") {
      continue;
    }
    const bytes = host.vfsRead(item.osClipboard);
    setOsClipboard(bytes);
  }
}

export async function applyImportWhen(when: Record<string, unknown>[]): Promise<void> {
  for (const step of when) {
    const name = Object.keys(step)[0];
    if (!name) {
      continue;
    }
    const params = (step[name] ?? {}) as CommandParams;
    if (name === "exportCertificate") {
      exportSelectedCertificate(params);
      continue;
    }
    await runCommand(name, params);
  }
}

export async function applyImportThen(then: Record<string, unknown>[]): Promise<void> {
  const rest: Record<string, unknown>[] = [];
  const clipboard: Record<string, unknown>[] = [];
  for (const item of then) {
    if (Object.keys(item)[0] === "clipboardContains") {
      clipboard.push(item);
    } else {
      rest.push(item);
    }
  }
  await applyThen(rest);
  for (const item of clipboard) {
    const spec = item.clipboardContains as { kind: string };
    expect(clipboardKind()).toBe(spec.kind);
  }
}

export type { Scenario };
