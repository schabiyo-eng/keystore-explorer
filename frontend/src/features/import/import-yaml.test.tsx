/** @vitest-environment jsdom */
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import App from "../../App";
import { loadFeatures } from "../../shell/loadFeatures";
import { resetRegistry, runCommand } from "../../shell/registry";
import { getActive, getSelection, host, resetSession } from "../../shell/session";
import {
  applyGiven,
  applyThen,
  applyWhen,
  loadSliceScenarios,
  type Scenario,
} from "../../shell/yaml-driver";
import type { CommandParams } from "../../shell/types";
import { resetClipboard, clipboardKind, setOsClipboard } from "./clipboard";
import { resetImportState } from "./commands";
import { resetImportOutcome } from "./outcome";

const testdata = path.resolve(process.cwd(), "../kse/src/test/resources/testdata");

const NAMED_FIXTURES: Record<string, string> = {
  "cert-pem": "CryptoFileUtilTest/cert.pem.cer",
  "rsa-unenc-pkcs8": "CryptoFileUtilTest/rsa.unenc.pem.pkcs8",
  "unknown-txt": "CryptoFileUtilTest/unknown.txt",
};

function seedNamedFixtures(): void {
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

async function applyImportGiven(given: Record<string, unknown>[]): Promise<void> {
  await applyGiven(given);
  for (const item of given) {
    if (typeof item.osClipboard !== "string") {
      continue;
    }
    const bytes = host.vfsRead(item.osClipboard);
    setOsClipboard(bytes);
  }
}

async function applyImportWhen(when: Record<string, unknown>[]): Promise<void> {
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

async function applyImportThen(then: Record<string, unknown>[]): Promise<void> {
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

describe("import YAML flows", () => {
  beforeEach(() => {
    resetRegistry();
    resetSession();
    resetImportState();
    resetImportOutcome();
    resetClipboard();
    loadFeatures();
    seedNamedFixtures();
  });

  afterEach(() => {
    cleanup();
  });

  for (const scenario of loadSliceScenarios("import")) {
    it(scenario.id, async () => {
      expect(scenario.slice).toBe("import");
      expect(scenario.requires).toEqual(["file"]);
      render(<App />);
      await applyImportGiven(scenario.given);
      await applyImportWhen(scenario.when);
      await applyImportThen(scenario.then);
    });
  }

  it("keeps yaml-driver applyWhen working for non-export steps", async () => {
    const scenario = loadSliceScenarios("import").find(
      (item: Scenario) => item.id === "import-trusted-certificate-duplicate-alias",
    );
    expect(scenario).toBeDefined();
    if (!scenario) {
      return;
    }
    render(<App />);
    await applyGiven(scenario.given);
    await applyWhen(scenario.when);
    await applyThen(scenario.then);
  });
});
