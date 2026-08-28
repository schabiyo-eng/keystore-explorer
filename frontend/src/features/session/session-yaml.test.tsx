/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import App from "../../App";
import { loadFeatures } from "../../shell/loadFeatures";
import { resetRegistry } from "../../shell/registry";
import { resetSession } from "../../shell/session";
import {
  applyGiven,
  applyThen,
  applyWhen,
  loadSessionScenarios,
} from "../../shell/yaml-driver";

describe("session YAML flows", () => {
  beforeEach(() => {
    resetRegistry();
    resetSession();
    loadFeatures();
  });

  afterEach(() => {
    cleanup();
  });

  for (const scenario of loadSessionScenarios()) {
    it(scenario.id, async () => {
      expect(scenario.slice).toBe("session");
      expect(scenario.requires).toEqual(["file"]);
      render(<App />);
      await applyGiven(scenario.given);
      await applyWhen(scenario.when);
      await applyThen(scenario.then);
    });
  }
});
