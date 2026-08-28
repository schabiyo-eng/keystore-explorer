/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import App from "../../App";
import { loadFeatures } from "../../shell/loadFeatures";
import { resetRegistry } from "../../shell/registry";
import { resetSession } from "../../shell/session";
import { applyGiven, applyThen, applyWhen } from "../../shell/yaml-driver";
import { resetImportState } from "./commands";
import { resetImportOutcome } from "./outcome";
import {
  applyImportGiven,
  applyImportThen,
  applyImportWhen,
  loadImportScenarios,
  seedNamedFixtures,
  type Scenario,
} from "./yaml";

describe("import YAML flows", () => {
  beforeEach(() => {
    resetRegistry();
    resetSession();
    resetImportState();
    resetImportOutcome();
    loadFeatures();
    seedNamedFixtures();
  });

  afterEach(() => {
    cleanup();
  });

  for (const scenario of loadImportScenarios()) {
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
    const scenario = loadImportScenarios().find(
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
