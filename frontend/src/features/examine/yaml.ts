import { readFileSync } from "node:fs";
import path from "node:path";
import { expect } from "vitest";
import { host } from "../../shell/session";
import {
  applyGiven,
  applyThen,
  loadSliceScenarios,
  type Scenario,
} from "../../shell/yaml-driver";
import { clipboardKind, setOsClipboard } from "./clipboard";
import { examinedType } from "./outcome";

const testdata = path.resolve(process.cwd(), "../kse/src/test/resources/testdata");

const NAMED_FIXTURES: Record<string, string> = {
  "cert-pem": "CryptoFileUtilTest/cert.pem.cer",
  "cert-base64": "CryptoFileUtilTest/cert.base64.txt",
  "jwt-sample": "CryptoFileUtilTest/test.jwt",
  "unknown-txt": "CryptoFileUtilTest/unknown.txt",
  "csr-p10": "CryptoFileUtilTest/csr.p10",
  "crl-pem": "CryptoFileUtilTest/test.pem.crl",
};

export function loadExamineScenarios() {
  return loadSliceScenarios("examine");
}

/**
 * Schema driver primitive: `when` may end with `cancel: {}` while a dialog
 * would be shown. Fold that into `cancel: true` on the preceding command so
 * examine does not depend on who last-wins the shared `cancel` registry.
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

export async function applyExamineGiven(given: Record<string, unknown>[]): Promise<void> {
  await applyGiven(given);
  for (const item of given) {
    if (typeof item.osClipboard !== "string") {
      continue;
    }
    const bytes = host.vfsRead(item.osClipboard);
    setOsClipboard(bytes);
  }
}

export async function applyExamineThen(then: Record<string, unknown>[]): Promise<void> {
  const rest: Record<string, unknown>[] = [];
  for (const item of then) {
    const key = Object.keys(item)[0];
    if (key === "examinedType") {
      expect(examinedType()).toBe(item.examinedType);
      continue;
    }
    if (key === "clipboardContains") {
      const spec = item.clipboardContains as { kind: string };
      expect(clipboardKind()).toBe(spec.kind);
      continue;
    }
    rest.push(item);
  }
  await applyThen(rest);
}

export type { Scenario };
