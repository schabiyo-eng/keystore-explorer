/** @vitest-environment jsdom */
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import App from "../../App";
import { loadFeatures } from "../../shell/loadFeatures";
import { resetRegistry } from "../../shell/registry";
import { host, resetSession } from "../../shell/session";
import { applyGiven, applyThen, applyWhen } from "../../shell/yaml-driver";
import { registerNamedFixture, resetNamedFixtures } from "./fixtures";
import { foldCancel, loadDeleteRenameScenarios } from "./yaml";

const CERT_PEM = path.resolve(
  process.cwd(),
  "../kse/src/test/resources/testdata/CryptoFileUtilTest/cert.pem.cer",
);

describe("delete-rename YAML flows", () => {
  beforeEach(() => {
    resetRegistry();
    resetSession();
    resetNamedFixtures();
    loadFeatures();
    const cert = new Uint8Array(readFileSync(CERT_PEM));
    registerNamedFixture("cert-pem", cert);
    host.vfsWrite("cert-pem", cert);
  });

  afterEach(() => {
    cleanup();
  });

  for (const scenario of loadDeleteRenameScenarios()) {
    it(scenario.id, async () => {
      expect(scenario.slice).toBe("delete-rename");
      expect(scenario.requires).toEqual(["file"]);
      render(<App />);
      await applyGiven(scenario.given);
      await applyWhen(foldCancel(scenario.when));
      await applyThen(scenario.then);
    });
  }
});
